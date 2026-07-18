import styled from "styled-components"
import Tilt from "@/components/Tilt"
import { motion } from "motion/react"

export const Container = styled(motion.div)`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 100%;
    max-width: 70rem;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    height: 100%;
    min-height: fit-content;

    @media (max-width: 559px) {
        padding: 3rem 0;
        gap: 3rem;
    }
`

export const Card = styled(Tilt)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    overflow: hidden;
    height: 20rem;
    width: 15rem;
    border-radius: 1rem;
    background-color: #16161e;
    padding: 1rem;
    gap: 1rem;
    color: ${(props) => props.foreground || "#f8f8f8"};
    transform-style: preserve-3d;
    overflow: visible;
    transition: 5000ms cubic-bezier(0.03, 0.98, 0.52, 0.99);
    /* transition: scale .2s ease-in-out; */

    &:hover {
        /* transition: scale .2s ease-in-out; */
        /* scale: 1.1; */
    }

    .card-icon {
        transform: translateZ(40px);
    }

    .card-icon {
        font-family: "Material Symbols Rounded";
        font-size: 4rem;
        font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 48;
        transition: opacity 0.3s ease;
        color: ${(props) => props.color || "#f8f8f8"};
        text-shadow: ${(props) => props.glow || props.color} 0px 0px 10px,
            ${(props) => props.glow || props.color} 0px 0px 50px;
    }
    .text-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;

        transform: translateZ(30px);
    }
    h2 {
        font-weight: 550;
        text-align: center;
        margin: 0;
    }

    h4 {
        font-weight: 450;
        color: #f8f8f8e1;
        margin: 0;
        text-align: left;
        text-justify: inter-word;
        word-break: normal;
        hyphens: manual;

        span {
            position: relative;
            color: ${(props) => props.color || "#f8f8f8"};
            display: inline-block;
            transition: 0.4s ease;
        }

        span::before {
            content: "";
            position: absolute;
            z-index: -1;
            height: 100%;
            width: 0%;
            background-color: rgba(0, 0, 0, 0);
            padding: 0.1rem 0.2rem;
            border-radius: 0.25rem;
            top: -0.1rem;
            left: -0.2rem;
            transition: 0.4s ease;
        }
    }

    &:hover > .text-wrapper h4 span::before {
        background-color: ${(props) => props.color || "#f8f8f8"};
        width: 100%;
    }

    &:hover > .text-wrapper h4 span {
        &:nth-child(2),
        &:nth-child(2)::before {
            transition-delay: 0.1s;
        }
        &:nth-child(3),
        &:nth-child(3)::before {
            transition-delay: 0.2s;
        }
    }

    &:hover > .text-wrapper span {
        color: var(--base-dark);
    }

    @media (max-width: 559px) {
        transform: none !important;
        flex-direction: row;
        height: 12rem;
        min-height: fit-content;
        padding: 1.5rem;
        gap: 1.5rem;
        width: 100%;
        .text-wrapper {
            gap: 0.5rem;
        }
        h2 {
            text-align: left;
        }
    }
`
