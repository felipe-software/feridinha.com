import muralApi from "@/services/api/mural"
import type { $ApiMuralCommunityModeratorRouteParams } from "api-types"
import { useQuery } from "@tanstack/react-query"

export const MODERATOR_LIST_QUERY_KEY = ["mural", "community", "moderator"] as const

export const useModeratorListQuery = (
    params: $ApiMuralCommunityModeratorRouteParams,
    enabled = true,
) => {
    return useQuery({
        queryKey: [...MODERATOR_LIST_QUERY_KEY, params],
        queryFn: async () => {
            const response = await muralApi.listMods(params)
            if (!response.success) throw new Error(response.error)
            return response.data!
        },
        enabled,
    })
}
