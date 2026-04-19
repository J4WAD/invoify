#!/usr/bin/env tsx
/**
 * One-shot CLI to create the initial admin account.
 * Run: npx tsx scripts/create-admin.ts
 *
 * Reads DATABASE_URL from .env.local (or environment).
 */

// Load env vars from .env.local before importing Prisma
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import * as readline from "readline";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const MIN_PASSWORD_LENGTH = 12;

function prompt(question: string, hidden = false): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });
        if (hidden && process.stdout.isTTY) {
            process.stdout.write(question);
            let value = "";
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding("utf8");
            process.stdin.on("data", function onData(char: string) {
                if (char === "\r" || char === "\n") {
                    process.stdin.setRawMode(false);
                    process.stdin.removeListener("data", onData);
                    process.stdout.write("\n");
                    rl.close();
                    resolve(value);
                } else if (char === "\u0003") {
                    process.exit(1);
                } else if (char === "\u007f") {
                    value = value.slice(0, -1);
                } else {
                    value += char;
                }
            });
        } else {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        }
    });
}

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL is not set. Check your .env.local file.");
        process.exit(1);
    }

    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

    console.log("\n── FacturApp — Create Admin ──────────────────────\n");

    const existing = await prisma.user.count();
    if (existing > 0) {
        const proceed = await prompt("Users already exist. Add another admin? [y/N] ");
        if (proceed.trim().toLowerCase() !== "y") {
            console.log("Aborted.");
            await prisma.$disconnect();
            process.exit(0);
        }
    }

    const username = (await prompt("Username: ")).trim();
    if (!username) {
        console.error("Username cannot be empty.");
        await prisma.$disconnect();
        process.exit(1);
    }

    const password = await prompt("Password (min 12 chars): ", true);
    if (password.length < MIN_PASSWORD_LENGTH) {
        console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        await prisma.$disconnect();
        process.exit(1);
    }

    const confirm = await prompt("Confirm password: ", true);
    if (password !== confirm) {
        console.error("Passwords do not match.");
        await prisma.$disconnect();
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
        data: { username, passwordHash, role: "ADMIN" },
    });

    console.log(`\nAdmin "${username}" created successfully.\n`);
    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error(err);
    process.exit(1);
});
