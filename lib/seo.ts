import { AUTHOR_WEBSITE, BASE_URL } from "@/lib/variables";

export const ROOTKEYWORDS = [
    "facture",
    "générateur de facture",
    "facture algérie",
    "facture DZD",
    "auto-entrepreneur algérie",
    "invoice generator",
    "facturapp",
    "free invoice generator",
];

export const JSONLD = {
    "@context": "https://schema.org",
    "@type": "Website",
    name: "FacturApp",
    description: "Générateur de factures professionnel — personnalisable, gratuit et rapide",
    keywords: ROOTKEYWORDS,
    url: BASE_URL,
    image: `${BASE_URL}/assets/img/facturapp-logo.svg`,
    mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${BASE_URL}/#website`,
    },
    author: {
        "@type": "Person",
        name: "Djaouad Azzouz",
        url: AUTHOR_WEBSITE,
    },
    "@graph": [
        {
            "@type": "WebSite",
            "@id": `${BASE_URL}/#website`,
            url: `${BASE_URL}`,
        },
    ],
};
