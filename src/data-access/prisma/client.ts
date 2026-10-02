import "dotenv/config";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import mariadb from "mariadb";

function createMariaDbAdapter(): PrismaMariaDb {
    const connectionUrl = process.env.DATABASE_URL;

    if (connectionUrl) {
        const url = new URL(connectionUrl);
        const pool = mariadb.createPool({
            host: url.hostname,
            port: Number(url.port || 3306),
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ""),
            connectionLimit: 1,
            minimumIdle: 1,
            connectTimeout: 15_000,
            acquireTimeout: 30_000,
            prepareCacheLength: 0,
        });

        return new PrismaMariaDb(pool, {
            disposeExternalPool: true,
        });
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
