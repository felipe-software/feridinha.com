import type { Metadata } from "next"
import { ViewTransitions } from "next-view-transitions"
import { hasLocale } from "next-intl"
import { NextIntlClientProvider } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import "../globals.css"
import { Providers } from "@/app/providers"
import StyledComponentsRegistry from "@/lib/registry"
import { inter } from "@/lib/fonts"
import ViewTransitionFix from "@/app/_polyfill"
// import ViewTransitionsPolyfill from "@/app/_polyfill"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { IS_MURAL_AVAILABLE } from "@/config/features"
import { routing } from "@/i18n/routing"

type LocaleLayoutProps = {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) notFound()

    const t = await getTranslations({ locale, namespace: "Metadata" })
    const localeRoot = locale === routing.defaultLocale ? "/" : `/${locale}`

    return {
        metadataBase: new URL("https://feridinha.com"),
        title: t("title"),
        description: t("description"),
        keywords: t("keywords"),
        authors: [{ name: "Feridinha" }],
        openGraph: {
            type: "website",
            url: localeRoot,
            title: t("openGraphTitle"),
            description: t("openGraphDescription"),
            images: ["/favicon.png"],
        },
        robots: "index, follow",
    }
}

export default async function RootLayout({ children, params }: LocaleLayoutProps) {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) notFound()

    setRequestLocale(locale)

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
