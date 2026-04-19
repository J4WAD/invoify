import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function getProfileId(userId: string): Promise<string> {
    const profile = await prisma.profile.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
    });
    return profile.id;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;
    const profileId = await getProfileId(userId);

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";

    const clients = await prisma.client.findMany({
        where: {
            profileId,
            ...(search
                ? {
                      OR: [
                          { name: { contains: search, mode: "insensitive" } },
                          { email: { contains: search, mode: "insensitive" } },
                          { city: { contains: search, mode: "insensitive" } },
                      ],
                  }
                : {}),
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;
    const profileId = await getProfileId(userId);

    const body = await req.json();
    const { name, address, zipCode, city, country, email, phone } = body;

    if (!name?.trim()) {
        return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    const client = await prisma.client.create({
        data: {
            profileId,
            name: name.trim(),
            address: address ?? "",
            zipCode: zipCode ?? "",
            city: city ?? "",
            country: country ?? "",
            email: email ?? "",
            phone: phone ?? "",
        },
    });

    return NextResponse.json(client, { status: 201 });
}
