import { motion } from "motion/react"
import styled from "styled-components"

export const Backdrop = styled(motion.div)`
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: 1rem;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px) grayscale(0.75) brightness(0.75);
`

export const Dialog = styled(motion.div)`
    width: min(100%, 38rem);
    border-radius: 1rem;
    background: var(--base-dark);
    color: var(--foreground);
    overflow: hidden;

    .content {
        padding: clamp(1.1rem, 4vw, 1.75rem);
    }

    .eyebrow {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        color: #bd93f9;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    h2 {
        margin: 0.65rem 0 0.45rem;
        font-size: clamp(1.35rem, 4vw, 1.8rem);
        line-height: 1.15;
    }

    .description {
        margin: 0;
        color: var(--dracula-gray);
        font-size: 0.9rem;
        line-height: 1.55;
    }

    .accounts {
        display: grid;
        gap: 0.55rem;
        margin: 1.35rem 0;
    }

    .merge-operator {
        display: grid;
        place-items: center;
        height: 1rem;
        color: var(--dracula-gray);
        font-size: 1rem;
        font-weight: 800;
        line-height: 1;
    }

    .merge-operator.result {
        color: var(--foreground);
        font-size: 1.15rem;
    }

    .warning {
        display: flex;
        gap: 0.7rem;
        padding: 0.8rem;
        border-radius: 0.65rem;
        background: rgba(255, 184, 108, 0.07);
        color: #f1dfc9;
        font-size: 0.78rem;
        line-height: 1.45;
    }

    .warning svg {
        flex: 0 0 auto;
        margin-top: 0.12rem;
        color: #ffb86c;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.65rem;
        padding: 1rem clamp(1.1rem, 4vw, 1.75rem);
        background: rgba(0, 0, 0, 0.12);
    }

    @media (max-width: 34rem) {
        .actions {
            flex-direction: column-reverse;
        }

        .actions button {
            justify-content: center;
            width: 100%;
        }
    }
`

export const AccountCard = styled.div<{ $accent: string; $kept: boolean }>`
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
    padding: 0.9rem;
    border-radius: 0.75rem;
    background: var(--base);

    .account-copy {
        min-width: 0;
    }

    .account-label {
        display: block;
        margin-bottom: 0.15rem;
        color: ${({ $accent, $kept }) => ($kept ? "var(--foreground)" : $accent)};
        font-size: 0.64rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    strong {
        display: flex;
        min-width: 0;
        align-items: baseline;
        gap: 0.35rem;
        overflow: hidden;
        font-size: 1rem;
    }

    .provider-name {
        flex: 0 1 auto;
        overflow: hidden;
        color: ${({ $accent }) => $accent};
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .account-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .separator {
        flex: 0 0 auto;
        color: var(--dracula-gray);
        font-weight: 400;
    }

    .kept-icon {
        color: ${({ $accent }) => $accent};
    }
`

export const ProviderIcon = styled.span<{ $color: string }>`
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--base-dark);
    color: ${({ $color }) => $color};
`
