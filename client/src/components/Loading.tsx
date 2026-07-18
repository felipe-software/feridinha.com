import { AnimatePresence, motion } from "motion/react"
import { LuLoaderCircle } from "react-icons/lu"
import styled from "styled-components"

const Container = styled(motion.div)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    background-color: rgba(0, 0, 0, 0.171);
    backdrop-filter: blur(5px);
    z-index: 5;
    border-radius: inherit;
    pointer-events: all;

    p {
        text-align: center;
        color: #f8f8f8;
        text-shadow: none;
    }

    div,
    & {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 0.5rem;

        z-index: 6;
    }
`

const Loading = ({
    isLoading,
    message,
    size
}: {
    isLoading: boolean
    message?: string
    size?: number
}) => {
    return (
        <AnimatePresence>
            {isLoading && (
                <Container
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="loading"
                    onClick={(e) => e.stopPropagation()}
                    onMouseMove={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{
                            ease: "linear",
                            duration: 1,
                            repeat: Infinity,
                            repeatType: "loop",
                        }}
                        className="loader"
                    >
                        <LuLoaderCircle size={size ?? 52} color="#f8f8f8c8" />
                    </motion.div>
                    <p>{message}</p>
                </Container>
            )}
        </AnimatePresence>
    )
}

export default Loading
