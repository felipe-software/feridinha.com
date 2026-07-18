import LoginButton from "@/components/LoginButton"
import Tooltip from "@/components/Tooltip"
import useTokenStore from "@/hooks/useToken"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { hideAll } from "tippy.js"
import TutorialItem from "./TutorialItem"
import Chatterino, { Sharex } from "./items/Chatterino"
import { Container, List } from "./styles"

export default function TutorialPage() {
    const [currentActive, setCurrentActive] = useState<string | null>(null)
    const tokenStore = useTokenStore()

    const handleActive = useCallback(
        (itemId: typeof currentActive) => {
            hideAll()
            if (currentActive === itemId) {
                setCurrentActive(null)
                return
            } else {
                setCurrentActive(itemId)
            }
        },
        [setCurrentActive, currentActive],
    )

    useEffect(() => {
        document.documentElement.style.setProperty("--nav-highlight", "#f579bf")
    }, [])

    return (
        <Container key="tutorial">
            {/* <NavBar /> */}
            <div className="title">
                <span className="notranslate material-icon">api</span>
                <h2>
                    Integração com aplicativos{" "}
                    <Tooltip
                        trigger="click"
                        content="Yeah... But BTTV is like a third-party thing and I don't now.."
                        // interactive={true}
                    >
                        <span>third-party</span>
                    </Tooltip>
                </h2>
            </div>
            <List
                animate={{
                    minHeight: "fit-content",
                }}
            >
                <TutorialItem
                    currentActive={currentActive}
                    itemId="chatterino"
                    handleActive={handleActive}
                    content={<Chatterino />}
                    title="Chatterino"
                    icon="/logo/chatterino.png"
                />
                <TutorialItem
                    currentActive={currentActive}
                    itemId="sharex"
                    handleActive={handleActive}
                    content={<Sharex />}
                    title="Sharex"
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
                            <li>Use as informações do Chatterino como base.</li>
                            <li>
                                <a
                                    target="_blank"
                                    style={{ color: "var(--dracula-cyan)" }}
                                    href="https://c.feridinha.com/eD3Uj.mp4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Vídeo mostrando como configurar com o
                                    Dankchat
                                </a>
                            </li>
                        </ul>
                    }
                    title="Dankchat"
                    icon="/logo/dankchat.png"
                    // handleHeight={handleHeight}
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
                            <li>
                                Chatsen: não suporta custom uploads no momento
                                (06/05/2025)
                            </li>
                            <li>
                                Lightshot: não suporta uploaders customizados.{" "}
                                <strong>
                                    Utilize a função de copiar o arquivo
                                    automaticamente e cole no Chatterino.
                                </strong>
                            </li>
                        </ul>
                    }
                    title="Outros"
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
                                readOnly={true}
                                checked={true}
                            ></input>
                            <label htmlFor="preference-input">
                                Seu token de integração será criado
                                automaticamente, basta clicar no campo "token"
                                ou baixar o arquivo do Sharex.
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>
                {!currentActive && !tokenStore.token && (
                    <div className="special-box">
                        <div className="bottom-notice">
                            <p>
                                Criando uma conta você tem histórico dos seus
                                uploads e limite de 100mb!
                            </p>
                            <LoginButton />
                        </div>
                    </div>
                )}
            </List>
        </Container>
    )
}
