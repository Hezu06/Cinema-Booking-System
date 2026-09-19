import { prisma } from "../prisma/client.js";
import type { UserRole, UserStatus } from "../../../generated/prisma/client.js";

export const userRepository = {
    findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    },

    findById(id: string) {
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
    },

    create(data: {
        fullName: string;
        email: string;
        passwordHash: string;
        phone: string;
        role?: UserRole;
        status?: UserStatus;
    }) {
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
    },
};
