import muralApi from "@/services/api/mural"
import { useQuery } from "@tanstack/react-query"
import type { $ApiMuralCommunityModeratorParams } from "api-types"

export const COMMUNITY_MODS_QUERY_QUERY = ["mural", "mods"] as const

export const useModeratorsQuery = (params: $ApiMuralCommunityModeratorParams) => {
    return useQuery({
        queryKey: [...COMMUNITY_MODS_QUERY_QUERY, params.id],
        queryFn: async () => {
            const response = await muralApi.listMods(params)
            if (!response.success) throw new Error(response.error)
            return response.data!
        },
    })
}
