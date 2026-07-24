import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { routing } from "@/i18n/routing"

export default getRequestConfig(async ({ requestLocale }) => {
    const requestedLocale = await requestLocale
    const locale = hasLocale(routing.locales, requestedLocale) ? requestedLocale : routing.defaultLocale

    const messages = (await import(`../../messages/${locale}.json`)).default

    return {
        locale,
        messages,
    }
})
