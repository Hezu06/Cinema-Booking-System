import "dotenv/config";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createMariaDbAdapter(): PrismaMariaDb {
    const connectionUrl = process.env.DATABASE_URL;

    if (connectionUrl) {
        try {
            const url = new URL(connectionUrl);
            return new PrismaMariaDb({
                host: url.hostname,
                port: Number(url.port || 3306),
                user: url.username,
                password: decodeURIComponent(url.password),
                database: url.pathname.replace(/^\//, ""),
                allowPublicKeyRetrieval: true,
            });
        } catch (error) {
            console.warn("Failed to parse DATABASE_URL, falling back to individual env variables:", error);
        }
    }

    return new PrismaMariaDb({
        host: process.env.DB_HOST ?? "localhost",
        port: Number(process.env.DB_PORT ?? 3306),
        user: process.env.DB_USER ?? "cbs",
        password: process.env.DB_PASSWORD ?? "cbs_password",
        database: process.env.DB_NAME ?? "cinema_booking",
        allowPublicKeyRetrieval: true,
    });
}

const adapter = createMariaDbAdapter();

export const prisma = new PrismaClient({ adapter });