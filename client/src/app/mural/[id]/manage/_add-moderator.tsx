"use client"

import { MyInputWrapper } from "@/app/mural/_post/_create-post"
import { createAddModeratorSchema } from "@/app/mural/_validations"
import { Button } from "@/components/Button"
import Tooltip from "@/components/Tooltip"
import { useDebounce } from "@/hooks/useDebounce"
import { useAddModeratorMutation } from "@/hooks/mutations/useModeratorMutations"
import { useFindUserQuery } from "@/hooks/queries/useFindUserQuery"
import { useModalStore } from "@/hooks/useModalStore"
import { zodResolver } from "@hookform/resolvers/zod"
import type { $ApiMuralCommunityModeratorPreview } from "api-types"
import { useTranslations } from "next-intl"
import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import styled from "styled-components"
import z from "zod"

const Modal = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background-color: var(--base-dark);
    border-radius: 1rem;
    padding: 1rem;
    width: 100%;
`

const InputWrapper = styled.div`
    width: 100%;
`

const ResultsList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 12rem;
    overflow-y: auto;
    min-width: 12rem;
`

const ResultItem = styled.li`
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background-color: var(--base);
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--base-light);
    }
`

const SelectedBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    background-color: var(--base);
    font-size: 0.9rem;
`

export const AddModeratorForm = ({ communityId }: { communityId: string }) => {
    const t = useTranslations("Mural")
    const [selectedUser, setSelectedUser] =
        useState<$ApiMuralCommunityModeratorPreview | null>(null)
    const addModMutation = useAddModeratorMutation()
    const schema = useMemo(
        () =>
            createAddModeratorSchema({
                minQuery: t("moderatorQueryMin"),
            }),
        [t],
    )
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { query: "" },
        mode: "onChange",
    })
    const modalStore = useModalStore()

    const query = form.watch("query")
    const debouncedQuery = useDebounce(query ?? "", 500)
    const findUserQuery = useFindUserQuery({ q: debouncedQuery, communityId })
    const errors = form.formState.errors

    const showTooltip = (query?.length ?? 0) >= 3 && !selectedUser
    const isWaitingDebounce =
        (query?.length ?? 0) >= 3 && (debouncedQuery?.length ?? 0) < 3

    const tooltipContent = showTooltip ? (
        <>
            {(isWaitingDebounce || findUserQuery.isFetching) && (
                <p className="text-dracula-gray">{t("searchingUsers")}</p>
            )}
            {!isWaitingDebounce &&
                !findUserQuery.isFetching &&
                findUserQuery.data &&
                findUserQuery.data.length > 0 && (
                    <ResultsList>
                        {findUserQuery.data.map((user) => (
                            <ResultItem
                                key={user.id}
                                onClick={() => {
                                    setSelectedUser(user)
                                }}
                            >
                                <span
                                    style={{
                                        color: user.color,
                                        fontWeight: 500,
                                    }}
                                >
                                    {user.name}
                                </span>
                            </ResultItem>
                        ))}
                    </ResultsList>
                )}
            {!isWaitingDebounce &&
                !findUserQuery.isFetching &&
                debouncedQuery.length >= 3 &&
                findUserQuery.data?.length === 0 && (
                    <p className="text-dracula-gray">{t("noUsersFound")}</p>
                )}
        </>
    ) : null

    const handleAddModerator = useCallback(async () => {
        if (!selectedUser) return

        await addModMutation.mutateAsync(
            { communityId, id: selectedUser.id },
            {
                onSuccess: () => {
                    setSelectedUser(null)
                    form.reset()
                    modalStore.setPage(null)
                },
            },
        )
    }, [addModMutation, communityId, form, modalStore, selectedUser])

    return (
        <Modal
            className="px-6! w-full max-w-160 gap-4! py-8!"
            onClick={(e) => e.stopPropagation()}
        >
            <h1 className="text-white">{t("addNewModerator")}</h1>
            <form
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col gap-4 items-start w-full"
            >
                <Tooltip
                    content={tooltipContent}
                    visible={showTooltip}
                    interactive
                    placement="bottom-start"
                    appendTo={document.body}
                    trigger="manual"
                >
                    <InputWrapper>
                        <MyInputWrapper>
                            <input
                                placeholder={t("moderatorQueryPlaceholder")}
                                {...form.register("query")}
                            />
                            {errors.query && (
                                <p className="text-dracula-red! error">
                                    {errors.query.message}
                                </p>
                            )}
                        </MyInputWrapper>
                    </InputWrapper>
                </Tooltip>

                {selectedUser && (
                    <p className="text-white">
                        {t.rich("addingUserAsModerator", {
                            user: () => (
                                <SelectedBadge>
                                    <span
                                        style={{
                                            color: selectedUser.color,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {selectedUser.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser(null)}
                                        className="text-dracula-gray hover:text-dracula-red! text-sm reset bg-transparent"
                                    >
                                        ×
                                    </button>
                                </SelectedBadge>
                            ),
                        })}
                    </p>
                )}

                <Button
                    variant="green"
                    type="button"
                    disabled={!selectedUser || addModMutation.isPending}
                    onClick={handleAddModerator}
                >
                    {t("addModerator")}
                </Button>
            </form>
        </Modal>
    )
}
