import { describe, expect, test } from "bun:test"
import {
    DEVLOGS,
    DEVLOG_PAGE_COPY,
    LATEST_DEVLOG_DATE,
    hasUnreadDevlogs,
} from "@/content/devlogs"
import { SUPPORTED_LOCALES } from "@/i18n/config"

describe("devlogs", () => {
    test("entries use descending yyyy-mm-dd dates and include every locale", () => {
        const dates = DEVLOGS.map(({ date }) => date)

        expect(dates).toEqual([...dates].sort().reverse())
        expect(new Set(dates).size).toBe(dates.length)
        expect(LATEST_DEVLOG_DATE).toBe(dates[0])

        for (const entry of DEVLOGS) {
            expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

            for (const locale of SUPPORTED_LOCALES) {
                expect(entry.items[locale].length).toBeGreaterThan(0)
                for (const item of entry.items[locale]) {
                    expect(item).not.toContain("<0>")
                    expect(item).not.toMatch(/\b(?:we|we've|we're|eu|nós)\b/i)
                }
                expect(DEVLOG_PAGE_COPY[locale].title.length).toBeGreaterThan(0)
                expect(DEVLOG_PAGE_COPY[locale].titlePrefix).toBe("Devlogs:")
            }

            expect(entry.authors.length).toBeGreaterThan(0)
            for (const author of entry.authors) {
                expect(author.name.length).toBeGreaterThan(0)
                expect(author.avatarUrl).toStartWith("https://")
                expect(author.name).toBe("felipe-software")
                expect(author.profileUrl).toBe("https://github.com/felipe-software")
            }
        }

        for (const locale of SUPPORTED_LOCALES) {
            const items = DEVLOGS.flatMap((entry) => entry.items[locale])
            expect(new Set(items).size).toBe(items.length)
        }
    })

    test("new visitors start without unread updates", () => {
        expect(hasUnreadDevlogs(null)).toBe(false)
    })

    test("page heading is localized", () => {
        expect(DEVLOG_PAGE_COPY["pt-BR"].title).toBe(
            "Novidades do feridinha.com",
        )
        expect(DEVLOG_PAGE_COPY.en.title).toBe(
            "Development notes for feridinha.com",
        )
    })

    test("a newer entry is unread until its date is stored", () => {
        expect(hasUnreadDevlogs("2026-07-30")).toBe(true)
        expect(hasUnreadDevlogs(LATEST_DEVLOG_DATE)).toBe(false)
    })
})
