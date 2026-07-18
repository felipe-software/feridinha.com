import { useModalStore } from "@/hooks/useModalStore"
import { useTranslations } from "next-intl"
import { ModalBase } from "@/components/ViewFileModal"
import { FaTwitch } from "react-icons/fa6"
import styled from "styled-components"

const Button = styled.button`
    position: relative;
    background-color: rgb(144, 72, 249);
    border: none;
    border-radius: var(--border-radius-ss);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.6rem;
    box-shadow: 0px 0px 5px 2px rgb(144, 72, 249, 0.25);
    transition: 0.4s ease;
    padding: 0.5rem 0.75rem;
    cursor: pointer;

    &:hover {
        background-color: #6724ca;
        box-shadow: 0px 0px 15px 5px rgb(144, 72, 249, 0.25);
        transition: 0.2s ease;
    }

    p {
        color: #f8f8f8;
        font-size: 1rem;
        font-weight: 600;
        transition: 0.4s;
        margin: 0;
        text-shadow: 0px 0px 2px #000000;
    }
`

const Container = styled(ModalBase)`
    max-height: 40rem !important;
    max-width: 35rem;

    align-items: center;
    gap: 1.5rem;

    p {
        color: var(--foreground);

        a {
            color: var(--dracula-cyan);
        }
    }
`

export const LoginModal = () => {
    const t = useTranslations("Auth")

    const handleLogin = () => {
        window.open(
            process.env.NEXT_PUBLIC_API_URL + "/login/twitch/redirect",
            "_self"
        )
    }

    return (
        <Container onClick={(e) => e.stopPropagation()}>
            <h1>{t("login")}</h1>
            <Button onClick={handleLogin}>
                <FaTwitch size={18} color={"#f8f8f8"} />
                <p>{t("loginWithTwitch")}</p>
            </Button>
            <p>
                {t.rich("loginAgreement", {
                    terms: (chunks) => (
                        <a href="/termos-de-servico" target="_blank">
                            {chunks}
                        </a>
                    ),
                })}
            </p>
        </Container>
    )
}

const LoginButton = () => {
    const t = useTranslations("Auth")
    const modal = useModalStore()

    const handleLogin = () => {

        // window.open(process.env.NEXT_PUBLIC_API_URL + "/login/twitch/redirect", "_self")

        modal.setPage({ jsx: <LoginModal /> })
    }

    return (
        <Button onClick={handleLogin}>
            <FaTwitch size={18} color={"#f8f8f8"} />
            <p>{t("loginButton")}</p>
        </Button>
    )
}

export default LoginButton
