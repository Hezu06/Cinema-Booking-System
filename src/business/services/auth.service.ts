import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRepository } from "../interfaces/user.interface.js";
import type { RegisterDTO, AuthResult } from "../interfaces/auth.interface.js";
import type { SafeUser } from "../models/user.model.js";

export class AuthService {
    constructor(private readonly userRepository: UserRepository) {}

    async register(input: RegisterDTO): Promise<SafeUser> {
        const existingUser = await this.userRepository.findByEmail(input.email);

        if (existingUser) {
            throw new Error("Email đã được sử dụng");
        }

        const passwordHash = await bcrypt.hash(input.password, 12);

        return this.userRepository.create({
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            passwordHash,
        });
    }

    async login(email: string, password: string): Promise<AuthResult> {
        const user = await this.userRepository.findByEmail(email);

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
                createdAt: user.createdAt,
            },
            accessToken,
        };
    }

    async getProfile(userId: string): Promise<SafeUser | null> {
        return this.userRepository.findById(userId);
    }
}