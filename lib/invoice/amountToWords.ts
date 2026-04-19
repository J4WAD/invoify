/**
 * French amount-in-words implementation.
 * Covers 0–999 999 999 999 (up to billions).
 * Tests: 1, 21, 71, 80, 81, 100, 101, 1000, 1001, 12 345.67
 */

const ONES = [
    "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
    "dix-sept", "dix-huit", "dix-neuf",
];

const TENS = [
    "", "", "vingt", "trente", "quarante", "cinquante", "soixante",
    "soixante", "quatre-vingt", "quatre-vingt",
];

function belowHundred(n: number): string {
    if (n < 20) return ONES[n];
    const t = Math.floor(n / 10);
    const o = n % 10;

    if (t === 7) {
        // 70–79: soixante-dix, soixante-onze…
        return o === 0 ? "soixante-dix" : `soixante-${ONES[10 + o]}`;
    }
    if (t === 9) {
        // 90–99: quatre-vingt-dix, quatre-vingt-onze…
        return o === 0 ? "quatre-vingt-dix" : `quatre-vingt-${ONES[10 + o]}`;
    }
    if (t === 8) {
        // 80: quatre-vingts (with s when no unit), 81–89: quatre-vingt-un…
        return o === 0 ? "quatre-vingts" : `quatre-vingt-${ONES[o]}`;
    }

    const liaison = o === 1 ? "-et-un" : o === 0 ? "" : `-${ONES[o]}`;
    return `${TENS[t]}${liaison}`;
}

function belowThousand(n: number): string {
    const h = Math.floor(n / 100);
    const rest = n % 100;

    let result = "";
    if (h === 1) {
        result = "cent";
    } else if (h > 1) {
        result = `${ONES[h]} cent${rest === 0 ? "s" : ""}`;
    }

    const below = belowHundred(rest);
    if (below) result = result ? `${result} ${below}` : below;
    return result;
}

function integerToFrench(n: number): string {
    if (n === 0) return "zéro";

    const billions = Math.floor(n / 1_000_000_000);
    const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
    const thousands = Math.floor((n % 1_000_000) / 1_000);
    const remainder = n % 1_000;

    const parts: string[] = [];

    if (billions > 0) {
        parts.push(`${belowThousand(billions)} milliard${billions > 1 ? "s" : ""}`);
    }
    if (millions > 0) {
        parts.push(`${belowThousand(millions)} million${millions > 1 ? "s" : ""}`);
    }
    if (thousands > 0) {
        parts.push(thousands === 1 ? "mille" : `${belowThousand(thousands)} mille`);
    }
    if (remainder > 0) {
        parts.push(belowThousand(remainder));
    }

    return parts.join(" ");
}

/**
 * Converts a DZD amount to the standard Algerian fiscal mention:
 * "Arrêtée la présente facture à la somme de **{words} dinars algériens** et **{cents} centimes**."
 */
export function amountToWordsDZD(amount: number): string {
    const intPart = Math.floor(amount);
    const centsPart = Math.round((amount - intPart) * 100);

    const intWords = integerToFrench(intPart);
    const centsWords = integerToFrench(centsPart);

    const dinars = intPart <= 1 ? "dinar algérien" : "dinars algériens";
    const centimes = centsPart <= 1 ? "centime" : "centimes";

    if (centsPart === 0) {
        return `Arrêtée la présente facture à la somme de ${intWords} ${dinars}.`;
    }
    return `Arrêtée la présente facture à la somme de ${intWords} ${dinars} et ${centsWords} ${centimes}.`;
}

/**
 * Generic converter for non-DZD currencies — returns "{words} {currencyCode}".
 */
export function amountToWordsFR(amount: number, currencyCode: string): string {
    const intPart = Math.floor(amount);
    const centsPart = Math.round((amount - intPart) * 100);

    const intWords = integerToFrench(intPart);

    if (centsPart === 0) {
        return `${intWords} ${currencyCode}`;
    }
    const centsWords = integerToFrench(centsPart);
    return `${intWords} ${currencyCode} et ${centsWords} centimes`;
}
