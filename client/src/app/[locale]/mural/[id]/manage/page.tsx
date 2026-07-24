"use client"

import { Button } from "@/components/Button"
import { BasePageContainer } from "@/components/PageTransition"
import { use, useMemo } from "react"
import { useModeratorsQuery } from "@/hooks/queries/useCommunityModsQuery"
import { useModalStore } from "@/hooks/useModalStore"
import useUserData from "@/hooks/useUserData"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { AddModeratorForm } from "@/app/mural/[id]/manage/_add-moderator"
import { ModeratorsTable } from "@/app/mural/[id]/manage/_moderators-table"

export default function MuralManagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const pathname = usePathname()
    const userData = useUserData()
    const modsQuery = useModeratorsQuery({ id })
    const modalStore = useModalStore()
    const t = useTranslations("Mural")

    const isModerator = useMemo(
        () => userData.data?.moderatedCommunities?.some((c) => c.id === id),
        [userData.data, id],
    )

    if (!userData.isLoading && userData.data && !isModerator) {
        router.replace(pathname?.replace("/manage", "") ?? `/mural/${id}`)
        return null
    }

    return (
        <BasePageContainer className="p-4! gap-4 h-fit! ">
            <div className="flex flex-col w-full max-w-240 p-4! py-4! bg-base-dark rounded-2xl gap-4">
                <h3 className="text-white text-3xl">
                    {t("managingCommunity", { id })}
                </h3>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center justify-between gap-4 px-2">
                        <p className="text-white shrink-0">
                            {t("moderators", {
                                count: modsQuery.data?.length ?? 0,
                            })}
                        </p>
                        <Button
                            variant="green"
                            size="semi-slim"
                            onClick={() => {
                                modalStore.setPage({
                                    jsx: <AddModeratorForm communityId={id} />,
                                })
                            }}
                        >
                            {t("addModerator")}
                        </Button>
                    </div>

                    {modsQuery.data && modsQuery.data.length > 0 ? (
                        <ModeratorsTable moderators={modsQuery.data} communityId={id} />
                    ) : (
                        <p className="text-dracula-gray">
                            {modsQuery.isLoading
                                ? t("searchingUsers")
                                : t("noModerators")}
                        </p>
                    )}
                </div>
            </div>
        </BasePageContainer>
    )
}
