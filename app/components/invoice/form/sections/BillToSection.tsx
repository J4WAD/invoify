"use client";

// RHF
import { useFieldArray, useFormContext } from "react-hook-form";

// Components
import {
    BaseButton,
    FormCustomInput,
    FormInput,
    Subheading,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useProfileContext } from "@/contexts/ProfileContext";

// Icons
import { Plus, User } from "lucide-react";

const BillToSection = () => {
    const { control, setValue } = useFormContext();

    const { _t } = useTranslationContext();
    const { profile } = useProfileContext();
    const clients = profile.clients || [];

    const selectClient = (clientId: string) => {
        const client = clients.find((c) => c.id === clientId);
        if (!client) return;
        setValue("receiver.name", client.name);
        setValue("receiver.address", client.address);
        setValue("receiver.zipCode", client.zipCode);
        setValue("receiver.city", client.city);
        setValue("receiver.country", client.country);
        setValue("receiver.email", client.email);
        setValue("receiver.phone", client.phone);
    };

    const CUSTOM_INPUT_NAME = "receiver.customInputs";

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
            <Subheading>{_t("form.steps.fromAndTo.billTo")}:</Subheading>
            {clients.length > 0 && (
                <div>
                    <select
                        onChange={(e) => {
                            if (e.target.value) selectClient(e.target.value);
                        }}
                        defaultValue=""
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    >
                        <option value="" disabled>
                            Selectionner un client enregistre...
                        </option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}{c.city ? ` — ${c.city}` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <FormInput
                name="receiver.name"
                label={_t("form.steps.fromAndTo.name")}
                placeholder="Receiver name"
            />
            <FormInput
                name="receiver.address"
                label={_t("form.steps.fromAndTo.address")}
                placeholder="Receiver address"
            />
            <FormInput
                name="receiver.zipCode"
                label={_t("form.steps.fromAndTo.zipCode")}
                placeholder="Receiver zip code"
            />
            <FormInput
                name="receiver.city"
                label={_t("form.steps.fromAndTo.city")}
                placeholder="Receiver city"
            />
            <FormInput
                name="receiver.country"
                label={_t("form.steps.fromAndTo.country")}
                placeholder="Receiver country"
            />
            <FormInput
                name="receiver.email"
                label={_t("form.steps.fromAndTo.email")}
                placeholder="Receiver email"
            />
            <FormInput
                name="receiver.phone"
                label={_t("form.steps.fromAndTo.phone")}
                placeholder="Receiver phone number"
                type="text"
                inputMode="tel"
                pattern="[0-9+\-\(\)\s]*"
                aria-describedby="phone-format"
                onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/[^\d\+\-\(\)\s]/g, "");
                }}
            />
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
                tooltipLabel="Add custom input to receiver"
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

export default BillToSection;
