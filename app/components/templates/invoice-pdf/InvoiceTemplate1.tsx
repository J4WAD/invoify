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

const InvoiceTemplate = (data: InvoiceType) => {
	const { sender, receiver, details } = data;

	// Brand color with safe fallback
	const brand = details.brandColor || "#1e3a8a";
	const docType = (details.documentType || "facture") as DocumentType;
	const docConfig = DOCUMENT_TYPE_CONFIG[docType];

	return (
		<InvoiceLayout data={data}>
			{/* Header — logo + company name / invoice number */}
			<div className='flex justify-between'>
				<div>
					{details.invoiceLogo && (
						<img
							src={details.invoiceLogo}
							width={140}
							height={100}
							alt={`Logo de ${sender.name}`}
						/>
					)}
					<h1
						className='mt-2 text-lg md:text-xl font-semibold'
						style={{ color: brand }}
					>
						{sender.name}
					</h1>
				</div>
				<div className='text-right'>
					<h2
						className='text-2xl md:text-3xl font-semibold'
						style={{ color: brand }}
					>
						{docConfig.pdfTitle} N°
					</h2>
					<span className='mt-1 block text-gray-500'>{details.invoiceNumber}</span>
					<address className='mt-4 not-italic text-gray-800'>
						{sender.address}
						<br />
						{sender.zipCode}, {sender.city}
						<br />
						{sender.country}
						<br />
					</address>
					{/* Sender legal identifiers in header */}
					{(sender.nif || sender.nis || sender.rc || sender.ai) && (
						<div style={{ fontSize: "10px", color: "#888", marginTop: "4px", lineHeight: "1.6", textAlign: "right" }}>
							{sender.nif && <span><b>NIF:</b> {sender.nif}&nbsp; </span>}
							{sender.nis && <span><b>NIS:</b> {sender.nis}&nbsp; </span>}
							{sender.rc  && <span><b>RC:</b>  {sender.rc}&nbsp; </span>}
							{sender.ai  && <span><b>AI:</b>  {sender.ai}</span>}
						</div>
					)}
				</div>
			</div>

			{/* Divider */}
			<div
				className='my-4 h-0.5 rounded'
				style={{ backgroundColor: brand, opacity: 0.15 }}
			/>

			{/* Bill-to + dates */}
			<div className='mt-2 grid sm:grid-cols-2 gap-3'>
				<div>
					<h3
						className='text-sm font-semibold uppercase tracking-wide mb-1'
						style={{ color: brand }}
					>
						Facturé à :
					</h3>
					<h3 className='text-lg font-semibold text-gray-800'>{receiver.name}</h3>
					<address className='mt-2 not-italic text-gray-500'>
						{receiver.address && receiver.address.length > 0 ? receiver.address : null}
						{receiver.zipCode && receiver.zipCode.length > 0 ? `, ${receiver.zipCode}` : null}
						<br />
						{receiver.city}, {receiver.country}
						<br />
					</address>
					{/* Custom receiver inputs */}
					{receiver.customInputs?.map((input, i) =>
						input.key ? (
							<p key={i} className='text-sm text-gray-600'>
								<span className='font-medium'>{input.key} :</span> {input.value}
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
				<div className='sm:text-right space-y-2'>
					<div className='grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-2'>
						<dl className='grid sm:grid-cols-6 gap-x-3'>
							<dt className='col-span-3 font-semibold text-gray-800'>Date d'émission :</dt>
							<dd className='col-span-3 text-gray-500'>
								{new Date(details.invoiceDate).toLocaleDateString("fr-FR", DATE_OPTIONS)}
							</dd>
						</dl>
						{(docConfig.showDueDate || docConfig.showDeliveryDate) && (
							<dl className='grid sm:grid-cols-6 gap-x-3'>
								<dt className='col-span-3 font-semibold text-gray-800'>
									{docConfig.showDeliveryDate
										? "Date de livraison :"
										: "Date d'échéance :"}
								</dt>
								<dd className='col-span-3 text-gray-500'>
									{new Date(details.dueDate).toLocaleDateString("fr-FR", DATE_OPTIONS)}
								</dd>
							</dl>
						)}
						{docType === "devis" && details.devisValidity && (
							<dl className='grid sm:grid-cols-6 gap-x-3'>
								<dt className='col-span-3 font-semibold text-gray-800'>Validité :</dt>
								<dd className='col-span-3 text-gray-500'>{details.devisValidity}</dd>
							</dl>
						)}
					</div>
				</div>
			</div>

			{/* Sender custom inputs (e.g. NIF, Website) */}
			{sender.customInputs && sender.customInputs.length > 0 && (
				<div className='mt-3 flex flex-wrap gap-x-6 gap-y-1'>
					{sender.customInputs.map((input, i) =>
						input.key ? (
							<p key={i} className='text-sm text-gray-600'>
								<span className='font-medium'>{input.key} :</span> {input.value}
							</p>
						) : null
					)}
				</div>
			)}

			{/* Items table */}
			<div className='mt-4'>
				<div className='border border-gray-200 rounded-lg overflow-hidden'>
					{/* Table header */}
					<div
						className={`hidden sm:grid px-3 py-2 ${docConfig.showPrices ? "sm:grid-cols-5" : "sm:grid-cols-3"}`}
						style={{ backgroundColor: brand }}
					>
						<div className='sm:col-span-2 text-xs font-semibold text-white uppercase'>Désignation</div>
						<div className='text-left text-xs font-semibold text-white uppercase'>Qté</div>
						{docConfig.showPrices && (
							<>
								<div className='text-left text-xs font-semibold text-white uppercase'>Prix Unit.</div>
								<div className='text-right text-xs font-semibold text-white uppercase'>Montant</div>
							</>
						)}
					</div>
					{/* Rows */}
					<div className={`grid grid-cols-3 gap-y-0 ${docConfig.showPrices ? "sm:grid-cols-5" : "sm:grid-cols-3"}`}>
						{details.items.map((item, index) => (
							<React.Fragment key={index}>
								<div
									className='col-span-full sm:col-span-2 border-b border-gray-200 px-3 py-2'
									style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb" }}
								>
									<p className='font-medium text-gray-800'>{item.name}</p>
									<p className='text-xs text-gray-500 whitespace-pre-line'>{item.description}</p>
								</div>
								<div
									className='border-b border-gray-200 px-3 py-2'
									style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb" }}
								>
									<p className='text-gray-700'>{item.quantity}</p>
								</div>
								{docConfig.showPrices && (
									<>
										<div
											className='border-b border-gray-200 px-3 py-2'
											style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb" }}
										>
											<p className='text-gray-700'>
												{formatNumberWithCommas(Number(item.unitPrice), details.currency)} {details.currency}
											</p>
										</div>
										<div
											className='border-b border-gray-200 px-3 py-2'
											style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb" }}
										>
											<p className='sm:text-right text-gray-700'>
												{formatNumberWithCommas(Number(item.total), details.currency)} {details.currency}
											</p>
										</div>
									</>
								)}
							</React.Fragment>
						))}
					</div>
				</div>
			</div>

			{/* Totals */}
			{docConfig.showPrices && (
			<div className='mt-4 flex sm:justify-end'>
				<div className='sm:text-right space-y-2 min-w-[240px]'>
					<div className='grid grid-cols-2 sm:grid-cols-1 gap-2'>
						<dl className='grid sm:grid-cols-5 gap-x-3'>
							<dt className='col-span-3 font-semibold text-gray-700'>Sous-total :</dt>
							<dd className='col-span-2 text-gray-500'>
								{formatNumberWithCommas(Number(details.subTotal), details.currency)} {details.currency}
							</dd>
						</dl>
						{details.discountDetails?.amount != undefined &&
							details.discountDetails?.amount > 0 && (
								<dl className='grid sm:grid-cols-5 gap-x-3'>
									<dt className='col-span-3 font-semibold text-gray-700'>Remise :</dt>
									<dd className='col-span-2 text-gray-500'>
										{details.discountDetails.amountType === "amount"
											? `- ${details.discountDetails.amount} ${details.currency}`
											: `- ${details.discountDetails.amount}%`}
									</dd>
								</dl>
							)}
						{details.taxRegime !== "DISPENSE_IFU" && details.taxRegime !== "EXONERE" &&
							details.taxDetails?.amount != undefined && details.taxDetails?.amount > 0 && (
							<dl className='grid sm:grid-cols-5 gap-x-3'>
								<dt className='col-span-3 font-semibold text-gray-700'>TVA :</dt>
								<dd className='col-span-2 text-gray-500'>
									{details.taxDetails.amountType === "amount"
										? `+ ${details.taxDetails.amount} ${details.currency}`
										: `+ ${details.taxDetails.amount}%`}
								</dd>
							</dl>
						)}
						{details.shippingDetails?.cost != undefined && details.shippingDetails?.cost > 0 && (
							<dl className='grid sm:grid-cols-5 gap-x-3'>
								<dt className='col-span-3 font-semibold text-gray-700'>Livraison :</dt>
								<dd className='col-span-2 text-gray-500'>
									{details.shippingDetails.costType === "amount"
										? `+ ${details.shippingDetails.cost} ${details.currency}`
										: `+ ${details.shippingDetails.cost}%`}
								</dd>
							</dl>
						)}
						{/* Total TTC highlighted */}
						<dl
							className='grid sm:grid-cols-5 gap-x-3 rounded px-2 py-1 mt-1'
							style={{ backgroundColor: brand + "15" }}
						>
							<dt
								className='col-span-3 font-bold'
								style={{ color: brand }}
							>
								Total TTC :
							</dt>
							<dd
								className='col-span-2 font-bold'
								style={{ color: brand }}
							>
								{formatNumberWithCommas(Number(details.totalAmount), details.currency)} {details.currency}
							</dd>
						</dl>
						{details.totalAmountInWords && (
							<dl className='grid sm:grid-cols-5 gap-x-3'>
								<dt className='col-span-3 font-semibold text-gray-700'>Arrêté à :</dt>
								<dd className='col-span-2 text-gray-500'>
									<em>{details.totalAmountInWords}</em>
								</dd>
							</dl>
						)}
						{details.taxRegime === "DISPENSE_IFU" && (
							<p style={{ fontSize: "9px", color: "#888", marginTop: "6px", fontStyle: "italic" }}>
								TVA non applicable — Article 282 ter du CID, régime IFU
							</p>
						)}
						{details.taxRegime === "EXONERE" && (
							<p style={{ fontSize: "9px", color: "#888", marginTop: "6px", fontStyle: "italic" }}>
								Exonéré de TVA
							</p>
						)}
					</div>
				</div>
			</div>
			)}

			{/* Notes + Payment */}
			<div className='mt-6'>
				{details.additionalNotes && (
					<div className='my-2'>
						<p className='font-semibold text-sm' style={{ color: brand }}>
							Notes :
						</p>
						<p className='text-gray-700 text-sm'>{details.additionalNotes}</p>
					</div>
				)}
				{details.paymentTerms && (
					<div className='my-2'>
						<p className='font-semibold text-sm' style={{ color: brand }}>
							Conditions de paiement :
						</p>
						<p className='text-gray-700 text-sm'>{details.paymentTerms}</p>
					</div>
				)}
				{docConfig.showPaymentInfo && (details.paymentInformation?.bankName ||
					details.paymentInformation?.accountName ||
					details.paymentInformation?.accountNumber) && (
					<div className='my-2'>
						<p className='font-semibold text-sm' style={{ color: brand }}>
							Informations de paiement :
						</p>
						{details.paymentInformation?.bankName && (
							<p className='text-sm text-gray-700'>Banque : {details.paymentInformation.bankName}</p>
						)}
						{details.paymentInformation?.accountName && (
							<p className='text-sm text-gray-700'>Titulaire : {details.paymentInformation.accountName}</p>
						)}
						{details.paymentInformation?.accountNumber && (
							<p className='text-sm text-gray-700'>N° de compte : {details.paymentInformation.accountNumber}</p>
						)}
					</div>
				)}
				<p className='text-gray-400 text-xs mt-4'>
					Pour toute question concernant cette facture, contactez-nous :
				</p>
				<div>
					<p className='text-sm font-medium text-gray-700'>{sender.email}</p>
					<p className='text-sm font-medium text-gray-700'>{sender.phone}</p>
				</div>
			</div>

			{/* Signature */}
			{docConfig.showSignature && details?.signature?.data && isDataUrl(details?.signature?.data) ? (
				<div className='mt-6'>
					<p className='font-semibold text-gray-700 text-sm'>Signature :</p>
					<img
						src={details.signature.data}
						width={120}
						height={60}
						alt={`Signature de ${sender.name}`}
					/>
				</div>
			) : docConfig.showSignature && details.signature?.data ? (
				<div className='mt-6'>
					<p className='text-gray-700 text-sm'>Signature :</p>
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

export default InvoiceTemplate;
