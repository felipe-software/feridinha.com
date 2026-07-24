"use client"

import useToken from "@/hooks/useToken"
import useUserDataStore from "@/hooks/useUserDataStore"
import apiService from "@/services/api"
import { useRouter } from "@/i18n/navigation"
import Cookies from "js-cookie"
import { useEffect } from "react"
import { clearAuthSession } from "@/services/api/authSession"
import { toast } from "react-toastify"
import { useTranslations } from "next-intl"
import { getOAuthFragmentValue } from "@/lib/oauth"

const LoginCallback = () => {
    const router = useRouter()
    const setToken = useToken((state) => state.setToken)
    const { setUserData } = useUserDataStore()
    const t = useTranslations("Auth")

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

                try {
                    const response = await apiService.fetchUserData()
                    if (response.success && response.data) {
                        setUserData(response.data)
                        router.replace("/dashboard")
                        return
                    }
                } catch {
                    // The shared cleanup below removes the rejected token.
                }

                await clearAuthSession()
                router.replace("/")
            }
        }

        checkAndSetupSession()
    }, [setToken, setUserData, router, t])

    return null
}

export default LoginCallback
