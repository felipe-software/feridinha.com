import type { Metadata } from "next"
import type { AppLocale } from "@/i18n/config"
import { buildPageMetadata } from "@/lib/seo"
import DevlogsPageClient from "./_page-client"

type DevlogsPageProps = {
    params: Promise<{ locale: AppLocale }>
}

export async function generateMetadata({ params }: DevlogsPageProps): Promise<Metadata> {
    const { locale } = await params
    return buildPageMetadata("devlogs", locale)
}

export default function DevlogsPage() {
    return <DevlogsPageClient />
}
