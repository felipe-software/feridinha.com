"use client"

export const dynamic = "force-dynamic"

import { BasePageContainer } from "@/components/PageTransition"

export default function NotFound() {
    return (
        <BasePageContainer>
            <h1 style={{ margin: "auto" }}>
                <h1 style={{ color: "var(--foreground)" }}>404</h1>
            </h1>
        </BasePageContainer>
    )
}
