import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

async function getProfileId(userId: string): Promise<string> {
    const profile = await prisma.profile.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
    });
    return profile.id;
}

export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const profileId = await getProfileId(session.user.id as string);

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client || client.profileId !== profileId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const profileId = await getProfileId(session.user.id as string);

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client || client.profileId !== profileId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, address, zipCode, city, country, email, phone } = body;

    const updated = await prisma.client.update({
        where: { id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(address !== undefined && { address }),
            ...(zipCode !== undefined && { zipCode }),
            ...(city !== undefined && { city }),
            ...(country !== undefined && { country }),
            ...(email !== undefined && { email }),
            ...(phone !== undefined && { phone }),
        },
    });

    return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const profileId = await getProfileId(session.user.id as string);

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client || client.profileId !== profileId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
}
