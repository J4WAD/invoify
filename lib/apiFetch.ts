"use client";

export class UnauthorizedError extends Error {
    constructor() {
        super("Unauthorized");
        this.name = "UnauthorizedError";
    }
}

function getLocaleFromPath(): string {
    if (typeof window === "undefined") return "fr";
    const match = window.location.pathname.match(/^\/([a-z]{2})(?=\/|$)/);
    return match?.[1] ?? "fr";
}

function redirectToLogin() {
    if (typeof window === "undefined") return;
    const locale = getLocaleFromPath();
    const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search
    );
    window.location.href = `/${locale}/auth/login?callbackUrl=${callbackUrl}`;
}

export async function apiFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<Response> {
    const res = await fetch(input, {
        ...init,
        credentials: "include",
        cache: init.cache ?? "no-store",
    });

    if (res.status === 401) {
        redirectToLogin();
        throw new UnauthorizedError();
    }

    return res;
}
