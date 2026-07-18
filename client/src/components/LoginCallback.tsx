"use client"

import useToken from "@/hooks/useToken"
import useUserDataStore from "@/hooks/useUserDataStore"
import apiService from "@/services/api"
import Cookies from "js-cookie"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { clearAuthSession } from "@/services/api/authSession"

const LoginCallback = () => {
    const router = useRouter()
    const setToken = useToken((state) => state.setToken)
    const { setUserData } = useUserDataStore()

    useEffect(() => {
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
    }, [setToken, setUserData, router])

    return null
}

export default LoginCallback
