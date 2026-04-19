import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0,
        beforeSend(event) {
            if (event.request?.cookies) delete event.request.cookies;
            if (event.user?.email) event.user.email = "[redacted]";
            return event;
        },
    });
}
