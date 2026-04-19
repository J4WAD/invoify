/**
 * FacturApp — localStorage → Database Migration Script
 *
 * Paste into the browser console while logged into FacturApp to migrate
 * all saved invoices and your profile to the server.
 *
 * Usage:
 *   1. Open FacturApp in your browser and log in
 *   2. Open DevTools → Console
 *   3. Paste and run this script
 *   4. Confirm when prompted
 *   5. Refresh the page
 */

(async function migrateLocalStorage() {
    const INVOICES_KEY = "facturapp:savedInvoices";
    const LEGACY_KEY = "savedInvoices";
    const PROFILE_KEY = "facturapp:profile";

    console.log("── FacturApp localStorage Migration ──────────────");

    // 1. Collect saved invoices
    const raw = localStorage.getItem(INVOICES_KEY) ?? localStorage.getItem(LEGACY_KEY);
    const invoices = raw ? JSON.parse(raw) : [];
    console.log(`Found ${invoices.length} saved invoice(s).`);

    if (invoices.length === 0) {
        console.log("Nothing to migrate.");
        return;
    }

    if (!confirm(`Migrate ${invoices.length} invoice(s) to the server?`)) {
        console.log("Aborted.");
        return;
    }

    // 2. POST to migration endpoint (implement /api/migrate in Phase 4)
    try {
        const res = await fetch("/api/migrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoices }),
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Migration failed:", err);
            return;
        }

        const result = await res.json();
        console.log(`Migrated: ${result.migrated} invoices, skipped: ${result.skipped} duplicates`);

        // 3. Clear local storage after success
        localStorage.removeItem(INVOICES_KEY);
        localStorage.removeItem(LEGACY_KEY);
        console.log("Local storage cleared. Refresh the page.");
    } catch (err) {
        console.error("Network error during migration:", err);
    }
})();
