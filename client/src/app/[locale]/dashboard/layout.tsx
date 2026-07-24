import type { Metadata } from "next"
import { NO_INDEX_ROBOTS } from "@/lib/seo"

export const metadata: Metadata = {
    robots: NO_INDEX_ROBOTS,
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return children
}
