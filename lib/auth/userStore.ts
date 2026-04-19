import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

export type StoredUser = {
    id: string;
    username: string;
    passwordHash: string;
    role: "admin" | "user";
    createdAt: string;
};

export class AccountLockedError extends Error {
    retryAfter: Date;
    constructor(retryAfter: Date) {
        super("Account temporarily locked");
        this.name = "AccountLockedError";
        this.retryAfter = retryAfter;
    }
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;

function mapRole(role: Role): "admin" | "user" {
    return role === "ADMIN" ? "admin" : "user";
}

function toStoredUser(u: { id: string; username: string; passwordHash: string; role: Role; createdAt: Date }): StoredUser {
    return {
        id: u.id,
        username: u.username,
        passwordHash: u.passwordHash,
        role: mapRole(u.role),
        createdAt: u.createdAt.toISOString(),
    };
}

export function readUserStore(): StoredUser[] {
    throw new Error("readUserStore() is deprecated — use Prisma directly");
}

export function writeUserStore(_users: StoredUser[]): void {
    throw new Error("writeUserStore() is deprecated — use Prisma directly");
}

export async function hasAnyUser(): Promise<boolean> {
    const count = await prisma.user.count();
    return count > 0;
}

export async function verifyCredentials(username: string, password: string): Promise<StoredUser | null> {
    const user = await prisma.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
    });
    if (!user) return null;

    if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new AccountLockedError(user.lockedUntil);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
        const newFailed = user.failedLogins + 1;
        const shouldLock = newFailed >= LOCKOUT_THRESHOLD;
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLogins: newFailed,
                lockedUntil: shouldLock
                    ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                    : undefined,
            },
        });
        return null;
    }

    // Reset on success
    if (user.failedLogins > 0 || user.lockedUntil) {
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: 0, lockedUntil: null },
        });
    }

    return toStoredUser(user);
}

export async function createUser(input: {
    username: string;
    password: string;
    role?: "admin" | "user";
}): Promise<StoredUser> {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
        data: {
            username: input.username,
            passwordHash,
            role: input.role === "admin" ? "ADMIN" : "USER",
        },
    });
    return toStoredUser(user);
}

export async function changePassword(username: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { username },
        data: { passwordHash },
    });
}

export async function deleteUser(username: string): Promise<void> {
    await prisma.user.delete({ where: { username } });
}

export async function getUserByUsername(username: string): Promise<StoredUser | null> {
    const user = await prisma.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
    });
    return user ? toStoredUser(user) : null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toStoredUser(user) : null;
}
