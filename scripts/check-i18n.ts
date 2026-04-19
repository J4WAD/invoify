/**
 * Fails CI if any locale is missing keys present in the canonical (fr.json) locale.
 *
 * Usage: npm run check-i18n
 */
import fs from "fs";
import path from "path";

type JsonObject = Record<string, unknown>;

const LOCALES_DIR = path.join(process.cwd(), "i18n", "locales");
const CANONICAL = "fr.json";

function flattenKeys(obj: unknown, prefix = ""): string[] {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        return [prefix];
    }
    const record = obj as JsonObject;
    const keys: string[] = [];
    for (const [k, v] of Object.entries(record)) {
        const next = prefix ? `${prefix}.${k}` : k;
        keys.push(...flattenKeys(v, next));
    }
    return keys;
}

function readJson(file: string): JsonObject {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw) as JsonObject;
}

function main(): void {
    const canonicalPath = path.join(LOCALES_DIR, CANONICAL);
    if (!fs.existsSync(canonicalPath)) {
        console.error(`Canonical locale missing: ${canonicalPath}`);
        process.exit(1);
    }

    const canonicalKeys = new Set(flattenKeys(readJson(canonicalPath)));
    const files = fs
        .readdirSync(LOCALES_DIR)
        .filter((f) => f.endsWith(".json") && f !== CANONICAL);

    let hasError = false;
    const report: Record<string, string[]> = {};

    for (const file of files) {
        const localeKeys = new Set(
            flattenKeys(readJson(path.join(LOCALES_DIR, file)))
        );
        const missing: string[] = [];
        for (const key of canonicalKeys) {
            if (!localeKeys.has(key)) missing.push(key);
        }
        if (missing.length > 0) {
            report[file] = missing;
            hasError = true;
        }
    }

    if (hasError) {
        console.error("\n✗ Missing i18n keys detected:\n");
        for (const [file, keys] of Object.entries(report)) {
            console.error(`  ${file} (${keys.length} missing):`);
            for (const k of keys) console.error(`    - ${k}`);
        }
        console.error(
            `\nCanonical locale: ${CANONICAL} (${canonicalKeys.size} keys)`
        );
        process.exit(1);
    }

    console.log(
        `✓ All ${files.length} locales match canonical ${CANONICAL} (${canonicalKeys.size} keys)`
    );
}

main();
