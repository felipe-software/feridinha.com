import muralApi from "@/services/api/mural"
import type { $ApiMuralListParams } from "api-types"
import { useQuery } from "@tanstack/react-query"

export const POST_LIST_QUERY_KEY = ["mural", "list"] as const

export const usePostListQuery = (params: $ApiMuralListParams, enabled: boolean = true) => {
    return useQuery({
        queryKey: [...POST_LIST_QUERY_KEY, params],
        queryFn: async () => {
            const response = await muralApi.listPosts(params)
            if (!response.success) throw new Error(response.error)
            return response.data!
        },
        enabled
    })
}
