"use client";

import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { NameType } from "@/types";

type ColorInputProps = {
    name: NameType;
    label?: string;
};

const PRESET_COLORS = [
    { hex: "#2563eb", label: "Blue" },
    { hex: "#16a34a", label: "Green" },
    { hex: "#dc2626", label: "Red" },
    { hex: "#9333ea", label: "Purple" },
    { hex: "#ea580c", label: "Orange" },
    { hex: "#0d1b2a", label: "Navy" },
    { hex: "#0f172a", label: "Slate" },
    { hex: "#111827", label: "Black" },
];

const ColorInput = ({ name, label }: ColorInputProps) => {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <div className="flex justify-between gap-5 items-center text-sm">
                        <FormLabel>{label}:</FormLabel>
                        <div className="flex flex-col gap-2 items-end">
                            {/* Preset swatches */}
                            <div className="flex flex-wrap gap-1.5 justify-end">
                                {PRESET_COLORS.map((preset) => (
                                    <button
                                        key={preset.hex}
                                        type="button"
                                        title={preset.label}
                                        onClick={() => field.onChange(preset.hex)}
                                        className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: preset.hex,
                                            borderColor:
                                                field.value === preset.hex
                                                    ? "#fff"
                                                    : "transparent",
                                            boxShadow:
                                                field.value === preset.hex
                                                    ? `0 0 0 2px ${preset.hex}`
                                                    : "none",
                                        }}
                                        aria-label={`Select ${preset.label}`}
                                    />
                                ))}
                            </div>

                            {/* Custom color picker */}
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">
                                        Custom:
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={field.value || "#2563eb"}
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                            className="w-8 h-8 rounded cursor-pointer border border-gray-300 p-0.5 bg-transparent"
                                            title="Pick a custom brand color"
                                        />
                                    </div>
                                    <span
                                        className="text-xs font-mono text-muted-foreground"
                                        style={{ minWidth: "4.5rem" }}
                                    >
                                        {field.value || "#2563eb"}
                                    </span>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </div>
                    </div>
                </FormItem>
            )}
        />
    );
};

export default ColorInput;
