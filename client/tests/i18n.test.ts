import { describe, expect, test } from "bun:test"
import { parse } from "@formatjs/icu-messageformat-parser"
import en from "../messages/en.json"
import ptBR from "../messages/pt-BR.json"

const messages = (value: unknown, prefix = ""): Array<[string, string]> => {
    if (typeof value === "string") return [[prefix, value]]
    if (!value || typeof value !== "object") return []
    return Object.entries(value).flatMap(([key, child]) => messages(child, prefix ? `${prefix}.${key}` : key))
}

describe("client i18n catalogs", () => {
    test("English and Portuguese have identical message paths", () => {
        const enPaths = messages(en).map(([path]) => path).sort()
        const ptPaths = messages(ptBR).map(([path]) => path).sort()
        expect(enPaths.length).toBeGreaterThanOrEqual(274)
        expect(enPaths).toEqual(ptPaths)
    })

    test("every message has valid ICU syntax", () => {
        for (const [locale, catalog] of [["en", en], ["pt-BR", ptBR]] as const) {
            for (const [path, message] of messages(catalog)) {
                expect(() => parse(message), `${locale}:${path}`).not.toThrow()
            }
        }
    })
})
