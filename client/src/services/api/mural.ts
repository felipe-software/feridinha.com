import type {
    $ApiMuralCreateParams,
    $ApiMuralListParams,
    $ApiMuralListResponse,
    $ApiMuralListItem,
    $ApiMuralApproveBody,
    $ApiMuralApproveParams,
    $ApiMuralCommunityModeratorPreview,
    $ApiMuralCommunityModeratorAddParams,
    $ApiMuralCommunityModeratorRouteParams,
    $ApiMuralCommunityFindUserParams,
} from "api-types"
import type { $ApiMuralCommunityListItem } from "api-types"

import { ApiResponse, axiosClient } from "@/services/api/axiosClient"

const createPost = async (params: $ApiMuralCreateParams): Promise<ApiResponse<$ApiMuralListItem>> => {
    const response = await axiosClient.post("/mural/create", params)

    return response.data
}

const votePost = async (id: string, vote: "up" | "down"): Promise<ApiResponse<$ApiMuralListItem>> => {
    const response = await axiosClient.post(`/mural/${id}/vote/${vote}`)

    return response.data
}

const listPosts = async (params?: $ApiMuralListParams): Promise<ApiResponse<$ApiMuralListResponse>> => {
    const response = await axiosClient.get("/mural/list", { params })

    return response.data
}

const listCommunities = async (params?: $ApiMuralListParams): Promise<ApiResponse<$ApiMuralCommunityListItem[]>> => {
    const response = await axiosClient.get("/mural/community/list", { params })

    return response.data
}

const moderatePost = async (
    params: $ApiMuralApproveBody & $ApiMuralApproveParams,
): Promise<ApiResponse<$ApiMuralListItem>> => {
    const response = await axiosClient.post(`/mural/${params.id}/moderate`, {
        approved: params.approved,
        reason: params.reason,
    })

    return response.data
}

const listMods = async (
    params: $ApiMuralCommunityModeratorRouteParams,
): Promise<ApiResponse<$ApiMuralCommunityModeratorPreview[]>> => {
    const response = await axiosClient.get(`/mural/community/${params.id}/moderator`)

    return response.data
}

const findUser = async (
    params: $ApiMuralCommunityFindUserParams,
): Promise<ApiResponse<$ApiMuralCommunityModeratorPreview[]>> => {
    const response = await axiosClient.get("/mural/community/user", { params: params })

    return response.data
}

const addMod = async (
    params: $ApiMuralCommunityModeratorAddParams,
): Promise<ApiResponse<null>> => {
    const response = await axiosClient.post(
        `/mural/community/${params.communityId}/moderator/add`,
        { id: params.id },
    )

    return response.data
}

const removeMod = async (
    params: $ApiMuralCommunityModeratorAddParams,
): Promise<ApiResponse<null>> => {
    const response = await axiosClient.post(
        `/mural/community/${params.communityId}/moderator/remove`,
        { id: params.id },
    )

    return response.data
}

const muralApi = {
    createPost,
    votePost,
    listPosts,
    listCommunities,
    moderatePost,
    listMods,
    findUser,
    addMod,
    removeMod,
}

export default muralApi
export type { $ApiMuralListItem, $ApiMuralListResponse }
