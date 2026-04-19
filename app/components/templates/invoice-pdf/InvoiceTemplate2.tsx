import React from "react";

// Components
import { InvoiceLayout } from "@/app/components";

// Helpers
import { formatNumberWithCommas, isDataUrl } from "@/lib/helpers";

// Variables
import { DATE_OPTIONS } from "@/lib/variables";
import { DOCUMENT_TYPE_CONFIG } from "@/lib/documentTypes";
import type { DocumentType } from "@/types";

// Types
import { InvoiceType } from "@/types";

const InvoiceTemplate2 = (data: InvoiceType) => {
    const { sender, receiver, details } = data;

    // Brand color with safe fallback
    const brand = details.brandColor || "#2563eb";
    const docType = (details.documentType || "facture") as DocumentType;
    const docConfig = DOCUMENT_TYPE_CONFIG[docType];

    return (
        <InvoiceLayout data={data}>
            {/* Header band */}
            <div
                className="rounded-lg px-6 py-5 mb-6 flex justify-between items-start"
                style={{ backgroundColor: brand }}
            >
                <div>
                    {details.invoiceLogo && (
                        <img
                            src={details.invoiceLogo}
                            width={120}
                            height={80}
                            alt={`Logo de ${sender.name}`}
                            style={{ marginBottom: "8px", filter: "brightness(0) invert(1)" }}
                        />
                    )}
                    <h1 className="text-white text-xl font-bold">{sender.name}</h1>
                    <address className="not-italic text-white text-sm opacity-80 mt-1">
                        {sender.address && <span>{sender.address}<br /></span>}
                        {sender.zipCode && sender.city && <span>{sender.zipCode}, {sender.city}<br /></span>}
                        {sender.country && <span>{sender.country}</span>}
                    </address>
                    {/* Sender legal identifiers in header band */}
                    {(sender.nif || sender.nis || sender.rc || sender.ai) && (
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", marginTop: "4px", lineHeight: "1.6" }}>
                            {sender.nif && <span><b>NIF:</b> {sender.nif}&nbsp; </span>}
                            {sender.nis && <span><b>NIS:</b> {sender.nis}&nbsp; </span>}
                            {sender.rc  && <span><b>RC:</b>  {sender.rc}&nbsp; </span>}
                            {sender.ai  && <span><b>AI:</b>  {sender.ai}</span>}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <h2 className="text-white text-3xl font-extrabold tracking-tight">{docConfig.pdfTitle}</h2>
                    <p className="text-white opacity-80 text-sm mt-1">N° {details.invoiceNumber}</p>
                    <div className="mt-3 text-white text-sm opacity-90 space-y-0.5">
                        <p>
                            <span className="opacity-70">Émission : </span>
                            {new Date(details.invoiceDate).toLocaleDateString("fr-FR", DATE_OPTIONS)}
                        </p>
                        {(docConfig.showDueDate || docConfig.showDeliveryDate) && (
                            <p>
                                <span className="opacity-70">
                                    {docConfig.showDeliveryDate ? "Livraison : " : "Échéance : "}
                                </span>
                                {new Date(details.dueDate).toLocaleDateString("fr-FR", DATE_OPTIONS)}
                            </p>
                        )}
                        {docType === "devis" && details.devisValidity && (
                            <p>
                                <span className="opacity-70">Validité : </span>
                                {details.devisValidity}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Sender custom fields (NIF, website, etc.) */}
            {sender.customInputs && sender.customInputs.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4">
                    {sender.customInputs.map((input, i) =>
                        input.key ? (
                            <p key={i} className="text-sm text-gray-600">
                                <span className="font-semibold">{input.key} :</span> {input.value}
                            </p>
                        ) : null
                    )}
                </div>
            )}

            {/* Bill-to */}
            <div
                className="rounded-lg p-4 mb-6"
                style={{ backgroundColor: brand + "0D", borderLeft: `4px solid ${brand}` }}
            >
                <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: brand }}
                >
                    Facturé à
                </p>
                <h3 className="text-lg font-semibold text-gray-800">{receiver.name}</h3>
                <address className="mt-1 not-italic text-gray-500 text-sm">
                    {receiver.address && <span>{receiver.address}</span>}
                    {receiver.zipCode && <span>, {receiver.zipCode}</span>}
                    <br />
                    {receiver.city && <span>{receiver.city}</span>}
                    {receiver.country && <span>, {receiver.country}</span>}
                </address>
                {receiver.customInputs?.map((input, i) =>
                    input.key ? (
                        <p key={i} className="text-sm text-gray-600 mt-0.5">
                            <span className="font-medium">{input.key} :</span> {input.value}
                        </p>
                    ) : null
                )}
                {/* Receiver Algerian tax IDs — show only if present */}
                {(receiver.nif || receiver.nis || receiver.rc || receiver.ai) && (
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                        {receiver.nif && <span><b>NIF:</b> {receiver.nif}&nbsp;&nbsp;</span>}
                        {receiver.nis && <span><b>NIS:</b> {receiver.nis}&nbsp;&nbsp;</span>}
                        {receiver.rc  && <span><b>RC:</b>  {receiver.rc}&nbsp;&nbsp;</span>}
                        {receiver.ai  && <span><b>AI:</b>  {receiver.ai}</span>}
                    </div>
                )}
            </div>

            {/* Items table */}
            <div className="mb-6">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ backgroundColor: brand }}>
                            <th className="text-left text-white font-semibold uppercase text-xs px-3 py-2 rounded-tl-lg">
                                Désignation
                            </th>
                            <th className="text-center text-white font-semibold uppercase text-xs px-3 py-2">
                                Qté
                            </th>
                            {docConfig.showPrices && (
                                <>
                                    <th className="text-right text-white font-semibold uppercase text-xs px-3 py-2">
                                        Prix Unit.
                                    </th>
                                    <th className="text-right text-white font-semibold uppercase text-xs px-3 py-2 rounded-tr-lg">
                                        Montant
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {details.items.map((item, index) => (
                            <tr
                                key={index}
                                style={{
                                    backgroundColor: index % 2 === 0 ? "#fff" : brand + "08",
                                }}
                            >
                                <td className="px-3 py-2 border-b border-gray-100">
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    {item.description && (
                                        <p className="text-xs text-gray-400 whitespace-pre-line">
                                            {item.description}
                                        </p>
                                    )}
                                </td>
                                <td className="px-3 py-2 border-b border-gray-100 text-center text-gray-700">
                                    {item.quantity}
                                </td>
                                {docConfig.showPrices && (
                                    <>
                                        <td className="px-3 py-2 border-b border-gray-100 text-right text-gray-700">
                                            {formatNumberWithCommas(Number(item.unitPrice), details.currency)} {details.currency}
                                        </td>
                                        <td className="px-3 py-2 border-b border-gray-100 text-right font-medium text-gray-800">
                                            {formatNumberWithCommas(Number(item.total), details.currency)} {details.currency}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            {docConfig.showPrices && (
            <div className="flex justify-end mb-6">
                <div className="w-full max-w-xs space-y-1.5">
                    {Number(details.subTotal) !== Number(details.totalAmount) && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Sous-total :</span>
                            <span>{formatNumberWithCommas(Number(details.subTotal), details.currency)} {details.currency}</span>
                        </div>
                    )}
                    {details.discountDetails?.amount != undefined &&
                        details.discountDetails?.amount > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Remise :</span>
                                <span>
                                    {details.discountDetails.amountType === "amount"
                                        ? `- ${details.discountDetails.amount} ${details.currency}`
                                        : `- ${details.discountDetails.amount}%`}
                                </span>
                            </div>
                        )}
                    {details.taxRegime !== "DISPENSE_IFU" && details.taxRegime !== "EXONERE" &&
                        details.taxDetails?.amount != undefined && details.taxDetails?.amount > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>TVA :</span>
                            <span>
                                {details.taxDetails.amountType === "amount"
                                    ? `+ ${details.taxDetails.amount} ${details.currency}`
                                    : `+ ${details.taxDetails.amount}%`}
                            </span>
                        </div>
                    )}
                    {details.shippingDetails?.cost != undefined && details.shippingDetails?.cost > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Livraison :</span>
                            <span>
                                {details.shippingDetails.costType === "amount"
                                    ? `+ ${details.shippingDetails.cost} ${details.currency}`
                                    : `+ ${details.shippingDetails.cost}%`}
                            </span>
                        </div>
                    )}
                    {/* Total TTC */}
                    <div
                        className="flex justify-between items-center rounded-lg px-3 py-2 mt-2"
                        style={{ backgroundColor: brand }}
                    >
                        <span className="font-bold text-white text-sm">Total TTC :</span>
                        <span className="font-extrabold text-white">
                            {formatNumberWithCommas(Number(details.totalAmount), details.currency)} {details.currency}
                        </span>
                    </div>
                    {details.totalAmountInWords && (
                        <p className="text-xs text-gray-400 text-right italic">
                            Arrêté à : {details.totalAmountInWords}
                        </p>
                    )}
                    {details.taxRegime === "DISPENSE_IFU" && (
                        <p style={{ fontSize: "9px", color: "#aaa", textAlign: "right", fontStyle: "italic", marginTop: "4px" }}>
                            TVA non applicable — Article 282 ter du CID, régime IFU
                        </p>
                    )}
                    {details.taxRegime === "EXONERE" && (
                        <p style={{ fontSize: "9px", color: "#aaa", textAlign: "right", fontStyle: "italic", marginTop: "4px" }}>
                            Exonéré de TVA
                        </p>
                    )}
                </div>
            </div>
            )}

            {/* Footer — notes, payment, contact */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
                {details.additionalNotes && (
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: brand }}>
                            Notes
                        </p>
                        <p className="text-sm text-gray-600">{details.additionalNotes}</p>
                    </div>
                )}
                {details.paymentTerms && (
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: brand }}>
                            Conditions de paiement
                        </p>
                        <p className="text-sm text-gray-600">{details.paymentTerms}</p>
                    </div>
                )}
                {docConfig.showPaymentInfo && (details.paymentInformation?.bankName ||
                    details.paymentInformation?.accountName ||
                    details.paymentInformation?.accountNumber) && (
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: brand }}>
                            Informations de paiement
                        </p>
                        {details.paymentInformation?.bankName && (
                            <p className="text-sm text-gray-600">Banque : {details.paymentInformation.bankName}</p>
                        )}
                        {details.paymentInformation?.accountName && (
                            <p className="text-sm text-gray-600">Titulaire : {details.paymentInformation.accountName}</p>
                        )}
                        {details.paymentInformation?.accountNumber && (
                            <p className="text-sm text-gray-600">N° de compte : {details.paymentInformation.accountNumber}</p>
                        )}
                    </div>
                )}
                <div>
                    <p className="text-xs text-gray-400">Contact :</p>
                    {sender.email && <p className="text-sm font-medium text-gray-700">{sender.email}</p>}
                    {sender.phone && <p className="text-sm font-medium text-gray-700">{sender.phone}</p>}
                </div>
            </div>

            {/* Signature */}
            {docConfig.showSignature && details?.signature?.data && isDataUrl(details?.signature?.data) ? (
                <div className="mt-6">
                    <p className="font-semibold text-gray-700 text-sm">Signature :</p>
                    <img
                        src={details.signature.data}
                        width={120}
                        height={60}
                        alt={`Signature de ${sender.name}`}
                    />
                </div>
            ) : docConfig.showSignature && details.signature?.data ? (
                <div className="mt-6">
                    <p className="text-gray-700 text-sm">Signature :</p>
                    <p
                        style={{
                            fontSize: 30,
                            fontWeight: 400,
                            fontFamily: `${details.signature.fontFamily}, cursive`,
                            color: brand,
                        }}
                    >
                        {details.signature.data}
                    </p>
                </div>
            ) : null}
        </InvoiceLayout>
    );
};

export default InvoiceTemplate2;
