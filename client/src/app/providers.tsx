"use client"

import "@/lib/suppress-react-ref-warning"
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
import {
    POSTHOG_PROXY_PATH,
    obfuscatePostHogAssetUrl,
} from "@/config/posthog"
import { stripOAuthFragmentFromUrl } from "@/lib/oauth"

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

export function Providers({
    children,
    isMuralAvailable,
    isOpenSource,
}: {
    children: React.ReactNode
    isMuralAvailable: boolean
    isOpenSource: boolean
}) {
    const [client] = useState(() => queryClient)

    return (
        <PostHogProvider
            apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY || ""}
            options={{
                api_host: POSTHOG_PROXY_PATH,
                ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
                prepare_external_dependency_script: (script) => {
                    script.src = obfuscatePostHogAssetUrl(script.src)
                    return script
                },
                before_send: (event) => {
                    if (!event) return null
                    for (const [key, value] of Object.entries(
                        event.properties ?? {},
                    )) {
                        if (
                            typeof value === "string" &&
                            (key.includes("url") || key.includes("referrer"))
                        ) {
                            event.properties[key] =
                                stripOAuthFragmentFromUrl(value)
                        }
                    }
                    return event
                },
            }}
        >
            <QueryClientProvider client={client}>
                <>
                    <NavBar isMuralAvailable={isMuralAvailable} isOpenSource={isOpenSource} />
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
