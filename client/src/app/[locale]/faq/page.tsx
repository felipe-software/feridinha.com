import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import type { AppLocale } from "@/i18n/config"
import { buildPageMetadata, serializeJsonLd } from "@/lib/seo"
import FaqPageClient from "./_page-client"

type FaqPageProps = {
    params: Promise<{ locale: AppLocale }>
}

const stripRichTextTags = (value: string) =>
    value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()

const storyAnswerKeys = ["storyBody1", "storyBody2", "storyBody3", "storyBody4"] as const
const deletedAnswerKeys = ["deletedBody1", "deletedBody2", "deletedBody3"] as const

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
    const { locale } = await params
    return buildPageMetadata("faq", locale)
}

export default async function FaqPage({ params }: FaqPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "Faq" })
    const questions = [
        {
            name: t("storyTitle"),
            answer: storyAnswerKeys
                .map((key) => stripRichTextTags(t.raw(key)))
                .join(" "),
        },
        {
            name: t("contactTitle"),
            answer: stripRichTextTags(t.raw("contactBody")),
        },
        {
            name: t("supportTitle"),
            answer: stripRichTextTags(t.raw("supportBody")),
        },
        {
            name: t("deletedTitle"),
            answer: deletedAnswerKeys
                .map((key) => stripRichTextTags(t.raw(key)))
                .join(" "),
        },
        {
            name: t("reportTitle"),
            answer: stripRichTextTags(t.raw("reportBody")),
        },
    ]
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: questions.map(({ name, answer }) => ({
            "@type": "Question",
            name,
            acceptedAnswer: {
                "@type": "Answer",
                text: answer,
            },
        })),
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
            />
            <FaqPageClient />
        </>
    )
}
