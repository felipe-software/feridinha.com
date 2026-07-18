import { motion } from "motion/react"
import styled from "styled-components"

export const PageContainer = styled.div`
    width: 100%;
    padding: 1rem 2rem;
    background: #181922;
    color: var(--foreground);

    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
    gap: 1rem;

    min-height: calc(100vh - var(--navbar-height));

    & > .content-wrapper {
        max-width: 100rem;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
        gap: 1rem;
    }
`

export const BaseBox = styled(motion.div)``

export const Column = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
    min-width: 70%;
    flex-grow: 4;
    /* max-height: calc(100vh - var(--navbar-height) - 2rem); */
`

export const IdentityCard = styled(BaseBox)`
    position: sticky;
    top: 1rem;
    background-color: #111218;
    border-radius: 1rem;
    padding: 1rem;

    display: flex;
    flex-direction: column;
    padding: 1rem;
    /* justify-content: space-evenly; */
    gap: 1rem;
    flex-grow: 1;
    align-items: stretch;
    width: 100%;
    max-width: 20rem;
    flex-wrap: wrap;

    /* height: 40rem; */

    .title {
        font-size: 1.2rem;
        font-weight: 600;
    }

    .userPhoto {
        max-width: 10rem;
        border-radius: 10rem;
        margin-bottom: 1rem;
    }
    .userName {
    }
    .userRole {
        width: fit-content;
        padding: 0.15rem 0.25rem;
        border-radius: 0.25rem;
        color: white;
        font-weight: 700;
        letter-spacing: 0.03rem;
        font-size: 0.75rem;
        text-shadow: 0px 0px 1px #111218ad;
        background: linear-gradient(
            79.23deg,
            rgb(255, 128, 191) -2.25%,
            rgb(149, 128, 255)
        );
    }
    .userStats {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.25rem 0;

        align-items: center;
        margin-bottom: 1rem;
        span.group {
            opacity: 0.75;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;

            span {
                font-size: 0.75rem;
                letter-spacing: 0.02rem;
                font-weight: 500;
            }
            svg {
                width: 1rem;
            }
        }
    }

    @media (max-width: 1200px) {
        & {
            width: 100%;
            max-width: 30rem;
            /* flex-wrap: nowrap; */
            flex-direction: row;
            position: static;
        }

        > .column {
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;

            .userStats {
                display: flex;
                flex-direction: column;
            }

            .dot {
                display: none;
            }
        }
    }
`

export const AchievementsBox = styled(BaseBox)`
    width: 100%;

    display: flex;
    flex-direction: column;

    gap: 1rem 1rem;
    /* align-items: center; */
    span {
        font-size: 1.2rem;
        font-weight: 500;
        letter-spacing: 0.02rem;
    }
    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        width: 100%;
        justify-content: space-evenly;
        max-width: 30rem;
        /* justify-content: space-between; */
        div {
            width: calc(100% / 7);
        }
    }
`

export const UploadsBox = styled(BaseBox)`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    background-color: #111218;
    border-radius: 1rem;

    overflow: auto;
    text-align: center;
    padding: 1rem;

    .items-container {
        display: flex;
        flex-direction: column;
    }

    .title-wrapper {
        
    }

    .upload-item {
        display: flex;
        justify-content: space-between;
    }

    table {
        width: 100%;
        /* border-collapse: collapse; */
        border-spacing: 0;
        /* border-collapse: separate; */
    }

    table thead tr th:last-child {
        pointer-events: none;
    }

    table tbody tr {
        width: 100%;
        color: #f8f8f8f5;
        margin-bottom: 1rem;

        &:hover td {
            color: #f8f8f8;
            background-color: #1f2029d2;
        }

        & > td:first-child {
            border-top-left-radius: 0.5rem;
            border-bottom-left-radius: 0.5rem;
        }

        & > td:last-child {
            border-top-right-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
        }
    }

    table td {
        padding: 0.25rem;

        a {
            color: var(--dracula-cyan);
        }
    }

    table tbody tr td:first-child {
        font-weight: 500;
    }

    table tbody tr td:not(:first-child) {
        opacity: 0.75;
    }

    .filename-cell {
    }

    table thead tr th {
        background-color: #1f2029d2;
        padding: 0.5rem;
        transition: 0.2s;

        &:first-child {
            border-top-left-radius: 0.5rem;
            border-bottom-left-radius: 0.5rem;
        }

        &:last-child {
            border-top-right-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
        }

        &:hover {
            transition: 0.1s;
            background-color: #2d2f3bd2;
        }
    }

    .pagination-row {
        display: flex;
        gap: 0.5rem;
    }
`

export const PaginationWrapper = styled.div`
    background-color: #2d2f3bd2;
    display: flex;
    justify-content: center;
    width: fit-content;
    align-self: center;
    gap: 0.5rem;
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem;

    ul {
        align-self: center;
        list-style: none;

        gap: 1rem;

        width: fit-content;

        *,
        & {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        a {
            cursor: pointer;
        }

        *.disabled {
            opacity: 0.5;
            pointer-events: none;
        }
    }
    /* margin-top: 1rem; */
`

export const MansoryContainer = styled.div`
    position: relative;
    display: flex;
    justify-content: stretch;
    align-items: stretch;
    /* height: 100%; */
    height: fit-content;
    overflow-y: auto;
    overflow-x: clip;
    padding: 0.25rem;
    /* background-color: yellow; */

    /* padding-right: 1rem; */

    > div {
        width: 100%;
        height: 100%;
    }


    [aria-selected="true"] {
        outline: 2px solid var(--purple-gradient);
    }

    /* .file-preview > * {
        width: 100%;

        -webkit-user-drag: none;
    } */

    .selectable {
        user-select: none;
        -webkit-user-drag: none;
    }
`
