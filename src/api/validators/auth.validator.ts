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
