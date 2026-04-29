"use client";

import { Loader2, Check, AlertCircle } from "lucide-react";

import type { SaveState } from "@/contexts/ProfileContext";

type Props = {
    state: SaveState;
};

const SaveStatePill = ({ state }: Props) => {
    if (state === "idle") return null;

    if (state === "saving") {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Enregistrement…
            </span>
        );
    }

    if (state === "saved") {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-green-700">
                <Check className="h-3 w-3" />
                Enregistré
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs text-red-700">
            <AlertCircle className="h-3 w-3" />
            Échec — réessayer
        </span>
    );
};

export default SaveStatePill;
