"use client"

import { Button } from "@/components/Button"
import AccountMergeDialog from "@/components/dashboard/AccountMergeDialog"
import { BaseBox } from "@/components/dashboard/styles"
import type {
    LinkedAuthProvider,
    OAuthProviderName,
} from "@/hooks/useUserDataStore"
import type { OAuthLinkCompletion } from "@/services/api"
import {
    useCompleteOAuthLinkMutation,
    useCompleteOAuthMergeMutation,
    useStartOAuthLinkMutation,
    useUnlinkOAuthAccountMutation,
} from "@/hooks/mutations/useOAuthMutations"
import { USER_DATA_QUERY_KEY } from "@/hooks/queries/useUserDataQuery"
import {
    getOAuthFragmentValue,
    OAUTH_PROVIDERS,
} from "@/lib/oauth"
import { FaDiscord, FaGoogle, FaTwitch } from "react-icons/fa6"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "react-toastify"
import styled from "styled-components"
import { useQueryClient } from "@tanstack/react-query"

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

type MergeRequest = Extract<OAuthLinkCompletion, { kind: "merge_required" }>

const LinkedAccountsBox = ({ linkedAccounts }: LinkedAccountsBoxProps) => {
    const t = useTranslations("Dashboard")
    const [mergeRequest, setMergeRequest] = useState<MergeRequest | null>(null)
    const completionStarted = useRef(false)
    const queryClient = useQueryClient()
    const linked = new Set(linkedAccounts.map((account) => account.provider))

    const completeLinkMutation = useCompleteOAuthLinkMutation({
        onSuccess: async (response) => {
            if (!response.success || !response.data) {
                toast.error(response.success ? t("oauthLinkError") : response.error)
                return
            }

            if (response.data.kind === "linked") {
                toast.success(t("oauthLinkSuccess"))
                await queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY })
                return
            }
            setMergeRequest(response.data)
        },
        onError: () => {
            toast.error(t("oauthLinkError"))
        },
    })

    const completeMergeMutation = useCompleteOAuthMergeMutation({
        onSuccess: async (response) => {
            if (!response.success) {
                toast.error(response.error || t("oauthLinkError"))
                setMergeRequest(null)
                return
            }
            setMergeRequest(null)
            toast.success(t("oauthMergeSuccess"))
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY }),
                queryClient.invalidateQueries({ queryKey: ["my-albums"] }),
                queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
            ])
        },
        onError: async () => {
            setMergeRequest(null)
            toast.error(t("oauthLinkError"))
            await queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY })
        },
    })

    const startLinkMutation = useStartOAuthLinkMutation({
        onSuccess: (response) => {
            if (response.success && response.data) {
                window.location.assign(response.data.redirectUrl)
                return
            }
            toast.error(response.success ? t("oauthLinkError") : response.error)
        },
        onError: () => {
            toast.error(t("oauthLinkError"))
        },
    })

    const unlinkMutation = useUnlinkOAuthAccountMutation({
        onSuccess: async (response) => {
            if (!response.success) {
                toast.error(response.error)
                return
            }
            toast.success(t("oauthUnlinkSuccess"))
            await queryClient.invalidateQueries({ queryKey: USER_DATA_QUERY_KEY })
        },
        onError: () => {
            toast.error(t("oauthLinkError"))
        },
    })

    const completeLink = completeLinkMutation.mutate
    const pendingProvider = startLinkMutation.isPending
        ? startLinkMutation.variables
        : unlinkMutation.isPending
          ? unlinkMutation.variables
          : null
    const isProviderMutationPending =
        startLinkMutation.isPending || unlinkMutation.isPending

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

        completeLink(ticket)
    }, [completeLink])

    const cancelMerge = () => {
        if (completeMergeMutation.isPending) return
        setMergeRequest(null)
        toast.info(t("oauthMergeCancelled"))
    }

    const confirmMerge = () => {
        if (!mergeRequest || completeMergeMutation.isPending) return
        completeMergeMutation.mutate(mergeRequest.ticket)
    }

    const connect = (provider: OAuthProviderName) => {
        if (isProviderMutationPending) return
        startLinkMutation.mutate(provider)
    }

    const disconnect = (provider: OAuthProviderName) => {
        if (!window.confirm(t("oauthUnlinkConfirm", { provider: t(`oauthProviders.${provider}`) }))) {
            return
        }
        if (isProviderMutationPending) return
        unlinkMutation.mutate(provider)
    }

    return (
        <>
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
                                disabled={isLastProvider || isProviderMutationPending}
                                title={isLastProvider ? t("oauthLastProviderHint") : undefined}
                                onClick={() =>
                                    isLinked
                                        ? disconnect(provider)
                                        : connect(provider)
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
                isLoading={completeMergeMutation.isPending}
                onCancel={cancelMerge}
                onConfirm={confirmMerge}
            />
        </>
    )
}

export default LinkedAccountsBox
