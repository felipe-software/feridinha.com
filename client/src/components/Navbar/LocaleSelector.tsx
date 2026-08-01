"use client"

import { AppLocale, NEXT_LOCALE } from "@/i18n/config"

export const languages: Record<AppLocale, { code: string; next: AppLocale; label: string }> = {
    "pt-BR": { code: "PT", next: NEXT_LOCALE["pt-BR"], label: "Mudar idioma para inglês" },
    en: { code: "EN", next: NEXT_LOCALE.en, label: "Switch language to Spanish" },
    es: { code: "ES", next: NEXT_LOCALE.es, label: "Cambiar idioma a portugués" },
}

type LocaleSelectorProps = {
    locale: AppLocale
    onChange: (locale: AppLocale) => void
}

export function LocaleSelector({ locale, onChange }: LocaleSelectorProps) {
    const currentLanguage = languages[locale]
    const nextLanguage = languages[currentLanguage.next]

    return (
        <button
            aria-label={currentLanguage.label}
            className="language-toggle"
            onClick={() => onChange(currentLanguage.next)}
            type="button"
        >
            {currentLanguage.code}
            <span aria-hidden="true">/{nextLanguage.code}</span>
        </button>
    )
}
