import { BaseBox } from "@/components/dashboard/styles"
import styled from "styled-components"

export const AlbunsBox = styled(BaseBox)`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    background-color: #111218;
    border-radius: 1rem;
    max-width: 100%;

    padding: 1rem;

    .title-wrapper {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0 0.5rem;
        gap: 1rem;

        p.title {
            font-size: 1.5rem;
            font-weight: 600;
        }

        > button:first-of-type {
            margin-left: auto;
        }
    }

    .items-container {
        width: 100%;
        /* display: grid;
        grid-template-columns: repeat(auto-fill, minmax(20rem, min-content));
        grid-auto-rows: 20rem;
        gap: 1rem;
        min-width: 0;
        overflow: hidden;
        background-color: red; */
    }
`
