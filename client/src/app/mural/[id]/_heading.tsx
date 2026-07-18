"use client"
import { Button } from "@/components/Button"

import { filterToLabel, orderToLabel } from "@/app/mural/[id]/_constants"
import { Selector } from "@/components/ui/Selector"
import useUserData from "@/hooks/useUserData"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { LuArrowUpDown, LuChevronLeft, LuFilter, LuSquarePlus } from "react-icons/lu"

export const MuralCommunityHeading = ({
    isModerator,
    setFilter,
    setSortBy,
    handleCreatePost,
    filter,
    sortBy,
    userFilter,
    communityId,
}: {
    isModerator: boolean
    setFilter: (d: string) => void
    setSortBy: (d: string) => void
    handleCreatePost: () => void
    filter: string
    sortBy: string
    userFilter: string | null
    communityId: string
}) => {
    const router = useRouter()
    const pathname = usePathname()
    const userData = useUserData()
    const t = useTranslations("Mural")
    return (
        <div className="flex flex-col w-full max-w-240 p-4! py-4! bg-base-dark  gap-4 rounded-2xl">
            <div className="flex flex-row justify-between items-center gap-2">
                <div className="flex flex-row gap-1 text-white bg-dracula-base px-3! py-1!  rounded-2xl">
                    <p className="font-medium">Mural {communityId}</p>
                    {isModerator && (
                        <>
                            <p>•</p>
                            <p>{t("youAreModerator")}</p>
                        </>
                    )}
                </div>

                <div className="flex flex-row gap-4">
                    {isModerator && (
                        <Link className="text-dracula-cyan" href={`${pathname}/manage`}>
                            {t("manageCommunity")}
                        </Link>
                    )}
                    {userData.data && userFilter !== userData.data.name && (
                        <Link className="text-dracula-cyan" href={`${pathname}?username=${userData.data?.name}`}>
                            {t("myPosts")}
                        </Link>
                    )}
                </div>
            </div>
            <div className="w-full h-px bg-white/5"></div>
            <div className="flex-row flex items-center justify-between rounded-2xl   top-1 z-10">
                <Button
                    icon={<LuChevronLeft size={4} />}
                    variant="deselect"
                    onClick={() => {
                        router.back()
                    }}
                    size="semi-slim"
                    className="pl-1! bg-dracula-base!"
                >
                    Voltar
                </Button>

                <div className="flex flex-row items-center gap-2">
                    <Selector
                        options={[t("filterApproved"), t("filterPending"), t("filterRejected")]}
                        keys={Object.keys(filterToLabel)}
                        onClick={setFilter}
                        selected={filter}
                        icon={<LuFilter />}
                    ></Selector>
                    <Selector
                        options={[t("sortPopular"), t("sortRecent")]}
                        keys={Object.keys(orderToLabel)}
                        onClick={setSortBy}
                        selected={sortBy}
                        icon={<LuArrowUpDown />}
                    ></Selector>
                    <Button variant="green" onClick={handleCreatePost} icon={<LuSquarePlus />} size="semi-slim">
                        {t("createPostButton")}
                    </Button>
                </div>
            </div>
            {userFilter && <div className="w-full h-px bg-white/5"></div>}
            {userFilter && <p className="text-white">{t("showingOnlyUserPosts", { user: userFilter })}</p>}
        </div>
    )
}
