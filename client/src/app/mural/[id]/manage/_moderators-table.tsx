"use client"

import { Button } from "@/components/Button"
import { useRemoveModeratorMutation } from "@/hooks/mutations/useModeratorMutations"
import type { $ApiMuralCommunityModeratorPreview } from "api-types"
import { useTranslations } from "next-intl"
import styled from "styled-components"
import { LuX } from "react-icons/lu"

const TableWrapper = styled.div`
    width: 100%;
    background-color: #1f202960;
    border-radius: 1rem;
    overflow: auto;

    table {
        width: 100%;
        border-spacing: 0;
    }

    table thead tr th {
        background-color: #1f2029d2;
        padding: 0.5rem 1rem;
        text-align: left;
        font-weight: 500;
        color: var(--foreground);
        border-radius: 0.1rem !important;

        &:first-child {
            border-top-left-radius: 0.5rem;
            border-bottom-left-radius: 0.5rem;
        }

        &:last-child {
            border-top-right-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
        }
    }

    table tbody tr {
        color: #f8f8f8f5;

        &:hover td {
            color: #f8f8f8;
            background-color: #1f2029d2;
        }

        & > td:first-child {
            border-top-left-radius: 0.5rem;
            border-bottom-left-radius: 0.5rem;
        }

        & > td:last-child {
            border-top-right-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
        }
    }

    table td {
        padding: 0.5rem 1rem;
    }

    table tbody tr td:first-child {
        font-weight: 500;
    }
`

export const ModeratorsTable = ({
    moderators,
    communityId,
}: {
    moderators: $ApiMuralCommunityModeratorPreview[]
    communityId: string
}) => {
    const removeMutation = useRemoveModeratorMutation()
    const t = useTranslations("Mural")

    return (
        <TableWrapper>
            <table>
                <thead>
                    <tr>
                        <th className="w-full">{t("nameColumn")}</th>
                        <th>{t("actionColumn")}</th>
                    </tr>
                </thead>
                <tbody>
                    {moderators.map((mod) => (
                        <tr key={mod.id}>
                            <td>
                                <span style={{ color: mod.color, fontWeight: 500 }}>@{mod.name}</span>
                            </td>
                            <td>
                                <Button
                                    variant="red"
                                    size="slim"
                                    icon={<LuX />}
                                    onClick={() =>
                                        removeMutation.mutate({
                                            communityId,
                                            id: mod.id,
                                        })
                                    }
                                    disabled={removeMutation.isPending}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableWrapper>
    )
}
