// 1. Domain Interfaces
import type { UserRepository } from "../business/interfaces/user.interface.js";
import type {
  MovieRepository,
  ExternalMovieGateway,
} from "../business/interfaces/movie.interface.js";
import type { CinemaRepository } from "../business/interfaces/cinema.interface.js";
import type { RoomRepository } from "../business/interfaces/room.interface.js";
import type { SeatRepository } from "../business/interfaces/seat.interface.js";
import type { ShowtimeRepository } from "../business/interfaces/showtime.interface.js";
import type { BookingRepository } from "../business/interfaces/booking.interface.js";
import type {
  PaymentRepository,
  PaymentGateway,
} from "../business/interfaces/payment.interface.js";
import type { EmailService } from "../business/interfaces/email.interface.js";
import type { GoogleOAuthVerifier } from "../business/interfaces/auth.interface.js";

// 2. Concrete Data Access Implementations
import { PrismaUserRepository } from "../data-access/repositories/user.repository.js";
import { PrismaMovieRepository } from "../data-access/repositories/movie.repository.js";
import { PrismaCinemaRepository } from "../data-access/repositories/cinema.repository.js";
import { PrismaRoomRepository } from "../data-access/repositories/room.repository.js";
import { PrismaSeatRepository } from "../data-access/repositories/seat.repository.js";
import { PrismaShowtimeRepository } from "../data-access/repositories/showtime.repository.js";
import { PrismaBookingRepository } from "../data-access/repositories/booking.repository.js";
import { PrismaPaymentRepository } from "../data-access/repositories/payment.repository.js";
import { BrevoEmailGateway } from "../data-access/gateways/email.gateway.js";
import { GoogleOAuthGateway } from "../data-access/gateways/google-oauth.gateway.js";
import { TmdbGateway } from "../data-access/gateways/tmdb.gateway.js";
import { VnpayGateway } from "../data-access/gateways/vnpay.gateway.js";

// 3. Application Services
import { AuthService } from "../business/services/auth.service.js";
import { MovieService } from "../business/services/movie.service.js";
import { CinemaService } from "../business/services/cinema.service.js";
import { RoomService } from "../business/services/room.service.js";
import { SeatService } from "../business/services/seat.service.js";
import { ShowtimeService } from "../business/services/showtime.service.js";
import { BookingService } from "../business/services/booking.service.js";
import { PaymentService } from "../business/services/payment.service.js";

// 4. API Controllers
import { AuthController } from "../api/controllers/auth.controller.js";
import { MovieController } from "../api/controllers/movie.controller.js";
import { CinemaController } from "../api/controllers/cinema.controller.js";
import { RoomController } from "../api/controllers/room.controller.js";
import { SeatController } from "../api/controllers/seat.controller.js";
import { ShowtimeController } from "../api/controllers/showtime.controller.js";
import { BookingController } from "../api/controllers/booking.controller.js";
import { PaymentController } from "../api/controllers/payment.controller.js";
import { BookingExpirationWorker } from "../infrastructure/workers/booking-expiration.worker.js";

export interface ContainerOverrides {
  // Repositories
  userRepository?: UserRepository;
  movieRepository?: MovieRepository;
  cinemaRepository?: CinemaRepository;
  roomRepository?: RoomRepository;
  seatRepository?: SeatRepository;
  showtimeRepository?: ShowtimeRepository;
  bookingRepository?: BookingRepository;
  paymentRepository?: PaymentRepository;

  // Gateways
  emailGateway?: EmailService;
  googleOAuthGateway?: GoogleOAuthVerifier;
  tmdbGateway?: ExternalMovieGateway;
  vnpayGateway?: PaymentGateway;

  // Services
  authService?: AuthService;
  movieService?: MovieService;
  cinemaService?: CinemaService;
  roomService?: RoomService;
  seatService?: SeatService;
  showtimeService?: ShowtimeService;
  bookingService?: BookingService;
  paymentService?: PaymentService;
  bookingExpirationWorker?: BookingExpirationWorker;
}

/**
 * Composition Root / Service Container
 * Manages the lifecycle and dependency graph of all Repositories, Gateways, Services, and Controllers.
 * Adheres to the Dependency Inversion Principle (DIP) and ensures Singleton instances across the app.
 */
