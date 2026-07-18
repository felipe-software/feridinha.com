import { POST_LIST_QUERY_KEY } from "@/hooks/queries/usePostListQuery"
import muralApi from "@/services/api/mural"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { $ApiMuralApproveBody, $ApiMuralApproveParams } from "api-types"
import { useTranslations } from "next-intl"
import { toast } from "react-toastify"

export const usePostModerationMutation = () => {
    const queryClient = useQueryClient()
    const t = useTranslations("Errors")

    return useMutation({
        mutationFn: (params: $ApiMuralApproveBody & $ApiMuralApproveParams) => muralApi.moderatePost(params),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: POST_LIST_QUERY_KEY })
                toast.success(response.message)
            } else {
                toast.error(response.error)
            }
        },
        onError: () => {
            toast.error(t("createPost"))
        },
    })
}
