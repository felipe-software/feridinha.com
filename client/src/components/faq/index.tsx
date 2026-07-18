import { ExpandableCard } from "@/components/ExpandableCard"
import { motion } from "motion/react"
import { useEffect } from "react"
import styled from "styled-components"

import {
    FaDiscord,
    FaGithub,
    FaPix,
    FaTwitch,
    FaTwitter,
} from "react-icons/fa6"
import { LuMail } from "react-icons/lu"

const Container = styled.div`
    /* height: 100%; */
    display: flex;
    flex-direction: column;
    padding: 1rem;
    padding-top: 5rem;
    align-items: center;
    color: var(--foreground);
    gap: 2rem;
    min-width: 100%;

    h1 {
        font-size: 2.5rem;
        width: 100%;
        font-weight: 600;
        color: var(--foreground);

        span {
            display: inline-block;
            width: fit-content;
            color: #ffb86c;
            text-shadow:
                #ffb86c5b 0px 0px 20px,
                #ffb86c3a 0px 0px 50px;
            font-weight: 700;
            cursor: pointer;
        }
    }

    > .header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: center;
        text-align: center;

        span.material-icon {
            color: #ffb86c;
            font-size: 4rem;
            text-shadow:
                #ffb86c7f 0px 0px 10px,
                #ffb86c52 0px 0px 50px;
            font-variation-settings:
                "FILL" 1,
                "wght" 600,
                "GRAD" 0,
                "opsz" 20;
        }

        > .row {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            padding-top: 0.25rem;

            gap: 1rem;

            a {
                display: flex;
                gap: 0.35rem;
                background-color: var(--base-dark);
                padding: 0.5rem 0.5rem;
                border-radius: 0.5rem;
                color: var(--foreground);
                text-decoration: none;
                transition: 0.2s ease-in-out;

                &:hover {
                    background-color: #ffb86c;
                    color: var(--base-dark);
                    transform: scale(1.05);
                    box-shadow: 0px 0px 15px 1px #ffb86c52;

                    svg {
                        color: var(--base-dark) !important;
                    }
                }
            }

            svg {
                height: 1.25rem;
                width: 1.25rem;
                color: white;
                transition: 0.2s ease-in-out;
            }
        }
    }

    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 50rem;
    }

    span.highlight {
        --color-1: #e9c600;
        --color-2: #f1891a;
        background: linear-gradient(
            190deg,
            var(--color-1) 0%,
            var(--color-2) 50%,
            var(--color-1) 100%
        );
        font-weight: 500;
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        background-size: 200% auto;
        animation: gradient 5s linear infinite reverse;

        &.pink {
            --color-1: #ff80bf;
            --color-2: #9580ff;
        }
    }

    .expandable-card .header {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        font-size: 1.5rem;
        font-weight: 600;
        align-self: stretch;
        gap: 0.5rem;
        align-items: center;
        user-select: none;

        span.material-icon {
            font-size: 2rem;
        }

        span.material-icon:first-child {
            color: #ffb86c;
            text-shadow:
                #ffb86c7f 0px 0px 10px,
                #ffb86c52 0px 0px 50px;
            font-variation-settings:
                "FILL" 1,
                "wght" 600,
                "GRAD" 0,
                "opsz" 20;

            /* margin-right: 0.5rem; */
            min-width: 3rem;
        }

        span.material-icon:last-child {
            margin-left: auto;
            color: var(--foreground);
        }
    }
`

