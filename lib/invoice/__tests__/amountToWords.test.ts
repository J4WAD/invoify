import { describe, it, expect } from "vitest";
import { amountToWordsDZD, amountToWordsFR } from "../amountToWords";

describe("amountToWordsDZD", () => {
    const cases: Array<[number, string]> = [
        [1, "un dinar algérien"],
        [21, "vingt-et-un dinars algériens"],
        [71, "soixante-onze dinars algériens"],
        [80, "quatre-vingts dinars algériens"],
        [100, "cent dinars algériens"],
        [1000, "mille dinars algériens"],
    ];

    for (const [input, expectedSubstring] of cases) {
        it(`handles ${input}`, () => {
            const result = amountToWordsDZD(input);
            expect(result.toLowerCase()).toContain(
                expectedSubstring.toLowerCase()
            );
        });
    }

    it("includes centimes when fractional", () => {
        const result = amountToWordsDZD(12345.67);
        expect(result).toMatch(/dinars algériens/);
        expect(result).toMatch(/centimes/);
    });

    it("omits centimes when integer", () => {
        const result = amountToWordsDZD(42);
        expect(result).not.toMatch(/centime/);
    });
});

describe("amountToWordsFR", () => {
    it("includes currency code", () => {
        const result = amountToWordsFR(100, "EUR");
        expect(result).toMatch(/cent/);
        expect(result).toMatch(/EUR/);
    });
});
