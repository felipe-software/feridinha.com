export const SUPPORTED_LOCALES = ["pt-BR", "en", "es"] as const;

export type ApiLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: ApiLocale = "pt-BR";
