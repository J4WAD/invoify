import pino from "pino";

export const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: {
        service: "facturapp",
        env: process.env.NODE_ENV ?? "development",
    },
    redact: {
        paths: [
            "password",
            "passwordHash",
            "token",
            "authorization",
            "cookie",
            "headers.authorization",
            "headers.cookie",
        ],
        censor: "[REDACTED]",
    },
});
