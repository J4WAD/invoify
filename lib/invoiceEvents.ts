"use client";

const target =
    typeof window !== "undefined"
        ? new EventTarget()
        : (null as unknown as EventTarget);

const EVENT_NAME = "facturapp:invoices-changed";

export const emitInvoicesChanged = () => {
    if (!target) return;
    target.dispatchEvent(new Event(EVENT_NAME));
};

export const subscribeInvoicesChanged = (cb: () => void) => {
    if (!target) return () => {};
    target.addEventListener(EVENT_NAME, cb);
    return () => target.removeEventListener(EVENT_NAME, cb);
};
