import "dotenv/config";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST ?? "mysql",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "cbs",
    password: process.env.DB_PASSWORD ?? "cbs_password",
    database: process.env.DB_NAME ?? "cinema_booking",
});

export const prisma = new PrismaClient({ adapter });