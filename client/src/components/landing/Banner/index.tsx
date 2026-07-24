import { LoginModal } from "@/components/LoginButton"
import { useModalStore } from "@/hooks/useModalStore"
import useTokenStore from "@/hooks/useToken"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import styled, { keyframes } from "styled-components"

const GradientBackground = keyframes`
    0% {
        background-position: 15% 0%;
    }
    50% {
        background-position: 86% 100%;
    }
    100% {
        background-position: 15% 0%;
    }

`

const Container = styled(motion.div)`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4rem;
    height: 25rem;
    min-height: fit-content;
    padding: 3.5rem 2rem;
    width: 100%;
    min-width: fit-content;
    max-width: 80rem;
    border-radius: 1.5rem;
    background: linear-gradient(
        318deg,
        var(--pink-gradient),
        var(--purple-gradient)
    );
    background-size: 150% 150%;
    -webkit-animation: ${GradientBackground} 5s ease infinite;
    -moz-animation: ${GradientBackground} 5s ease infinite;
    animation: ${GradientBackground} 5s ease infinite;

    display: flex;
    overflow: hidden;

    .content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }

        h2 {
            font-size: 4rem;
            color: var(--foreground);
            text-wrap: balance;
        }
    }

    .picture {
        height: 100%;
        transform: scaleX(-1) scale(1.1);
    }

    button.button {
        overflow: visible;
        white-space: nowrap;
        border: none;
        padding: 1rem 1.5rem;
        height: fit-content;
        font-size: 1.2rem;
        color: var(--foreground);
        font-weight: 500;
        min-width: fit-content;
        background-color: rgba(248, 248, 248, 0.35);
        backdrop-filter: saturate(1.5);
        border-radius: 0.4rem;
        cursor: pointer;
        transition: 0.3s ease;

        &:hover {
            background-color: #f8f8f8;
            color: black;
            transform: scale(1.025);
        }

        &:active {
            transform: scale(0.85);
        }
    }

    @media (max-width: 850px) {
        & {
            justify-content: center;
            align-items: center;
        }

        h2 {
            text-align: center;
            font-size: 2.5rem;
        }
        .buttons {
            justify-content: center;
        }

        .picture {
            display: none;
        }

        br {
            display: none;
        }
    }
`

export default function Banner() {
    const router = useRouter()
    const tokenStore = useTokenStore()
    const { setPage } = useModalStore()
    const t = useTranslations("Landing")
    const containerVariants = {
        hidden: {
            y: -30,
            opacity: 0,
        },
        visible: {
            y: 0,
            opacity: 1,
        },
    }

    return (
        <Container
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 1 }}
            viewport={{ once: true }}
        >
            <div className={"content"}>
                <h2>
                    {t.rich("banner.title", {
                        break: () => <br />,
                    })}
                </h2>
                {/* <img src={FeelsOkayMan} className="picture" /> */}

                <div className={"buttons"}>
                    <button
                        onClick={() => {
                            if(tokenStore.token) {
                                return router.push("/dashboard")
                            }
                            setPage({
                                jsx: <LoginModal />,
                            })
                        }}
                        className={"reset-button button"}
                    >
                        {tokenStore.token ? t("banner.ctaLogged") : t("banner.ctaGuest")}
                    </button>
                    <button
                        className={"reset-button button"}
                        onClick={() => {
                            router.push("/tutorial")
                        }}
                    >
                        {t("banner.tutorial")}
                    </button>
                </div>
            </div>
            <img
                src="/feelsokayman.svg"
                alt="feelsokayman"
                className={"picture"}
                loading="lazy"
            />
        </Container>
    )
}
