import type { Metadata } from "next"
import { ViewTransitions } from "next-view-transitions"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"
import "./globals.css"
import { Providers } from "./providers"
import StyledComponentsRegistry from "@/lib/registry"
import { inter } from "@/lib/fonts"
import ViewTransitionFix from "@/app/_polyfill"
// import ViewTransitionsPolyfill from "@/app/_polyfill"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { IS_MURAL_AVAILABLE } from "@/config/features"

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale()
    const t = await getTranslations({ locale, namespace: "Metadata" })

    return {
        title: t("title"),
        description: t("description"),
        keywords: t("keywords"),
        authors: [{ name: "Feridinha" }],
        openGraph: {
            type: "website",
            url: "https://feridinha.com/",
            title: t("openGraphTitle"),
            description: t("openGraphDescription"),
            images: ["https://feridinha.com/favicon.png"],
        },
        robots: "index, follow",
    }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const locale = await getLocale()

    return (
        <ViewTransitions>
            <html lang={locale}>
                <ViewTransitionFix />
                {/* <ViewTransitionsPolyfill /> */}
                <body className={inter.className} style={{ backgroundColor: "rgb(24, 25, 34)" }}>
                    <NextIntlClientProvider>
                        <NuqsAdapter>
                            <StyledComponentsRegistry>
                                <Providers isMuralAvailable={IS_MURAL_AVAILABLE}>{children}</Providers>
                            </StyledComponentsRegistry>
                        </NuqsAdapter>
                    </NextIntlClientProvider>
                </body>
            </html>
        </ViewTransitions>
    )
}
