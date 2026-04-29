"use client";

import { ChangeEvent, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useProfileContext } from "@/contexts/ProfileContext";
import { useTranslationContext } from "@/contexts/TranslationContext";
import SaveStatePill from "../SaveStatePill";

import { Image, ImageMinus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

import type { BrandingType } from "@/types";

const PRESET_COLORS = [
    "#1e3a8a",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#4f46e5",
    "#c026d3",
];

type ImageUploadProps = {
    label: string;
    value: string;
    onChange: (base64: string) => void;
    placeholder: string;
};

const ImageUpload = ({ label, value, onChange, placeholder }: ImageUploadProps) => {
    const fileRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            onChange(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const remove = () => {
        onChange("");
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <div>
            <Label>{label}</Label>
            {value ? (
                <div className="flex items-center gap-3 mt-1">
                    <img
                        src={value}
                        alt={label}
                        className="object-contain w-24 h-16 rounded border"
                    />
                    <Button variant="destructive" size="sm" onClick={remove}>
                        <ImageMinus className="h-4 w-4 mr-1" />
                        Remove
                    </Button>
                </div>
            ) : (
                <label className="flex justify-center items-center h-16 w-full cursor-pointer rounded-md bg-gray-100 border border-dashed border-gray-300 hover:border-blue-500 mt-1">
                    <div className="flex flex-col items-center text-sm text-muted-foreground">
                        <Image className="h-5 w-5 mb-1" />
                        <span>{placeholder}</span>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept="image/*"
                    />
                </label>
            )}
        </div>
    );
};

const BrandingTab = () => {
    const { profile, updateBranding, saveState } = useProfileContext();
    const { _t } = useTranslationContext();

    const [form, setForm] = useState<BrandingType>(profile.branding);

    const handleSave = () => {
        try {
            updateBranding(form);
            toast({
                title: _t("settings.branding.saved"),
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
                {_t("settings.branding.description")}
            </p>

            <ImageUpload
                label={_t("settings.branding.logo")}
                value={form.logo}
                onChange={(v) => setForm((p) => ({ ...p, logo: v }))}
                placeholder={_t("form.steps.invoiceDetails.invoiceLogo.placeholder")}
            />

            <ImageUpload
                label={_t("settings.branding.watermark")}
                value={form.watermarkLogo}
                onChange={(v) => setForm((p) => ({ ...p, watermarkLogo: v }))}
                placeholder={_t("form.steps.invoiceDetails.invoiceLogo.placeholder")}
            />

            <div>
                <Label>{_t("settings.branding.brandColor")}</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, brandColor: color }))}
                            className="w-8 h-8 rounded-full border-2 transition-all"
                            style={{
                                backgroundColor: color,
                                borderColor: form.brandColor === color ? "#000" : "transparent",
                                outline:
                                    form.brandColor === color
                                        ? "2px solid white"
                                        : "none",
                            }}
                        />
                    ))}
                    <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 cursor-pointer flex items-center justify-center overflow-hidden">
                        <input
                            type="color"
                            value={form.brandColor}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, brandColor: e.target.value }))
                            }
                            className="w-10 h-10 cursor-pointer border-0"
                            style={{ margin: "-4px" }}
                        />
                    </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{form.brandColor}</p>
            </div>

            <div>
                <Label>{_t("settings.branding.defaultTemplate")}</Label>
                <div className="flex gap-2 mt-1">
                    {[1, 2, 3].map((tpl) => (
                        <Button
                            key={tpl}
                            variant={form.defaultTemplate === tpl ? "default" : "outline"}
                            size="sm"
                            onClick={() => setForm((p) => ({ ...p, defaultTemplate: tpl }))}
                        >
                            Template {tpl}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center gap-1">
                <Button onClick={handleSave} className="w-full">
                    {_t("settings.save")}
                </Button>
                <SaveStatePill state={saveState.branding} />
            </div>
        </div>
    );
};

export default BrandingTab;