export class Container {
  // 1. Repositories
  readonly userRepository: UserRepository;
  readonly movieRepository: MovieRepository;
  readonly cinemaRepository: CinemaRepository;
  readonly roomRepository: RoomRepository;
  readonly seatRepository: SeatRepository;
  readonly showtimeRepository: ShowtimeRepository;
  readonly bookingRepository: BookingRepository;
  readonly paymentRepository: PaymentRepository;

  // 2. Gateways
  readonly emailGateway: EmailService;
  readonly googleOAuthGateway: GoogleOAuthVerifier;
  readonly tmdbGateway: ExternalMovieGateway;
  readonly vnpayGateway: PaymentGateway;

  // 3. Application Services
  readonly authService: AuthService;
  readonly movieService: MovieService;
  readonly cinemaService: CinemaService;
  readonly roomService: RoomService;
  readonly seatService: SeatService;
  readonly showtimeService: ShowtimeService;
  readonly bookingService: BookingService;
  readonly paymentService: PaymentService;

  // 4. API Controllers
  readonly authController: AuthController;
  readonly movieController: MovieController;
  readonly cinemaController: CinemaController;
  readonly roomController: RoomController;
  readonly seatController: SeatController;
  readonly showtimeController: ShowtimeController;
  readonly bookingController: BookingController;
  readonly paymentController: PaymentController;

  // 5. Background Workers
  readonly bookingExpirationWorker: BookingExpirationWorker;

  constructor(overrides: ContainerOverrides = {}) {
    // 1. Initialize Repositories
    this.userRepository = overrides.userRepository ?? new PrismaUserRepository();
    this.movieRepository = overrides.movieRepository ?? new PrismaMovieRepository();
    this.cinemaRepository = overrides.cinemaRepository ?? new PrismaCinemaRepository();
    this.roomRepository = overrides.roomRepository ?? new PrismaRoomRepository();
    this.seatRepository = overrides.seatRepository ?? new PrismaSeatRepository();
    this.showtimeRepository = overrides.showtimeRepository ?? new PrismaShowtimeRepository();
    this.bookingRepository = overrides.bookingRepository ?? new PrismaBookingRepository();
    this.paymentRepository = overrides.paymentRepository ?? new PrismaPaymentRepository();

    // 2. Initialize Gateways
    this.emailGateway = overrides.emailGateway ?? new BrevoEmailGateway();
    this.googleOAuthGateway = overrides.googleOAuthGateway ?? new GoogleOAuthGateway();
    this.tmdbGateway = overrides.tmdbGateway ?? new TmdbGateway();
    this.vnpayGateway = overrides.vnpayGateway ?? new VnpayGateway();

    // 3. Initialize Services (injecting repositories and gateways)
    this.authService =
      overrides.authService ??
      new AuthService(this.userRepository, this.emailGateway, this.googleOAuthGateway);

    this.movieService =
      overrides.movieService ??
      new MovieService(
        this.movieRepository,
        this.tmdbGateway,
        this.showtimeRepository,
        this.roomRepository,
      );

    this.cinemaService =
      overrides.cinemaService ?? new CinemaService(this.cinemaRepository);

    this.roomService =
      overrides.roomService ??
      new RoomService(this.roomRepository, this.cinemaRepository);

    this.seatService =
      overrides.seatService ??
      new SeatService(this.seatRepository, this.roomRepository);

    this.showtimeService =
      overrides.showtimeService ??
      new ShowtimeService(
        this.showtimeRepository,
        this.movieRepository,
        this.roomRepository,
      );

    this.bookingService =
      overrides.bookingService ??
      new BookingService(this.bookingRepository, this.emailGateway);

    this.paymentService =
      overrides.paymentService ??
      new PaymentService(
        this.paymentRepository,
        this.vnpayGateway,
        this.bookingRepository,
        this.emailGateway,
      );

    // 4. Initialize Controllers (injecting application services)
    this.authController = new AuthController(this.authService);
    this.movieController = new MovieController(this.movieService);
    this.cinemaController = new CinemaController(this.cinemaService);
    this.roomController = new RoomController(this.roomService);
    this.seatController = new SeatController(this.seatService);
    this.showtimeController = new ShowtimeController(this.showtimeService);
    this.bookingController = new BookingController(this.bookingService);
    this.paymentController = new PaymentController(this.paymentService);

    // 5. Initialize Background Workers
    this.bookingExpirationWorker =
      overrides.bookingExpirationWorker ?? new BookingExpirationWorker();
  }
}

/**
 * Global application IoC container singleton.
 */
export const container = new Container();
