"use client";

import { useMemo } from "react";

// Next
import Link from "next/link";
import Image from "next/image";

// Auth
import { useSession } from "next-auth/react";

// Assets
import Logo from "@/public/assets/logottype.png";

// ShadCn
import { Card } from "@/components/ui/card";

// Components
import { BaseButton, DevDebug, LanguageSelector, SettingsModal } from "@/app/components";

// Context
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { FileStack, LayoutDashboard, Settings, Users } from "lucide-react";

const BaseNavbar = () => {
    const { _t } = useTranslationContext();
    const { status } = useSession();
    const isAuthenticated = status === "authenticated";
    const devEnv = useMemo(() => {
        return process.env.NODE_ENV === "development";
    }, []);

    return (
        <header className="lg:container z-[99]">
            <nav>
                <Card className="flex flex-wrap justify-between items-center px-5 gap-5">
                    <Link href={"/"}>
                        <Image
                            src={Logo}
                            alt="FacturApp Logo"
                            width={240}
                            height={120}
                            loading="eager"
                            style={{ height: "auto" }}
                        />
                    </Link>
                    {/* ? DEV Only */}
                    {devEnv && <DevDebug />}
                    <div className="flex items-center gap-1">
                        {isAuthenticated && (
                            <>
                                <Link href="/dashboard">
                                    <BaseButton
                                        variant="ghost"
                                        size="sm"
                                        tooltipLabel={_t("dashboard.title")}
                                        className="gap-1.5"
                                    >
                                        <LayoutDashboard className="h-[1.2rem] w-[1.2rem]" />
                                        <span className="hidden sm:inline text-sm">{_t("dashboard.title")}</span>
                                    </BaseButton>
                                </Link>
                                <Link href="/invoices">
                                    <BaseButton
                                        variant="ghost"
                                        size="sm"
                                        tooltipLabel="Mes factures"
                                        className="gap-1.5"
                                    >
                                        <FileStack className="h-[1.2rem] w-[1.2rem]" />
                                        <span className="hidden sm:inline text-sm">Factures</span>
                                    </BaseButton>
                                </Link>
                                <Link href="/clients">
                                    <BaseButton
                                        variant="ghost"
                                        size="sm"
                                        tooltipLabel="Mes clients"
                                        className="gap-1.5"
                                    >
                                        <Users className="h-[1.2rem] w-[1.2rem]" />
                                        <span className="hidden sm:inline text-sm">Clients</span>
                                    </BaseButton>
                                </Link>
                            </>
                        )}
                        <LanguageSelector />
                        {isAuthenticated && (
                            <SettingsModal>
                                <BaseButton
                                    variant="ghost"
                                    size="icon"
                                    tooltipLabel={_t("settings.title")}
                                >
                                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                                </BaseButton>
                            </SettingsModal>
                        )}
                    </div>
                </Card>
            </nav>
        </header>
    );
};

export default BaseNavbar;
