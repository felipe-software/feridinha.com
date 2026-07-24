"use client"

import { Button } from "@/components/Button"
import { BaseBox } from "@/components/dashboard/styles"
import queryClient from "@/config/queryClient"
import type {
    LinkedAuthProvider,
    OAuthProviderName,
} from "@/hooks/useUserDataStore"
import apiService from "@/services/api"
import { getOAuthFragmentValue, OAUTH_PROVIDERS } from "@/lib/oauth"
import { FaDiscord, FaGoogle, FaTwitch } from "react-icons/fa6"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "react-toastify"
import styled from "styled-components"

const Container = styled(BaseBox)`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    .account {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        border-radius: 0.55rem;
        background: #1f20296e;
        padding: 0.6rem 0.7rem;
    }

    .provider {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        margin-right: auto;
    }

    .provider strong {
        font-size: 0.9rem;
    }

    .status {
        color: var(--dracula-gray);
        font-size: 0.72rem;
    }

    button {
        flex-shrink: 0;
    }
`

const icons = {
    twitch: FaTwitch,
    google: FaGoogle,
    discord: FaDiscord,
}

interface LinkedAccountsBoxProps {
    linkedAccounts: LinkedAuthProvider[]
}

const LinkedAccountsBox = ({ linkedAccounts }: LinkedAccountsBoxProps) => {
    const t = useTranslations("Dashboard")
    const [pendingProvider, setPendingProvider] =
        useState<OAuthProviderName | null>(null)
    const completionStarted = useRef(false)
    const linked = new Set(linkedAccounts.map((account) => account.provider))

    const refreshUser = async () => {
        await queryClient.invalidateQueries({ queryKey: ["userData"] })
    }

    useEffect(() => {
        if (completionStarted.current) return
        const ticket = getOAuthFragmentValue(
            window.location.hash,
            "oauth-link",
        )
        if (!ticket) return
        completionStarted.current = true

        window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
        )

        void (async () => {
            try {
                const response = await apiService.completeOAuthLink(ticket)
                if (response.success) {
                    toast.success(t("oauthLinkSuccess"))
                    await refreshUser()
                    return
                }
                toast.error(response.error || t("oauthLinkError"))
            } catch {
                toast.error(t("oauthLinkError"))
            }
        })()
    }, [t])

    const connect = async (provider: OAuthProviderName) => {
        setPendingProvider(provider)
        try {
            const response = await apiService.startOAuthLink(provider)
            if (response.success && response.data) {
                window.location.assign(response.data.redirectUrl)
                return
            }
            toast.error(response.success ? t("oauthLinkError") : response.error)
        } catch {
            toast.error(t("oauthLinkError"))
        }
        setPendingProvider(null)
    }

    const disconnect = async (provider: OAuthProviderName) => {
        if (!window.confirm(t("oauthUnlinkConfirm", { provider: t(`oauthProviders.${provider}`) }))) {
            return
        }
        setPendingProvider(provider)
        try {
            const response = await apiService.unlinkOAuthAccount(provider)
            if (response.success) {
                toast.success(t("oauthUnlinkSuccess"))
                await refreshUser()
                return
            }
            toast.error(response.error)
        } catch {
            toast.error(t("oauthLinkError"))
        } finally {
            setPendingProvider(null)
        }
    }

    return (
        <Container>
            <h2 className="title">{t("linkedAccountsTitle")}</h2>
            {OAUTH_PROVIDERS.map((provider) => {
                const Icon = icons[provider]
                const isLinked = linked.has(provider)
                const isLastProvider = isLinked && linked.size === 1

                return (
                    <div className="account" key={provider}>
                        <Icon size={20} aria-hidden="true" />
                        <div className="provider">
                            <strong>{t(`oauthProviders.${provider}`)}</strong>
                            <span className="status">
                                {t(isLinked ? "oauthConnected" : "oauthNotConnected")}
                            </span>
                        </div>
                        <Button
                            variant={isLinked ? "deselect" : "purple"}
                            size="slim"
                            isLoading={pendingProvider === provider}
                            disabled={isLastProvider || pendingProvider !== null}
                            title={isLastProvider ? t("oauthLastProviderHint") : undefined}
                            onClick={() =>
                                isLinked
                                    ? void disconnect(provider)
                                    : void connect(provider)
                            }
                        >
                            {t(isLinked ? "oauthDisconnect" : "oauthConnect")}
                        </Button>
                    </div>
                )
            })}
        </Container>
    )
}

export default LinkedAccountsBox
