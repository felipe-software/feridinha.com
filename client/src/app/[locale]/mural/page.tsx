"use client"
import { Button } from "@/components/Button"
import { BasePageContainer } from "@/components/PageTransition"
import { useCommunitiesQuery } from "@/hooks/queries/useCommunitiesQuery"
import { toTitleCase } from "@/utils"
import dayjs from "dayjs"
import "dayjs/locale/en"
import "dayjs/locale/pt-br"
import relativeTime from "dayjs/plugin/relativeTime"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
dayjs.extend(relativeTime)

import { useEffect } from "react"
import { LuCalendar, LuMessageSquareMore, LuUsers } from "react-icons/lu"

export default function MuralPage() {
    // const postsQuery = usePostListQuery()
    const communitiesQuery = useCommunitiesQuery()
    const router = useRouter()
    const locale = useLocale()
    const t = useTranslations("Mural")

    useEffect(() => {
        document.documentElement.style.setProperty("--nav-highlight", "var(--dracula-green)")
    }, [])

    useEffect(() => {
        dayjs.locale(locale === "pt-BR" ? "pt-br" : "en")
    }, [locale])

    return (
        <BasePageContainer className="" style={{ viewTransitionName: "page-content" }}>
            <div className="flex w-full  flex-1 flex-col  items-center p-4!">
                <div className="w-full max-w-240 flex flex-row justify-center py-8! gap-4">
                    {communitiesQuery.data?.map((com) => (
                        <div key={com.id} className="flex flex-col gap-2 bg-base-dark p-4! pt-6! rounded-xl min-w-100">
                            <p className="text-white text-2xl font-semibold leading-4">{toTitleCase(com.name)}</p>
                            <p className="text-white/70 text-md leading-6">{com.description}</p>

                            <div className="flex flex-row gap-2 items-center ">
                                <div className="flex flex-row gap-2 text-white bg-dracula-gray/30 p-2! rounded-2xl items-center">
                                    <LuMessageSquareMore />
                                    {t("communityPosts", { count: com._count.posts })}
                                </div>
                                <div className="flex flex-row gap-2 text-white bg-dracula-gray/30 p-2! rounded-2xl items-center">
                                    <LuUsers />
                                    {t("communityUsers", { count: com.memberIds.length })}
                                </div>
                                <div className="flex flex-row gap-2 text-white bg-dracula-gray/30 p-2! rounded-2xl items-center">
                                    <LuUsers />
                                    {t("communityMods", { count: com.moderatorIds.length })}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4! justify-between">
                                <Button
                                    variant="green"
                                    // className="mt-4!"
                                    onClick={() => {
                                        router.push(`/mural/${com.id}`)
                                    }}
                                >
                                    {t("visit")}
                                </Button>
                                <div className="flex flex-row gap-2 text-white/50  p-2! rounded-2xl items-center ">
                                    <LuCalendar />
                                    {t("createdAgo", { time: dayjs(com.createdAt).fromNow() })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </BasePageContainer>
    )
}
