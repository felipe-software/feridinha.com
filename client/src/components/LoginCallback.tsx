"use client"

import useToken from "@/hooks/useToken"
import useUserDataStore from "@/hooks/useUserDataStore"
import { useRouter } from "@/i18n/navigation"
import Cookies from "js-cookie"
import { useEffect, useState } from "react"
import { clearAuthSession } from "@/services/api/authSession"
import { toast } from "react-toastify"
import { useTranslations } from "next-intl"
import { getOAuthFragmentValue } from "@/lib/oauth"
import { useUserDataQuery } from "@/hooks/queries/useUserDataQuery"

const LoginCallback = () => {
    const router = useRouter()
    const setToken = useToken((state) => state.setToken)
    const { setUserData } = useUserDataStore()
    const t = useTranslations("Auth")
    const [callbackToken, setCallbackToken] = useState<string | null>(null)
    const sessionQuery = useUserDataQuery({
        enabled: Boolean(callbackToken),
        retry: false,
    })

    useEffect(() => {
        const oauthError = getOAuthFragmentValue(
            window.location.hash,
            "oauth-error",
        )
        if (oauthError) {
            toast.error(t("oauthAccessDenied"))
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}`,
            )
        }

        const checkAndSetupSession = async () => {
            const tokenCookie = Cookies.get("Token")
            if (tokenCookie) {
                Cookies.remove("Token", {
                    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
                    path: "/",
                })

                await clearAuthSession()
                setToken(tokenCookie)
                setCallbackToken(tokenCookie)
            }
        }

        void checkAndSetupSession()
    }, [setToken, t])

    useEffect(() => {
        if (!callbackToken || sessionQuery.isFetching) return

        if (sessionQuery.data) {
            setCallbackToken(null)
            setUserData(sessionQuery.data)
            router.replace("/dashboard")
            return
        }
        if (!sessionQuery.error) return

        setCallbackToken(null)
        void clearAuthSession().then(() => router.replace("/"))
    }, [
        callbackToken,
        router,
        sessionQuery.data,
        sessionQuery.error,
        sessionQuery.isFetching,
        setUserData,
    ])

    return null
}

export default LoginCallback
