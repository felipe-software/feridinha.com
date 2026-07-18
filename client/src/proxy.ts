import { NextRequest, NextResponse } from "next/server"
import { COUNTRY_HEADER, getRequestLocale, isSupportedLocale, LOCALE_COOKIE } from "@/i18n/config"

export function proxy(request: NextRequest) {
    const response = NextResponse.next()
    const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value

    if (!isSupportedLocale(localeCookie)) {
        response.cookies.set(
            LOCALE_COOKIE,
            getRequestLocale({
                localeCookie,
                countryCode: request.headers.get(COUNTRY_HEADER),
                acceptLanguage: request.headers.get("accept-language"),
            }),
            {
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365,
                path: "/",
            },
        )
    }

    return response
}

export const config = {
    matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}
