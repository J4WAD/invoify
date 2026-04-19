/**
 * Unified email service.
 * Uses Resend when RESEND_API_KEY is set, falls back to Nodemailer/Gmail.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "FacturApp <no-reply@facturapp.dz>";
const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;
const NODEMAILER_PW = process.env.NODEMAILER_PW;

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
    }>;
    // For logging only
    userId?: string;
    invoiceId?: string;
}

async function sendViaResend(opts: SendEmailOptions): Promise<string> {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    const attachments = opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType ?? "application/pdf",
    }));

    const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        attachments,
    });

    if (result.error) {
        throw new Error(result.error.message);
    }

    return result.data?.id ?? "";
}

async function sendViaNodemailer(opts: SendEmailOptions): Promise<void> {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: NODEMAILER_EMAIL, pass: NODEMAILER_PW },
    });

    await transporter.sendMail({
        from: "FacturApp",
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        attachments: opts.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
        })),
    });
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
    let providerId: string | undefined;
    let error: string | undefined;
    let status = "sent";

    try {
        if (RESEND_API_KEY) {
            providerId = await sendViaResend(opts);
        } else if (NODEMAILER_EMAIL && NODEMAILER_PW) {
            await sendViaNodemailer(opts);
        } else {
            throw new Error("No email provider configured. Set RESEND_API_KEY or NODEMAILER_EMAIL+NODEMAILER_PW.");
        }
    } catch (err: unknown) {
        status = "failed";
        error = err instanceof Error ? err.message : String(err);
        logger.error({ err: error }, "email send failed");
    }

    // Fire-and-forget DB log — never let logging block or fail the response
    if (opts.userId) {
        prisma.emailLog
            .create({
                data: {
                    userId: opts.userId,
                    invoiceId: opts.invoiceId,
                    to: opts.to,
                    subject: opts.subject,
                    status,
                    providerId,
                    error,
                },
            })
            .catch((e: unknown) =>
                logger.error({ err: e }, "EmailLog write failed")
            );
    }

    return status === "sent";
}
