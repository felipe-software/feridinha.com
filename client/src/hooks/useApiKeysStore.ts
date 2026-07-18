import { create } from "zustand"

export interface ApiKey {
    id: string
    secret: string
    name: string
    tag?: string

    lastUsedAt?: Date
    createdAt: Date
}

interface State {
    apiKeys: ApiKey[]
    update: (data: Partial<ApiKey>) => void
    add: (apiKey: ApiKey) => void
    set: (apiKey: ApiKey[]) => void
    removeById: (id: string) => void
    clear: () => void
}

const useApiKeysStore = create<State>((set) => ({
    apiKeys: [],
    add: (apiKey: ApiKey) =>
        set((state) => ({ ...state, apiKeys: [...state.apiKeys, apiKey] })),
    set: (apiKeys: ApiKey[]) => set((state) => ({ ...state, apiKeys })),
    removeById: (id: string) =>
        set((state) => ({
            ...state,
            apiKeys: state.apiKeys.filter((k) => k.id !== id),
        })),
    update: (data) => set((state) => ({ ...state, ...data })),
    clear: () => set({ apiKeys: [] }),
}))

export default useApiKeysStore
