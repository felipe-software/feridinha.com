import useUserData from "@/hooks/useUserData"
import Achievement from "@/components/dashboard/Achievement"
import { AlbunsView } from "@/components/dashboard/AlbunsView"
import Integrations from "@/components/dashboard/IntegrationsBox"
import { UploadsView } from "@/components/dashboard/UploadsView"
import { formatDatePtBr } from "@/utils"
import { AnimatePresence } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import {
    LuCloudUpload,
    LuDot,
    LuPackagePlus,
    LuTicketCheck,
} from "react-icons/lu"
import { AchievementsBox, Column, IdentityCard, PageContainer } from "./styles"

export default function DashboardPage() {
    const user = useUserData()
    const [currentMainView, setCurrentMainView] = useState<
        "uploads" | "albuns"
    >((localStorage.getItem("defaultMainView") || "uploads") as any)

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
        <PageContainer id="uploads-view-box">
            <div className="content-wrapper">
                <IdentityCard>
                    <img className="userPhoto" src={user.data?.profileImage} />
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
                                    {formatDatePtBr(
                                        new Date(user.data.createdAt),
                                    )}
                                </span>
                            </span>
                        </div>
                    </div>
                    <AchievementsBox>
                        <span className="title">Conquistas</span>
                        <div className="row">
                            {user.data?.achievements.map((achievement) => (
                                <Achievement
                                    key={achievement.id}
                                    achievement={achievement}
                                />
                            ))}
                        </div>
                    </AchievementsBox>
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
