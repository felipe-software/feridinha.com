import type { Metadata } from "next"
import type { AppLocale } from "@/i18n/config"
import { buildPageMetadata } from "@/lib/seo"
import HomePageClient from "./_page-client"

type HomePageProps = {
    params: Promise<{ locale: AppLocale }>
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
    const { locale } = await params
    return buildPageMetadata("home", locale)
}

export default function HomePage() {
    return <HomePageClient />
}
