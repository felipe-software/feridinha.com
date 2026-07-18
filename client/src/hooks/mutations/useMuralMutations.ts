import muralApi from "@/services/api/mural"
import { useMutation } from "@tanstack/react-query"
import type { $ApiMuralCreateParams } from "api-types"
import { useTranslations } from "next-intl"
import { toast } from "react-toastify"

export const useCreateMuralPost = () => {
    const t = useTranslations("Errors")
    const muralT = useTranslations("Mural")
    // const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (params: $ApiMuralCreateParams) => muralApi.createPost(params),
        onSuccess: (response) => {
            if (response.success) {
                // queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
                toast.success(response.message ?? muralT("postCreated"))
            } else {
                toast.error(response.error)
            }
        },
        onError: () => {
            toast.error(t("createPost"))
        },
    })
}

export const useVoteMuralPost = () => {
    const t = useTranslations("Errors")
    // const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (ctx: { id: string, vote: "up" | "down" }) => muralApi.votePost(ctx.id, ctx.vote),
        onSuccess: (response) => {
            if (response.success) {
                // queryClient.invalidateQueries({ queryKey: MURAL_LIST_QUERY_KEY })
            } else {
                toast.error(response.error)
            }
        },
        onError: () => {
            toast.error(t("upvote"))
        },
    })
}
