import { FaGithub } from "react-icons/fa6"
import styled from "styled-components"

const Container = styled.a`
    display: flex;
    background-color: white;
    align-items: center;
    gap: .25rem;
    padding: .25rem .35rem;
    border-radius: .25rem;
    color: var(--base-dark) !important;
    cursor: pointer;
    transition: .2s;
    &:hover {
        transform: scale(1.05);
    }
`

export const OpenSourceBadge = () => {
    if((process.env.NEXT_PUBLIC_IS_OPEN_SOURCE_ALREADY)?.toLowerCase() !== 'true') return null;
    return (
        <Container className="base" href="https://github.com/Feridinha/feridinha.com" target="_blank">
            <FaGithub />
            Agora open source!
        </Container>
    )
}
