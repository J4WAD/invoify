import "server-only";
import { NextResponse } from "next/server";
import { hasAnyUser, createUser } from "@/lib/auth/userStore";

const MIN_PASSWORD_LENGTH = 12;

export async function POST(req: Request) {
    if (await hasAnyUser()) {
        return NextResponse.json(
            { error: "Setup already completed" },
            { status: 403 }
        );
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { username, password } = body as Record<string, unknown>;

    if (typeof username !== "string" || username.trim().length === 0) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
            { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
            { status: 400 }
        );
    }

    try {
        await createUser({ username: username.trim(), password, role: "admin" });
        return NextResponse.json({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create user";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET() {
    if (await hasAnyUser()) {
        return NextResponse.json({ setupRequired: false }, { status: 403 });
    }
    return NextResponse.json({ setupRequired: true });
}
