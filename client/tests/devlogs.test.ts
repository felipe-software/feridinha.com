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
        expect(LATEST_DEVLOG_DATE).toBe(dates[0])

        for (const entry of DEVLOGS) {
            expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

            for (const locale of SUPPORTED_LOCALES) {
                expect(entry.items[locale].length).toBeGreaterThan(0)
                expect(DEVLOG_PAGE_COPY[locale].title.length).toBeGreaterThan(0)
            }
        }
    })

    test("new visitors start without unread updates", () => {
        expect(hasUnreadDevlogs(null)).toBe(false)
    })

    test("a newer entry is unread until its date is stored", () => {
        expect(hasUnreadDevlogs("2026-07-30")).toBe(true)
        expect(hasUnreadDevlogs(LATEST_DEVLOG_DATE)).toBe(false)
    })
})
