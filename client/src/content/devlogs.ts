import type { AppLocale } from "@/i18n/config"
import devlogs from "@/i18n/devlogs.json"

export type DevlogDate = `${number}-${number}-${number}`

type LocalizedDevlogCopy = Record<AppLocale, readonly string[]>

export type DevlogEntry = {
    date: DevlogDate
    items: LocalizedDevlogCopy
}

type DevlogsDocument = {
    page: Record<AppLocale, { title: string; description: string }>
    entries: readonly DevlogEntry[]
}

const devlogsDocument = devlogs as DevlogsDocument

export const DEVLOG_PAGE_COPY = devlogsDocument.page
export const DEVLOGS = devlogsDocument.entries

export const LATEST_DEVLOG_DATE = DEVLOGS.reduce<DevlogDate>(
    (latest, entry) => (entry.date > latest ? entry.date : latest),
    "0000-00-00",
)

export const DEVLOG_LAST_SEEN_STORAGE_KEY = "feridinha:devlogs:last-seen"

export const hasUnreadDevlogs = (lastSeenDate: string | null) =>
    lastSeenDate !== null && lastSeenDate < LATEST_DEVLOG_DATE
