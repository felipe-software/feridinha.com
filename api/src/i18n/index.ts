import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/config";
import { resources } from "@/i18n/resources";
import i18next from "i18next";
import * as middleware from "i18next-http-middleware";

const languageDetector = new middleware.LanguageDetector();

languageDetector.addDetector({
    name: "x-locale",
    lookup(req: { headers?: Record<string, string | string[] | undefined> }) {
        const locale = req?.headers?.["x-locale"];
        return Array.isArray(locale) ? locale[0] : locale;
    },
});

void i18next
    .use(languageDetector)
    .init({
        resources,
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: [...SUPPORTED_LOCALES],
        preload: [...SUPPORTED_LOCALES],
        load: "all",
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ["x-locale", "header"],
            lookupHeader: "accept-language",
        },
        initImmediate: false,
    });

export const i18nMiddleware = middleware.handle(i18next);

export default i18next;
