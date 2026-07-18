import muralApi from "@/services/api/mural"
import { useQuery } from "@tanstack/react-query"

export const COMMUNITIES_LIST_QUERY_KEY = ["mural", "communities"] as const

export const useCommunitiesQuery = (params?: undefined) => {
    return useQuery({
        queryKey: [...COMMUNITIES_LIST_QUERY_KEY, params],
        queryFn: async () => {
            const response = await muralApi.listCommunities(params)
            if (!response.success) throw new Error(response.error)
            return response.data!
        },
    })
}
