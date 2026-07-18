export const SUPPORTED_LOCALES = ["pt-BR", "en"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "pt-BR"
export const LOCALE_COOKIE = "fd_locale"
export const COUNTRY_HEADER = "cf-ipcountry"

export const isSupportedLocale = (value: string | undefined | null): value is AppLocale => {
    return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export const getBrowserLocale = (value: string | undefined | null): AppLocale => {
    if (!value) return DEFAULT_LOCALE
    return value.toLowerCase().startsWith("pt") ? "pt-BR" : "en"
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
