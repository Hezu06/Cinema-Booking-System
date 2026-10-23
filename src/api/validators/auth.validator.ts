import { z } from "zod";

export const registerSchema = z.object({
    fullName: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    phone: z
        .string()
        .trim()
        .regex(/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const googleAuthSchema = z.object({
    idToken: z.string().trim().min(1, "Google ID token là bắt buộc"),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export const verifyEmailSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    code: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Mã xác thực phải gồm đúng 6 chữ số"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    force: z.boolean().optional(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    code: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Mã xác thực phải gồm đúng 6 chữ số"),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
