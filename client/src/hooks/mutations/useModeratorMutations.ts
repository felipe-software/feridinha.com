import muralApi from "@/services/api/mural"
import type { $ApiMuralCommunityModeratorAddParams } from "api-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "react-toastify"
import { COMMUNITY_MODS_QUERY_QUERY } from "@/hooks/queries/useCommunityModsQuery"
import { MODERATOR_LIST_QUERY_KEY } from "@/hooks/queries/useModeratorListQuery"

const invalidateMods = (queryClient: ReturnType<typeof useQueryClient>, communityId: string) => {
    queryClient.invalidateQueries({ queryKey: [...MODERATOR_LIST_QUERY_KEY, { id: communityId }] })
    queryClient.invalidateQueries({ queryKey: COMMUNITY_MODS_QUERY_QUERY })
}

export const useAddModeratorMutation = () => {
    const t = useTranslations("Errors")
    const muralT = useTranslations("Mural")
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (params: $ApiMuralCommunityModeratorAddParams) =>
            muralApi.addMod(params),
        onSuccess: (response, variables) => {
            if (response.success) {
                invalidateMods(queryClient, variables.communityId)
                toast.success(response.message ?? muralT("moderatorAdded"))
            } else {
                toast.error(response.error)
            }
        },
        onError: () => {
            toast.error(t("addModerator"))
        },
    })
}

export const useRemoveModeratorMutation = () => {
    const t = useTranslations("Errors")
    const muralT = useTranslations("Mural")
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (params: $ApiMuralCommunityModeratorAddParams) =>
            muralApi.removeMod(params),
        onSuccess: (response, variables) => {
            if (response.success) {
                invalidateMods(queryClient, variables.communityId)
                toast.success(response.message ?? muralT("moderatorRemoved"))
            } else {
                toast.error(response.error)
            }
        },
        onError: () => {
            toast.error(t("removeModerator"))
        },
    })
}
