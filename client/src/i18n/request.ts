import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { COUNTRY_HEADER, DEFAULT_LOCALE, getRequestLocale, LOCALE_COOKIE } from "@/i18n/config"

export default getRequestConfig(async () => {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value
    const headerStore = await headers()
    const locale = getRequestLocale({
        localeCookie,
        countryCode: headerStore.get(COUNTRY_HEADER),
        acceptLanguage: headerStore.get("accept-language"),
    })

    const messages = (await import(`../../messages/${locale}.json`)).default

    return {
        locale: locale || DEFAULT_LOCALE,
        messages,
    }
})
