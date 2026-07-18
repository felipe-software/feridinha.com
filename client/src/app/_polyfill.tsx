"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ViewTransitionFix() {
    const pathname = usePathname()

    useEffect(() => {
        // Adiciona a classe manualmente quando inicia a transição
        document.documentElement.classList.add("is-transitioning")

        // Remove após a transição terminar (usando o finished promise se disponível)
        // @ts-ignore
        const transition = document.activeViewTransition

        if (transition) {
            transition.finished.finally(() => {
                document.documentElement.classList.remove("is-transitioning")
            })
        } else {
            // Fallback: remove após o tempo máximo da animação
            const timer = setTimeout(() => {
                document.documentElement.classList.remove("is-transitioning")
            }, 400) // um pouco maior que a duração total da animação
            return () => clearTimeout(timer)
        }
    }, [pathname])

    return null
}
