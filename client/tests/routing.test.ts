import { describe, expect, test } from "bun:test"
import { NextRequest } from "next/server"
import nextConfig from "../next.config"
import { proxy } from "@/proxy"
import {
    DEFAULT_LOCALE,
    getBrowserLocale,
    getRequestLocale,
    isSupportedLocale,
    LOCALE_COOKIE,
    SUPPORTED_LOCALES,
    type AppLocale,
} from "@/i18n/config"

type LocaleInput = {
    localeCookie?: string | null
    countryCode?: string | null
    acceptLanguage?: string | null
}

type LocaleCase = LocaleInput & {
    name: string
    expected: AppLocale
}

const detect = (input: LocaleInput) => getRequestLocale(input)

const requestWithLocaleHeaders = ({
    localeCookie,
    countryCode,
    acceptLanguage,
}: LocaleInput) => {
    const headers = new Headers()

    if (localeCookie !== undefined && localeCookie !== null) {
        headers.set("cookie", `${LOCALE_COOKIE}=${localeCookie}`)
    }
    if (countryCode !== undefined && countryCode !== null) {
        headers.set("cf-ipcountry", countryCode)
    }
    if (acceptLanguage !== undefined && acceptLanguage !== null) {
        headers.set("accept-language", acceptLanguage)
    }

    return new NextRequest("https://feridinha.com/", { headers })
}

