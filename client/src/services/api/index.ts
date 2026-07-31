import { ApiKey } from "@/hooks/useApiKeysStore"
import useTokenStore from "@/hooks/useToken"
import {
    LinkedAuthProvider,
    OAuthProviderName,
    Upload,
    UserData,
} from "@/hooks/useUserDataStore"
import { axiosClient } from "@/services/api/axiosClient"
import { handleAuthSessionError } from "@/services/api/authSession"
import { AxiosError, AxiosProgressEvent, AxiosResponse } from "axios"

export type ApiResponse<T = undefined> =
    | {
          success: false
          error: string
          code?: string
      }
    | {
          success: true
          data?: T
          message?: string
          code?: string
      }

export type OAuthLinkCompletion =
    | {
          kind: "linked"
          provider: OAuthProviderName
          linkedAt: string
      }
    | {
          kind: "merge_required"
          provider: OAuthProviderName
          ticket: string
          accountToKeep: OAuthMergeAccountPreview
          accountToMerge: OAuthMergeAccountPreview
      }

export interface OAuthMergeAccountPreview {
    name: string
    providers: OAuthProviderName[]
}

export type UploadResponse =
    | { success: false; error: string; code?: string }
    | {
          success: true
          message: string
          delete: string
          filename: string
          code: "new_upload_created"
          mimeType: string
          optimized?: boolean
          time?: number
          size?: number
          sourcePlatform?: "reddit" | "instagram" | "tiktok" | "twitter"
      }

const uploadFile = async (file: File, onProgress: (progress: AxiosProgressEvent) => void): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)

    const rawResponse = await axiosClient.post("/upload", formData, {
        onUploadProgress: onProgress,
    })

    return rawResponse.data
}

const uploadSocialLink = async (link: string): Promise<UploadResponse> => {
    const rawResponse = await axiosClient.post("/upload/link", { link })

    return rawResponse.data
}

const fetchUserData = async (): Promise<ApiResponse<UserData>> => {
    const response = await axiosClient.get("/login/validate")

    return response.data
}

const startOAuthLink = async (
    provider: OAuthProviderName,
): Promise<ApiResponse<{ redirectUrl: string }>> => {
    const response = await axiosClient.post(`/login/${provider}/link`)
    return response.data
}

const completeOAuthLink = async (
    ticket: string,
): Promise<ApiResponse<OAuthLinkCompletion>> => {
    const response = await axiosClient.post("/login/accounts/link/complete", {
        ticket,
    })
    return response.data
}

const completeOAuthMerge = async (
    ticket: string,
): Promise<ApiResponse<LinkedAuthProvider>> => {
    const response = await axiosClient.post("/login/accounts/merge/complete", {
        ticket,
    })
    return response.data
}

const unlinkOAuthAccount = async (
    provider: OAuthProviderName,
): Promise<ApiResponse<{ provider: OAuthProviderName }>> => {
    const response = await axiosClient.delete(`/login/accounts/${provider}`)
    return response.data
}

const fetchApiKeys = async (): Promise<ApiResponse<ApiKey[]>> => {
    const response = await axiosClient.get("/api-key/list")

    return response.data
}

const createApiKey = async (name: string, tag?: string): Promise<ApiResponse<ApiKey>> => {
    const response = await axiosClient.post("/api-key/create", { name, tag })

    return response.data
}

const deleteApiKey = async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete(`/api-key/${id}`)

    return response.data
}

const deleteUpload = async (id: string): Promise<ApiResponse<Upload>> => {
    const response = await axiosClient.delete(`/upload/${id}`)

    return response.data
}

const createReview = async (review: string, suggestion?: string): Promise<ApiResponse> => {
    const response = await axiosClient.post(`/feedback/review/create`, {
        review,
        suggestion,
    })

    return response.data
}

export interface Album {
    id: string
    createdAt: Date

    uploads: Upload[]
    user: {
        name: string
        color: string
    }
    viewCount: number
}

const createAlbum = async (files: string[]): Promise<ApiResponse<Album>> => {
    const response = await axiosClient.post(`/album/create`, {
        files,
    })

    return response.data
}

const updateMyAlbum = async (id: Album["id"], itemsToPush: string[]): Promise<ApiResponse<Album>> => {
    const response = await axiosClient.post(`/album/update-my/${id}`, {
        itemsToPush: itemsToPush,
    })

    return response.data
}

const fetchAlbum = async (albumId: string): Promise<ApiResponse<Album>> => {
    const response = await axiosClient.get(`/album/${albumId}`)

    return response.data
}

const fetchMyAlbums = async (): Promise<ApiResponse<Album[]>> => {
    const response = await axiosClient.get(`/album/list-my`)

    return response.data
}

export interface Review {
    id: string
    content: string
    user: {
        name: string
        uploadCount: number
        createdAt: Date
        color: string
        profileImage: string
    }
}

export interface MyReview extends Review {
    approvedAt: Date | null
    notApprovedReason: string | null
    hasBeenApproved: boolean
}

const fetchReviews = async (): Promise<ApiResponse<{ public: Review[]; yours: MyReview }>> => {
    const response = await axiosClient.get("/feedback/home-reviews")
    return response.data
}

axiosClient.interceptors.request.use((request) => {
    const token = useTokenStore.getState().token
    if (!token) return request
    request.headers["Authorization"] = `${token}`
    return request
})

axiosClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<unknown>>) => {
        if (!response.data.success) {
            handleAuthSessionError(response.data.code, response.data.error)
        }

        return response
    },
    (error: AxiosError<ApiResponse<unknown>>) => {
        const responseData = error.response?.data

        if (responseData && !responseData.success) {
            handleAuthSessionError(responseData.code, responseData.error)
        }

        return Promise.reject(error)
    },
)

const apiService = {
    uploadFile,
    uploadSocialLink,
    fetchUserData,
    startOAuthLink,
    completeOAuthLink,
    completeOAuthMerge,
    unlinkOAuthAccount,
    fetchApiKeys,
    createApiKey,
    deleteApiKey,
    deleteUpload,
    createReview,
    createAlbum,
    fetchAlbum,
    fetchReviews,
    fetchMyAlbums,
    updateMyAlbum,
}
export default apiService
