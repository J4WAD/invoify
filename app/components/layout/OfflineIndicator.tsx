"use client";

import { useEffect, useState } from "react";

const OfflineIndicator = () => {
    const [online, setOnline] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        setOnline(navigator.onLine);
        const on = () => {
            setOnline(true);
            setDismissed(false);
        };
        const off = () => setOnline(false);
        window.addEventListener("online", on);
        window.addEventListener("offline", off);
        return () => {
            window.removeEventListener("online", on);
            window.removeEventListener("offline", off);
        };
    }, []);

    if (online || dismissed) return null;

    return (
        <div
            role="status"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full shadow-lg text-white text-sm"
            style={{ backgroundColor: "#ef4444" }}
        >
            <span>Hors ligne — certaines fonctions peuvent être indisponibles</span>
            <button
                onClick={() => setDismissed(true)}
                className="text-white/80 hover:text-white font-semibold"
                aria-label="Fermer"
            >
                ✕
            </button>
        </div>
    );
};

export default OfflineIndicator;
