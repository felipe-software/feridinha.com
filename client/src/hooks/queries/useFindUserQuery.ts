import muralApi from "@/services/api/mural"
import type { $ApiMuralCommunityFindUserParams } from "api-types"
import { useQuery } from "@tanstack/react-query"

export const FIND_USER_QUERY_KEY = ["mural", "community", "user"] as const

export const useFindUserQuery = (params: $ApiMuralCommunityFindUserParams) => {
    return useQuery({
        queryKey: [...FIND_USER_QUERY_KEY, params],
        queryFn: async () => {
            const response = await muralApi.findUser(params)
            if (!response.success) throw new Error(response.error)
            return response.data!
        },
        enabled: params.q.length >= 3 && !!params.communityId,
    })
}
