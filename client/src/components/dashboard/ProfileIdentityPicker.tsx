"use client"

import queryClient from "@/config/queryClient"
import Tooltip from "@/components/Tooltip"
import type { LinkedAuthProvider, OAuthProviderName } from "@/hooks/useUserDataStore"
import apiService from "@/services/api"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"
import { FaDiscord, FaGoogle, FaTwitch } from "react-icons/fa6"
import { LuCheck, LuPencil } from "react-icons/lu"
import { toast } from "react-toastify"
import { ProfileMenu, ProfilePicker } from "./styles"

const providerVisuals = {
    twitch: { Icon: FaTwitch, color: "#9146ff" },
    google: { Icon: FaGoogle, color: "#4285f4" },
    discord: { Icon: FaDiscord, color: "#5865f2" },
} satisfies Record<OAuthProviderName, { Icon: typeof FaTwitch; color: string }>

interface ProfileIdentityPickerProps {
    accounts: LinkedAuthProvider[]
}

const ProfileIdentityPicker = ({ accounts }: ProfileIdentityPickerProps) => {
    const t = useTranslations("Dashboard")
    const tooltipRef = useRef<{ hide: () => void } | null>(null)
    const [pendingProvider, setPendingProvider] = useState<OAuthProviderName | null>(null)

    const selectProfile = async (account: LinkedAuthProvider) => {
        if (account.isPrimary || pendingProvider) return
        setPendingProvider(account.provider)
        try {
            const response = await apiService.setPrimaryOAuthAccount(account.provider)
            if (!response.success) {
                toast.error(response.error || t("oauthPrimaryProfileError"))
                return
            }
            tooltipRef.current?.hide()
            toast.success(t("oauthPrimaryProfileSuccess"))
            await queryClient.invalidateQueries({ queryKey: ["userData"] })
        } catch {
            toast.error(t("oauthPrimaryProfileError"))
        } finally {
            setPendingProvider(null)
        }
    }

    const menu = (
        <ProfileMenu>
            <strong>{t("oauthPrimaryProfile")}</strong>
            <p>{t("oauthPrimaryProfileHint")}</p>
            <div className="profile-options">
                {accounts.map((account) => {
                    const { Icon, color } = providerVisuals[account.provider]
                    return (
                        <button
                            type="button"
                            key={account.provider}
                            disabled={account.isPrimary || pendingProvider !== null}
                            onClick={() => void selectProfile(account)}
                        >
                            <span className="option-avatar">
                                {/* Provider avatar hosts are dynamic and cannot use a fixed Next Image allowlist. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={account.profileImage} alt="" />
                                <span className="provider-icon" style={{ color }}>
                                    <Icon size={10} aria-hidden="true" />
                                </span>
                            </span>
                            <span className="option-copy">
                                <span className="provider-name" style={{ color }}>
                                    {t(`oauthProviders.${account.provider}`)}
                                </span>
                                <span className="identity-name">{account.name}</span>
                            </span>
                            <span className="option-status">
                                {account.isPrimary
                                    ? <><LuCheck size={14} /> {t("oauthPrimaryProfileCurrent")}</>
                                    : t("oauthPrimaryProfileUse")}
                            </span>
                        </button>
                    )
                })}
            </div>
        </ProfileMenu>
    )

    return (
        <ProfilePicker>
            <Tooltip
                content={menu}
                interactive
                trigger="click"
                placement="right"
                maxWidth="none"
                appendTo={() => document.body}
                zIndex={20000}
                onCreate={(instance) => { tooltipRef.current = instance }}
                onDestroy={() => { tooltipRef.current = null }}
            >
                <button
                    type="button"
                    className="profile-trigger"
                    title={t("oauthPrimaryProfileOpen")}
                    aria-label={t("oauthPrimaryProfileOpen")}
                >
                    <LuPencil size={17} strokeWidth={2.5} aria-hidden="true" />
                </button>
            </Tooltip>
        </ProfilePicker>
    )
}

export default ProfileIdentityPicker
