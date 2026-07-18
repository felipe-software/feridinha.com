import Tooltip from "@/components/Tooltip"
import { TippyProps } from "@tippyjs/react"
import { ReactNode } from "react"
import styled from "styled-components"

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: .25rem;

`

export const Dropdown = ({
    items,
    children,
    tippyProps,
}: {
    items: ReactNode[]
    children: JSX.Element
    tippyProps?: TippyProps
}) => {
    return (
        <Tooltip
            content={<ContentWrapper>{items}</ContentWrapper>}
            children={children}
            interactive={true}
            placement="bottom"
            arrow={true}
            appendTo={document.body}
            trigger={"click"}
            
            {...tippyProps}
        />
    )
}
