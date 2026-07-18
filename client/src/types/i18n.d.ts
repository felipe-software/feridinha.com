import type messages from "../../messages/pt-BR.json"
import type { AppLocale } from "@/i18n/config"

declare module "next-intl" {
    interface AppConfig {
        Locale: AppLocale
        Messages: typeof messages
    }
}
