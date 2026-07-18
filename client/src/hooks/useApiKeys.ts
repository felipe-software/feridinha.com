import useApiKeysStore, { ApiKey } from "@/hooks/useApiKeysStore"
import useTokenStore from "@/hooks/useToken"
import apiService from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "react-toastify"

const useApiKeys = () => {
    const { token } = useTokenStore()
    const apiKeysStore = useApiKeysStore()
    return useQuery({
        queryKey: ["api-keys"],
        queryFn: async () => {
            const response = await apiService.fetchApiKeys()
            if (response.success) {
                apiKeysStore.set(response.data!)
                return response.data
            }
            throw new Error(response.error)
        },
        enabled: !!token,
    })
}

export const useTutorialApiKey = () => {
    const t = useTranslations("Tutorial")
    const apiKeys = useApiKeys()
    const foundResult = apiKeys.data?.find((k) => k.tag === "tutorial")
    const [isLoading, setIsLoading] = useState(false)
    const tokenStore = useTokenStore()

    const handleCreateTutorialKey = async () => {
        if (!tokenStore.token) {
            toast.info(t("integrationKeyGuestWarning"))
            return null
        }
        setIsLoading(true)
        const response = await apiService.createApiKey(
            "Token geral",
            "tutorial"
        )
        setIsLoading(false)
        if (response.success && response.data) {
            return response.data!
        } else {
            toast.error(`${t("integrationKeyCreateError")}: ${(response as any)?.error}`)
        }

        return null
    }

    const get = async (): Promise<ApiKey | null> => {
        if (foundResult) {
            return foundResult
        }

        return handleCreateTutorialKey()
    }
    return { isLoading, get }
}

export default useApiKeys
