import muralApi from "@/services/api/mural"
import type { $ApiMuralListParams } from "api-types"
import { useInfiniteQuery } from "@tanstack/react-query"

export const POST_LIST_INFINITE_QUERY_KEY = ["mural", "list", "infinite"] as const

export const usePostListInfiniteQuery = (
    baseParams: Omit<$ApiMuralListParams, "after">
) => {
    return useInfiniteQuery({
        queryKey: [...POST_LIST_INFINITE_QUERY_KEY, baseParams],
        queryFn: async ({ pageParam }) => {
            const response = await muralApi.listPosts({
                ...baseParams,
                after: pageParam ?? undefined,
            })
            if (!response.success) throw new Error(response.error)
            return response.data!
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })
}
