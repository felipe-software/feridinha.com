"use client"

export const dynamic = "force-dynamic"

import PrivateRoute from "@/components/PrivateRoute"
import useUserData from "@/hooks/useUserData"
import Achievement from "@/components/dashboard/Achievement"
import { AlbunsView } from "@/components/dashboard/AlbunsView"
import Integrations from "@/components/dashboard/IntegrationsBox"
import LinkedAccountsBox from "@/components/dashboard/LinkedAccountsBox"
import ProfileIdentityPicker from "@/components/dashboard/ProfileIdentityPicker"
import { UploadsView } from "@/components/dashboard/UploadsView"
import { AnimatePresence } from "motion/react"
import { useFormatter, useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import {
    LuCloudUpload,
    LuDot,
    LuPackagePlus,
    LuTicketCheck,
} from "react-icons/lu"
import {
    AchievementsBox,
    Column,
    IdentityCard,
    PageContainer,
} from "@/components/dashboard/styles"

function DashboardPage() {
    const user = useUserData()
    const t = useTranslations("Dashboard")
    const format = useFormatter()
    const [currentMainView, setCurrentMainView] = useState<
        "uploads" | "albuns"
    >(
        ((typeof window !== "undefined"
            ? localStorage.getItem("defaultMainView")
            : "uploads") as "uploads" | "albuns") || "uploads",
    )

    useEffect(() => {
        localStorage.setItem("defaultMainView", currentMainView)
    }, [currentMainView])

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--nav-highlight",
            "var(--dracula-cyan)",
        )
    }, [])

    const handleChangeView = useCallback(
        (newView: "uploads" | "albuns") => {
            setCurrentMainView(newView)
        },
        [setCurrentMainView],
    )

    if (!user.data) return null

    return (
        <PageContainer id="uploads-view-box" style={{ viewTransitionName: "page-content" }}>
            <div className="content-wrapper">
                <IdentityCard>
                    <div className="profile-photo">
                        {/* OAuth profile images use provider-controlled hosts. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="userPhoto" src={user.data.profileImage} alt="" />
                        <ProfileIdentityPicker accounts={user.data.authProviders} />
                    </div>
                    <div className="column">
                        <h1 className="userName">{user.data.name}</h1>
                        <div className="userStats">
                            <span className="userRole">{user.data.role}</span>
                            <LuDot className="dot" />
                            <span className="group">
                                <LuCloudUpload />
                                <span>{user.data.uploadCount}</span>
                            </span>
                            <LuDot className="dot" />
                            <span className="group">
                                <LuPackagePlus />
                                <span>{user.data.readableLimit} MB</span>
                            </span>
                            <LuDot className="dot" />
                            <span className="group">
                                <LuTicketCheck />
                                <span>
                                    {format.dateTime(
                                        new Date(user.data.createdAt),
                                        {
                                            day: "numeric",
                                            month: "numeric",
                                            year: "numeric",
                                        },
                                    )}
                                </span>
                            </span>
                        </div>
                    </div>
                    <AchievementsBox>
                        <span className="title">{t("achievements")}</span>
                        <div className="row">
                            {user.data?.achievements.map((achievement) => (
                                <Achievement
                                    key={achievement.id}
                                    achievement={achievement}
                                />
                            ))}
                        </div>
                    </AchievementsBox>
                    <LinkedAccountsBox
                        linkedAccounts={user.data.authProviders}
                    />
                    <Integrations />
                </IdentityCard>

                <Column>
                    <AnimatePresence mode="popLayout">
                        {currentMainView === "uploads" && (
                            <UploadsView
                                key={"er"}
                                handleChangeView={handleChangeView}
                            />
                        )}
                        {currentMainView === "albuns" && (
                            <AlbunsView
                                key={"er"}
                                handleChangeView={handleChangeView}
                            />
                        )}
                    </AnimatePresence>
                </Column>
            </div>
        </PageContainer>
    )
}

export default function DashboardPageWrapper() {
    return (
        <PrivateRoute>
            <DashboardPage />
        </PrivateRoute>
    )
}
