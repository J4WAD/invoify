import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createUser } from "@/lib/auth/userStore";
import { checkRegisterRateLimit } from "@/lib/auth/ratelimit";

const MIN_PASSWORD_LENGTH = 12;

export async function POST(req: Request) {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await checkRegisterRateLimit(ip);
    if (!rl.success) {
        return NextResponse.json({ error: "Too many requests" }, {
            status: 429,
            headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) },
        });
    }

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");
    const role = body?.role === "admin" ? "admin" : "user";

    if (!username || password.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
            { error: `Username required and password must be at least ${MIN_PASSWORD_LENGTH} characters` },
            { status: 400 }
        );
    }

    try {
        const user = await createUser({ username, password, role });
        return NextResponse.json({ id: user.id, username: user.username, role: user.role });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 400 });
    }
}
