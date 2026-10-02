import { prisma } from "../prisma/client.js";
import type { UserRepository, CreateUserData } from "../../business/interfaces/user.interface.js";
import type { SafeUser, User } from "../../business/models/user.model.js";

export class PrismaUserRepository implements UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string): Promise<SafeUser | null> {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
    }

    async create(data: CreateUserData): Promise<SafeUser> {
        return prisma.user.create({
            data,
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
    }
}

export const userRepository = new PrismaUserRepository();
