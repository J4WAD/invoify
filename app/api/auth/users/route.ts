import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readUserStore } from "@/lib/auth/userStore";

export async function GET() {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const users = readUserStore().map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json({ users });
}
