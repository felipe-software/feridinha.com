import Tippy, { TippyProps } from "@tippyjs/react"
import styled from "styled-components"

import "tippy.js/animations/shift-away.css"
import "tippy.js/dist/tippy.css" // optional

const StyledTooltip = styled(Tippy)`
    position: relative;
    --background: var(--base);
    background-color: var(--background) !important;
    /* box-shadow: 0px 0px 5px 1px rgba(255, 255, 255, 0.075); */
    border: 2px solid #292a32;

    p {
        cursor: pointer;
    }

    &.purple {
        border: 2px solid #ff80bf;

        .tippy-arrow {
            color: #ff80bf;
        }
    }

    .tippy-arrow {
        /* color: var(--background) !important; */
        color: #292a32;
        /* background-color: red; */

        svg {
            stroke: #ff80bf;
            stroke-width: 2px;
        }
    }


`

const Tooltip = (props: TippyProps) => {
    return (
        // <Styless>
        <StyledTooltip  animation={"shift-away"} {...props}  />
        // </Styless>
    )
}

const TooltipImage = styled(Tooltip)`
    display: flex;
    width: fit-content;
    max-width: 30%;
    max-height: 30%;
    img {
        max-width: 100%;
    }

    p {
        cursor: pointer;
    }
    .content {
    }
`

const TooltipConfirmBox = styled(Tooltip)`
    .content {
        display: flex;
        width: fit-content;
        flex-direction: column;
        max-width: 230px;
        padding: 0.2rem;
        gap: 0.7rem;

        p {
            width: 100%;
            padding: 0;
            margin: 0;
            font-weight: 601;
            color: #bd93f9;
        }
        .actions {
            display: flex;
            justify-content: space-around;
            button {
                padding: 0.2rem;
                cursor: pointer;
                background: none;
                border: 2px solid #f8f8f878;
                color: #f8f8f8;
                border-radius: var(--border-radius-ss);
            }

            button:focus {
                transform: scale(0.97);
            }
        }
    }
`
const TooltipConfirm = (props: any) => {
    return (
        <TooltipConfirmBox
            {...props}
            interactive={true}
            content={
                <div className="content">
                    <p>{props.text}</p>
                    <div className="actions">
                        <button className="confirm" onClick={props.onConfirm}>
                            Confirmar
                        </button>
                        <button className="cancel" onClick={props.onCancel}>
                            Cancelar
                        </button>
                    </div>
                </div>
            }
        />
    )
}

export { TooltipConfirm, TooltipImage }

export default Tooltip
