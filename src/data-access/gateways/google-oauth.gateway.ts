import { CircuitBreaker, type CircuitBreakerOptions } from "../resilience/circuit-breaker.js";
import type { GoogleAuthPayload, GoogleOAuthVerifier } from "../../business/interfaces/auth.interface.js";

interface GoogleTokenInfoResponse {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  aud?: string;
  email_verified?: boolean | string;
  error?: string | { message?: string };
  error_description?: string;
}

export class GoogleOAuthGateway implements GoogleOAuthVerifier {
  public readonly breaker: CircuitBreaker<[string], GoogleAuthPayload>;

  constructor(options?: Partial<CircuitBreakerOptions<[string], GoogleAuthPayload>>) {
    this.breaker = new CircuitBreaker<[string], GoogleAuthPayload>({
      name: "GoogleOAuthGateway",
      timeoutMs: options?.timeoutMs ?? Number(process.env.CIRCUIT_BREAKER_TIMEOUT ?? 3000),
      errorThresholdPercentage: options?.errorThresholdPercentage ?? Number(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD ?? 50),
      resetTimeoutMs: options?.resetTimeoutMs ?? Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT ?? 10000),
      volumeThreshold: options?.volumeThreshold ?? Number(process.env.CIRCUIT_BREAKER_VOLUME_THRESHOLD ?? 5),
      enabled: options?.enabled ?? (process.env.CIRCUIT_BREAKER_ENABLED !== "false"),
      fallback: (idToken: string) => this.fallbackResponse(idToken),
      ...options,
    });
  }

  private fallbackResponse(idToken: string): GoogleAuthPayload {
    if (idToken.startsWith("demo_google_token")) {
      const demoSuffix = idToken.replace("demo_google_token_", "") || "demo";
      return {
        sub: `google-sub-${demoSuffix}`,
        email: `google.${demoSuffix}@example.com`,
        name: `Google User (${demoSuffix})`,
        picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      };
    }
    throw new Error(
      "Dịch vụ xác thực Google tạm thời gián đoạn (Circuit Breaker OPEN). Vui lòng đăng nhập bằng Email/Mật khẩu hoặc thử lại sau ít phút."
    );
  }

  private async fetchRawGoogleToken(idToken: string): Promise<GoogleAuthPayload> {
    if (idToken === "demo_google_token" || idToken.startsWith("demo_google_token_")) {
      return this.fallbackResponse(idToken);
    }

    const isJwt = idToken.includes(".") && idToken.split(".").length === 3;
    const customEndpoint = process.env.GOOGLE_OAUTH_URL?.trim();

    let res: globalThis.Response;
    if (customEndpoint) {
      res = await fetch(`${customEndpoint}?id_token=${encodeURIComponent(idToken)}`);
    } else if (isJwt) {
      res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );
    } else {
      res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
    }

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as GoogleTokenInfoResponse;
      const errorMsg =
        typeof errData.error === "object" && errData.error?.message
          ? errData.error.message
          : errData.error_description || (typeof errData.error === "string" ? errData.error : "Google Token không hợp lệ hoặc đã hết hạn");
      throw new Error(errorMsg);
    }

    const data = (await res.json()) as GoogleTokenInfoResponse;
    if (!data.sub || !data.email) {
      throw new Error("Google Token thiếu thông tin định danh cần thiết");
    }

    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && data.aud && data.aud !== expectedClientId) {
      throw new Error("Token không khớp với cấu hình Client ID của ứng dụng");
    }

    const isEmailVerified =
      data.email_verified === true || data.email_verified === "true";
    if (!isEmailVerified) {
      throw new Error("Email từ tài khoản Google chưa được xác thực");
    }

    const email = data.email.toLowerCase();
    const name = data.name || email.split("@")[0] || "Google User";

    return {
      sub: data.sub,
      email,
      name,
      picture: data.picture || null,
    };
  }

  async verifyIdToken(idToken: string): Promise<GoogleAuthPayload> {
    return this.breaker.execute((token) => this.fetchRawGoogleToken(token), idToken);
  }
}

export const googleOAuthGateway = new GoogleOAuthGateway();
