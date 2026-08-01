"use client"

import type { AppLocale } from "@/i18n/config"
import brazilFlag from "@discordapp/twemoji/dist/svg/1f1e7-1f1f7.svg"
import unitedStatesFlag from "@discordapp/twemoji/dist/svg/1f1fa-1f1f8.svg"
import type { StaticImageData } from "next/image"
import { useTranslations } from "next-intl"
import { useEffect, useRef } from "react"
import { LuCheck, LuGlobe } from "react-icons/lu"
import type { Instance } from "tippy.js"

import {
    Check,
    Container,
    Flag,
    FlagContainer,
    Menu,
    Option,
    Popover,
    Trigger,
} from "./styles"

// Twemoji artwork is licensed under CC-BY 4.0: https://github.com/discord/twemoji
const languages: Record<AppLocale, { label: string; flag: StaticImageData }> = {
    "pt-BR": { label: "Português", flag: brazilFlag },
    en: { label: "English", flag: unitedStatesFlag },
}

const languageOrder = ["pt-BR", "en"] as const satisfies readonly AppLocale[]

export type LocaleSelectorProps = {
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
            const instance = tooltip.current
            instance.disable()
            trigger.current?.focus()
            requestAnimationFrame(() => instance.enable())
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
        <Menu role="group" aria-label={t("languageMenu")}>
            {languageOrder.map((languageLocale) => {
                const language = languages[languageLocale]
                const isCurrent = languageLocale === locale

                return (
                    <Option
                        type="button"
                        key={languageLocale}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-label={isCurrent ? `${language.label}, ${t("currentLanguage")}` : language.label}
                        disabled={isCurrent}
                        lang={languageLocale}
                        onClick={() => handleSelect(languageLocale)}
                    >
                        <FlagContainer>
                            <Flag aria-hidden="true" alt="" fill sizes="2rem" src={language.flag} />
                        </FlagContainer>
                        <span>{language.label}</span>
                        <Check aria-hidden="true">{isCurrent && <LuCheck />}</Check>
                    </Option>
                )
            })}
        </Menu>
    )

    return (
        <Container>
            <Popover
                animation="fade"
                appendTo="parent"

                content={content}
                duration={[150, 100]}
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
                trigger="mouseenter focus"
                hideOnClick={false}
            >
                <Trigger ref={trigger} aria-label={t("selectLanguage")} type="button">
                    <LuGlobe aria-hidden="true" />
                </Trigger>
            </Popover>
        </Container>
    )
}
