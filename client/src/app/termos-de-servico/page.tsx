import { getTranslations } from "next-intl/server"
import Link from "next/link"

const sectionIds = [
    "ugc",
    "opinions",
    "prohibited",
    "reports",
    "review",
    "commercial",
    "termination",
    "collection",
    "usage",
    "sharing",
    "security",
    "rights",
] as const

export default async function TermsPage() {
    const t = await getTranslations("Terms")

    return (
        <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-20 text-white">
            <header className="flex flex-col gap-3">
                <h1 className="text-4xl font-semibold">{t("title")}</h1>
                <p className="text-white/80">{t("intro")}</p>
                <p className="text-white/60">{t("accept")}</p>
            </header>

            <section className="flex flex-col gap-4 rounded-2xl bg-base-dark p-6">
                <h2 className="text-2xl font-semibold">{t("tosTitle")}</h2>
                {sectionIds.slice(0, 7).map((id) => (
                    <div key={id} className="flex flex-col gap-1">
                        <h3 className="text-lg font-medium">
                            {t(`sections.${id}.title`)}
                        </h3>
                        <p className="text-white/75">
                            {t.rich(`sections.${id}.body`, {
                                email: (chunks) => (
                                    <a
                                        href="mailto:tos@feridinha.com"
                                        className="text-dracula-cyan"
                                    >
                                        {chunks}
                                    </a>
                                ),
                                faq: (chunks) => (
                                    <Link
                                        href="/faq"
                                        className="text-dracula-cyan"
                                    >
                                        {chunks}
                                    </Link>
                                ),
                            })}
                        </p>
                    </div>
                ))}
            </section>

            <section className="flex flex-col gap-4 rounded-2xl bg-base-dark p-6">
                <h2 className="text-2xl font-semibold">{t("privacyTitle")}</h2>
                {sectionIds.slice(7).map((id) => (
                    <div key={id} className="flex flex-col gap-1">
                        <h3 className="text-lg font-medium">
                            {t(`sections.${id}.title`)}
                        </h3>
                        <p className="text-white/75">
                            {t(`sections.${id}.body`)}
                        </p>
                    </div>
                ))}
            </section>

            <p className="text-center text-sm text-white/50">
                {t("lastUpdated")}
            </p>
        </main>
    )
}
