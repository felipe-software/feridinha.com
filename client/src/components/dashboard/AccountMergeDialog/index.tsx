"use client"

import { Button } from "@/components/Button"
import {
    AccountCard,
    Backdrop,
    Dialog,
} from "./styles"
import type { OAuthProviderName } from "@/hooks/useUserDataStore"
import type {
    OAuthLinkCompletion,
    OAuthMergeAccountPreview,
} from "@/services/api"
import { AnimatePresence } from "motion/react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { FaDiscord, FaGoogle, FaTwitch } from "react-icons/fa6"
import { LuArrowDown, LuGitMerge, LuShieldCheck, LuTriangleAlert } from "react-icons/lu"

type MergeRequest = Extract<OAuthLinkCompletion, { kind: "merge_required" }>

const providerIcons = {
    twitch: FaTwitch,
    google: FaGoogle,
    discord: FaDiscord,
} satisfies Record<OAuthProviderName, typeof FaTwitch>

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
