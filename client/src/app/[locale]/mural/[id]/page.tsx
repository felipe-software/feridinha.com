"use client"
import { CreatePostForm } from "@/app/mural/_post/_create-post"
import { BasePageContainer } from "@/components/PageTransition"
import { useModalStore } from "@/hooks/useModalStore"
import { use, useEffect, useMemo, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { useWindowVirtualizer } from "@tanstack/react-virtual"

import { MuralCommunityHeading } from "@/app/mural/[id]/_heading"
import { MuralPostItem } from "@/app/mural/_post"
import { usePostListInfiniteQuery } from "@/hooks/queries/usePostListInfiniteQuery"
import useUserData from "@/hooks/useUserData"
import { useQueryState } from "nuqs"
import { useTranslations } from "next-intl"

export default function MuralPostsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const userData = useUserData()
    const t = useTranslations("Mural")
    const listRef = useRef<HTMLDivElement>(null)
    const [scrollMargin, setScrollMargin] = useState(0)

    const isModerator = useMemo(() => {
        if (!userData.data) return null
        return userData.data.moderatedCommunities.some((c) => c.id === id)
    }, [userData.data, id])

    const [filter, setFilter] = useQueryState("filter", {
        defaultValue: "approved",
    })
    const [sortBy, setSortBy] = useQueryState("sortBy", { defaultValue: "upvotes" })
    const [userFilter, _setUserFilter] = useQueryState("username", {})

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = usePostListInfiniteQuery({
        communityId: id,
        limit: 20,
        sortBy: sortBy as "recent" | "upvotes",
        approvalStatus: filter as "approved" | "pending" | "all" | "rejected",
        username: userFilter ?? undefined,
    })

    const { ref: loadMoreRef, inView } = useInView()

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const allPosts = data?.pages.flatMap((p) => p.posts) ?? []

    useEffect(() => {
        if (!listRef.current) return
        const updateScrollMargin = () => {
            if (listRef.current) {
                setScrollMargin(listRef.current.getBoundingClientRect().top + window.scrollY)
            }
        }
        updateScrollMargin()
        window.addEventListener("scroll", updateScrollMargin, { passive: true })
        const observer = new ResizeObserver(updateScrollMargin)
        observer.observe(listRef.current)
        return () => {
            window.removeEventListener("scroll", updateScrollMargin)
            observer.disconnect()
        }
    }, [status, allPosts.length])

    const HEADER_INDEX = 0
    const LOAD_MORE_INDEX = allPosts.length + 1
    const totalCount = 1 + allPosts.length + (hasNextPage ? 1 : 0)

    const virtualizer = useWindowVirtualizer({
        count: totalCount,
        estimateSize: (index) => {
            if (index === HEADER_INDEX) return 200
            if (index >= LOAD_MORE_INDEX) return 80
            return 450
        },
        overscan: 5,
        scrollMargin,
    })

    const handleCreatePost = () => {
        useModalStore.getState().setPage({
            jsx: <CreatePostForm communityId={id} />,
        })
    }

    return (
        <BasePageContainer className="p-4! gap-4 min-h-fit!" style={{ viewTransitionName: "page-content" }}>
            <div ref={listRef} className="w-full max-w-200 flex flex-col">
                {status === "pending" ? (
                    <>
                        <div className="mb-4!">
                            <MuralCommunityHeading
                                isModerator={!!isModerator}
                                setFilter={setFilter}
                                setSortBy={setSortBy}
                                handleCreatePost={handleCreatePost}
                                filter={filter}
                                sortBy={sortBy}
                                userFilter={userFilter}
                                communityId={id}
                            />
                        </div>
                        <p className="text-white/50 text-center py-8">{t("loadingPosts")}</p>
                    </>
                ) : allPosts.length === 0 ? (
                    <>
                        <div className="mb-4!">
                            <MuralCommunityHeading
                                isModerator={!!isModerator}
                                setFilter={setFilter}
                                setSortBy={setSortBy}
                                handleCreatePost={handleCreatePost}
                                filter={filter}
                                sortBy={sortBy}
                                userFilter={userFilter}
                                communityId={id}
                            />
                        </div>
                        <p className="text-white/50 text-center py-8">{t("noPostsFound")}</p>
                    </>
                ) : (
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            if (virtualRow.index === HEADER_INDEX) {
                                return (
                                    <div
                                        key="header"
                                        data-index={virtualRow.index}
                                        ref={virtualizer.measureElement}
                                        className="pb-4!"
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            transform: `translateY(${
                                                virtualRow.start - virtualizer.options.scrollMargin
                                            }px)`,
                                        }}
                                    >
                                        <MuralCommunityHeading
                                            isModerator={!!isModerator}
                                            setFilter={setFilter}
                                            setSortBy={setSortBy}
                                            handleCreatePost={handleCreatePost}
                                            filter={filter}
                                            sortBy={sortBy}
                                            userFilter={userFilter}
                                            communityId={id}
                                        />
                                    </div>
                                )
                            }
                            if (virtualRow.index >= LOAD_MORE_INDEX) {
                                return (
                                    <div
                                        key="load-more"
                                        ref={loadMoreRef}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "80px",
                                            transform: `translateY(${
                                                virtualRow.start - virtualizer.options.scrollMargin
                                            }px)`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {isFetchingNextPage && <p className="text-white/50">{t("loadingMore")}</p>}
                                    </div>
                                )
                            }
                            const item = allPosts[virtualRow.index - 1]
                            return (
                                <div
                                    key={item.id}
                                    data-index={virtualRow.index}
                                    ref={virtualizer.measureElement}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        transform: `translateY(${
                                            virtualRow.start - virtualizer.options.scrollMargin
                                        }px)`,
                                    }}
                                >
                                    <div className="pb-4!">
                                        <MuralPostItem item={item} isModerator={!!isModerator} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </BasePageContainer>
    )
}
