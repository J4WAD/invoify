import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/db";

function getVersion(): string {
    try {
        const pkg = JSON.parse(
            readFileSync(join(process.cwd(), "package.json"), "utf8")
        ) as { version?: string };
        return pkg.version ?? "unknown";
    } catch {
        return "unknown";
    }
}

async function checkDb(): Promise<"ok" | "error"> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return "ok";
    } catch {
        return "error";
    }
}

async function checkRedis(): Promise<"ok" | "error" | "skipped"> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return "skipped";
    try {
        const res = await fetch(`${url}/ping`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        return res.ok ? "ok" : "error";
    } catch {
        return "error";
    }
}

export async function GET() {
    const [db, redis] = await Promise.all([checkDb(), checkRedis()]);
    const status =
        db === "ok" && (redis === "ok" || redis === "skipped")
            ? "ok"
            : "degraded";

    return NextResponse.json(
        {
            status,
            db,
            redis,
            version: getVersion(),
            ts: new Date().toISOString(),
        },
        { status: status === "ok" ? 200 : 503 }
    );
}
