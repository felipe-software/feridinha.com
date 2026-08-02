import Tooltip from "@/components/Tooltip"
import Image from "next/image"
import styled from "styled-components"

export const Container = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    z-index: 7;
`

export const Trigger = styled.button`
    padding: 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: var(--border-radius-m);
    background: var(--base);
    color: #a7a9b3;
    cursor: pointer;
    line-height: 1;
    transition: color 0.15s ease;

    svg {
        width: 1.65rem;
        height: 1.65rem;
        pointer-events: none;
        stroke-width: 2;
        filter: drop-shadow(0 0.0833rem 0 rgba(0, 0, 0, 0.8))
            drop-shadow(0 -0.0833rem 0 rgba(255, 255, 255, 0.06));
    }

    &[aria-expanded="true"] {
        color: #d3d5dc;
    }

    &:focus-visible {
        outline: 0.1667rem solid #a7a9b3;
        outline-offset: 0.25rem;
    }
`

export const Popover = styled(Tooltip)`
    width: 12.5rem;
    border: 0.0833rem solid #353745;
    background-color: var(--base-dark-transparent) !important;
    box-shadow: 0 1rem 2.6667rem rgba(8, 8, 14, 0.35);

    .tippy-content {
        padding: 0.25rem;
    }

    .tippy-arrow {
        color: #353745;

        svg {
            stroke: #353745;
        }
    }
`

export const Menu = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.1667rem;
    width: 100%;
`

export const Option = styled.button`
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) 1.3333rem;
    align-items: center;
    gap: 0.5rem;
    width: 100%;

    margin: 0;
    padding: 0.4rem 0.45rem;
    border: 0.0833rem solid transparent;
    border-radius: var(--border-radius-s);
    background: transparent;
    color: var(--foreground);
    cursor: pointer;
    font-size: 1.1667rem;
    font-weight: 500;
    line-height: 1.2;
    text-align: left;
    transition: color 0.15s ease, background-color 0.15s ease,
        border-color 0.15s ease;

    &:focus-visible {
        outline: 0.1667rem solid #a7a9b3;
        outline-offset: -0.1667rem;
    }

    &:hover {
        filter: brightness(1.1);
        background-color: var(--base);
    }

    &:disabled {
        opacity: 1;
        color: var(--nav-highlight);

        cursor: default;
    }


`

export const FlagContainer = styled.span`
    position: relative;
    display: block;
    width: 2rem;
    height: 2rem;
`

export const Flag = styled(Image)`
    object-fit: contain;
`

export const Check = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--nav-highlight);

    svg {
        width: 1.3333rem;
        height: 1.3333rem;
        stroke-width: 2.5;
    }
`
