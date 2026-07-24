import { create } from "zustand"

export interface Upload {
    name: string
    size: number
    mimeType: string
    userId: string
    deletedAt?: string
    albumId: null
    accessDates: string[]
    createdAt: string
    deleteCode: string
}

export interface ApiAchievement {
    id: string
    name: string
    description: string
    hiddenDescription: string
    secretUrl: string
    publicUrl: string
}

export interface ApiAlbums {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
}

export type OAuthProviderName = "twitch" | "google" | "discord"

export interface LinkedAuthProvider {
    provider: OAuthProviderName
    linkedAt: string
}

export interface UserData {
    id: string
    name: string
    role: string
    profileImage: string
    color: string
    createdAt: string
    updatedAt: string
    uploads: Upload[]
    achievements: ApiAchievement[]
    albums: ApiAlbums
    uploadCount: number
    readableLimit: number
    moderatedCommunities: { id: string; name: string }[]
    authProviders: LinkedAuthProvider[]
}

interface UserDataState {
    userData: UserData | null
    setUserData: (userData: UserData | null) => void
    updateUpload: (upload: Upload) => void
}

const useUserDataStore = create<UserDataState>()((set) => ({
    userData: null,
    setUserData: (userData) => set(() => ({ userData })),
    updateUpload: (upload) =>
        set((state) => ({
            userData: state.userData
                ? {
                      ...state.userData,
                      uploads: state.userData.uploads.map((u) => (u.name === upload.name ? upload : u)),
                  }
                : null,
        })),
}))

export default useUserDataStore
