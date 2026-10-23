import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRepository } from "../interfaces/user.interface.js";
import type {
    RegisterDTO,
    AuthResult,
    VerifyEmailDTO,
    ResendVerificationDTO,
    ForgotPasswordDTO,
    ResetPasswordDTO,
    ChangePasswordDTO,
    GoogleOAuthVerifier,
} from "../interfaces/auth.interface.js";
import type { EmailService } from "../interfaces/email.interface.js";
import { AuthProvider, UserRole, type SafeUser, type User } from "../models/user.model.js";

export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly emailService?: EmailService,
        private readonly googleOAuthVerifier?: GoogleOAuthVerifier
    ) {}

    async register(input: RegisterDTO): Promise<SafeUser> {
        const existingUser = await this.userRepository.findByEmail(input.email);

        if (existingUser) {
            if (existingUser.isVerified) {
                throw new Error("Email đã được sử dụng");
            }

            // Tài khoản chưa xác thực: cho phép cập nhật lại thông tin, tạo mã OTP mới và gửi lại email
            const passwordHash = await bcrypt.hash(input.password, 12);
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await this.userRepository.update(existingUser.id, {
                fullName: input.fullName,
                phone: input.phone,
                passwordHash,
                verificationToken: otpCode,
                verificationExpiresAt,
            });

            if (this.emailService) {
                await this.emailService.sendVerificationEmail(
                    input.email,
                    input.fullName,
                    otpCode
                );
            }

            const safeUser = await this.userRepository.findById(existingUser.id);
            return safeUser!;
        }

        const passwordHash = await bcrypt.hash(input.password, 12);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        const newUser = await this.userRepository.create({
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            passwordHash,
            provider: AuthProvider.LOCAL,
            isVerified: false,
            verificationToken: otpCode,
            verificationExpiresAt,
        });

        if (this.emailService) {
            await this.emailService.sendVerificationEmail(
                input.email,
                input.fullName,
                otpCode
            );
        }

        return newUser;
    }

    async login(email: string, password: string): Promise<AuthResult> {
        const user = await this.userRepository.findByEmail(email);

        if (!user || !user.passwordHash) {
            throw new Error("Email hoặc mật khẩu không đúng");
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            throw new Error("Email hoặc mật khẩu không đúng");
        }

        if (user.provider === AuthProvider.LOCAL && !user.isVerified) {
            if (user.role === UserRole.ADMIN) {
                await this.userRepository.update(user.id, { isVerified: true });
                user.isVerified = true;
            } else {
                throw new Error("Tài khoản chưa được kích hoạt. Vui lòng xác thực email của bạn");
            }
        }

        return this.generateAuthResult(user);
    }

    async loginWithGoogle(idToken: string): Promise<AuthResult> {
        if (!this.googleOAuthVerifier) {
            throw new Error("Dịch vụ xác thực Google chưa được cấu hình");
        }

        const payload = await this.googleOAuthVerifier.verifyIdToken(idToken);

        // 1. Check if user already linked with this googleId
        let user = await this.userRepository.findByGoogleId(payload.sub);

        if (!user) {
            // 2. Check if user exists with the same email (Account Linking)
            const existingByEmail = await this.userRepository.findByEmail(payload.email);

            if (existingByEmail) {
                // Link account
                await this.userRepository.update(existingByEmail.id, {
                    googleId: payload.sub,
                    avatar: existingByEmail.avatar || payload.picture,
                    isVerified: true,
                });
                user = await this.userRepository.findByEmail(payload.email);
            } else {
                // 3. Create brand-new user with Google provider
                await this.userRepository.create({
                    fullName: payload.name,
                    email: payload.email,
                    provider: AuthProvider.GOOGLE,
                    googleId: payload.sub,
                    avatar: payload.picture,
                    isVerified: true,
                    passwordHash: null,
                    phone: null,
                });
                user = await this.userRepository.findByEmail(payload.email);
            }
        }

        if (!user) {
            throw new Error("Không thể khởi tạo hoặc tìm kiếm tài khoản người dùng");
        }

        return this.generateAuthResult(user);
    }

    async getProfile(userId: string): Promise<SafeUser | null> {
        return this.userRepository.findById(userId);
    }

    async verifyEmail(input: VerifyEmailDTO): Promise<AuthResult> {
        const email = input.email.trim().toLowerCase();
        const code = input.code.trim();

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error("Tài khoản không tồn tại");
        }

        if (user.isVerified) {
            throw new Error("Tài khoản đã được xác thực trước đó");
        }

        if (!user.verificationToken || user.verificationToken !== code) {
            throw new Error("Mã xác thực không chính xác");
        }

        if (!user.verificationExpiresAt || user.verificationExpiresAt.getTime() < Date.now()) {
            throw new Error("Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã mới");
        }

        await this.userRepository.update(user.id, {
            isVerified: true,
            verificationToken: null,
            verificationExpiresAt: null,
        });

        const updatedUser = await this.userRepository.findByEmail(email);
        if (!updatedUser) {
            throw new Error("Không thể tìm kiếm tài khoản sau khi xác thực");
        }

        return this.generateAuthResult(updatedUser);
    }

    async resendVerificationCode(email: string, force: boolean = false): Promise<boolean> {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);

        if (!user) {
            throw new Error("Tài khoản không tồn tại");
        }

        if (user.isVerified) {
            throw new Error("Tài khoản đã được xác thực trước đó");
        }

        const now = Date.now();
        // Rate-limit check: cooldown of 60 seconds
        if (!force && user.verificationExpiresAt) {
            const timeLeft = user.verificationExpiresAt.getTime() - now;
            // Originally valid for 15m (15 * 60 * 1000 = 900,000ms).
            // If timeLeft > 14m, it was issued less than 60s ago.
            if (timeLeft > 14 * 60 * 1000) {
                const waitSeconds = Math.ceil((timeLeft - 14 * 60 * 1000) / 1000);
                throw new Error(`Vui lòng đợi ${waitSeconds} giây trước khi yêu cầu mã xác thực mới`);
            }
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiresAt = new Date(now + 15 * 60 * 1000);

        await this.userRepository.update(user.id, {
            verificationToken: otpCode,
            verificationExpiresAt,
        });

        if (this.emailService) {
            await this.emailService.sendVerificationEmail(
                user.email,
                user.fullName,
                otpCode
            );
        }

        return true;
    }

    async forgotPassword(input: ForgotPasswordDTO): Promise<boolean> {
        const normalizedEmail = input.email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);

        if (!user) {
            throw new Error("Không tìm thấy tài khoản với email này");
        }

        if (user.provider === AuthProvider.GOOGLE && !user.passwordHash) {
            throw new Error("Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.");
        }

        const now = Date.now();
        // Rate-limit check: cooldown of 60 seconds
        if (user.resetPasswordExpiresAt) {
            const timeLeft = user.resetPasswordExpiresAt.getTime() - now;
            // Valid for 15m (15 * 60 * 1000 = 900,000ms).
            // If timeLeft > 14m, it was issued less than 60s ago.
            if (timeLeft > 14 * 60 * 1000) {
                const waitSeconds = Math.ceil((timeLeft - 14 * 60 * 1000) / 1000);
                throw new Error(`Vui lòng đợi ${waitSeconds} giây trước khi yêu cầu mã mới`);
            }
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetPasswordExpiresAt = new Date(now + 15 * 60 * 1000);

        await this.userRepository.update(user.id, {
            resetPasswordToken: otpCode,
            resetPasswordExpiresAt,
        });

        if (this.emailService) {
            await this.emailService.sendPasswordResetEmail(
                user.email,
                user.fullName,
                otpCode
            );
        }

        return true;
    }

    async resetPassword(input: ResetPasswordDTO): Promise<boolean> {
        const email = input.email.trim().toLowerCase();
        const code = input.code.trim();

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error("Không tìm thấy tài khoản với email này");
        }

        if (!user.resetPasswordToken || user.resetPasswordToken !== code) {
            throw new Error("Mã xác thực không chính xác");
        }

        if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt.getTime() < Date.now()) {
            throw new Error("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã đặt lại mật khẩu mới");
        }

        const passwordHash = await bcrypt.hash(input.newPassword, 12);

        await this.userRepository.update(user.id, {
            passwordHash,
            resetPasswordToken: null,
            resetPasswordExpiresAt: null,
            isVerified: true,
        });

        return true;
    }

    async changePassword(input: ChangePasswordDTO): Promise<boolean> {
        const user = await this.userRepository.findWithPasswordById(input.userId);
        if (!user) {
            throw new Error("Người dùng không tồn tại");
        }

        if (!user.passwordHash) {
            throw new Error("Tài khoản của bạn đăng nhập qua Google OAuth, không sử dụng mật khẩu.");
        }

        const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new Error("Mật khẩu hiện tại không chính xác");
        }

        if (input.currentPassword === input.newPassword) {
            throw new Error("Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        const newHash = await bcrypt.hash(input.newPassword, 12);
        await this.userRepository.update(user.id, {
            passwordHash: newHash,
        });

        return true;
    }

    private generateAuthResult(user: User): AuthResult {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET chưa được cấu hình");
        }

        const expiresIn = (
            process.env.JWT_EXPIRES_IN ?? "1h"
        ) as NonNullable<SignOptions["expiresIn"]>;

        const signOptions: SignOptions = {
            expiresIn,
        };

        const accessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
            },
            secret,
            signOptions
        );

        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                provider: user.provider,
                googleId: user.googleId,
                avatar: user.avatar,
                isVerified: user.isVerified,
                verificationExpiresAt: user.verificationExpiresAt,
                resetPasswordExpiresAt: user.resetPasswordExpiresAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            accessToken,
        };
    }
}
