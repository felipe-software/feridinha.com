import { notFound } from "next/navigation"
import { IS_MURAL_AVAILABLE } from "@/config/features"

export default function MuralLayout({ children }: { children: React.ReactNode }) {
    if (!IS_MURAL_AVAILABLE) {
        notFound()
    }

    return <>{children}</>
}
