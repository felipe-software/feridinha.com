import type { Metadata } from "next"
import type { AppLocale } from "@/i18n/config"
import { buildPageMetadata } from "@/lib/seo"
import TutorialPageClient from "./_page-client"

type TutorialPageProps = {
    params: Promise<{ locale: AppLocale }>
}

export async function generateMetadata({ params }: TutorialPageProps): Promise<Metadata> {
    const { locale } = await params
    return buildPageMetadata("tutorial", locale)
}

export default function TutorialPage() {
    return <TutorialPageClient />
}
