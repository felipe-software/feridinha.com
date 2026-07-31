"use client"

import { DEVLOG_PAGE_COPY, DEVLOGS } from "@/content/devlogs"
import type { AppLocale } from "@/i18n/config"
import { useLocale } from "next-intl"
import { useEffect } from "react"
import styles from "./page.module.css"

export default function DevlogsPageClient() {
    const locale = useLocale() as AppLocale
    const copy = DEVLOG_PAGE_COPY[locale]

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--nav-highlight",
            "var(--dracula-red)",
        )
    }, [])

    return (
        <main
            className={styles.page}
            style={{ viewTransitionName: "page-content" }}
        >
            <div className={styles.content}>
                <header className={styles.header}>
                    <h1>{copy.title}</h1>
                    <p>{copy.description}</p>
                </header>

                <div className={styles.entries}>
                    {DEVLOGS.map((entry) => {
                        const headingId = `devlog-${entry.date}`

                        return (
                            <article
                                className={styles.entry}
                                aria-labelledby={headingId}
                                key={entry.date}
                            >
                                <time
                                    className={styles.date}
                                    dateTime={entry.date}
                                    id={headingId}
                                >
                                    {entry.date}
                                </time>
                                <ul className={styles.items}>
                                    {entry.items[locale].map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </article>
                        )
                    })}
                </div>
            </div>
        </main>
    )
}
