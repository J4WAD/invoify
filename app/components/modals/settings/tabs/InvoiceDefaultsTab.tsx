"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useProfileContext } from "@/contexts/ProfileContext";
import { useTranslationContext } from "@/contexts/TranslationContext";
import SaveStatePill from "../SaveStatePill";

import useCurrencies from "@/hooks/useCurrencies";

import { toast } from "@/components/ui/use-toast";

import type { InvoiceDefaultsType } from "@/types";

const InvoiceDefaultsTab = () => {
    const { profile, updateInvoiceDefaults, saveState } = useProfileContext();
    const { _t } = useTranslationContext();
    const { currencies } = useCurrencies();

    const [form, setForm] = useState<InvoiceDefaultsType>(profile.invoiceDefaults);

    const update = <K extends keyof InvoiceDefaultsType>(
        field: K,
        value: InvoiceDefaultsType[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        try {
            updateInvoiceDefaults(form);
            toast({
                title: _t("settings.invoiceDefaults.saved"),
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Invalid data",
            });
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                {_t("settings.invoiceDefaults.description")}
            </p>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label>{_t("settings.invoiceDefaults.currency")}</Label>
                    <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {currencies.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                    {c.code} - {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>{_t("settings.invoiceDefaults.language")}</Label>
                    <Select value={form.language} onValueChange={(v) => update("language", v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="French">Fran&ccedil;ais</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Arabic">العربية</SelectItem>
                            <SelectItem value="German">Deutsch</SelectItem>
                            <SelectItem value="Spanish">Espa&ntilde;ol</SelectItem>
                            <SelectItem value="Italian">Italiano</SelectItem>
                            <SelectItem value="Portuguese">Portugu&ecirc;s</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">
                    {_t("settings.invoiceDefaults.numbering")}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>{_t("settings.invoiceDefaults.invoicePrefix")}</Label>
                        <Input
                            value={form.invoiceNumberPrefix}
                            onChange={(e) => update("invoiceNumberPrefix", e.target.value)}
                            maxLength={10}
                        />
                    </div>
                    <div>
                        <Label>{_t("settings.invoiceDefaults.nextNumber")}</Label>
                        <Input
                            type="number"
                            min={1}
                            value={form.nextInvoiceNumber}
                            onChange={(e) =>
                                update("nextInvoiceNumber", Math.max(1, parseInt(e.target.value) || 1))
                            }
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {_t("settings.invoiceDefaults.preview")}:{" "}
                    <span className="font-mono">
                        {form.invoiceNumberPrefix}
                        {form.nextInvoiceNumber.toString().padStart(4, "0")}
                    </span>
                </p>
            </div>

            <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">
                    {_t("settings.invoiceDefaults.defaultCharges")}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>{_t("settings.invoiceDefaults.taxRate")}</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min={0}
                                value={form.defaultTaxRate}
                                onChange={(e) =>
                                    update("defaultTaxRate", parseFloat(e.target.value) || 0)
                                }
                                className="flex-1"
                            />
                            <Select
                                value={form.defaultTaxType}
                                onValueChange={(v: "amount" | "percentage") =>
                                    update("defaultTaxType", v)
                                }
                            >
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">%</SelectItem>
                                    <SelectItem value="amount">{form.currency}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>{_t("settings.invoiceDefaults.taxID")}</Label>
                        <Input
                            value={form.defaultTaxID}
                            onChange={(e) => update("defaultTaxID", e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>{_t("form.steps.summary.discount")}</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min={0}
                                value={form.defaultDiscountRate}
                                onChange={(e) =>
                                    update("defaultDiscountRate", parseFloat(e.target.value) || 0)
                                }
                                className="flex-1"
                            />
                            <Select
                                value={form.defaultDiscountType}
                                onValueChange={(v: "amount" | "percentage") =>
                                    update("defaultDiscountType", v)
                                }
                            >
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">%</SelectItem>
                                    <SelectItem value="amount">{form.currency}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>{_t("form.steps.summary.shipping")}</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min={0}
                                value={form.defaultShippingCost}
                                onChange={(e) =>
                                    update("defaultShippingCost", parseFloat(e.target.value) || 0)
                                }
                                className="flex-1"
                            />
                            <Select
                                value={form.defaultShippingType}
                                onValueChange={(v: "amount" | "percentage") =>
                                    update("defaultShippingType", v)
                                }
                            >
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">%</SelectItem>
                                    <SelectItem value="amount">{form.currency}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t pt-3 space-y-3">
                <div>
                    <Label>{_t("settings.invoiceDefaults.paymentTerms")}</Label>
                    <Textarea
                        value={form.defaultPaymentTerms}
                        onChange={(e) => update("defaultPaymentTerms", e.target.value)}
                        rows={2}
                    />
                </div>
                <div>
                    <Label>{_t("settings.invoiceDefaults.additionalNotes")}</Label>
                    <Textarea
                        value={form.defaultAdditionalNotes}
                        onChange={(e) => update("defaultAdditionalNotes", e.target.value)}
                        rows={2}
                    />
                </div>
            </div>

            <div className="flex flex-col items-center gap-1">
                <Button onClick={handleSave} className="w-full">
                    {_t("settings.save")}
                </Button>
                <SaveStatePill state={saveState.invoiceDefaults} />
            </div>
        </div>
    );
};

export default InvoiceDefaultsTab;
