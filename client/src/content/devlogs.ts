import type { AppLocale } from "@/i18n/config"

export type DevlogDate = `${number}-${number}-${number}`

type LocalizedDevlogCopy = Record<AppLocale, readonly string[]>

export type DevlogEntry = {
    date: DevlogDate
    items: LocalizedDevlogCopy
}

export const DEVLOG_PAGE_COPY: Record<
    AppLocale,
    { title: string; description: string }
> = {
    "pt-BR": {
        title: "Devlogs",
        description: "Novidades e notas de desenvolvimento do Feridinha.",
    },
    en: {
        title: "Devlogs",
        description: "Updates and development notes from Feridinha.",
    },
}

// Adicione novas entradas no topo. A data deve sempre usar o formato yyyy-mm-dd.
export const DEVLOGS: readonly DevlogEntry[] = [
    {
        date: "2026-07-31",
        items: {
            "pt-BR": [
                "Criamos uma página de devlogs para reunir as novidades do site.",
                "A navbar agora avisa quando existe uma atualização que você ainda não leu.",
            ],
            en: [
                "We added a devlogs page to keep the site's updates in one place.",
                "The navbar now lets you know when there is an update you have not read yet.",
            ],
        },
    },
]

export const LATEST_DEVLOG_DATE = DEVLOGS.reduce<DevlogDate>(
    (latest, entry) => (entry.date > latest ? entry.date : latest),
    "0000-00-00",
)

export const DEVLOG_LAST_SEEN_STORAGE_KEY = "feridinha:devlogs:last-seen"

export const hasUnreadDevlogs = (lastSeenDate: string | null) =>
    lastSeenDate !== null && lastSeenDate < LATEST_DEVLOG_DATE
