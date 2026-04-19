"use client";

import { useEffect } from "react";

type ShortcutHandler = () => void;

type Shortcuts = {
    onSave?: ShortcutHandler;
    onGenerate?: ShortcutHandler;
    onNewInvoice?: ShortcutHandler;
};

const useKeyboardShortcuts = ({ onSave, onGenerate, onNewInvoice }: Shortcuts) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;

            switch (e.key.toLowerCase()) {
                case "s":
                    if (onSave) {
                        e.preventDefault();
                        onSave();
                    }
                    break;
                case "g":
                    if (onGenerate) {
                        e.preventDefault();
                        onGenerate();
                    }
                    break;
                case "j":
                    if (onNewInvoice) {
                        e.preventDefault();
                        onNewInvoice();
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onSave, onGenerate, onNewInvoice]);
};

export default useKeyboardShortcuts;
