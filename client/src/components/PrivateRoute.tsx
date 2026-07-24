"use client"

import useTokenStore from "@/hooks/useToken"
import useUserData from "@/hooks/useUserData"
import { handleAuthSessionError } from "@/services/api/authSession"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

import React, { ReactNode, useEffect } from "react"
import { toast } from "react-toastify"

const PrivateRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
    const user = useUserData()
    const token = useTokenStore((state) => state.token)
    const hasHydrated = useTokenStore((state) => state._hasHydrated)
    const router = useRouter()
    const t = useTranslations("Auth")

    useEffect(() => {
        if(!hasHydrated) return
        if (!token) {
            toast.warn(t("mustLogin"))
            router.push("/")
            return
        }
        return () => {}
    }, [token, hasHydrated, router, t])

    useEffect(() => {
        if (!user.error) return
        if (handleAuthSessionError(user.error.name, user.error.message)) {
            router.push("/")
        } else {
            toast.error(
                user.error.message ??
                    t("sessionLoadError"),
            )
        }
    }, [user.error, router, t])

    if (hasHydrated && token && user.data && !user.error) {
        return children
    }

    return null
}

export default PrivateRoute
