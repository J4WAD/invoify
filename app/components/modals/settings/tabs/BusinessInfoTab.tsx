"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useProfileContext } from "@/contexts/ProfileContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

import type { BusinessInfoType } from "@/types";

const BusinessInfoTab = () => {
    const { profile, updateBusinessInfo } = useProfileContext();
    const { _t } = useTranslationContext();

    const [form, setForm] = useState<BusinessInfoType>(profile.businessInfo);

    const updateField = (field: keyof BusinessInfoType, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const addCustomInput = () => {
        setForm((prev) => ({
            ...prev,
            customInputs: [...prev.customInputs, { key: "", value: "" }],
        }));
    };

    const removeCustomInput = (index: number) => {
        setForm((prev) => ({
            ...prev,
            customInputs: prev.customInputs.filter((_, i) => i !== index),
        }));
    };

    const updateCustomInput = (index: number, field: "key" | "value", value: string) => {
        setForm((prev) => ({
            ...prev,
            customInputs: prev.customInputs.map((input, i) =>
                i === index ? { ...input, [field]: value } : input
            ),
        }));
    };

    const handleSave = () => {
        try {
            updateBusinessInfo(form);
            toast({
                title: _t("settings.businessInfo.saved"),
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
                {_t("settings.businessInfo.description")}
            </p>

            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <Label>{_t("form.steps.fromAndTo.name")}</Label>
                    <Input
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder={_t("form.steps.fromAndTo.name")}
                    />
                </div>
                <div className="col-span-2">
                    <Label>{_t("form.steps.fromAndTo.address")}</Label>
                    <Input
                        value={form.address}
                        onChange={(e) => updateField("address", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.fromAndTo.zipCode")}</Label>
                    <Input
                        value={form.zipCode}
                        onChange={(e) => updateField("zipCode", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.fromAndTo.city")}</Label>
                    <Input
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.fromAndTo.country")}</Label>
                    <Input
                        value={form.country}
                        onChange={(e) => updateField("country", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.fromAndTo.email")}</Label>
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                    />
                </div>
                <div className="col-span-2">
                    <Label>{_t("form.steps.fromAndTo.phone")}</Label>
                    <Input
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.fromAndTo.nif")}</Label>
                    <Input
                        value={form.nif || ""}
                        onChange={(e) => updateField("nif", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.fromAndTo.rc")}</Label>
                    <Input
                        value={form.rc || ""}
                        onChange={(e) => updateField("rc", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.fromAndTo.ai")}</Label>
                    <Input
                        value={form.ai || ""}
                        onChange={(e) => updateField("ai", e.target.value)}
                    />
                </div>
                <div>
                    <Label>{_t("form.steps.fromAndTo.nis")}</Label>
                    <Input
                        value={form.nis || ""}
                        onChange={(e) => updateField("nis", e.target.value)}
                    />
                </div>
            </div>

            {form.customInputs.length > 0 && (
                <div className="space-y-2">
                    {form.customInputs.map((input, index) => (
                        <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Label>Key</Label>
                                <Input
                                    value={input.key}
                                    onChange={(e) => updateCustomInput(index, "key", e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <Label>Value</Label>
                                <Input
                                    value={input.value}
                                    onChange={(e) =>
                                        updateCustomInput(index, "value", e.target.value)
                                    }
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomInput(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <Button variant="outline" size="sm" onClick={addCustomInput} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {_t("form.steps.fromAndTo.addCustomInput")}
            </Button>

            <Button onClick={handleSave} className="w-full">
                {_t("settings.save")}
            </Button>
        </div>
    );
};

export default BusinessInfoTab;
