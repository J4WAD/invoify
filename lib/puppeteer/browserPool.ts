import { ENV } from "@/lib/variables";

type Browser = import("puppeteer").Browser;

let _browser: Browser | null = null;
let _launching = false;
let _launchQueue: Array<(b: Browser) => void> = [];

async function launchBrowser(): Promise<Browser> {
    if (ENV === "production") {
        const chromium = (await import("@sparticuz/chromium")).default;
        const puppeteer = (await import("puppeteer-core")).default;
        return puppeteer.launch({
            args: [...chromium.args, "--disable-dev-shm-usage", "--ignore-certificate-errors"],
            executablePath: await chromium.executablePath(),
            headless: true,
        }) as unknown as Browser;
    } else {
        const puppeteer = (await import("puppeteer")).default;
        return puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: true,
        });
    }
}

/**
 * Returns the shared browser instance, launching it on first call.
 * If the browser crashes, a new one is launched automatically.
 */
export async function getBrowser(): Promise<Browser> {
    if (_browser) {
        try {
            // Quick liveness check — throws if browser is dead
            await _browser.version();
            return _browser;
        } catch {
            _browser = null;
        }
    }

    if (_launching) {
        // Another request is already launching; wait for it
        return new Promise<Browser>((resolve) => {
            _launchQueue.push(resolve);
        });
    }

    _launching = true;
    try {
        _browser = await launchBrowser();

        // Auto-reset on unexpected disconnect
        _browser.on("disconnected", () => {
            _browser = null;
        });

        // Drain the queue
        for (const resolve of _launchQueue) {
            resolve(_browser);
        }
        _launchQueue = [];

        return _browser;
    } finally {
        _launching = false;
    }
}
