import { EventEmitter } from "node:events";

export const CircuitState = {
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
} as const;

export type CircuitState = (typeof CircuitState)[keyof typeof CircuitState];

export interface CircuitBreakerOptions<TArgs extends any[] = any[], TResult = any> {
  name: string;
  timeoutMs?: number | undefined;
  errorThresholdPercentage?: number | undefined;
  resetTimeoutMs?: number | undefined;
  volumeThreshold?: number | undefined;
  rollingWindowMs?: number | undefined;
  enabled?: boolean | undefined;
  fallback?: ((...args: TArgs) => Promise<TResult> | TResult) | undefined;
}

export interface CircuitBreakerMetrics {
  name: string;
  state: CircuitState;
  enabled: boolean;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  timedOutCalls: number;
  fallbackCalls: number;
  rejectedCalls: number;
  consecutiveFailures: number;
  lastStateChange: Date;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
}

interface CallRecord {
  timestamp: number;
  success: boolean;
  timedOut: boolean;
}

export class CircuitBreakerError extends Error {
  constructor(
    public readonly breakerName: string,
    public readonly state: CircuitState,
    message: string = `Circuit breaker [${breakerName}] is OPEN. Call rejected to prevent cascading failure.`,
  ) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

export class CircuitBreakerTimeoutError extends Error {
  constructor(
    public readonly breakerName: string,
    public readonly timeoutMs: number,
    message: string = `Call timed out after ${timeoutMs}ms in circuit breaker [${breakerName}].`,
  ) {
    super(message);
    this.name = "CircuitBreakerTimeoutError";
  }
}

/**
 * Enterprise-grade Circuit Breaker pattern implementation (Martin Fowler 3-state model).
 * Protects downstream microservices/external APIs (Brevo, Google, TMDB) against Cascading Failure,
 * socket pool exhaustion, and thread starvation.
 */
export class CircuitBreaker<TArgs extends any[] = any[], TResult = any> extends EventEmitter {
  private readonly name: string;
  private readonly timeoutMs: number;
  private readonly errorThresholdPercentage: number;
  private readonly resetTimeoutMs: number;
  private readonly volumeThreshold: number;
  private readonly rollingWindowMs: number;
  private enabled: boolean;
  private readonly fallback?: ((...args: TArgs) => Promise<TResult> | TResult) | undefined;

  private state: CircuitState = CircuitState.CLOSED;
  private lastStateChange: Date = new Date();
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;

  private consecutiveFailures = 0;
  private totalCalls = 0;
  private successfulCalls = 0;
  private failedCalls = 0;
  private timedOutCalls = 0;
  private fallbackCalls = 0;
  private rejectedCalls = 0;

  private callHistory: CallRecord[] = [];
  private nextAttemptTimeout: NodeJS.Timeout | null = null;

  constructor(options: CircuitBreakerOptions<TArgs, TResult>) {
    super();
    this.name = options.name;
    this.timeoutMs = options.timeoutMs ?? Number(process.env.CIRCUIT_BREAKER_TIMEOUT ?? 3000);
    this.errorThresholdPercentage = options.errorThresholdPercentage ?? Number(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD ?? 50);
    this.resetTimeoutMs = options.resetTimeoutMs ?? Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT ?? 10000);
    this.volumeThreshold = options.volumeThreshold ?? Number(process.env.CIRCUIT_BREAKER_VOLUME_THRESHOLD ?? 5);
    this.rollingWindowMs = options.rollingWindowMs ?? 10000;
    this.enabled = options.enabled ?? (process.env.CIRCUIT_BREAKER_ENABLED !== "false");
    if (options.fallback) {
      this.fallback = options.fallback;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      name: this.name,
      state: this.state,
      enabled: this.enabled,
      totalCalls: this.totalCalls,
      successfulCalls: this.successfulCalls,
      failedCalls: this.failedCalls,
      timedOutCalls: this.timedOutCalls,
      fallbackCalls: this.fallbackCalls,
      rejectedCalls: this.rejectedCalls,
      consecutiveFailures: this.consecutiveFailures,
      lastStateChange: this.lastStateChange,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
  }

