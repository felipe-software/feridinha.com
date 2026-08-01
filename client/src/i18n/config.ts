export const SUPPORTED_LOCALES = ["pt-BR", "en", "es"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "pt-BR"
export const LOCALE_COOKIE = "fd_locale"
export const COUNTRY_HEADER = "cf-ipcountry"

export const DAYJS_LOCALES: Record<AppLocale, string> = {
    "pt-BR": "pt-br",
    en: "en",
    es: "es",
}

export const NEXT_LOCALE: Record<AppLocale, AppLocale> = {
    "pt-BR": "en",
    en: "es",
    es: "pt-BR",
}

export const isSupportedLocale = (value: string | undefined | null): value is AppLocale => {
    return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export const getBrowserLocale = (value: string | undefined | null): AppLocale => {
    if (!value) return DEFAULT_LOCALE

    const primaryLanguage = value.split(",", 1)[0]?.trim().toLowerCase()
    if (!primaryLanguage) return DEFAULT_LOCALE
    if (primaryLanguage === "pt" || primaryLanguage.startsWith("pt-")) return "pt-BR"
    if (primaryLanguage === "es" || primaryLanguage.startsWith("es-")) return "es"
    return "en"
}

export const getRequestLocale = ({
    localeCookie,
    countryCode,
    acceptLanguage,
}: {
    localeCookie?: string | null
    countryCode?: string | null
    acceptLanguage?: string | null
}): AppLocale => {
    if (isSupportedLocale(localeCookie)) return localeCookie
    if (countryCode?.trim().toUpperCase() === "BR") return "pt-BR"
    return getBrowserLocale(acceptLanguage)
}
