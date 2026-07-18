"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import queryClient from "@/config/queryClient"
import { PostHogProvider } from "posthog-js/react"
import NavBar from "@/components/Navbar"
import { Modal } from "@/components/Modal"
import LoginCallback from "@/components/LoginCallback"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { LuCheck, LuInfo, LuLoaderCircle, LuTriangleAlert, LuX } from "react-icons/lu"
import * as Sentry from "@sentry/nextjs"
import { POSTHOG_PROXY_PATH } from "@/config/posthog"

Sentry.init({
    dsn: "https://9b5ad6af7594366d35e639d20d21dea3@o4504569588809728.ingest.us.sentry.io/4509291703238656",
    sendDefaultPii: true,
})

const getIcon = ({ type }: any) => {
    switch (type) {
        case "info":
            return <LuInfo className="notification-icon notification-info" />
        case "error":
            return <LuX className="notification-icon notification-error" />
        case "success":
            return <LuCheck className="notification-icon notification-success" />
        case "warning":
            return <LuTriangleAlert className="notification-icon notification-warning" />
        case "default":
            return <LuLoaderCircle className="notification-icon notification-loading spin-animation" />
        default:
            return null
    }
}

export function Providers({ children, isMuralAvailable }: { children: React.ReactNode; isMuralAvailable: boolean }) {
    const [client] = useState(() => queryClient)

    return (
        <PostHogProvider
            apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY || ""}
            options={{
                api_host: POSTHOG_PROXY_PATH,
                ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
            }}
        >
            <QueryClientProvider client={client}>
                <>
                    <NavBar isMuralAvailable={isMuralAvailable} />
                    <LoginCallback />
                    {children}
                    <ToastContainer
                        theme="dark"
                        autoClose={15000}
                        closeOnClick={true}
                        stacked={false}
                        toastClassName={"toast-notification"}
                        icon={getIcon}
                    />
                    <Modal />
                </>
            </QueryClientProvider>
        </PostHogProvider>
    )
}
