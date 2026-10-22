export interface EmailService {
    sendVerificationEmail(to: string, name: string, otpCode: string): Promise<boolean>;
    sendPasswordResetEmail?(to: string, name: string, resetToken: string): Promise<boolean>;
}