export const FaqPage = () => {
    useEffect(() => {
        document.documentElement.style.setProperty("--nav-highlight", "#ffb86c")
    }, [])
    return (
        <Container>
            <div className="header">
                <span className="notranslate material-icon">
                    psychology_alt
                </span>
                <h1>
                    <span>Dúvidas</span> sobre o projeto
                </h1>
                <div className="row">
                    <a target="blank" href="https://tipa.ai/Feridinha">
                        <FaPix /> Doações
                    </a>
                    <a target="blank" href="https://github.com/Feridinha">
                        <FaGithub /> Github
                    </a>
                    <a target="blank" href="https://twitter.com/FeridinhaDev">
                        <FaTwitter /> Twitter
                    </a>
                    <a
                        target="blank"
                        href="https://discord.com/invite/GYv6WMD98A"
                    >
                        <FaDiscord /> Discord
                    </a>

                    <a target="blank" href="mailto:faq@feridinha.com">
                        <LuMail strokeWidth={2.25} /> Email
                    </a>
                    <a target="blank" href="https://twitch.tv/Feridinha">
                        <FaTwitch /> Twitch
                    </a>
                </div>
            </div>
            <motion.div className="content-wrapper">
                <ExpandableCard
                    icon="history_edu"
                    content={
                        <>
                            <p>
                                O site{" "}
                                <span className="highlight pink">
                                    Feridinha.com
                                </span>{" "}
                                foi criado pelo dev{" "}
                                <a
                                    href="https://github.com/Feridinha"
                                    target="_blank"
                                    className="highlight"
                                >
                                    @Feridinha
                                </a>{" "}
                                em 2021, por isso ele tem esse nome.
                            </p>
                            <p>
                                O objetivo inicial foi fornecer um site de
                                upload estável, pois o Imgur e o Inuuls não
                                paravam de ficar fora do ar na época. Com o
                                passar do tempo, a comunidade do streamer{" "}
                                <a
                                    className="red"
                                    href="//twitch.tv/ghiletofar"
                                    target="_blank"
                                    style={{ color: "red" }}
                                >
                                    @ghiletofar
                                </a>{" "}
                                foi apoiando o projeto, e consequentemente, o
                                projeto foi se espalhando para outras
                                comunidades brasileiras.
                            </p>
                            <p>
                                Com o passar dos anos, surgiu o{" "}
                                <span className="highlight pink">
                                    FeridinhaSync
                                </span>
                                , um que abrange ainda mais comunidades. Todos
                                os projetos da marca{" "}
                                <span className="highlight pink">
                                    Feridinha™
                                </span>{" "}
                                foram criados sem qualquer interesse financeiro
                                e{" "}
                                <strong>
                                    sempre serão gratuitos para todos.
                                </strong>
                            </p>
                            <p>
                                Porém, caso você queira e apoiar{" "}
                                <strong>diretamente</strong>, você pode{" "}
                                <a
                                    href="https://tipa.ai/feridinha"
                                    target="_blank"
                                >
                                    fazer uma doação via PIX aqui
                                </a>
                            </p>
                        </>
                    }
                    title="Por que o site se chama Feridinha?"
                ></ExpandableCard>
                <ExpandableCard
                    icon="contacts"
                    iconSize={0.9}
                    content={
                        <p>
                            Pode me mandar uma mensagem no Discord (
                            <a
                                href="https://discord.com/invite/GYv6WMD98A"
                                target="_blank"
                            >
                                @Feridinha
                            </a>
                            ), Twitter (
                            <a
                                href="https://twitter.com/FeridinhaDev"
                                target="_blank"
                            >
                                @FeridinhaDev
                            </a>
                            ) (
                            <a href="mailto:faq@feridinha.com" target="_blank">
                                faq@feridinha.com
                            </a>
                            )
                        </p>
                    }
                    title="Como posso entrar em contato?"
                ></ExpandableCard>
                <ExpandableCard
                    icon="attach_money"
                    iconSize={1.1}
                    content={
                        <>
                            <p>
                                Caso você queira apoiar o projeto{" "}
                                <strong>diretamente</strong>,{" "}
                                <a
                                    href="https://tipa.ai/feridinha"
                                    target="_blank"
                                >
                                    você pode fazer uma doação via PIX aqui
                                </a>
                            </p>
                        </>
                    }
                    title="Como posso ajudar o projeto?"
                ></ExpandableCard>
                <ExpandableCard
                    icon="delete"
                    content={
                        <>
                            <p>
                                Ao realizar um upload, é criado um cache
                                automaticamente, esse cache pode durar de 2
                                minutos até 2 horas para atualizar (dependendo
                                da quantidade de tráfego do site).
                            </p>

                            <p>
                                Com a nova versão do site, esse cache é
                                automaticamente limpo, porém ele ainda pode
                                persistir por alguns minutos.
                            </p>
                            <p>
                                Caso você tenha feito um upload de arquivo
                                pessoal e precisa que ele seja deletado{" "}
                                <strong style={{ textDecoration: "underline" }}>
                                    URGENTEMENTE
                                </strong>
                                , mande uma mensagem para mim no Discord:{" "}
                                <a
                                    href="https://discord.com/invite/GYv6WMD98A"
                                    target="_blank"
                                >
                                    @Feridinha
                                </a>
                            </p>
                        </>
                    }
                    title="Apaguei um arquivo, por que ele ainda não sumiu?"
                ></ExpandableCard>
                <ExpandableCard
                    icon="gavel"
                    iconSize={1.05}
                    content={
                        <>
                            <p>
                                Caso você tenha visto um arquivo que não segue o
                                Termos de uso do site (TOS), me envie um email
                                em{" "}
                                <a href="mailto:tos@feridinha.com">
                                    tos@feridinha.com
                                </a>{" "}
                                ou fale diretamente comigo pelo{" "}
                                <a
                                    href="https://discord.com/invite/GYv6WMD98A"
                                    target="_blank"
                                >
                                    Discord
                                </a>
                                .
                            </p>
                        </>
                    }
                    title="Como faço para denunciar um arquivo  que é contra os Termos de uso?"
                ></ExpandableCard>
            </motion.div>
        </Container>
    )
}
