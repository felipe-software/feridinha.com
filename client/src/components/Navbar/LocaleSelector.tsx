"use client"

import { AppLocale } from "@/i18n/config"

const languages: Record<AppLocale, { code: string; next: AppLocale }> = {
    "pt-BR": { code: "PT", next: "en" },
    en: { code: "EN", next: "pt-BR" },
}

type LocaleSelectorProps = {
    locale: AppLocale
    onChange: (locale: AppLocale) => void
}

export function LocaleSelector({ locale, onChange }: LocaleSelectorProps) {
    const currentLanguage = languages[locale]
    const nextLanguage = languages[currentLanguage.next]
    const label = locale === "pt-BR" ? "Mudar idioma para inglês" : "Switch language to Portuguese"

    return (
        <button
            aria-label={label}
            className="language-toggle"
            onClick={() => onChange(currentLanguage.next)}
            type="button"
        >
            {currentLanguage.code}
            <span aria-hidden="true">/{nextLanguage.code}</span>
        </button>
    )
}
