"use client"

import { useModalStore } from "@/hooks/useModalStore"
import { AnimatePresence, motion } from "motion/react"
import { createPortal } from "react-dom"
import styled from "styled-components"

const Backdrop = styled(motion.div)`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 10;
    display: flex;
    justify-content: center safe;
    backdrop-filter: blur(10px) grayscale(.75) brightness(.75);

    > div {
        z-index: 11;
        margin: auto;
    }
`

export const Modal = () => {
    const modalStore = useModalStore()

    if (typeof document === "undefined") return null

    return createPortal(
        <AnimatePresence>
            {modalStore.page && (
                <Backdrop
                    onClick={() => modalStore.setPage(null)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {modalStore.page.jsx}
                </Backdrop>
            )}
        </AnimatePresence>,
        document.body
    )
}
