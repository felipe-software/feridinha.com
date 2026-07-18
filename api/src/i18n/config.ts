export const SUPPORTED_LOCALES = ["pt-BR", "en"] as const;

export type ApiLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: ApiLocale = "pt-BR";
