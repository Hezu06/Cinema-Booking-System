import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { userRepository } from "../../data-access/repositories/user.repository.js";
import type { RegisterInput } from "../../api/validators/auth.validator.js";

export const authService = {
    async register(input: RegisterInput) {
        const existingUser = await userRepository.findByEmail(input.email);

        if (existingUser) {
            throw new Error("Email đã được sử dụng");
        }

        const passwordHash = await bcrypt.hash(input.password, 12);

        return userRepository.create({
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            passwordHash,
        });
    },

    async login(email: string, password: string) {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            throw new Error("Email hoặc mật khẩu không đúng");
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            throw new Error("Email hoặc mật khẩu không đúng");
        }

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
            },
            accessToken,
        };
    },
};