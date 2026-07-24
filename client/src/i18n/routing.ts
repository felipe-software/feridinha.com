import { defineRouting } from "next-intl/routing"
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES } from "@/i18n/config"

export const routing = defineRouting({
    locales: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    localePrefix: "as-needed",
    localeCookie: {
        name: LOCALE_COOKIE,
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        path: "/",
    },
})
