import queryClient from "@/config/queryClient"
import useTokenStore from "@/hooks/useToken"
import useUserDataStore from "@/hooks/useUserDataStore"
import useApiKeysStore from "@/hooks/useApiKeysStore"
import { useModalStore } from "@/hooks/useModalStore"
import { cancelPendingApiRequests } from "@/services/api/axiosClient"
import { getStoredLocale } from "@/i18n/client"
import { toast } from "react-toastify"

export const AUTH_SESSION_ERROR_CODES = [
    "TokenExpiredError",
    "session_expired",
    "session_not_found",
    "JsonWebTokenError",
    "jwt expired",
    "invalid_token",
] as const

export type AuthSessionErrorCode = (typeof AUTH_SESSION_ERROR_CODES)[number]

const SESSION_EXPIRED_TOAST_ID = "session-expired"

export const isAuthSessionError = (code: unknown, message?: unknown) => {
    return (
        (typeof code === "string" && AUTH_SESSION_ERROR_CODES.some((candidate) => candidate === code)) ||
        message === "jwt expired"
    )
}

export const clearAuthSession = async ({ notifyExpired = false } = {}) => {
    cancelPendingApiRequests()
    await queryClient.cancelQueries()
    queryClient.clear()

    useUserDataStore.getState().setUserData(null)
    useApiKeysStore.getState().clear()
    useModalStore.getState().setPage(null)
    useTokenStore.getState().setToken(null)
    await useTokenStore.persist.clearStorage()

    if (notifyExpired && !toast.isActive(SESSION_EXPIRED_TOAST_ID)) {
        const message = getStoredLocale() === "pt-BR" ? "Sua sessão expirou" : "Your session expired"
        toast.error(message, { toastId: SESSION_EXPIRED_TOAST_ID })
    }
}

export const handleAuthSessionError = (code: unknown, message?: unknown) => {
    if (!isAuthSessionError(code, message)) return false

    void clearAuthSession({ notifyExpired: true })
    return true
}
