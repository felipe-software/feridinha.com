import { PostReviewControls } from "@/app/mural/_post/_actions"
import { PostPlayer } from "@/app/mural/_post/player"
import { Button } from "@/components/Button"
import Tooltip from "@/components/Tooltip"
import { usePostModerationMutation } from "@/hooks/mutations/usePostModerationMutation"
import { $ApiMuralListItem } from "api-types"
import dayjs from "dayjs"
import "dayjs/locale/en"
import "dayjs/locale/es"
import "dayjs/locale/pt-br"
import relativeTime from "dayjs/plugin/relativeTime"
import { useLocale, useTranslations } from "next-intl"
import { LuBan, LuCircleCheck, LuExternalLink, LuSword } from "react-icons/lu"
import styled from "styled-components"
import { DAYJS_LOCALES, type AppLocale } from "@/i18n/config"
dayjs.extend(relativeTime)

const PostWrapper = styled.div`
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;

    background-color: var(--base-dark);
    --max-height: 45rem;
    outline: 1px solid #ffffff0b;

    .media-controller {
        max-height: var(--max-height);
        width: 100%;

        video {
            height: 100% !important;
            width: 100% !important;
        }

        --media-button-padding: 10px;
        --media-control-height: 36px;

        --media-control-transition-in: opacity 0.1s ease; /* aparece */
        --media-control-transition-out: opacity 0.1s ease; /* some */
    }
    overflow: hidden;

    .tag {
        background-color: rgb(40, 42, 54, 0.75);
        padding: 0.5rem 0.5rem;
        border-radius: 2rem;
        color: white;
    }

    /* ._vote-container svg path:first-child {
        display: none;
    } */

    /* ._vote-container svg {
        transform: scale(1.2);
    } */
    ._vote-container button {
    }
`

const toTitleCase = (str: string) => {
    const firstLetter = str.charAt(0).toUpperCase()
    return firstLetter + str.slice(1).toLowerCase()
}

const approvalStatusToText = (status: string) => {
    switch (status) {
        case "approved":
            return "approvalApproved"
        case "pending":
            return "approvalPending"
        case "rejected":
            return "approvalRejected"
    }
}

export const MuralPostItem = ({ item, isModerator }: { item: $ApiMuralListItem; isModerator: boolean }) => {
    const moderateMutation = usePostModerationMutation()
    const locale = useLocale() as AppLocale
    const t = useTranslations("Mural")
    dayjs.locale(DAYJS_LOCALES[locale])

    return (
        <PostWrapper className="gap-4 rounded-2xl">
            <div className="post-header flex flex-col gap-0 text-lg font-semibold items-start justify-between w-full px-1">
                <div className="flex flex-row gap-2 items-center mb-2!">
                    <img src={item.user.profileImage.replace("300x300", "50x50")} className="h-6 rounded-full"></img>
                    <p className="flex flex-row gap-1 items-center ">
                        <span className="font-bold leading-4 text-sm" style={{ color: item.user.color }}>
                            @{item.user.name}
                        </span>

                        <span className="text-white/70 text-xs">
                            {"• "}
                            {locale === "pt-BR"
                                ? `${dayjs(item.createdAt).fromNow().replace("há ", "")} ${t("agoSuffix")}`
                                : dayjs(item.createdAt).fromNow()}
                        </span>
                    </p>
                </div>
                <p className="text-xl text-white font-semibold leading-5">
                    {item.title}
                    {/* My grandma just sent me a meme. We have come full circle. */}
                </p>
            </div>
            <div className="h-fit w-full bg-dracula-base/50 flex justify-center rounded-sm">
                {item.contentType === "VIDEO" ? (
                    <PostPlayer src={item.processedContent!} />
                ) : (
                    <img className="h-full max-h-100 object-fit rounded-xs" src={item.processedContent!} />
                )}
            </div>

            <div className="flex  w-full">
                <div className="flex flex-row items-center gap-2 w-full">
                    <PostReviewControls item={item} />
                    <div className="flex  gap-2 items-center">
                        <a href={item.bareContent} className="tag items-center flex gap-2 pr-3!" style={{ textDecoration: "none" }}>
                            <LuExternalLink />
                            {toTitleCase(item.contentOrigin)}
                        </a>
                    </div>

                    {isModerator && (
                        <div className="_mod-actions flex flex-row gap-2 items-center">
                            <Tooltip
                                content={item.approvedById ? t("approvedBy", { user: item.approvedById }) : null}
                                disabled={!item.approvedById}
                            >
                                <div className="flex flex-row gap-1 tag items-center pr-3!">
                                    <LuSword className="rotate-y-180" />
                                    <p className="text-white">
                                        {t(
                                            approvalStatusToText(
                                                item.approvalStatus,
                                            ) ?? "approvalPending",
                                        )}
                                    </p>
                                </div>
                            </Tooltip>
                            {!item.approvedById && (
                                <div className="flex flex-row gap-2">
                                    <Tooltip content={t("rejectPost")}>
                                        <Button
                                            variant="red"
                                            icon={<LuBan />}
                                            size="slim"
                                            onClick={() => {
                                                moderateMutation.mutateAsync({
                                                    approved: false,
                                                    id: item.id,
                                                    reason: "N/A",
                                                })
                                            }}
                                        ></Button>
                                    </Tooltip>
                                    <Tooltip content={t("approvePost")}>
                                        <Button
                                            variant="green"
                                            icon={<LuCircleCheck />}
                                            size="slim"
                                            onClick={() => {
                                                moderateMutation.mutateAsync({
                                                    approved: true,
                                                    id: item.id,
                                                })
                                            }}
                                        ></Button>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PostWrapper>
    )
}
