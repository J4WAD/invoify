"use client";

import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTranslationContext } from "@/contexts/TranslationContext";

import BusinessInfoTab from "./tabs/BusinessInfoTab";
import BrandingTab from "./tabs/BrandingTab";
import InvoiceDefaultsTab from "./tabs/InvoiceDefaultsTab";
import PaymentInfoTab from "./tabs/PaymentInfoTab";
import ClientsTab from "./tabs/ClientsTab";
import UsersTab from "./tabs/UsersTab";

type SettingsModalProps = {
    children: React.ReactNode;
};

const SettingsModal = ({ children }: SettingsModalProps) => {
    const [open, setOpen] = useState(false);
    const { _t } = useTranslationContext();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
                <DialogHeader className="pb-2 border-b">
                    <DialogTitle>{_t("settings.title")}</DialogTitle>
                    <DialogDescription>
                        {_t("settings.description")}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="business" className="flex-1 min-h-0">
                    <TabsList className="w-full">
                        <TabsTrigger value="business" className="flex-1 text-xs">
                            {_t("settings.businessInfo.title")}
                        </TabsTrigger>
                        <TabsTrigger value="branding" className="flex-1 text-xs">
                            {_t("settings.branding.title")}
                        </TabsTrigger>
                        <TabsTrigger value="defaults" className="flex-1 text-xs">
                            {_t("settings.invoiceDefaults.title")}
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="flex-1 text-xs">
                            {_t("settings.paymentInfo.title")}
                        </TabsTrigger>
                        <TabsTrigger value="clients" className="flex-1 text-xs">
                            Clients
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex-1 text-xs">
                            Compte
                        </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[55vh] mt-2 pr-3">
                        <TabsContent value="business">
                            <BusinessInfoTab />
                        </TabsContent>
                        <TabsContent value="branding">
                            <BrandingTab />
                        </TabsContent>
                        <TabsContent value="defaults">
                            <InvoiceDefaultsTab />
                        </TabsContent>
                        <TabsContent value="payment">
                            <PaymentInfoTab />
                        </TabsContent>
                        <TabsContent value="clients">
                            <ClientsTab />
                        </TabsContent>
                        <TabsContent value="users">
                            <UsersTab />
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsModal;
