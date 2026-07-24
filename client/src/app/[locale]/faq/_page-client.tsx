"use client"

import { ExpandableCard } from "@/components/ExpandableCard"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
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
                padding: 0.5rem;
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

            min-width: 3rem;
        }

        span.material-icon:last-child {
            margin-left: auto;
            color: var(--foreground);
        }
    }
`

export default function FaqPageClient() {
    const t = useTranslations("Faq")

    useEffect(() => {
        document.documentElement.style.setProperty("--nav-highlight", "#ffb86c")
    }, [])

    const cards = useMemo(
        () => [
            {
                icon: "history_edu",
                iconSize: undefined,
                title: t("storyTitle"),
                content: (
                    <>
                        <p>
                            {t.rich("storyBody1", {
                                site: (chunks) => (
                                    <span className="highlight pink">
                                        {chunks}
                                    </span>
                                ),
                                author: (chunks) => (
                                    <a
                                        href="https://github.com/Feridinha"
                                        target="_blank"
                                        className="highlight"
                                    >
                                        {chunks}
                                    </a>
                                ),
                            })}
                        </p>
                        <p>
                            {t.rich("storyBody2", {
                                ghiletofar: (chunks) => (
                                    <a
                                        href="https://twitch.tv/ghiletofar"
                                        target="_blank"
                                        style={{ color: "red" }}
                                    >
                                        {chunks}
                                    </a>
                                ),
                            })}
                        </p>
                        <p>
                            {t.rich("storyBody3", {
                                sync: (chunks) => (
                                    <span className="highlight pink">
                                        {chunks}
                                    </span>
                                ),
                                brand: (chunks) => (
                                    <span className="highlight pink">
                                        {chunks}
                                    </span>
                                ),
                                strong: (chunks) => <strong>{chunks}</strong>,
                            })}
                        </p>
                        <p>
                            {t.rich("storyBody4", {
                                strong: (chunks) => <strong>{chunks}</strong>,
                                donate: (chunks) => (
                                    <a
                                        href="https://tipa.ai/feridinha"
                                        target="_blank"
                                    >
                                        {chunks}
                                    </a>
                                ),
                            })}
                        </p>
                    </>
                ),
            },
            {
                icon: "contacts",
                iconSize: 0.9,
                title: t("contactTitle"),
                content: (
                    <p>
                        {t.rich("contactBody", {
                            discord: (chunks) => (
                                <a
                                    href="https://discord.com/invite/GYv6WMD98A"
                                    target="_blank"
                                >
                                    {chunks}
                                </a>
                            ),
                            twitter: (chunks) => (
                                <a
                                    href="https://twitter.com/FeridinhaDev"
                                    target="_blank"
                                >
                                    {chunks}
                                </a>
                            ),
                            email: (chunks) => (
                                <a
                                    href="mailto:faq@feridinha.com"
                                    target="_blank"
                                >
                                    {chunks}
                                </a>
                            ),
                        })}
                    </p>
                ),
            },
            {
                icon: "attach_money",
                iconSize: 1.1,
                title: t("supportTitle"),
                content: (
                    <p>
                        {t.rich("supportBody", {
                            strong: (chunks) => <strong>{chunks}</strong>,
                            donate: (chunks) => (
                                <a
                                    href="https://tipa.ai/feridinha"
                                    target="_blank"
                                >
                                    {chunks}
                                </a>
                            ),
                        })}
                    </p>
                ),
            },
            {
                icon: "delete",
                iconSize: undefined,
                title: t("deletedTitle"),
                content: (
                    <>
                        <p>{t("deletedBody1")}</p>
                        <p>{t("deletedBody2")}</p>
                        <p>
                            {t.rich("deletedBody3", {
                                urgent: (chunks) => (
                                    <strong
                                        style={{ textDecoration: "underline" }}
                                    >
                                        {chunks}
                                    </strong>
                                ),
                                discord: (chunks) => (
                                    <a
                                        href="https://discord.com/invite/GYv6WMD98A"
                                        target="_blank"
                                    >
                                        {chunks}
                                    </a>
                                ),
                            })}
                        </p>
                    </>
                ),
            },
            {
                icon: "gavel",
                iconSize: 1.05,
                title: t("reportTitle"),
                content: (
                    <p>
                        {t.rich("reportBody", {
                            email: (chunks) => (
                                <a href="mailto:tos@feridinha.com">{chunks}</a>
                            ),
                            discord: (chunks) => (
                                <a
                                    href="https://discord.com/invite/GYv6WMD98A"
                                    target="_blank"
                                >
                                    {chunks}
                                </a>
                            ),
                        })}
                    </p>
                ),
            },
        ],
        [t],
    )

    return (
        <Container style={{ viewTransitionName: "page-content" }}>
            <div className="header">
                <span className="notranslate material-icon">
                    psychology_alt
                </span>
                <h1>
                    {t.rich("title", {
                        highlight: (chunks) => <span>{chunks}</span>,
                    })}
                </h1>
                <div className="row">
                    <a target="_blank" href="https://tipa.ai/Feridinha">
                        <FaPix /> {t("donations")}
                    </a>
                    <a target="_blank" href="https://github.com/Feridinha">
                        <FaGithub /> Github
                    </a>
                    <a target="_blank" href="https://twitter.com/FeridinhaDev">
                        <FaTwitter /> Twitter
                    </a>
                    <a
                        target="_blank"
                        href="https://discord.com/invite/GYv6WMD98A"
                    >
                        <FaDiscord /> Discord
                    </a>
                    <a target="_blank" href="mailto:faq@feridinha.com">
                        <LuMail strokeWidth={2.25} /> {t("email")}
                    </a>
                    <a target="_blank" href="https://twitch.tv/Feridinha">
                        <FaTwitch /> Twitch
                    </a>
                </div>
            </div>
            <motion.div className="content-wrapper">
                {cards.map((card) => (
                    <ExpandableCard
                        key={card.title}
                        icon={card.icon}
                        iconSize={card.iconSize}
                        title={card.title}
                        content={<>{card.content}</>}
                    />
                ))}
            </motion.div>
        </Container>
    )
}
