import { ReactNode } from "react"
import { create } from "zustand"

interface ModalState {
    page: {
        jsx: ReactNode
    } | null
    setPage: (page: ModalState["page"]) => void
}

export const useModalStore = create<ModalState>((set) => ({
    page: null,
    setPage: (page) => set(() => ({ page })),
}))
