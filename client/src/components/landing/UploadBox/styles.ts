import styled from "styled-components"

export const UploadBoxWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 35rem;
    max-width: calc(100vw - 2rem);
`

export const UploadBoxContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: stretch;
    flex-direction: column;

    gap: 0.5rem;
    border-radius: 1.5rem;
    width: 100%;
    height: 35rem;
    background-color: var(--base-dark) !important;
    padding: 1rem;
    cursor: pointer;
    border: none;
    transition: ease 0.5s, opacity 0s;
    color: #f8f8f2;

    input[type="file"] {
        display: none;
    }

    &:active {
        /* transform: scale(0.99); */
        transition: ease all 0.1s;
    }

    .limit-notice {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        padding: 0.5rem;
        border-radius: 0.5rem;
        background-color: var(--base);
        font-size: 0.9rem;
        background-color: rgba(61, 63, 81, 0.25);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 400;
        border: none;
        color: var(--foreground);
        margin: 0.25rem;
        transition: .2s;

        svg {
            height: 1.25rem;
            width: 1.25rem;
        }
    }

    @keyframes rotate {
        100% {
            transform: rotate(1turn);
        }
    }

    .svg-wrapper {
        position: absolute;
        /* inset: 0; */
        width: 100%;
        height: 100%;
        /* background-color: blue; */
    }

    svg.re-open {
        position: absolute;
        top: 1rem;
        right: 1rem;
        cursor: pointer;
        width: 2rem;
        height: 2rem;
        backdrop-filter: blur(15px);
    }

    svg.my-border {
        /* position: absolute; */
        height: 100%;
        width: 100%;
        /* inset: 0; */
        /* padding: 1rem; */
        /* background-color: blue; */
        z-index: 2;
        overflow: visible;
    }

    rect.path {
        --stroke-width: 0.5rem;
        fill: rgba(0, 0, 0, 0);
        stroke: rgba(61, 63, 81, 0.15);
        stroke-width: var(--stroke-width);
        stroke-dasharray: 2rem 1.75rem;
        stroke-linecap: round;
        stroke-linejoin: round;
        animation: spin-stroke linear infinite;
        animation-duration: 15s;
        transition: stroke 0.3s ease;
        width: calc(100% - 1rem);
        height: calc(100% - 1rem);
    }

    &:hover rect.path {
        stroke: #b76fff1a;
    }

    rect.path-active {
        stroke: #c980df;
        animation-duration: 5s;
    }

    @keyframes spin-stroke {
        to {
            stroke-dashoffset: 1000;
        }
    }

    h4 {
        font-size: 1.1rem;
        margin: unset;
        padding: unset;
        font-weight: 400;
        text-align: center;
    }

    button.click-to {
        font-size: 1.1rem;
        background-color: rgba(61, 63, 81, 0.25);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 400;
        border: none;
        color: var(--foreground);
        margin: 0.25rem;
        transition: 0.2s;
    }

    .tos-notice {
        position: absolute;
        margin-top: auto;
        bottom: 1.5rem;
        font-size: 0.75rem;
        left: 2.5rem;
        right: 2.5rem;
        text-align: center;
        z-index: 1;

        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        align-items: center;
    }

    .tos-notice a {
        color: var(--dracula-cyan);
    }

    .content {
        position: absolute;
        inset: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        /* background-color: red; */
        width: calc(100% - 2rem);

        height: calc(100% - 2rem);
        transition: height 0.5s;
        top: 1rem;

        &.has-history {
            height: 50%;
        }

        z-index: 3;
    }

`
