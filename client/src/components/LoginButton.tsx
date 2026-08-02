import { useModalStore } from "@/hooks/useModalStore"
import { useLocale, useTranslations } from "next-intl"
import { ModalBase } from "@/components/ViewFileModal"
import { FaDiscord, FaGoogle, FaTwitch } from "react-icons/fa6"
import styled from "styled-components"
import type { AppLocale } from "@/i18n/config"
import { getTermsUrl } from "@/lib/seo"
import type { OAuthProviderName } from "@/hooks/useUserDataStore"
import { getOAuthLoginUrl, OAUTH_PROVIDERS } from "@/lib/oauth"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState, type ComponentType } from "react"

const LOGIN_THEMES = [
    {
        provider: "twitch",
        background: "var(--oauth-twitch)",
        foreground: "var(--foreground)",
    },
    {
        provider: "google",
        background: "var(--oauth-google)",
        foreground: "var(--base-dark)",
    },
    {
        provider: "discord",
        background: "var(--oauth-discord)",
        foreground: "var(--foreground)",
    },
] as const

const shuffleThemes = () => {
    const themes = [...LOGIN_THEMES]

    for (let index = themes.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        ;[themes[index], themes[randomIndex]] = [themes[randomIndex], themes[index]]
    }

    return themes
}

const NavbarButton = styled(motion.button)<{
    $accent: string
    $foreground: string
}>`
    --login-accent: ${({ $accent }) => $accent};
    --login-foreground: ${({ $foreground }) => $foreground};

    position: relative;
    isolation: isolate;
    overflow: hidden;
    min-width: 6.9rem;
    min-height: 2.5rem;
    background-color: var(--login-accent);
    border: none;
    border-radius: var(--border-radius-ss);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.7rem;
    box-shadow: 0 0.25rem 1rem color-mix(in srgb, var(--login-accent) 24%, transparent);
    transition:
        background-color 0.65s ease-in-out,
        box-shadow 0.65s ease-in-out;
    padding: 0.5rem 0.85rem;
    cursor: pointer;
    color: var(--login-foreground);

    &:hover {
        box-shadow: 0 0.4rem 1.35rem color-mix(in srgb, var(--login-accent) 38%, transparent);
    }

    &:focus-visible {
        outline: 0.15rem solid var(--foreground);
        outline-offset: 0.2rem;
    }

    .provider-icon-slot {
        position: relative;
        overflow: hidden;
        flex: 0 0 1rem;
        width: 1rem;
        height: 1rem;
    }

    .provider-icon {
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .label {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
    }

    .label {
        font-size: 0.9rem;
        font-weight: 750;
        letter-spacing: 0.08em;
        line-height: 1;
        text-transform: uppercase;
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`

const ProviderButton = styled.button<{ $provider: OAuthProviderName }>`
    width: min(100%, 21rem);
    border: none;
    background: ${({ $provider }) =>
        $provider === "twitch" ? "var(--oauth-twitch)" : $provider === "discord" ? "var(--oauth-discord)" : "#ffffff"};
    color: ${({ $provider }) => ($provider === "google" ? "#202124" : "#fff")};
    border-radius: 0.6rem;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: 0.2s ease-in-out;

    &:hover {
        transform: scale(1.02);
        filter: brightness(0.94);
    }

    &:active {
        transform: scale(0.96);
        filter: brightness(0.8);
    }
`

const Container = styled(ModalBase)`
    max-height: 40rem !important;
    max-width: 35rem;
    align-items: center;
    gap: 1.25rem;

    .providers {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    p {
        color: var(--foreground);
        text-align: center;

        a {
            color: var(--dracula-cyan);
        }
    }
`

const providerIcons = {
    twitch: FaTwitch,
    google: FaGoogle,
    discord: FaDiscord,
} satisfies Record<OAuthProviderName, ComponentType<{ size?: number }>>

export const LoginModal = () => {
    const t = useTranslations("Auth")
    const locale = useLocale() as AppLocale

    const handleLogin = (provider: OAuthProviderName) => {
        window.location.assign(getOAuthLoginUrl(process.env.NEXT_PUBLIC_API_URL as string, provider))
    }

    return (
        <Container onClick={(event) => event.stopPropagation()}>
            <h1>{t("login")}</h1>
            <div className="providers">
                {OAUTH_PROVIDERS.map((provider) => {
                    const Icon = providerIcons[provider]
                    return (
                        <ProviderButton
                            type="button"
                            $provider={provider}
                            onClick={() => handleLogin(provider)}
                            key={provider}
                        >
                            <Icon size={19} />
                            {t(`loginWith.${provider}`)}
                        </ProviderButton>
                    )
                })}
            </div>
            <p>
                {t.rich("loginAgreement", {
                    terms: (chunks) => (
                        <a href={getTermsUrl(locale)} target="_blank">
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
    const setModalPage = useModalStore((state) => state.setPage)
    const [themeOrder, setThemeOrder] = useState<readonly (typeof LOGIN_THEMES)[number][]>(LOGIN_THEMES)
    const [themeIndex, setThemeIndex] = useState(0)

    useEffect(() => {
        setThemeOrder(shuffleThemes())
    }, [])

    useEffect(() => {
        const interval = window.setInterval(() => {
            setThemeIndex((currentIndex) => (currentIndex + 1) % themeOrder.length)
        }, 2200)

        return () => window.clearInterval(interval)
    }, [themeOrder.length])

    const currentActive = themeOrder[themeIndex] ?? LOGIN_THEMES[0]
    const ActiveProviderIcon = providerIcons[currentActive.provider]

    const openLoginModal = () => {
        setModalPage({ jsx: <LoginModal /> })
    }

    const handleClick = () => {
        openLoginModal()
    }

    return (
        <NavbarButton
            type="button"
            $accent={currentActive.background}
            $foreground={currentActive.foreground}
            data-provider={currentActive.provider}
            // aria-busy={isExiting}
            // disabled={isExiting}
            initial={false}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleClick}
        >
            <AnimatePresence initial={false} mode="sync">
                <div className="relative w-4  overflow-visible">
                    <motion.span
                        className="provider-icon"
                        key={currentActive.provider}
                        initial={{
                            y: "100%",
                            opacity: 0,
                            scale: 1.5,
                        }}
                        animate={{ y: 0, opacity: 1, scale: 1.5 }}
                        exit={{
                            y: "-100%",
                            opacity: 0,
                            scale: 1.5,
                        }}
                        style={{ width: "1rem" }}
                    >
                        <ActiveProviderIcon />
                    </motion.span>
                </div>
            </AnimatePresence>
            <span className="label">{t("loginButton")}</span>
        </NavbarButton>
    )
}

export default LoginButton
