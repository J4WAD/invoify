import "server-only";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { NODEMAILER_EMAIL, NODEMAILER_PW, BASE_URL } from "@/lib/variables";

const TOKEN_TTL_HOURS = 1;

export async function POST(req: Request) {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const username = String(body?.username ?? "").trim();

    if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Find user — always return 200 to prevent enumeration
    const user = await prisma.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
        select: { id: true, username: true, email: true },
    });

    if (!user?.email) {
        // Still return success to prevent username enumeration
        return NextResponse.json({ ok: true });
    }

    // Invalidate existing tokens for this user
    await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? BASE_URL;
    const resetUrl = `${siteUrl}/fr/auth/reset?token=${token}`;

    // Send email if Nodemailer is configured
    if (NODEMAILER_EMAIL && NODEMAILER_PW) {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: NODEMAILER_EMAIL, pass: NODEMAILER_PW },
        });
        await transporter.sendMail({
            from: `FacturApp <${NODEMAILER_EMAIL}>`,
            to: user.email,
            subject: "Réinitialisation de votre mot de passe FacturApp",
            text: `Cliquez sur ce lien pour réinitialiser votre mot de passe (valable ${TOKEN_TTL_HOURS}h) :\n\n${resetUrl}\n\nSi vous n'avez pas demandé cela, ignorez cet email.`,
            html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe (valable ${TOKEN_TTL_HOURS}h) :</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si vous n'avez pas demandé cela, ignorez cet email.</p>`,
        });
    }

    return NextResponse.json({ ok: true });
}
