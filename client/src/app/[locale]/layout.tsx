import type { Metadata } from "next"
import { ViewTransitions } from "next-view-transitions"
import { hasLocale } from "next-intl"
import { NextIntlClientProvider } from "next-intl"
import { setRequestLocale } from "next-intl/server"
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
import { buildRootMetadata, buildSiteJsonLd, serializeJsonLd } from "@/lib/seo"
import type { AppLocale } from "@/i18n/config"

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

    return buildRootMetadata(locale as AppLocale)
}

export default async function RootLayout({ children, params }: LocaleLayoutProps) {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) notFound()

    setRequestLocale(locale)
    const jsonLd = buildSiteJsonLd(locale as AppLocale)

    return (
        <ViewTransitions>
            <html lang={locale}>
                <head>
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
                    />
                </head>
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
