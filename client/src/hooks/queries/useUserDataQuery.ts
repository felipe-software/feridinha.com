import apiService from "@/services/api"
import type { AuthSessionErrorCode } from "@/services/api/authSession"
import { useQuery } from "@tanstack/react-query"

export const USER_DATA_QUERY_KEY = ["userData"] as const

type UserDataErrorName = AuthSessionErrorCode | "ApiError"

export class UserDataError extends Error {
    name: UserDataErrorName
    code?: string

    constructor({
        name,
        message,
        cause,
        code,
    }: {
        name: UserDataErrorName
        message: string
        cause?: unknown
        code?: string
    }) {
        super(message, { cause })
        this.name = name
        this.code = code
    }
}

export const fetchUserDataQuery = async () => {
    const response = await apiService.fetchUserData()
    if (response.success && response.data) return response.data

    throw new UserDataError({
        message: response.success ? "Missing user data" : response.error,
        name: response.success
            ? "ApiError"
            : (response.code as AuthSessionErrorCode) || "ApiError",
        code: response.code,
    })
}

export const useUserDataQuery = ({
    enabled,
    retry,
}: {
    enabled: boolean
    retry?: boolean
}) => {
    return useQuery({
        queryKey: USER_DATA_QUERY_KEY,
        queryFn: fetchUserDataQuery,
        enabled,
        retry,
        refetchOnMount: "always",
    })
}
