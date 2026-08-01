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
                    <span className="notranslate material-icon" aria-hidden="true">
                        code
                    </span>
                    <h1>
                        <span>{copy.titlePrefix}</span> {copy.title}
                    </h1>
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
                                <div className={styles.meta}>
                                    <time
                                        className={styles.date}
                                        dateTime={entry.date}
                                        id={headingId}
                                    >
                                        {entry.date}
                                    </time>
                                    <div className={styles.authors}>
                                        {entry.authors.map((author) => (
                                            <a
                                                href={author.profileUrl}
                                                key={author.profileUrl}
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                {/* Author avatars are externally configured in devlogs.json. */}
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    alt={author.name}
                                                    height={20}
                                                    src={author.avatarUrl}
                                                    width={20}
                                                />
                                                <span>{author.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
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
