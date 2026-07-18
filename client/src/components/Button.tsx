import styled from "styled-components"
import { ButtonProps } from "react-html-props"
import { ReactNode, memo } from "react"
import Loading from "@/components/Loading"

interface StyledProps {
    variant: "black" | "blur" | "green" | "purple" | "red" | "transparent" | "grey" | "cyan" | "white" | "deselect"
    size?: "slim" | "semi-slim"
    isLoading?: boolean
}
const Container = styled.button`
    position: relative;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-align: center;
    font-weight: 500;

    display: flex;
    align-items: center;
    gap: 0.5rem;
    /* line-height: 1.35rem; */

    &.green {
        background: #50fa7b;
        color: var(--background);
        box-shadow: 0px 4px 12px 0px rgba(80, 175, 123, 0.2);

        svg {
        }
    }

    &.grey {
        color: var(--foreground);
        background-color: var(--base);
    }

    &.cyan {
        background: #8be9fd;
        color: var(--background);
        box-shadow: 0px 4px 12px 0px rgb(139, 233, 253, 0.2);
    }

    &.purple {
        background-color: var(--purple-gradient);
        color: var(--base-dark) !important;
        text-shadow: 0px 0px 1px #00000036;
    }

    &.deselect {
        background-color: #44475a;
        color: var(--foreground);
    }

    &.red {
        background-color: #ff5555;
    }

    &.black {
        color: #fff;
        background: #000;
    }

    &.white {
        background: #fff;
        color: #000;
    }

    &.transparent {
        background: none;
    }

    &.blur {
        color: white;
        border-radius: 1rem;
        background: var(--Grey-a8, rgba(7, 0, 46, 0.31));
        backdrop-filter: blur(5px);
    }

    transition: transform 0.2s;
    &:not(:disabled):hover {
        transform: scale(1.05);
    }

    &:not(:disabled):active {
        transform: scale(0.97);
    }

    .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        svg {
            width: 1.25rem;
            height: 1.25rem;
        }
    }

    &.right {
        flex-direction: row-reverse;
    }

    &.size-slim {
        padding: 0.25rem 0.5rem;
        gap: 0.3rem;
    }

    &.size-semi-slim {
        padding: 0.35rem 0.75rem;
        gap: 0.3rem;

        /* &:has(svg) {
            padding-left: 0.25rem;
        } */
    }

    &[aria-busy="true"] {
        cursor: wait !important;
        pointer-events: none !important;
        transform: 0 !important;
    }

    border: none;
    cursor: pointer;
`

export type ButtonPropsType = {
    icon?: ReactNode
    iconSide?: "left" | "right"
} & StyledProps &
    ButtonProps

export const Button = memo((props: ButtonPropsType) => {
    return (
        <Container
            {...props}
            className={
                props.className +
                " " +
                props.variant +
                " " +
                (props.iconSide || "") +
                " " +
                ("size-" + props.size || "")
            }
            aria-busy={props.isLoading}
            children={
                <>
                    {props.icon && <div className="icon-wrapper">{props.icon}</div>}
                    {props.children}
                    <Loading size={20} isLoading={!!props.isLoading} />
                </>
            }
        />
    )
})
