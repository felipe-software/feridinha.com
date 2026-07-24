import createMiddleware from "next-intl/middleware"
import { NextRequest } from "next/server"
import { COUNTRY_HEADER, getRequestLocale, isSupportedLocale, LOCALE_COOKIE } from "@/i18n/config"
import { routing } from "@/i18n/routing"

const handleI18nRouting = createMiddleware(routing)

export function proxy(request: NextRequest) {
    const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value
    const pathnameLocale = request.nextUrl.pathname.split("/")[1]
    const hasExplicitLocale = isSupportedLocale(pathnameLocale)

    if (!hasExplicitLocale && !isSupportedLocale(localeCookie)) {
        const detectedLocale = getRequestLocale({
            localeCookie,
            countryCode: request.headers.get(COUNTRY_HEADER),
            acceptLanguage: request.headers.get("accept-language"),
        })

        request.cookies.set(LOCALE_COOKIE, detectedLocale)
        const response = handleI18nRouting(request)
        response.cookies.set(
            LOCALE_COOKIE,
            detectedLocale,
            {
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365,
                path: "/",
            },
        )
        return response
    }

    return handleI18nRouting(request)
}

export const config = {
    matcher: "/((?!api|faro|_next|_vercel|.*\\..*).*)",
}
