import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface TokenState {
    token: string | null
    setToken: (token: string | null) => void
    _hasHydrated: boolean
    setHasHydrated: (state: boolean) => void
}

const useTokenStore = create<TokenState>()(
    persist(
        (set) => ({
            token: null,
            setToken: (token) => set(() => ({ token })),
            _hasHydrated: false,
            setHasHydrated: (state) => set(() => ({ _hasHydrated: state })),
        }),
        {
            name: "token-storage", // storage key
            storage: createJSONStorage(() => localStorage),
            // skipHydration: true,
            onRehydrateStorage: () => (state) => {
                state?._hasHydrated
                state?.setHasHydrated(true) 
            },
        },
    ),
)

export default useTokenStore
