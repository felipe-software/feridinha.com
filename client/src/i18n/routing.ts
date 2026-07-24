import { defineRouting } from "next-intl/routing"
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES } from "@/i18n/config"

export const routing = defineRouting({
    locales: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    localePrefix: "as-needed",
    // Public pages emit canonical and hreflang links through localized metadata.
    // Avoid duplicate HTTP Link headers that use the request host (e.g. localhost).
    alternateLinks: false,
    localeCookie: {
        name: LOCALE_COOKIE,
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
    },
})
