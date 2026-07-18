"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import queryClient from "@/config/queryClient"

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [client] = useState(() => queryClient)
    return (
        <QueryClientProvider client={client}>
            {children}
        </QueryClientProvider>
    )
}
