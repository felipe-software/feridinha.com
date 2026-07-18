import Tooltip from "@/components/Tooltip"
import { TippyProps } from "@tippyjs/react"
import { ButtonProps } from "react-html-props"
import styled from "styled-components"

interface StyledProps {
    scaleHover: number
    scaleActive: number
    activeColor: string
    activeForeground: string
    background: string
    color: string
}

const Container = styled.button<StyledProps>`
    padding: 0.1rem 0.25rem;
    border-radius: 0.5rem;
    
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    &,
    p,
    span {
        transition: 0.2s;
    }

    --scaler-hover: ${(p) => p.scaleHover};
    --scaler-active: ${(p) => p.scaleActive};
    --active-color: ${(p) => p.activeColor};
    --active-foreground: ${(p) => p.activeForeground};
    --background: ${(p) => p.background};
    --color: ${(p) => p.color};

    background: var(--background);

    span.material-icon {
        color: var(--color);
        font-size: 1.5rem;
        font-variation-settings: "FILL" 0, "wght" 500, "GRAD" 0, "opsz" 10;
    }

    p {
        color: var(--color);
        font-weight: 500;
    }

    &:has(p) {
        gap: 0.25rem;
        padding: 0.25rem 0.5rem !important;
    }

    &.force-hover,
    &:hover {
        
        background-color: var(--active-color);

        p,
        span {
            color: var(--active-foreground);
            font-weight: 600;
        }
    }

    &:hover {
        transform: scale(var(--scaler-hover));
    }

    &.disable-transform {
        transform: scale(1) !important;
    }

    &:active {
        transform: scale(0.9);
    }

    &:disabled {
        /* pointer-events: none; */
        cursor: not-allowed;
        transform: none !important; 
    }
`

export const ButtonIcon = ({
    icon,
    tooltip,
    text,
    customTooltipProps,
    forceHover,
    disabledTransform,
    ...props
}: {
    icon: string
    tooltip?: string
    text?: string
    forceHover?: boolean
    disabledTransform?: boolean

    customTooltipProps?: TippyProps
} & ButtonProps &
    Partial<StyledProps>) => {
    const button = (
        <Container
            {...props}
            scaleHover={props.scaleHover || 1.05}
            scaleActive={props.scaleActive || 1.1}
            activeColor={props.activeColor || "var(--purple-gradient)"}
            activeForeground={props.activeForeground || "var(--base)"}
            background={props.background || "var(--base)"}
            color={props.color || "var(--foreground)"}
            
            className={
                props.className +
                (forceHover ? " force-hover" : "") +
                (disabledTransform ? " disable-transform" : "")
            }
        >
            <span className="notranslate material-icon">{icon}</span>
            {text && <p>{text}</p>}
        </Container>
    )

    if (tooltip) {
        return (
            <Tooltip content={tooltip!} {...customTooltipProps}>
                {button}
            </Tooltip>
        )
    }

    return button
}
