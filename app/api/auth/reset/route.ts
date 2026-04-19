import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { changePassword } from "@/lib/auth/userStore";

const MIN_PASSWORD_LENGTH = 12;

export async function POST(req: Request) {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    if (!token) {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
            { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
            { status: 400 }
        );
    }

    const record = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Mark token as used and update password atomically
    await prisma.$transaction([
        prisma.passwordResetToken.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: record.userId },
            // Reset lockout on password reset
            data: { failedLogins: 0, lockedUntil: null },
        }),
    ]);

    await changePassword(record.user.username, password);

    return NextResponse.json({ ok: true });
}
