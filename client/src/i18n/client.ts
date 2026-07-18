"use client"

import Cookies from "js-cookie"
import { AppLocale, DEFAULT_LOCALE, getBrowserLocale, LOCALE_COOKIE, isSupportedLocale } from "@/i18n/config"

export const getStoredLocale = (): AppLocale => {
    const locale = Cookies.get(LOCALE_COOKIE)

    if (isSupportedLocale(locale)) {
        return locale
    }

    if (typeof navigator !== "undefined") {
        return getBrowserLocale(navigator.language)
    }

    return DEFAULT_LOCALE
}

export const setStoredLocale = (locale: AppLocale) => {
    Cookies.set(LOCALE_COOKIE, locale, {
        sameSite: "lax",
        expires: 365,
        path: "/",
    })
}
