"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useProfileContext } from "@/contexts/ProfileContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

import { toast } from "@/components/ui/use-toast";

import type { PaymentInfoType } from "@/types";

const PaymentInfoTab = () => {
    const { profile, updatePaymentInfo } = useProfileContext();
    const { _t } = useTranslationContext();

    const [form, setForm] = useState<PaymentInfoType>(profile.paymentInfo);

    const updateField = (field: keyof PaymentInfoType, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        try {
            updatePaymentInfo(form);
            toast({
                title: _t("settings.paymentInfo.saved"),
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
                {_t("settings.paymentInfo.description")}
            </p>

            <div className="space-y-3">
                <div>
                    <Label>{_t("form.steps.paymentInfo.bankName")}</Label>
                    <Input
                        value={form.bankName}
                        onChange={(e) => updateField("bankName", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.paymentInfo.accountName")}</Label>
                    <Input
                        value={form.accountName}
                        onChange={(e) => updateField("accountName", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.paymentInfo.accountNumber")}</Label>
                    <Input
                        value={form.accountNumber}
                        onChange={(e) => updateField("accountNumber", e.target.value)}
                    />
                </div>
            </div>

            <Button onClick={handleSave} className="w-full">
                {_t("settings.save")}
            </Button>
        </div>
    );
};

export default PaymentInfoTab;
