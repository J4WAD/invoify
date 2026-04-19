import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { changePassword, getUserByUsername, verifyCredentials } from "@/lib/auth/userStore";

const MIN_PASSWORD_LENGTH = 12;

export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
            { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` },
            { status: 400 }
        );
    }

    const username = String((session.user as { username?: string })?.username ?? session.user?.name ?? "");
    const user = await getUserByUsername(username);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify current password — verifyCredentials resets lockout on success
    const verified = await verifyCredentials(user.username, currentPassword);
    if (!verified) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
    }

    await changePassword(user.username, newPassword);
    return NextResponse.json({ ok: true });
}
