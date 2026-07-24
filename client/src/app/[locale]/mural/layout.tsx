import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { IS_MURAL_AVAILABLE } from "@/config/features"
import { NO_INDEX_ROBOTS } from "@/lib/seo"

export const metadata: Metadata = {
    robots: NO_INDEX_ROBOTS,
}

export default function MuralLayout({ children }: { children: React.ReactNode }) {
    if (!IS_MURAL_AVAILABLE) {
        notFound()
    }

    return <>{children}</>
}
