"use client"

import { Button } from "@/components/Button"
import type { OAuthProviderName } from "@/hooks/useUserDataStore"
import type {
    OAuthLinkCompletion,
    OAuthMergeAccountPreview,
} from "@/services/api"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { FaDiscord, FaGoogle, FaTwitch } from "react-icons/fa6"
import { LuArrowDown, LuGitMerge, LuShieldCheck, LuTriangleAlert } from "react-icons/lu"
import styled from "styled-components"

type MergeRequest = Extract<OAuthLinkCompletion, { kind: "merge_required" }>

const providerIcons = {
    twitch: FaTwitch,
    google: FaGoogle,
    discord: FaDiscord,
} satisfies Record<OAuthProviderName, typeof FaTwitch>

const Backdrop = styled(motion.div)`
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: 1rem;
    overflow-y: auto;
    background: rgba(7, 8, 14, 0.78);
    backdrop-filter: blur(12px) saturate(0.7);
`

const Dialog = styled(motion.div)`
    width: min(100%, 38rem);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    background: #171820;
    box-shadow: 0 1.5rem 5rem rgba(0, 0, 0, 0.55);
    color: var(--foreground);
    overflow: hidden;

    .content {
        padding: clamp(1.1rem, 4vw, 1.75rem);
    }

    .eyebrow {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        color: #bd93f9;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    h2 {
        margin: 0.65rem 0 0.45rem;
        font-size: clamp(1.35rem, 4vw, 1.8rem);
        line-height: 1.15;
    }

    .description {
        margin: 0;
        color: var(--dracula-gray);
        font-size: 0.9rem;
        line-height: 1.55;
    }

    .accounts {
        display: grid;
        gap: 0.55rem;
        margin: 1.35rem 0;
    }

    .merge-arrow {
        display: grid;
        place-items: center;
        height: 1.5rem;
        color: #6272a4;
    }

    .warning {
        display: flex;
        gap: 0.7rem;
        padding: 0.8rem;
        border: 1px solid rgba(255, 184, 108, 0.22);
        border-radius: 0.65rem;
        background: rgba(255, 184, 108, 0.07);
        color: #f1dfc9;
        font-size: 0.78rem;
        line-height: 1.45;
    }

    .warning svg {
        flex: 0 0 auto;
        margin-top: 0.12rem;
        color: #ffb86c;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.65rem;
        padding: 1rem clamp(1.1rem, 4vw, 1.75rem);
        border-top: 1px solid rgba(255, 255, 255, 0.07);
        background: rgba(0, 0, 0, 0.12);
    }

    @media (max-width: 34rem) {
        .actions {
            flex-direction: column-reverse;
        }

        .actions button {
            justify-content: center;
            width: 100%;
        }
    }
`

const AccountCard = styled.div<{ $kept: boolean }>`
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
    padding: 0.9rem;
    border: 1px solid ${({ $kept }) => ($kept ? "rgba(80, 250, 123, 0.34)" : "rgba(255, 255, 255, 0.08)")};
    border-radius: 0.75rem;
    background: ${({ $kept }) => ($kept ? "rgba(80, 250, 123, 0.06)" : "rgba(255, 255, 255, 0.025)")};

    .provider-icons {
        display: flex;
        align-items: center;
    }

    .provider-icon {
        display: grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        margin-left: -0.35rem;
        border: 2px solid #171820;
        border-radius: 50%;
        background: #282a36;
    }

    .provider-icon:first-child {
        margin-left: 0;
    }

    .account-copy {
        min-width: 0;
    }

    .account-label {
        display: block;
        margin-bottom: 0.15rem;
        color: ${({ $kept }) => ($kept ? "#50fa7b" : "var(--dracula-gray)")};
        font-size: 0.64rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    strong {
        display: flex;
        min-width: 0;
        align-items: baseline;
        gap: 0.35rem;
        overflow: hidden;
        font-size: 1rem;
    }

    .provider-name {
        flex: 0 1 auto;
        overflow: hidden;
        color: ${({ $kept }) => ($kept ? "#8fffa9" : "#d6d7df")};
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .account-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .separator {
        flex: 0 0 auto;
        color: var(--dracula-gray);
        font-weight: 400;
    }

    .kept-icon {
        color: #50fa7b;
    }
`

const Account = ({ account, kept }: { account: OAuthMergeAccountPreview; kept: boolean }) => {
    const t = useTranslations("Dashboard")
    const providerNames = account.providers.map((provider) => t(`oauthProviders.${provider}`)).join(" + ")

    return (
        <AccountCard $kept={kept}>
            <div className="provider-icons" aria-label={providerNames}>
                {account.providers.map((provider) => {
                    const Icon = providerIcons[provider]
                    return (
                        <span className="provider-icon" key={provider} title={t(`oauthProviders.${provider}`)}>
                            <Icon size={17} aria-hidden="true" />
                        </span>
                    )
                })}
            </div>
            <div className="account-copy">
                <span className="account-label">
                    {t(kept ? "oauthMergeAccountKept" : "oauthMergeAccountAbsorbed")}
                </span>
                <strong>
                    <span className="provider-name">{providerNames}</span>
                    <span className="separator" aria-hidden="true">+</span>
                    <span className="account-name">{account.name}</span>
                </strong>
            </div>
            {kept && <LuShieldCheck className="kept-icon" size={22} aria-hidden="true" />}
        </AccountCard>
    )
}

interface AccountMergeDialogProps {
    request: MergeRequest | null
    isLoading: boolean
    onCancel: () => void
    onConfirm: () => void
}

const AccountMergeDialog = ({ request, isLoading, onCancel, onConfirm }: AccountMergeDialogProps) => {
    const t = useTranslations("Dashboard")
    const dialogRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    useEffect(() => {
        if (!request || !mounted) return
        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        dialogRef.current?.focus()

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isLoading) onCancel()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = previousOverflow
            previouslyFocused?.focus()
        }
    }, [isLoading, mounted, onCancel, request])

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {request && (
                <Backdrop
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isLoading) onCancel()
                    }}
                >
                    <Dialog
                        ref={dialogRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="account-merge-title"
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className="content">
                            <span className="eyebrow">
                                <LuGitMerge size={15} aria-hidden="true" />
                                {t("oauthMergeEyebrow")}
                            </span>
                            <h2 id="account-merge-title">{t("oauthMergeTitle")}</h2>
                            <p className="description">{t("oauthMergeDescription")}</p>

                            <div className="accounts">
                                <Account account={request.accountToMerge} kept={false} />
                                <div className="merge-arrow" aria-hidden="true">
                                    <LuArrowDown size={20} />
                                </div>
                                <Account account={request.accountToKeep} kept />
                            </div>

                            <div className="warning">
                                <LuTriangleAlert size={17} aria-hidden="true" />
                                <span>{t("oauthMergeWarning")}</span>
                            </div>
                        </div>
                        <div className="actions">
                            <Button variant="deselect" disabled={isLoading} onClick={onCancel}>
                                {t("oauthMergeCancel")}
                            </Button>
                            <Button variant="red" isLoading={isLoading} disabled={isLoading} onClick={onConfirm}>
                                {t("oauthMergeConfirmAction")}
                            </Button>
                        </div>
                    </Dialog>
                </Backdrop>
            )}
        </AnimatePresence>,
        document.body,
    )
}

export default AccountMergeDialog
