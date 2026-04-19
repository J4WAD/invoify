import { NextRequest } from "next/server";
import { render } from "@react-email/render";
import { SendPdfEmail } from "@/app/components";
import { fileToBuffer } from "@/lib/helpers";
import { sendEmail } from "@/lib/email/emailService";

export async function sendPdfToEmailService(req: NextRequest): Promise<boolean> {
    const fd = await req.formData();

    const email = fd.get("email") as string;
    const invoicePdf = fd.get("invoicePdf") as File;
    const invoiceNumber = fd.get("invoiceNumber") as string;
    const userId = (fd.get("userId") as string) || undefined;
    const invoiceId = (fd.get("invoiceId") as string) || undefined;

    const emailHTML = await render(SendPdfEmail({ invoiceNumber }));
    const invoiceBuffer = await fileToBuffer(invoicePdf);

    return sendEmail({
        to: email,
        subject: `Facture FacturApp : #${invoiceNumber}`,
        html: emailHTML,
        attachments: [{ filename: `facture-${invoiceNumber}.pdf`, content: invoiceBuffer }],
        userId,
        invoiceId,
    });
}
