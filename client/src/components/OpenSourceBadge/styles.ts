import { motion } from "motion/react"
import styled from "styled-components"

export const Container = styled.a`
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    overflow: hidden;
    gap: 0.25rem;
    padding: 0.25rem 0.35rem;
    border-radius: var(--border-radius-ss);
    background-color: var(--foreground);
    color: var(--base-dark) !important;
    cursor: pointer;
    transition: transform 0.2s var(--hover-transition);

    &:hover,
    &:focus-visible {
        transform: scale(1.05);
    }

    &:focus-visible {
        outline: 0.125rem solid var(--nav-highlight);
        outline-offset: 0.125rem;
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }

    @media (max-width: 68.75rem) {
        display: none;
    }
`

export const Content = styled.span`
    display: flex;
    align-items: center;
    gap: 0.25rem;
`

export const Spotlight = styled(motion.span)`
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    background-color: var(--base-dark);
    color: var(--foreground);
    pointer-events: none;
`
