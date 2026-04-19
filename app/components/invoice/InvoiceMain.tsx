"use client";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Form } from "@/components/ui/form";

// Components
import { InvoiceActions, InvoiceForm } from "@/app/components";

// Context
import { useInvoiceContext } from "@/contexts/InvoiceContext";

// Hooks
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";

// Types
import { InvoiceType } from "@/types";

const InvoiceMain = () => {
    const { handleSubmit, getValues } = useFormContext<InvoiceType>();

    // Get the needed values from invoice context
    const { onFormSubmit, saveInvoice, newInvoice } = useInvoiceContext();

    // Keyboard shortcuts: Ctrl+S save, Ctrl+G generate, Ctrl+J new
    useKeyboardShortcuts({
        onSave: saveInvoice,
        onGenerate: () => onFormSubmit(getValues()),
        onNewInvoice: newInvoice,
    });

    return (
        <>
            <Form {...useFormContext<InvoiceType>()}>
                <form
                    onSubmit={handleSubmit(onFormSubmit, (err) => {
                        console.log(err);
                    })}
                >
                    <div className="flex flex-wrap">
                        <InvoiceForm />
                        <InvoiceActions />
                    </div>
                </form>
            </Form>
        </>
    );
};

export default InvoiceMain;
