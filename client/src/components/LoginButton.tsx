import { useModalStore } from "@/hooks/useModalStore"
import { useLocale, useTranslations } from "next-intl"
import { ModalBase } from "@/components/ViewFileModal"
import { FaDiscord, FaGoogle, FaTwitch } from "react-icons/fa6"
import { LuLogIn } from "react-icons/lu"
import styled from "styled-components"
import type { AppLocale } from "@/i18n/config"
import { getTermsUrl } from "@/lib/seo"
import type { OAuthProviderName } from "@/hooks/useUserDataStore"
import { getOAuthLoginUrl, OAUTH_PROVIDERS } from "@/lib/oauth"
import type { ComponentType } from "react"

const NavbarButton = styled.button`
    position: relative;
    background-color: rgb(144, 72, 249);
    border: none;
    border-radius: var(--border-radius-ss);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.6rem;
    box-shadow: 0 0 5px 2px rgb(144 72 249 / 25%);
    transition: 0.2s ease;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    color: #f8f8f8;

    &:hover {
        background-color: #6724ca;
        box-shadow: 0 0 15px 5px rgb(144 72 249 / 25%);
    }

    span {
        font-size: 1rem;
        font-weight: 600;
        text-shadow: 0 0 2px #000;
    }
`

const ProviderButton = styled.button<{ $provider: OAuthProviderName }>`
    width: min(100%, 21rem);
    border: 1px solid
        ${({ $provider }) =>
            $provider === "twitch"
                ? "#9146ff"
                : $provider === "discord"
                  ? "#5865f2"
                  : "#dadce0"};
    background: ${({ $provider }) =>
        $provider === "twitch"
            ? "#9146ff"
            : $provider === "discord"
              ? "#5865f2"
              : "#ffffff"};
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
    transition:
        transform 0.15s ease,
        filter 0.15s ease;

    &:hover {
        transform: translateY(-1px);
        filter: brightness(0.94);
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
        window.location.assign(
            getOAuthLoginUrl(
                process.env.NEXT_PUBLIC_API_URL as string,
                provider,
            ),
        )
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
    const modal = useModalStore()

    return (
        <NavbarButton
            type="button"
            onClick={() => modal.setPage({ jsx: <LoginModal /> })}
        >
            <LuLogIn size={18} aria-hidden="true" />
            <span>{t("loginButton")}</span>
        </NavbarButton>
    )
}

export default LoginButton
