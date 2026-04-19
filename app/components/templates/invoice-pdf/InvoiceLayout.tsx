import { ReactNode } from "react";

// Types
import { InvoiceType } from "@/types";

type InvoiceLayoutProps = {
    data: InvoiceType;
    children: ReactNode;
};

export default function InvoiceLayout({ data, children }: InvoiceLayoutProps) {
    const { sender, receiver, details } = data;

    // Instead of fetching all signature fonts, get the specific one user selected.
    const fontHref = details.signature?.fontFamily
        ? `https://fonts.googleapis.com/css2?family=${details?.signature?.fontFamily}&display=swap`
        : "";

    const head = (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
                rel="stylesheet"
            ></link>
            {details.signature?.fontFamily && (
                <>
                    <link href={fontHref} rel="stylesheet" />
                </>
            )}
        </>
    );

    // Use dedicated watermark if set, otherwise fall back to invoice logo
    const watermarkSrc = details.watermarkImage || details.invoiceLogo;

    return (
        <>
            {head}
            <style dangerouslySetInnerHTML={{ __html: `
                @page { margin: 10mm 10mm 15mm 10mm; }
                .page-break-avoid { page-break-inside: avoid; }
            `}} />
            <section style={{ fontFamily: "Outfit, sans-serif" }}>
                {/* Watermark — position:fixed repeats on every Puppeteer page */}
                {watermarkSrc && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "fixed",
                            bottom: "24px",
                            right: "24px",
                            opacity: 0.07,
                            pointerEvents: "none",
                            userSelect: "none",
                            zIndex: 0,
                        }}
                    >
                        <img
                            src={watermarkSrc}
                            width={180}
                            height={180}
                            alt=""
                            style={{
                                display: "block",
                                objectFit: "contain",
                                filter: "grayscale(100%)",
                            }}
                        />
                    </div>
                )}
                <div
                    className="flex flex-col p-4 sm:p-10 bg-white rounded-xl"
                    style={{ position: "relative" }}
                >
                    <div style={{ position: "relative", zIndex: 1 }}>
                        {children}
                    </div>
                </div>
            </section>
        </>
    );
}
