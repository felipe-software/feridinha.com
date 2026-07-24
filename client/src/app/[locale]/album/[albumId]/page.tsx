import { notFound } from "next/navigation"
import type { AppLocale } from "@/i18n/config"
import type { Album } from "@/services/api"
import AlbumPageClient from "./_page-client"

export const dynamic = "force-dynamic"

type AlbumPageProps = {
    params: Promise<{
        locale: AppLocale
        albumId: string
    }>
}

export default async function AlbumPage({ params }: AlbumPageProps) {
    const { albumId, locale } = await params
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is required to render album pages")
    }

    const response = await fetch(`${apiUrl}/album/${encodeURIComponent(albumId)}`, {
        cache: "no-store",
        headers: {
            "Accept-Language": locale,
            "x-locale": locale,
        },
    })

    if (response.status === 404) notFound()
    if (!response.ok) {
        throw new Error(`Could not verify album ${albumId}: HTTP ${response.status}`)
    }

    const result = await response.json()
    if (!result?.success || !result?.data) notFound()

    return <AlbumPageClient albumData={result.data as Album} />
}
