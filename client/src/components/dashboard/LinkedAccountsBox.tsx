"use client"

import { Button } from "@/components/Button"
import AccountMergeDialog from "@/components/dashboard/AccountMergeDialog"
import { BaseBox } from "@/components/dashboard/styles"
import queryClient from "@/config/queryClient"
import type {
    LinkedAuthProvider,
    OAuthProviderName,
} from "@/hooks/useUserDataStore"
import apiService from "@/services/api"
import type { OAuthLinkCompletion } from "@/services/api"
import {
    getOAuthFragmentValue,
    OAUTH_PROVIDERS,
} from "@/lib/oauth"
import { FaDiscord, FaGoogle, FaTwitch } from "react-icons/fa6"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
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

    .link-retry {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.6rem 0.7rem;
        border-radius: var(--border-radius-s);
        background: var(--base);
    }

    .link-retry span {
        font-size: 0.8rem;
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

type MergeRequest = Extract<OAuthLinkCompletion, { kind: "merge_required" }>

const LinkedAccountsBox = ({ linkedAccounts }: LinkedAccountsBoxProps) => {
    const t = useTranslations("Dashboard")
    const [pendingProvider, setPendingProvider] =
        useState<OAuthProviderName | null>(null)
    const [mergeRequest, setMergeRequest] = useState<MergeRequest | null>(null)
    const [isMerging, setIsMerging] = useState(false)
    const [isCompletingLink, setIsCompletingLink] = useState(false)
    const [canRetryLink, setCanRetryLink] = useState(false)
    const completionStarted = useRef(false)
    const completionInFlight = useRef(false)
    const completionTicket = useRef<string | null>(null)
    const linked = new Set(linkedAccounts.map((account) => account.provider))

    const refreshUser = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["userData"] })
    }, [])

    const refreshMergedAccount = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["userData"] }),
            queryClient.invalidateQueries({ queryKey: ["my-albums"] }),
            queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
        ])
    }

    const completePendingLink = useCallback(async () => {
        const ticket = completionTicket.current
        if (!ticket || completionInFlight.current) return

        completionInFlight.current = true
        setIsCompletingLink(true)
        try {
            const response = await apiService.completeOAuthLink(ticket)
            completionTicket.current = null
            setCanRetryLink(false)
            if (!response.success || !response.data) {
                toast.error(response.success ? t("oauthLinkError") : response.error)
                return
            }

            if (response.data.kind === "linked") {
                toast.success(t("oauthLinkSuccess"))
                await refreshUser()
                return
            }
            setMergeRequest(response.data)
        } catch {
            setCanRetryLink(true)
            toast.error(t("oauthLinkRetryError"))
        } finally {
            completionInFlight.current = false
            setIsCompletingLink(false)
        }
    }, [refreshUser, t])

    useEffect(() => {
        if (completionStarted.current) return
        const ticket = getOAuthFragmentValue(
            window.location.hash,
            "oauth-link",
        )
        if (!ticket) return
        completionStarted.current = true
        completionTicket.current = ticket

        window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
        )

        void completePendingLink()
    }, [completePendingLink])

    const cancelMerge = () => {
        if (isMerging) return
        setMergeRequest(null)
        toast.info(t("oauthMergeCancelled"))
    }

    const confirmMerge = async () => {
        if (!mergeRequest || isMerging) return
        setIsMerging(true)
        try {
            const response = await apiService.completeOAuthMerge(mergeRequest.ticket)
            if (!response.success) {
                toast.error(response.error || t("oauthLinkError"))
                setMergeRequest(null)
                return
            }
            setMergeRequest(null)
            toast.success(t("oauthMergeSuccess"))
            await refreshMergedAccount()
        } catch {
            setMergeRequest(null)
            toast.error(t("oauthLinkError"))
            await refreshUser()
        } finally {
            setIsMerging(false)
        }
    }

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
        <>
            <Container>
                <h2 className="title">{t("linkedAccountsTitle")}</h2>
                {canRetryLink && (
                    <div className="link-retry" role="alert">
                        <span>{t("oauthLinkRetryDescription")}</span>
                        <Button
                            variant="purple"
                            size="slim"
                            isLoading={isCompletingLink}
                            disabled={isCompletingLink}
                            onClick={() => void completePendingLink()}
                        >
                            {t("oauthLinkRetry")}
                        </Button>
                    </div>
                )}
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
            <AccountMergeDialog
                request={mergeRequest}
                isLoading={isMerging}
                onCancel={cancelMerge}
                onConfirm={() => void confirmMerge()}
            />
        </>
    )
}

export default LinkedAccountsBox
