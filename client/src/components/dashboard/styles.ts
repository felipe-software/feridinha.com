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

    .profile-photo {
        position: relative;
        width: fit-content;
        margin-bottom: 1rem;
    }

    .userPhoto {
        display: block;
        width: 10rem;
        height: 10rem;
        object-fit: cover;
        border-radius: 10rem;
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

export const ProfilePicker = styled.div`
    position: absolute;
    right: 0.15rem;
    bottom: 0.15rem;
    z-index: 5;

    .profile-trigger {
        display: grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border: 3px solid var(--base-dark);
        border-radius: 50%;
        background: var(--purple-gradient);
        color: var(--foreground);
        box-shadow: 0 0.45rem 1.2rem rgba(0, 0, 0, 0.45);
        cursor: pointer;
        transition: transform 0.15s ease, filter 0.15s ease;
    }

    .profile-trigger:hover,
    .profile-trigger[aria-expanded="true"] {
        transform: scale(1.08);
        filter: brightness(1.15);
    }
`

export const ProfileMenu = styled.div`
    width: min(18rem, calc(100vw - 3rem));
    padding: 0.25rem;
    color: var(--foreground);
    text-align: left;

    > strong {
        display: block;
        font-size: 0.9rem;
    }

    > p {
        margin: 0.2rem 0 0.75rem;
        color: var(--dracula-gray);
        font-size: 0.85rem;
        line-height: 1.45;
    }

    .profile-options {
        display: grid;
        gap: 0.4rem;
    }

    .profile-options button {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.65rem;
        width: 100%;
        padding: 0.6rem;
        border: 0;
        border-radius: 0.55rem;
        background: var(--base);
        color: var(--foreground);
        text-align: left;
        cursor: pointer;
    }

    .profile-options button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.075);
    }

    .profile-options button:disabled {
        cursor: default;
    }

    .option-avatar {
        position: relative;
        width: 2.25rem;
        height: 2.25rem;
    }

    .option-avatar > img {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }

    .provider-icon {
        position: absolute;
        right: -0.15rem;
        bottom: -0.1rem;
        display: grid;
        place-items: center;
        width: 1.1rem;
        height: 1.1rem;
        border-radius: 50%;
        background: var(--base-dark);
    }

    .option-copy {
        display: flex;
        min-width: 0;
        flex-direction: column;
    }

    .provider-name {
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
    }

    .identity-name {
        overflow: hidden;
        font-size: 0.82rem;
        font-weight: 650;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .option-status {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        color: var(--dracula-gray);
        font-size: 0.8rem;
        white-space: nowrap;
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
