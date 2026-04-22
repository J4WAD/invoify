import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProfileSchema } from "@/lib/schemas/profile";
import type { Prisma, TaxRegime } from "@prisma/client";

type FlatProfile = Prisma.ProfileGetPayload<Record<string, never>>;

function dbToClient(p: FlatProfile) {
    return {
        businessInfo: {
            name: p.name,
            address: p.address,
            zipCode: p.zipCode,
            city: p.city,
            country: p.country,
            email: p.email,
            phone: p.phone,
            nif: p.nif,
            nis: p.nis,
            rc: p.rc,
            ai: p.ai,
            customInputs: Array.isArray(p.customInputs) ? p.customInputs : [],
        },
        branding: {
            logo: p.logo ?? "",
            watermarkLogo: p.watermarkLogo ?? "",
            brandColor: p.brandColor,
            defaultTemplate: p.defaultTemplate,
        },
        invoiceDefaults: {
            currency: p.currency,
            language: p.language,
            invoiceNumberPrefix: p.invoiceNumberPrefix,
            nextInvoiceNumber: p.nextInvoiceNumber,
            defaultTaxRate: p.defaultTaxRate,
            defaultTaxType: p.defaultTaxType,
            defaultTaxID: p.defaultTaxID,
            defaultDiscountRate: p.defaultDiscountRate,
            defaultDiscountType: p.defaultDiscountType,
            defaultShippingCost: p.defaultShippingCost,
            defaultShippingType: p.defaultShippingType,
            defaultPaymentTerms: p.defaultPaymentTerms,
            defaultAdditionalNotes: p.defaultAdditionalNotes,
            documentCounters: p.documentCounters,
        },
        paymentInfo: {
            bankName: p.bankName,
            accountName: p.accountName,
            accountNumber: p.accountNumber,
        },
    };
}

type PartialClientProfile = Partial<ReturnType<typeof dbToClient>>;

function clientToDbUpdate(input: PartialClientProfile): Prisma.ProfileUpdateInput {
    const out: Prisma.ProfileUpdateInput = {};
    if (input.businessInfo) {
        const b = input.businessInfo;
        Object.assign(out, {
            name: b.name,
            address: b.address,
            zipCode: b.zipCode,
            city: b.city,
            country: b.country,
            email: b.email,
            phone: b.phone,
            nif: b.nif,
            nis: b.nis,
            rc: b.rc,
            ai: b.ai,
            customInputs: b.customInputs as Prisma.InputJsonValue,
        });
    }
    if (input.branding) {
        const b = input.branding;
        Object.assign(out, {
            logo: b.logo,
            watermarkLogo: b.watermarkLogo,
            brandColor: b.brandColor,
            defaultTemplate: b.defaultTemplate,
        });
    }
    if (input.invoiceDefaults) {
        const d = input.invoiceDefaults;
        Object.assign(out, {
            currency: d.currency,
            language: d.language,
            invoiceNumberPrefix: d.invoiceNumberPrefix,
            nextInvoiceNumber: d.nextInvoiceNumber,
            defaultTaxRate: d.defaultTaxRate,
            defaultTaxType: d.defaultTaxType,
            defaultTaxID: d.defaultTaxID,
            defaultDiscountRate: d.defaultDiscountRate,
            defaultDiscountType: d.defaultDiscountType,
            defaultShippingCost: d.defaultShippingCost,
            defaultShippingType: d.defaultShippingType,
            defaultPaymentTerms: d.defaultPaymentTerms,
            defaultAdditionalNotes: d.defaultAdditionalNotes,
            documentCounters: d.documentCounters as Prisma.InputJsonValue,
        });
    }
    if (input.paymentInfo) {
        const p = input.paymentInfo;
        Object.assign(out, {
            bankName: p.bankName,
            accountName: p.accountName,
            accountNumber: p.accountNumber,
        });
    }
    return out;
}

export async function GET(_req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const profile = await prisma.profile.upsert({
        where: { userId },
        create: { userId },
        update: {},
    });

    return NextResponse.json(dbToClient(profile));
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const body = await req.json();
    const parsed = ProfileSchema.partial().safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid profile data", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const updateData = clientToDbUpdate(parsed.data as PartialClientProfile);

    const createData = { ...(updateData as Prisma.ProfileUncheckedCreateInput), userId };

    const profile = await prisma.profile.upsert({
        where: { userId },
        create: createData,
        update: updateData,
    });

    return NextResponse.json(dbToClient(profile));
}
