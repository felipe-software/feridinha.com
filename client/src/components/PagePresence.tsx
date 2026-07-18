import { motion, usePresence } from "motion/react"
import React, { ReactElement } from "react"

type PageAnimatorProps = {
    children: ReactElement
    onExited?: () => void // callback to signal that exit animation is done
}

export const PagePresence: React.FC<PageAnimatorProps> = ({
    children,
    onExited,
}) => {
    const [isPresent, safeToRemove] = usePresence()

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: isPresent ? 1 : 0, y: isPresent ? 0 : -40 }}
            exit={{ opacity: 0, y: -40 }}

            onAnimationComplete={() => {
                if (!isPresent) {
                    onExited?.()
                    safeToRemove?.()
                }
            }}
        >
            {children}
        </motion.div>
    )
}