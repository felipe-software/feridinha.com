import useTokenStore from "@/hooks/useToken"
import useUserDataStore from "@/hooks/useUserDataStore"
import apiService from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import type { AuthSessionErrorCode } from "@/services/api/authSession"

export type ErrorName = AuthSessionErrorCode

export class ApiError extends Error {
    name: ErrorName
    message: string
    cause?: any
    code?: string

    constructor({
        name,
        message,
        cause,
        code,
    }: {
        name: ErrorName
        message: string
        cause?: any
        code?: string
    }) {
        super()
        this.name = name
        this.message = message
        this.cause = cause
        this.code = code
    }
}

const useUserData = () => {
    const { token } = useTokenStore()
    const { setUserData } = useUserDataStore()
    // console.log(token, !!token, _hasHydrated)
    const { data, isLoading, error } = useQuery({
        queryKey: ["userData"],
        queryFn: async () => {
            const response = await apiService.fetchUserData()
            if (response.success) {
                if (response.data) setUserData(response.data!)

                return response.data
            }
            throw new ApiError({
                message: response.error,
                name: response.code as ErrorName,
            })
        },
        enabled: !!token,


        refetchOnMount: "always"
    })

    return { data, isLoading, error }
}

export default useUserData
