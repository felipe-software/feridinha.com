import styled from "styled-components"
import "react-responsive-carousel/lib/styles/carousel.min.css" // requires a loader
import { Carousel } from "react-responsive-carousel"
import { motion } from "motion/react"

export const Container = styled(motion.div)`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    min-height: fit-content;
    width: 100%;
    gap: 2rem;
    padding: 4rem 0;
    h2 {
        display: flex;
        gap: 0.4ch;
        justify-content: center;
        align-items: center;
        margin: 0;
        color: var(--foreground);
        font-size: 3rem;
        user-select: none;
        span {
            font-family: "Material Symbols Rounded";
            font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 48;
            transform: translateY(0.075ch);
            color: #50fa7b;
        }
    }
    @media (max-width: 600px) {
        /* gap: 3rem; */
        /* padding: 5rem 1rem; */
        .box {
            justify-content: center;
            flex-wrap: wrap;
            min-height: fit-content;
            height: 30rem;
            gap: 0rem;
            width: 100%;
            overflow-x: scroll;
            padding: 1rem;
        }
    }

    .review-button {
        position: absolute;
        top: -1rem;
        right: 1rem;
        /* background-color: #50fa7b; */
        border: none;
        /* padding: .75rem 1rem; */
        /* border-radius: .5rem; */

        span {
            font-size: 1.25rem;
            font-variation-settings: "FILL" 0, "wght" 500, "GRAD" 0, "opsz" 20;
        }

        /* &:hover {
            background-color: #32ac50;
            transform: scale(1.05);
        }

        &:active {
            transform: scale(0.9);
        } */
    }
`

export const CarouselBase = styled(Carousel)`
    display: flex;
    max-width: 45rem;
    width: 100%;
    height: fit-content;
    justify-content: center;
    border-radius: 1.5rem;
    overflow: hidden;
  
    .control-dots {
        .dot {
            background-color: rgb(63, 66, 83);
        }

        .dot.selected {
            background-color: var(--foreground);
        }
    }
`

export const Box = styled.div`
    display: flex;
    border-radius: 1.5rem;
    overflow: hidden;
    align-items: center;
    background-color: var(--base-dark);
    width: 100%;
    min-height: fit-content;
    min-height: 18rem;
    gap: 2rem;
    padding: 2rem;

    * {
        margin: 0;
        color: var(--foreground);
    }

    img.profile-picture {
        width: 10rem !important;
        height: 10rem !important;
        border-radius: 1rem;
    }

    .about {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-width: 30ch;
        z-index: 1;
        overflow: visible;
        position: relative;

        h4 {
            width: 100%;
            font-weight: 400;
            font-size: 1.5rem;
            /* max-height: 9rem; */
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 8;
            line-clamp: 8;
            -webkit-box-orient: vertical;
            ::before {
                content: '"';
                position: absolute;
                z-index: -1;
                top: -50px;
                left: -1.25rem;
                font-size: 6rem;
                color: rgb(35, 37, 47);
                font-weight: 500;
            }
        }

        .author {
            font-size: 1.25rem;
            font-weight: 500;
            margin-top: 1.25rem;
            margin-bottom: .25rem;
            display: inline-block;
            font-weight: 600;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }

        .profession {
            color: rgb(63, 66, 83);
            font-weight: 600;
        }

        @media (max-width: 387px) {
            h4 {
                font-size: 1.2rem;
            }
        }
    }
`
