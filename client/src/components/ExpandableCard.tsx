import { AnimatePresence, motion } from "motion/react"
import { ReactNode, useState } from "react"
import useMeasure from "react-use-measure"
import styled from "styled-components"

const Container = styled.div`
    display: flex;
    flex-direction: column;
    background-color: var(--base-dark);
    padding: 1.5rem 1rem;
    border-radius: 1rem;
    cursor: pointer;
    pointer-events: all;
    align-items: center;
    width: 100%;

    p {
        text-align: start;
        width: 100%;
        max-width: 50rem;
        margin: auto;

        &:not(.title):first-letter {
            margin-left: 1.5rem;
        }

        a {
            color: var(--dracula-cyan);
        }
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        padding-bottom: 0;
    }
`

export const ExpandableCard = ({
    title,
    content,
    icon,
    iconInjected,
    iconSize,
    injectedOpen,
    injectedOnClick,
}: {
    title: string
    content: JSX.Element
    icon?: string
    iconInjected?: ReactNode
    iconSize?: number
    injectedOpen?: boolean
    injectedOnClick?: () => void
}) => {
    const [isOpen_, setIsOpen] = useState(false)
    const [ref, size] = useMeasure()

    const isOpen = injectedOpen ?? isOpen_

    return (
        <Container
            className="expandable-card"
            onClick={() => {
                injectedOnClick?.()
                setIsOpen((e) => !e)
            }}
        >
            <div className="header">
                {iconInjected && iconInjected}
                {icon && (
                    <span
                        style={iconSize === undefined ? undefined : { transform: `scale(${iconSize})` }}
                        className="notranslate material-icon"
                    >
                        {icon}
                    </span>
                )}
                <p className="title">{title}</p>
                <motion.span
                    animate={{ scaleY: isOpen ? -1 : 1 }}
                    className="notranslate material-icon"
                    transition={{ duration: 0.15, ease: "easeIn" }}
                >
                    arrow_drop_down
                </motion.span>
            </div>
            <motion.div
                className="content-wrapper"
                animate={{
                    height: isOpen ? size.height : 0,
                    overflow: "visible",
                }}
                // transition={{ duration: 0.25, }}
            >
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            className="content"
                            ref={ref}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            // transition={{ duration: 0.25, }}
                        >
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </Container>
    )
}
