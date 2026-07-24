"use client"

import LoginButton from "@/components/LoginButton"
import Tooltip from "@/components/Tooltip"
import useTokenStore from "@/hooks/useToken"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { hideAll } from "tippy.js"
import TutorialItem from "@/components/tutorial/TutorialItem"
import Chatterino, { Sharex } from "@/components/tutorial/items/Chatterino"
import { Container, List } from "@/components/tutorial/styles"
import { useTranslations } from "next-intl"

export default function TutorialPage() {
    const [currentActive, setCurrentActive] = useState<string | null>(null)
    const tokenStore = useTokenStore()
    const t = useTranslations("Tutorial")

    const handleActive = useCallback(
        (itemId: typeof currentActive) => {
            hideAll()
            if (currentActive === itemId) {
                setCurrentActive(null)
                return
            }

            setCurrentActive(itemId)
        },
        [currentActive],
    )

    useEffect(() => {
        document.documentElement.style.setProperty("--nav-highlight", "#f579bf")
    }, [])

    return (
        <Container key="tutorial" style={{ viewTransitionName: "page-content" }}>
            <div className="title">
                <span className="notranslate material-icon">api</span>
                <h1>
                    {t.rich("title", {
                        highlight: (chunks) => (
                            <Tooltip
                                trigger="click"
                                content={t("thirdPartyTooltip")}
                            >
                                <span>{chunks}</span>
                            </Tooltip>
                        ),
                    })}
                </h1>
            </div>
            <List animate={{ minHeight: "fit-content" }}>
                <TutorialItem
                    currentActive={currentActive}
                    itemId="chatterino"
                    handleActive={handleActive}
                    content={<Chatterino />}
                    title={t("chatterino")}
                    icon="/logo/chatterino.png"
                />
                <TutorialItem
                    currentActive={currentActive}
                    itemId="sharex"
                    handleActive={handleActive}
                    content={<Sharex />}
                    title={t("sharex")}
                    icon="/logo/sharex.png"
                />
                <TutorialItem
                    currentActive={currentActive}
                    itemId="dankchat"
                    handleActive={handleActive}
                    content={
                        <ul
                            style={{
                                fontSize: "1rem",
                                color: "#f8f8f8",
                                listStyle: "inside",
                            }}
                        >
                            <li>{t("dankchatUseBase")}</li>
                            <li>
                                <a
                                    target="_blank"
                                    style={{ color: "var(--dracula-cyan)" }}
                                    href="https://c.feridinha.com/eD3Uj.mp4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {t("dankchatVideo")}
                                </a>
                            </li>
                        </ul>
                    }
                    title={t("dankchat")}
                    icon="/logo/dankchat.png"
                />
                <TutorialItem
                    currentActive={currentActive}
                    itemId="chatsen"
                    handleActive={handleActive}
                    content={
                        <ul
                            style={{
                                fontSize: "1rem",
                                color: "#f8f8f8",
                                listStyle: "inside",
                            }}
                        >
                            <li>{t("chatsenUnsupported")}</li>
                            <li>{t("lightshotUnsupported")}</li>
                        </ul>
                    }
                    title={t("others")}
                    icon={["/logo/chatsen.png", "/logo/lightshot.png"]}
                />

                <AnimatePresence initial={false}>
                    {!currentActive && tokenStore.token && (
                        <motion.div
                            className="bottom-notice"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <input
                                type="checkbox"
                                id="preference-input"
                                readOnly
                                checked
                            />
                            <label htmlFor="preference-input">
                                {t("autoTokenNotice")}
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>
                {!currentActive && !tokenStore.token && (
                    <div className="special-box">
                        <div className="bottom-notice">
                            <p>{t("guestNotice")}</p>
                            <LoginButton />
                        </div>
                    </div>
                )}
            </List>
        </Container>
    )
}
