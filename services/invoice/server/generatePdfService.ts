import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helpers
import { getInvoiceTemplate } from "@/lib/helpers";

// Browser pool (shared singleton — avoids per-request Chromium launch overhead)
import { getBrowser } from "@/lib/puppeteer/browserPool";
import { logger } from "@/lib/logger";

// Types
import { InvoiceType } from "@/types";

// Load self-hosted Tailwind CSS once at module init (avoids CDN dependency)
let _tailwindCss: string | null = null;
function getTailwindCss(): string {
    if (!_tailwindCss) {
        const cssPath = path.join(process.cwd(), "public", "tailwind-pdf.min.css");
        _tailwindCss = fs.readFileSync(cssPath, "utf-8");
    }
    return _tailwindCss;
}

/**
 * Generate a PDF document of an invoice based on the provided data.
 *
 * @async
 * @param {NextRequest} req - The Next.js request object.
 * @throws {Error} If there is an error during the PDF generation process.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object containing the generated PDF.
 */
export async function generatePdfService(req: NextRequest) {
    const body: InvoiceType = await req.json();
    let page;

    try {
        const ReactDOMServer = (await import("react-dom/server")).default;
        const templateId = body.details.pdfTemplate;
        const InvoiceTemplate = await getInvoiceTemplate(templateId);
        const htmlTemplate = ReactDOMServer.renderToStaticMarkup(
            InvoiceTemplate(body)
        );

        const browser = await getBrowser();
        page = await browser.newPage();

        // A4 at 96dpi so `position: fixed` elements and CSS layout anchor to
        // the actual page box Puppeteer will render.
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

        // Build a complete HTML document with Tailwind CSS inlined from disk
        // so there is no external network dependency during PDF rendering.
        const fullHtml = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${getTailwindCss()}</style>
    <style>
      @page { size: A4; margin: 0; }
      body { margin: 0; padding: 0; font-family: sans-serif; }
    </style>
  </head>
  <body>${htmlTemplate}</body>
</html>`;

        await page.setContent(fullHtml, {
            waitUntil: "load",
            timeout: 30000,
        });

        // Ensure any <img> (logo, watermark) have fully decoded.
        await page
            .evaluate(async () => {
                const imgs = Array.from(document.images);
                await Promise.all(
                    imgs.map((img) =>
                        img.complete
                            ? Promise.resolve()
                            : new Promise((res) => {
                                  img.addEventListener("load", res);
                                  img.addEventListener("error", res);
                              })
                    )
                );
            })
            .catch(() => {});

		const pdf: Uint8Array = await page.pdf({
			format: "a4",
			printBackground: true,
			preferCSSPageSize: false,
			displayHeaderFooter: true,
			headerTemplate: '<span></span>',
			footerTemplate: `
				<div style="font-size:9px;width:100%;text-align:center;color:#999;padding:0 40px;font-family:sans-serif;">
					<span class="pageNumber"></span> / <span class="totalPages"></span>
				</div>
			`,
			margin: { top: '20px', right: '0px', bottom: '40px', left: '0px' },
		});

		return new NextResponse(new Blob([pdf], { type: "application/pdf" }), {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": "attachment; filename=invoice.pdf",
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
			status: 200,
		});
	} catch (error: any) {
		logger.error({ err: error }, "pdf generation failed");
		return new NextResponse(
			JSON.stringify({ error: "Failed to generate PDF" }),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {
                logger.error({ err: e }, "puppeteer page close failed");
            }
        }
    }
}
