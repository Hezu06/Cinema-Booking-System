import { prisma } from "../prisma/client.js";
import type { UserRepository, CreateUserData } from "../../business/interfaces/user.interface.js";
import type { SafeUser, User } from "../../business/models/user.model.js";

const safeUserSelect = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    provider: true,
    googleId: true,
    avatar: true,
    isVerified: true,
    verificationExpiresAt: true,
    resetPasswordExpiresAt: true,
    createdAt: true,
    updatedAt: true,
};

export class PrismaUserRepository implements UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { googleId },
        });
    }

    async findById(id: string): Promise<SafeUser | null> {
        return prisma.user.findUnique({
            where: { id },
            select: safeUserSelect,
        });
    }

    async findWithPasswordById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    async create(data: CreateUserData): Promise<SafeUser> {
        return prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
                ...(data.phone !== undefined ? { phone: data.phone } : {}),
                ...(data.role !== undefined ? { role: data.role } : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.provider !== undefined ? { provider: data.provider } : {}),
                ...(data.googleId !== undefined ? { googleId: data.googleId } : {}),
                ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
                ...(data.isVerified !== undefined ? { isVerified: data.isVerified } : {}),
                ...(data.verificationToken !== undefined ? { verificationToken: data.verificationToken } : {}),
                ...(data.verificationExpiresAt !== undefined ? { verificationExpiresAt: data.verificationExpiresAt } : {}),
            },
            select: safeUserSelect,
        });
    }

    async update(id: string, data: Partial<User>): Promise<SafeUser> {
        const updateData: Record<string, any> = {};
        if (data.fullName !== undefined) updateData.fullName = data.fullName;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.provider !== undefined) updateData.provider = data.provider;
        if (data.googleId !== undefined) updateData.googleId = data.googleId;
        if (data.avatar !== undefined) updateData.avatar = data.avatar;
        if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
        if (data.verificationToken !== undefined) updateData.verificationToken = data.verificationToken;
        if (data.verificationExpiresAt !== undefined) updateData.verificationExpiresAt = data.verificationExpiresAt;
        if (data.resetPasswordToken !== undefined) updateData.resetPasswordToken = data.resetPasswordToken;
        if (data.resetPasswordExpiresAt !== undefined) updateData.resetPasswordExpiresAt = data.resetPasswordExpiresAt;

        return prisma.user.update({
            where: { id },
            data: updateData,
            select: safeUserSelect,
        });
    }
}

export const userRepository = new PrismaUserRepository();
