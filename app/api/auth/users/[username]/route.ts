import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteUser, readUserStore } from "@/lib/auth/userStore";

export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ username: string }> }
) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { username } = await ctx.params;
    const target = decodeURIComponent(username);
    if (target.toLowerCase() === String((session.user as any)?.username ?? "").toLowerCase()) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }
    const users = readUserStore();
    if (!users.find((u) => u.username.toLowerCase() === target.toLowerCase())) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    deleteUser(target);
    return NextResponse.json({ ok: true });
}
