import muralApi from "@/services/api/mural"
import type { $ApiMuralCreateParams } from "api-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "react-toastify"
import { POST_LIST_QUERY_KEY } from "@/hooks/queries/usePostListQuery"

export const useCreatePostMutation = () => {
    const t = useTranslations("Errors")
    const muralT = useTranslations("Mural")
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (params: $ApiMuralCreateParams) => muralApi.createPost(params),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
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