describe("automatic locale detection", () => {
    test("locale constants and cookie validation are intentionally strict", () => {
        expect(SUPPORTED_LOCALES).toEqual(["pt-BR", "en"])
        expect(DEFAULT_LOCALE).toBe("pt-BR")

        for (const locale of SUPPORTED_LOCALES) {
            expect(isSupportedLocale(locale), locale).toBe(true)
        }

        for (const locale of [
            undefined,
            null,
            "",
            "pt",
            "pt-br",
            "PT-BR",
            "en-US",
            "EN",
            " en",
            "en ",
            "invalid",
        ]) {
            expect(isSupportedLocale(locale), String(locale)).toBe(false)
        }
    })

    test("browser detection covers defaults, Portuguese variants and other languages", () => {
        const cases: Array<{
            name: string
            value?: string | null
            expected: AppLocale
        }> = [
            { name: "missing header", value: undefined, expected: "pt-BR" },
            { name: "null header", value: null, expected: "pt-BR" },
            { name: "empty header", value: "", expected: "pt-BR" },
            { name: "Portuguese only", value: "pt", expected: "pt-BR" },
            { name: "Brazilian Portuguese", value: "pt-BR", expected: "pt-BR" },
            { name: "Portugal Portuguese", value: "pt-PT", expected: "pt-BR" },
            { name: "uppercase Portuguese", value: "PT-BR", expected: "pt-BR" },
            {
                name: "Portuguese first in a language list",
                value: "pt-BR,pt;q=0.9,en;q=0.8",
                expected: "pt-BR",
            },
            { name: "English", value: "en-US,en;q=0.9", expected: "en" },
            { name: "French", value: "fr-FR,fr;q=0.9", expected: "en" },
            { name: "Spanish", value: "es-ES,es;q=0.9", expected: "en" },
            { name: "German", value: "de-DE,de;q=0.9", expected: "en" },
            { name: "Japanese", value: "ja-JP,ja;q=0.9", expected: "en" },
            {
                name: "Portuguese is present but is not the primary language",
                value: "fr-FR,pt-BR;q=0.9",
                expected: "en",
            },
            { name: "wildcard language", value: "*", expected: "en" },
        ]

        for (const { name, value, expected } of cases) {
            expect(getBrowserLocale(value), name).toBe(expected)
        }
    })

    test("decision table covers every precedence branch", () => {
        const cases: LocaleCase[] = [
            {
                name: "Portuguese cookie wins outside Brazil with an English browser",
                localeCookie: "pt-BR",
                countryCode: "US",
                acceptLanguage: "en-US",
                expected: "pt-BR",
            },
            {
                name: "English cookie wins in Brazil with a Portuguese browser",
                localeCookie: "en",
                countryCode: "BR",
                acceptLanguage: "pt-BR",
                expected: "en",
            },
            {
                name: "English cookie wins even when every automatic signal says Portuguese",
                localeCookie: "en",
                countryCode: "BR",
                acceptLanguage: "pt-BR,pt;q=0.9",
                expected: "en",
            },
            {
                name: "Brazil wins when the cookie is missing",
                countryCode: "BR",
                acceptLanguage: "fr-FR",
                expected: "pt-BR",
            },
            {
                name: "Brazil wins when the cookie is invalid",
                localeCookie: "invalid",
                countryCode: "BR",
                acceptLanguage: "en-US",
                expected: "pt-BR",
            },
            {
                name: "Portuguese browser is used outside Brazil",
                countryCode: "US",
                acceptLanguage: "pt-BR",
                expected: "pt-BR",
            },
            {
                name: "non-Portuguese browser is used outside Brazil",
                countryCode: "FR",
                acceptLanguage: "fr-FR",
                expected: "en",
            },
            {
                name: "Cloudflare unknown country delegates to a Portuguese browser",
                countryCode: "XX",
                acceptLanguage: "pt-PT",
                expected: "pt-BR",
            },
            {
                name: "Cloudflare unknown country delegates to a non-Portuguese browser",
                countryCode: "XX",
                acceptLanguage: "de-DE",
                expected: "en",
            },
            {
                name: "missing country delegates to the browser",
                countryCode: undefined,
                acceptLanguage: "en-US",
                expected: "en",
            },
            {
                name: "null country delegates to the browser",
                countryCode: null,
                acceptLanguage: "pt-BR",
                expected: "pt-BR",
            },
            {
                name: "malformed country delegates to the browser",
                countryCode: "unknown",
                acceptLanguage: "en-US",
                expected: "en",
            },
            {
                name: "missing browser language reaches the Portuguese default",
                countryCode: "US",
                acceptLanguage: undefined,
                expected: "pt-BR",
            },
            {
                name: "all signals missing reaches the Portuguese default",
                expected: "pt-BR",
            },
        ]

        for (const { name, expected, ...input } of cases) {
            expect(detect(input), name).toBe(expected)
        }
    })

    test("a supported cookie redundantly overrides every conflicting automatic signal", () => {
        const conflictingSignals: LocaleInput[] = [
            { countryCode: "BR", acceptLanguage: "pt-BR" },
            { countryCode: "BR", acceptLanguage: "en-US" },
            { countryCode: "US", acceptLanguage: "pt-BR" },
            { countryCode: "US", acceptLanguage: "en-US" },
            { countryCode: "XX", acceptLanguage: "fr-FR" },
            { countryCode: undefined, acceptLanguage: undefined },
        ]

        for (const localeCookie of SUPPORTED_LOCALES) {
            for (const signals of conflictingSignals) {
                expect(
                    detect({ localeCookie, ...signals }),
                    `${localeCookie}:${String(signals.countryCode)}:${String(signals.acceptLanguage)}`,
                ).toBe(localeCookie)
            }
        }
    })

    test("Brazilian country normalization always forces Portuguese without a valid cookie", () => {
        const brazilianCountryValues = ["BR", "br", "Br", "bR", " BR ", "\tbr\n"]
        const absentOrInvalidCookies = [undefined, null, "", "invalid", "PT-BR", "EN"]
        const nonPortugueseBrowsers = ["en-US", "fr-FR", "es-ES"]

        for (const countryCode of brazilianCountryValues) {
            for (const localeCookie of absentOrInvalidCookies) {
                for (const acceptLanguage of nonPortugueseBrowsers) {
                    expect(
                        detect({ localeCookie, countryCode, acceptLanguage }),
                        `${String(localeCookie)}:${JSON.stringify(countryCode)}:${acceptLanguage}`,
                    ).toBe("pt-BR")
                }
            }
        }
    })

    test("representative non-Brazilian countries and special values always delegate to the browser", () => {
        const nonBrazilianCountries = ["US", "FR", "PT", "JP", "AR", "XX", "", null, undefined]
        const browserCases = [
            { acceptLanguage: "pt-BR", expected: "pt-BR" as const },
            { acceptLanguage: "pt-PT", expected: "pt-BR" as const },
            { acceptLanguage: "en-US", expected: "en" as const },
            { acceptLanguage: "fr-FR", expected: "en" as const },
            { acceptLanguage: null, expected: "pt-BR" as const },
            { acceptLanguage: undefined, expected: "pt-BR" as const },
        ]

        for (const countryCode of nonBrazilianCountries) {
            for (const { acceptLanguage, expected } of browserCases) {
                expect(
                    detect({ countryCode, acceptLanguage }),
                    `${String(countryCode)}:${String(acceptLanguage)}`,
                ).toBe(expected)
            }
        }
    })

    test("invalid cookie spellings fall through instead of being normalized", () => {
        const invalidCookies = ["pt", "pt-br", "PT-BR", "en-US", "EN", " en", "en ", "invalid"]

        for (const localeCookie of invalidCookies) {
            expect(
                detect({ localeCookie, countryCode: "US", acceptLanguage: "en-US" }),
                localeCookie,
            ).toBe("en")
            expect(
                detect({ localeCookie, countryCode: "BR", acceptLanguage: "en-US" }),
                localeCookie,
            ).toBe("pt-BR")
        }
    })
})

