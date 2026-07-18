import { motion } from "motion/react"
import styled from "styled-components"

export const Container = styled.div`
    width: 100%;
    /* min-height: 100vh; */
    height: calc(100%);

    display: flex;
    flex-direction: column;
    justify-content: flex;
    align-items: center;
    background-color: var(--base);

    overflow-y: auto;
    & > .title {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        margin: 5rem 0;
        margin-bottom: 2rem;
        text-align: center;
        width: 100%;

        h2 {
            display: inline-block;
            color: var(--foreground);
            font-size: 2.5rem;
            width: 100%;
            font-weight: 600;

            span {
                display: inline-block;
                width: fit-content;
                color: #ff79c6;
                text-shadow: #ff79c55b 0px 0px 10px, #ff79c53a 0px 0px 50px;
                font-weight: 700;
                cursor: pointer;
            }
        }
        span.material-icon {
            color: #ff79c6;
            font-size: 4rem;
            text-shadow: #ff79c67f 0px 0px 10px, #ff79c552 0px 0px 50px;
            font-variation-settings: "FILL" 0, "wght" 500, "GRAD" 0, "opsz" 20;
        }
    }

    .special-box {
        position: relative;
        padding: 4px;
        border-radius: 0.5rem;

        &::before {
            position: absolute;
            inset: 0;
            content: "";

            width: 100%;
            height: 100%;
            z-index: 1;
            border-radius: inherit;

            background: linear-gradient(
                318deg,
                #6624caff,
                var(--pink-gradient)
            );
            /* background-size: 100% 100%; */
        }

        > div {
            position: relative;
            z-index: 3;
        }
    }

    .bottom-notice {
        font-size: 1rem;
        color: var(--foreground);

        display: flex;
        align-items: center;
        gap: 1rem;

        user-select: none;
        padding: 0.5rem;
        justify-content: center;

        background-color: var(--base-dark);
        border-radius: 0.5rem;
    }

    .icons-wrapper {
        display: flex;
        gap: 0.5rem;
        /* min-width: 5rem; */
        /* max-width: 10rem; */
        overflow: visible;
        /* background-color: red; */
        flex-direction: row;
        width: 40px;

        img:not(:only-child) {
            width: 2rem;
            height: 2rem;
            aspect-ratio: 1/1;
        }
    }
`

export const List = styled(motion.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0rem;
    gap: 1rem;
    width: calc(100% - 2rem);
    max-width: 600px;
    height: 100%;

    .expandable-card .header {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        font-size: 1.5rem;
        font-weight: 600;
        align-self: stretch;
        gap: 0.5rem;
        align-items: center;

        color: var(--foreground);
        cursor: pointer;
        border-radius: var(--border-radius-s);
        user-select: none;
        svg {
            transition: 0.5s ease;
        }

        .title {
            margin: auto;
            width: fit-content;
            /* text-align: center; */
            /* background-color: red; */
        }

        > span.material-icon {
            min-width: 40px;
            text-align: right;
        }
    }

    .expandable-card {
        padding: 1.5rem 1.5rem;
    }
    /* background-color: red; */
`

export const ItemBase = styled(motion.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: var(--border-radius-m);
    width: 100%;
    font-size: 1.5rem;
    max-width: 50rem;
    min-width: fit-content;
    background-color: var(--base-dark);
    color: var(--foreground);
    height: fit-content;
    cursor: pointer;
    padding: 1rem;

    button.header {
        display: flex;

        justify-content: space-between;
        align-items: center;

        width: 100%;
        padding: 0.5rem;
        border: none;
        background: none;
        font-size: 1.5rem;
        color: var(--foreground);
        cursor: pointer;
        border-radius: var(--border-radius-s);
        height: 4rem;
        svg {
            transition: 0.5s ease;
        }
    }

    button.header .icon {
        max-height: 100%;
        height: 100%;
        aspect-ratio: 1/1;
        /* filter:  grayscale(1); */
    }

    span.material-icon {
        font-size: 2.5rem;
    }
`
