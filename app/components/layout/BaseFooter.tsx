"use client";

import Link from "next/link";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Variables
import { AUTHOR_GITHUB } from "@/lib/variables";

const BaseFooter = () => {
    const { _t } = useTranslationContext();

    return (
        <footer className="container py-10 space-y-2">
            <p>
                {_t("footer.developedBy")}{" "}
                <a
                    href={AUTHOR_GITHUB}
                    target="_blank"
                    style={{ textDecoration: "underline" }}
                >
                    Djaouad Azzouz
                </a>
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <Link href="/cgu" className="hover:underline">CGU</Link>
                <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
                <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
            </div>
        </footer>
    );
};

export default BaseFooter;
