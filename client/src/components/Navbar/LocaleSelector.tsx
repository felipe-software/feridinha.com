"use client"

import Tooltip from "@/components/Tooltip"
import type { AppLocale } from "@/i18n/config"
import brazilFlag from "@discordapp/twemoji/dist/svg/1f1e7-1f1f7.svg"
import unitedStatesFlag from "@discordapp/twemoji/dist/svg/1f1fa-1f1f8.svg"
import Image, { type StaticImageData } from "next/image"
import { useTranslations } from "next-intl"
import { useEffect, useRef } from "react"
import { LuCheck, LuGlobe } from "react-icons/lu"
import type { Instance } from "tippy.js"

// Twemoji artwork is licensed under CC-BY 4.0: https://github.com/discord/twemoji
const languages: Record<AppLocale, { label: string; flag: StaticImageData }> = {
    "pt-BR": { label: "Português", flag: brazilFlag },
    en: { label: "English", flag: unitedStatesFlag },
}

const languageOrder = ["pt-BR", "en"] as const satisfies readonly AppLocale[]

type LocaleSelectorProps = {
    locale: AppLocale
    onChange: (locale: AppLocale) => void
}

export function LocaleSelector({ locale, onChange }: LocaleSelectorProps) {
    const t = useTranslations("Nav")
    const tooltip = useRef<Instance | null>(null)
    const trigger = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape" || !tooltip.current?.state.isVisible) return

            event.preventDefault()
            tooltip.current.hide()
            trigger.current?.focus()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    const handleSelect = (targetLocale: AppLocale) => {
        if (targetLocale === locale) return

        tooltip.current?.hide()
        onChange(targetLocale)
    }

    const content = (
        <div className="language-menu" role="group" aria-label={t("languageMenu")}>
            {languageOrder.map((languageLocale) => {
                const language = languages[languageLocale]
                const isCurrent = languageLocale === locale

                return (
                    <button
                        type="button"
                        className="language-option"
                        key={languageLocale}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-label={isCurrent ? `${language.label}, ${t("currentLanguage")}` : language.label}
                        disabled={isCurrent}
                        lang={languageLocale}
                        onClick={() => handleSelect(languageLocale)}
                    >
                        <Image
                            aria-hidden="true"
                            alt=""
                            className="language-flag"
                            height={24}
                            src={language.flag}
                            width={24}
                        />
                        <span>{language.label}</span>
                        <span className="language-check" aria-hidden="true">
                            {isCurrent && <LuCheck />}
                        </span>
                    </button>
                )
            })}
        </div>
    )

    return (
        <Tooltip
            appendTo="parent"
            className="language-popover"
            content={content}
            interactive={true}
            maxWidth="none"
            offset={[0, 8]}
            onCreate={(instance) => {
                tooltip.current = instance
            }}
            onDestroy={() => {
                tooltip.current = null
            }}
            placement="bottom-start"
            trigger="click"
        >
            <button
                ref={trigger}
                aria-label={t("selectLanguage")}
                className="language-toggle"
                type="button"
            >
                <LuGlobe aria-hidden="true" />
            </button>
        </Tooltip>
    )
}
