import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        beforeSend(event) {
            if (event.request?.cookies) delete event.request.cookies;
            if (event.request?.headers) {
                delete event.request.headers["authorization"];
                delete event.request.headers["cookie"];
            }
            if (event.user?.email) event.user.email = "[redacted]";
            return event;
        },
    });
}
