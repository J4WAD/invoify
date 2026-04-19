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

const InvoiceTemplate3 = (data: InvoiceType) => {
	const { sender, receiver, details } = data;

	const brand = details.brandColor || "#2563eb";
	const docType = (details.documentType || "facture") as DocumentType;
	const docConfig = DOCUMENT_TYPE_CONFIG[docType];

	return (
		<InvoiceLayout data={data}>
			{/* Compact header: logo + sender | invoice meta */}
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
				<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
					{details.invoiceLogo && (
						<img
							src={details.invoiceLogo}
							width={60}
							height={60}
							alt={`Logo de ${sender.name}`}
							style={{ objectFit: "contain" }}
						/>
					)}
					<div>
						<p style={{ fontSize: "14px", fontWeight: 700, color: brand, margin: 0 }}>
							{sender.name}
						</p>
						<p style={{ fontSize: "10px", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>
							{sender.address && <>{sender.address}<br /></>}
							{sender.zipCode && <>{sender.zipCode}, </>}{sender.city}
							{sender.country && <>, {sender.country}</>}
						</p>
						{sender.email && (
							<p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>{sender.email}</p>
						)}
						{sender.phone && (
							<p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>{sender.phone}</p>
						)}
					</div>
				</div>
				<div style={{ textAlign: "right" }}>
					<p style={{ fontSize: "18px", fontWeight: 800, color: brand, margin: 0, letterSpacing: "0.5px" }}>
						{docConfig.pdfTitle}
					</p>
					<p style={{ fontSize: "11px", color: "#374151", margin: "2px 0 0 0" }}>
						N° {details.invoiceNumber}
					</p>
					<p style={{ fontSize: "10px", color: "#6b7280", margin: "4px 0 0 0" }}>
						Émission : {new Date(details.invoiceDate).toLocaleDateString("fr-FR", DATE_OPTIONS)}
					</p>
					{(docConfig.showDueDate || docConfig.showDeliveryDate) && (
						<p style={{ fontSize: "10px", color: "#6b7280", margin: "1px 0 0 0" }}>
							{docConfig.showDeliveryDate ? "Livraison : " : "Échéance : "}
							{new Date(details.dueDate).toLocaleDateString("fr-FR", DATE_OPTIONS)}
						</p>
					)}
				</div>
			</div>

			{/* Algerian tax IDs */}
			{(sender.nif || sender.rc || sender.ai || sender.nis) && (
				<div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginTop: "3px", fontSize: "9px", color: "#6b7280" }}>
					{sender.nif && <span><b>NIF:</b> {sender.nif}</span>}
					{sender.rc && <span><b>RC:</b> {sender.rc}</span>}
					{sender.ai && <span><b>AI:</b> {sender.ai}</span>}
					{sender.nis && <span><b>NIS:</b> {sender.nis}</span>}
				</div>
			)}

			{/* Sender custom fields */}
			{sender.customInputs && sender.customInputs.length > 0 && (
				<div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: "4px" }}>
					{sender.customInputs.map((input, i) =>
						input.key ? (
							<p key={i} style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>
								<span style={{ fontWeight: 600 }}>{input.key} :</span> {input.value}
							</p>
						) : null
					)}
				</div>
			)}

			{/* Thin divider */}
			<div style={{ height: "1px", backgroundColor: brand, opacity: 0.2, margin: "8px 0" }} />

			{/* Bill-to — compact */}
			<div style={{ marginBottom: "8px" }}>
				<p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: brand, margin: "0 0 2px 0" }}>
					Facturé à
				</p>
				<p style={{ fontSize: "12px", fontWeight: 600, color: "#1f2937", margin: 0 }}>{receiver.name}</p>
				<p style={{ fontSize: "10px", color: "#6b7280", margin: "1px 0 0 0", lineHeight: 1.4 }}>
					{receiver.address && <>{receiver.address}</>}
					{receiver.zipCode && <>, {receiver.zipCode}</>}
					{receiver.city && <> {receiver.city}</>}
					{receiver.country && <>, {receiver.country}</>}
				</p>
				{receiver.customInputs?.map((input, i) =>
					input.key ? (
						<p key={i} style={{ fontSize: "10px", color: "#6b7280", margin: "1px 0 0 0" }}>
							<span style={{ fontWeight: 600 }}>{input.key} :</span> {input.value}
						</p>
					) : null
				)}
			</div>

			{/* Items table — compact */}
			<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "8px" }}>
				<thead>
					<tr>
						<th style={{
							textAlign: "left", backgroundColor: brand, color: "#fff",
							fontWeight: 600, textTransform: "uppercase", fontSize: "9px",
							padding: "4px 6px", letterSpacing: "0.3px",
						}}>
							Désignation
						</th>
						<th style={{
							textAlign: "center", backgroundColor: brand, color: "#fff",
							fontWeight: 600, textTransform: "uppercase", fontSize: "9px",
							padding: "4px 6px", width: "50px",
						}}>
							Qté
						</th>
						{docConfig.showPrices && (
							<>
								<th style={{
									textAlign: "right", backgroundColor: brand, color: "#fff",
									fontWeight: 600, textTransform: "uppercase", fontSize: "9px",
									padding: "4px 6px", width: "100px",
								}}>
									P.U.
								</th>
								<th style={{
									textAlign: "right", backgroundColor: brand, color: "#fff",
									fontWeight: 600, textTransform: "uppercase", fontSize: "9px",
									padding: "4px 6px", width: "100px",
								}}>
									Montant
								</th>
							</>
						)}
					</tr>
				</thead>
				<tbody>
					{details.items.map((item, index) => (
						<tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb" }}>
							<td style={{ padding: "3px 6px", borderBottom: "1px solid #f3f4f6" }}>
								<span style={{ fontWeight: 500, color: "#1f2937" }}>{item.name}</span>
								{item.description && (
									<span style={{ display: "block", fontSize: "9px", color: "#9ca3af", whiteSpace: "pre-line" }}>
										{item.description}
									</span>
								)}
							</td>
							<td style={{ padding: "3px 6px", borderBottom: "1px solid #f3f4f6", textAlign: "center", color: "#374151" }}>
								{item.quantity}
							</td>
							{docConfig.showPrices && (
								<>
									<td style={{ padding: "3px 6px", borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#374151" }}>
										{formatNumberWithCommas(Number(item.unitPrice), details.currency)}
									</td>
									<td style={{ padding: "3px 6px", borderBottom: "1px solid #f3f4f6", textAlign: "right", fontWeight: 500, color: "#1f2937" }}>
										{formatNumberWithCommas(Number(item.total), details.currency)} {details.currency}
									</td>
								</>
							)}
						</tr>
					))}
				</tbody>
			</table>

			{/* Totals — right-aligned compact block */}
			{docConfig.showPrices && (
			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
				<div style={{ width: "220px" }}>
					<div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280", padding: "2px 0" }}>
						<span>Sous-total :</span>
						<span>{formatNumberWithCommas(Number(details.subTotal), details.currency)} {details.currency}</span>
					</div>
					{details.discountDetails?.amount != undefined && details.discountDetails?.amount > 0 && (
						<div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280", padding: "2px 0" }}>
							<span>Remise :</span>
							<span>
								{details.discountDetails.amountType === "amount"
									? `- ${details.discountDetails.amount} ${details.currency}`
									: `- ${details.discountDetails.amount}%`}
							</span>
						</div>
					)}
					{details.taxDetails?.amount != undefined && details.taxDetails?.amount > 0 && (
						<div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280", padding: "2px 0" }}>
							<span>TVA :</span>
							<span>
								{details.taxDetails.amountType === "amount"
									? `+ ${details.taxDetails.amount} ${details.currency}`
									: `+ ${details.taxDetails.amount}%`}
							</span>
						</div>
					)}
					{details.shippingDetails?.cost != undefined && details.shippingDetails?.cost > 0 && (
						<div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280", padding: "2px 0" }}>
							<span>Livraison :</span>
							<span>
								{details.shippingDetails.costType === "amount"
									? `+ ${details.shippingDetails.cost} ${details.currency}`
									: `+ ${details.shippingDetails.cost}%`}
							</span>
						</div>
					)}
					{/* Total TTC */}
					<div style={{
						display: "flex", justifyContent: "space-between", alignItems: "center",
						backgroundColor: brand, borderRadius: "4px", padding: "4px 8px", marginTop: "4px",
					}}>
						<span style={{ fontWeight: 700, color: "#fff", fontSize: "11px" }}>Total TTC :</span>
						<span style={{ fontWeight: 800, color: "#fff", fontSize: "12px" }}>
							{formatNumberWithCommas(Number(details.totalAmount), details.currency)} {details.currency}
						</span>
					</div>
					{details.totalAmountInWords && (
						<p style={{ fontSize: "9px", color: "#9ca3af", textAlign: "right", fontStyle: "italic", margin: "2px 0 0 0" }}>
							Arrêté à : {details.totalAmountInWords}
						</p>
					)}
				</div>
			</div>
			)}

			{/* Footer: notes + payment — 2 columns to save space */}
			<div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "6px", display: "flex", gap: "16px", pageBreakInside: "avoid" }}>
				<div style={{ flex: 1 }}>
					{details.additionalNotes && (
						<div style={{ marginBottom: "4px" }}>
							<p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color: brand, margin: "0 0 1px 0" }}>Notes</p>
							<p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>{details.additionalNotes}</p>
						</div>
					)}
					{details.paymentTerms && (
						<div style={{ marginBottom: "4px" }}>
							<p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color: brand, margin: "0 0 1px 0" }}>Conditions de paiement</p>
							<p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>{details.paymentTerms}</p>
						</div>
					)}
				</div>
				<div style={{ flex: 1 }}>
					{docConfig.showPaymentInfo && (details.paymentInformation?.bankName ||
						details.paymentInformation?.accountName ||
						details.paymentInformation?.accountNumber) && (
						<div style={{ marginBottom: "4px" }}>
							<p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color: brand, margin: "0 0 1px 0" }}>Paiement</p>
							{details.paymentInformation?.bankName && (
								<p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>Banque : {details.paymentInformation.bankName}</p>
							)}
							{details.paymentInformation?.accountName && (
								<p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>Titulaire : {details.paymentInformation.accountName}</p>
							)}
							{details.paymentInformation?.accountNumber && (
								<p style={{ fontSize: "10px", color: "#6b7280", margin: 0 }}>N° compte : {details.paymentInformation.accountNumber}</p>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Signature */}
			{docConfig.showSignature && details?.signature?.data && isDataUrl(details?.signature?.data) ? (
				<div style={{ marginTop: "8px", pageBreakInside: "avoid" }}>
					<p style={{ fontSize: "10px", fontWeight: 600, color: "#374151", margin: "0 0 2px 0" }}>Signature :</p>
					<img
						src={details.signature.data}
						width={100}
						height={50}
						alt={`Signature de ${sender.name}`}
					/>
				</div>
			) : docConfig.showSignature && details.signature?.data ? (
				<div style={{ marginTop: "8px", pageBreakInside: "avoid" }}>
					<p style={{ fontSize: "10px", color: "#374151", margin: "0 0 2px 0" }}>Signature :</p>
					<p
						style={{
							fontSize: 24,
							fontWeight: 400,
							fontFamily: `${details.signature.fontFamily}, cursive`,
							color: brand,
							margin: 0,
						}}
					>
						{details.signature.data}
					</p>
				</div>
			) : null}
		</InvoiceLayout>
	);
};

export default InvoiceTemplate3;
