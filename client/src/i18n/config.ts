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

export const isSupportedLocale = (value: string | undefined | null): value is AppLocale => {
    return SUPPORTED_LOCALES.includes(value as AppLocale)
}

const localeFromLanguageRange = (languageRange: string): AppLocale | null => {
    const normalizedRange = languageRange.trim().toLowerCase()
    if (normalizedRange === "*") return "en"

    const baseLanguage = normalizedRange.split("-", 1)[0]
    if (baseLanguage === "pt") return "pt-BR"
    if (baseLanguage === "en") return "en"
    if (baseLanguage === "es") return "es"
    return null
}

export const getBrowserLocale = (value: string | undefined | null): AppLocale => {
    if (!value) return DEFAULT_LOCALE

    const languageRanges = value
        .split(",")
        .map((entry, index) => {
            const [languageRange = "", ...parameters] = entry.split(";")
            const locale = localeFromLanguageRange(languageRange)
            const qualityParameter = parameters.find((parameter) =>
                parameter.trim().toLowerCase().startsWith("q="),
            )
            const quality = qualityParameter
                ? Number(qualityParameter.split("=", 2)[1]?.trim())
                : 1

            return {
                index,
                locale,
                quality: Number.isFinite(quality) && quality >= 0 && quality <= 1
                    ? quality
                    : 0,
            }
        })
        .filter((entry): entry is typeof entry & { locale: AppLocale } =>
            entry.locale !== null && entry.quality > 0,
        )
        .sort((left, right) => right.quality - left.quality || left.index - right.index)

    if (languageRanges.length > 0) return languageRanges[0].locale
    if (value.trim().length === 0) return DEFAULT_LOCALE
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
