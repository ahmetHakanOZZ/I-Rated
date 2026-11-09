import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const database = process.env.DB_NAME;

if (!host || !user || !database) {
    throw new Error("DB_HOST, DB_USER, and DB_NAME must be set in server/.env");
}

export const db = mysql.createPool({
    host,
    port: Number(process.env.DB_PORT ?? "3306"),
    user,
    password: process.env.DB_PASSWORD ?? "",
    database,
});