  forceClose(): void {
    this.transitionTo(CircuitState.CLOSED);
  }

  async execute(fn: (...args: TArgs) => Promise<TResult>, ...args: TArgs): Promise<TResult> {
    this.totalCalls++;

    // When Circuit Breaker is disabled via Feature Flag (Before state)
    if (!this.enabled) {
      return fn(...args);
    }

    // Check if OPEN state should transition to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastStateChange.getTime() >= this.resetTimeoutMs) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        // Circuit is still OPEN -> Fast Fail
        this.rejectedCalls++;
        this.emit("reject", this.name);
        return this.handleFallback(
          new CircuitBreakerError(this.name, this.state),
          ...args,
        );
      }
    }

    try {
      const result = await this.executeWithTimeout(fn, ...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      return this.handleFallback(error, ...args);
    }
  }

  private async executeWithTimeout(
    fn: (...args: TArgs) => Promise<TResult>,
    ...args: TArgs
  ): Promise<TResult> {
    let timer: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        this.timedOutCalls++;
        reject(new CircuitBreakerTimeoutError(this.name, this.timeoutMs));
      }, this.timeoutMs);
    });

    try {
      const result = await Promise.race([fn(...args), timeoutPromise]);
      return result;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private onSuccess(): void {
    const now = Date.now();
    this.successfulCalls++;
    this.consecutiveFailures = 0;
    this.lastSuccessTime = new Date(now);
    this.recordCall(true, false);

    if (this.state === CircuitState.HALF_OPEN) {
      // Trial call succeeded -> Close circuit
      this.transitionTo(CircuitState.CLOSED);
    }
  }

  private onFailure(error: unknown): void {
    const now = Date.now();
    this.failedCalls++;
    this.consecutiveFailures++;
    this.lastFailureTime = new Date(now);
    const timedOut = error instanceof CircuitBreakerTimeoutError;
    this.recordCall(false, timedOut);

    if (this.state === CircuitState.HALF_OPEN) {
      // Trial call failed in HALF_OPEN -> reopen circuit immediately
      this.transitionTo(CircuitState.OPEN);
      return;
    }

    if (this.state === CircuitState.CLOSED) {
      this.checkThresholds();
    }
  }

  private checkThresholds(): void {
    const now = Date.now();
    const windowStart = now - this.rollingWindowMs;
    // Keep only calls within rolling window
    this.callHistory = this.callHistory.filter((c) => c.timestamp >= windowStart);

    if (this.callHistory.length < this.volumeThreshold) {
      return;
    }

    const failed = this.callHistory.filter((c) => !c.success).length;
    const failureRate = (failed / this.callHistory.length) * 100;

    if (failureRate >= this.errorThresholdPercentage) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private recordCall(success: boolean, timedOut: boolean): void {
    this.callHistory.push({
      timestamp: Date.now(),
      success,
      timedOut,
    });
  }

  private transitionTo(nextState: CircuitState): void {
    if (this.state === nextState) return;
    const previousState = this.state;
    this.state = nextState;
    this.lastStateChange = new Date();

    if (this.nextAttemptTimeout) {
      clearTimeout(this.nextAttemptTimeout);
      this.nextAttemptTimeout = null;
    }

    if (nextState === CircuitState.OPEN) {
      this.nextAttemptTimeout = setTimeout(() => {
        if (this.state === CircuitState.OPEN) {
          this.transitionTo(CircuitState.HALF_OPEN);
        }
      }, this.resetTimeoutMs);
      this.nextAttemptTimeout.unref();
    }

    this.emit("stateChange", {
      breaker: this.name,
      from: previousState,
      to: nextState,
      timestamp: this.lastStateChange,
    });
  }

  private async handleFallback(error: unknown, ...args: TArgs): Promise<TResult> {
    if (this.fallback) {
      this.fallbackCalls++;
      this.emit("fallback", { breaker: this.name, error });
      return this.fallback(...args);
    }
    throw error;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.callHistory = [];
    this.lastStateChange = new Date();
    if (this.nextAttemptTimeout) {
      clearTimeout(this.nextAttemptTimeout);
      this.nextAttemptTimeout = null;
    }
  }
}
