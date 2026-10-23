export interface BookingTicketEmailData {
    to: string;
    name: string;
    bookingCode: string;
    bookingId: string;
    movieTitle: string;
    moviePosterUrl?: string | null | undefined;
    cinemaName: string;
    cinemaAddress: string;
    roomName: string;
    startTime: Date;
    seatLabels: string[];
    totalAmount: number;
    ticketUrl: string;
}

export interface EmailService {
    sendVerificationEmail(to: string, name: string, otpCode: string): Promise<boolean>;
    sendPasswordResetEmail(to: string, name: string, otpCode: string): Promise<boolean>;
    sendBookingTicketEmail(data: BookingTicketEmailData): Promise<boolean>;
}