describe("locale proxy persistence", () => {
    test("proxy writes the same result as the locale detector for every automatic branch", () => {
        const cases: LocaleCase[] = [
            {
                name: "Brazil with a French browser",
                countryCode: "BR",
                acceptLanguage: "fr-FR",
                expected: "pt-BR",
            },
            {
                name: "United States with a Portuguese browser",
                countryCode: "US",
                acceptLanguage: "pt-BR",
                expected: "pt-BR",
            },
            {
                name: "France with a French browser",
                countryCode: "FR",
                acceptLanguage: "fr-FR",
                expected: "en",
            },
            {
                name: "unknown country with an English browser",
                countryCode: "XX",
                acceptLanguage: "en-US",
                expected: "en",
            },
            {
                name: "missing country with a Portuguese browser",
                acceptLanguage: "pt-PT",
                expected: "pt-BR",
            },
            {
                name: "missing headers use the default",
                expected: "pt-BR",
            },
            {
                name: "invalid cookie is replaced using automatic detection",
                localeCookie: "invalid",
                countryCode: "US",
                acceptLanguage: "en-US",
                expected: "en",
            },
        ]

        for (const { name, expected, ...input } of cases) {
            const response = proxy(requestWithLocaleHeaders(input))
            expect(response.cookies.get(LOCALE_COOKIE)?.value, name).toBe(expected)
        }
    })

    test("proxy never overwrites either supported cookie", () => {
        const conflictingSignals = [
            { countryCode: "BR", acceptLanguage: "pt-BR" },
            { countryCode: "US", acceptLanguage: "en-US" },
            { countryCode: "XX", acceptLanguage: "fr-FR" },
        ]

        for (const localeCookie of SUPPORTED_LOCALES) {
            for (const signals of conflictingSignals) {
                const response = proxy(requestWithLocaleHeaders({ localeCookie, ...signals }))
                expect(response.cookies.get(LOCALE_COOKIE)).toBeUndefined()
            }
        }
    })

    test("automatic locale cookie has the expected persistence and security attributes", () => {
        const response = proxy(
            requestWithLocaleHeaders({ countryCode: "US", acceptLanguage: "en-US" }),
        )
        const setCookie = response.headers.get("set-cookie")

        expect(setCookie).toContain(`${LOCALE_COOKIE}=en`)
        expect(setCookie).toContain("Path=/")
        expect(setCookie).toContain("Max-Age=31536000")
        expect(setCookie?.toLowerCase()).toContain("samesite=lax")
    })
})

describe("legacy routing", () => {
    test("redirects the legacy terms URL in Next config", async () => {
        const redirects = await nextConfig.redirects?.()
        expect(redirects).toContainEqual({
            source: "/termos-de-servico.html",
            destination: "/termos-de-servico",
            permanent: true,
        })
    })
})
