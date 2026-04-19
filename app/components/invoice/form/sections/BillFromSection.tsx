"use client";

// RHF
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

// Components
import {
    BaseButton,
    FormCustomInput,
    FormInput,
    Subheading,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Plus, AlertTriangle } from "lucide-react";

const BillFromSection = () => {
    const { control } = useFormContext();

    const { _t } = useTranslationContext();

    const [nif, nis, rc, ai] = useWatch({
        name: ["sender.nif", "sender.nis", "sender.rc", "sender.ai"],
    }) as [string, string, string, string];
    const missingIds = [!nif && "NIF", !nis && "NIS", !rc && "RC", !ai && "AI"].filter(Boolean) as string[];

    const CUSTOM_INPUT_NAME = "sender.customInputs";
    const { fields, append, remove } = useFieldArray({
        control: control,
        name: CUSTOM_INPUT_NAME,
    });

    const addNewCustomInput = () => {
        append({
            key: "",
            value: "",
        });
    };

    const removeCustomInput = (index: number) => {
        remove(index);
    };

    return (
        <section className="flex flex-col gap-3">
            <Subheading>{_t("form.steps.fromAndTo.billFrom")}:</Subheading>
            <FormInput
                name="sender.name"
                label={_t("form.steps.fromAndTo.name")}
                placeholder="Your name"
            />
            <FormInput
                name="sender.address"
                label={_t("form.steps.fromAndTo.address")}
                placeholder="Your address"
            />
            <FormInput
                name="sender.zipCode"
                label={_t("form.steps.fromAndTo.zipCode")}
                placeholder="Your zip code"
            />
            <FormInput
                name="sender.city"
                label={_t("form.steps.fromAndTo.city")}
                placeholder="Your city"
            />
            <FormInput
                name="sender.country"
                label={_t("form.steps.fromAndTo.country")}
                placeholder="Your country"
            />
            <FormInput
                name="sender.email"
                label={_t("form.steps.fromAndTo.email")}
                placeholder="Your email"
            />
            <FormInput
                name="sender.phone"
                label={_t("form.steps.fromAndTo.phone")}
                placeholder="Your phone number"
                type="text"
                inputMode="tel"
                pattern="[0-9+\-\(\)\s]*"
                aria-describedby="phone-format"
                onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/[^\d\+\-\(\)\s]/g, "");
                }}
            />
            {/* Algerian tax compliance fields (optional) */}
            <div className="grid grid-cols-2 gap-3">
                <FormInput
                    name="sender.nif"
                    label={_t("form.steps.fromAndTo.nif")}
                    placeholder="NIF"
                    vertical
                    className="w-full"
                />
                <FormInput
                    name="sender.nis"
                    label={_t("form.steps.fromAndTo.nis")}
                    placeholder="NIS"
                    vertical
                    className="w-full"
                />
                <FormInput
                    name="sender.rc"
                    label={_t("form.steps.fromAndTo.rc")}
                    placeholder="RC"
                    vertical
                    className="w-full"
                />
                <FormInput
                    name="sender.ai"
                    label={_t("form.steps.fromAndTo.ai")}
                    placeholder="AI"
                    vertical
                    className="w-full"
                />
            </div>
            {/* Compliance warning — editor only, not on PDF */}
            {missingIds.length > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-600" />
                    <span>
                        {_t("form.steps.fromAndTo.complianceWarning")}{" "}
                        <strong>{missingIds.join(", ")}</strong>
                    </span>
                </div>
            )}

            {/* //? key = field.id fixes a bug where wrong field gets deleted  */}
            {fields?.map((field, index) => (
                <FormCustomInput
                    key={field.id}
                    index={index}
                    location={CUSTOM_INPUT_NAME}
                    removeField={removeCustomInput}
                />
            ))}
            <BaseButton
                tooltipLabel="Add custom input to sender"
                size="sm"
                variant="link"
                className="w-fit"
                onClick={addNewCustomInput}
            >
                <Plus />
                {_t("form.steps.fromAndTo.addCustomInput")}
            </BaseButton>
        </section>
    );
};

export default BillFromSection;
