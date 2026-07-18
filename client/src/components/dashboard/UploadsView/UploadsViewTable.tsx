import { Button } from "@/components/Button"
import { FilePreview } from "@/components/FilePreview"
import { TooltipImage } from "@/components/Tooltip"
import { Upload } from "@/hooks/useUserDataStore"
import { UploadViewNavigation } from "@/components/dashboard/UploadsView/UploadViewNavigation"
import { cdnUrl, formatFileSize } from "@/utils"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import { useFormatter, useTranslations } from "next-intl"
import { useSingleton } from "@tippyjs/react"
import { useMemo, useState } from "react"
import { LuTrash2 } from "react-icons/lu"

export const UploadsViewTable = ({
    currentData,
    handleDelete,
}: {
    currentData: Upload[]
    handleDelete: (deleteCode: string) => void
}) => {
    const t = useTranslations("Dashboard")
    const format = useFormatter()
    const [sorting, setSorting] = useState<SortingState>([
        { id: "createdAt", desc: false },
    ])

    const data = useMemo(() => currentData, [currentData])
    const [source, target] = useSingleton({})
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    })
    const columns: ColumnDef<Upload>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: t("nameColumn"),
                cell: (props) => {
                    const content = props.getValue() as string
                    return (
                        <a href={`${cdnUrl}/${content}`} target="_blank">
                            {content}
                        </a>
                    )
                },
                // enableSorting: true,
                enableResizing: true,
                invertSorting: true,
            },
            {
                accessorKey: "size",
                header: t("sizeColumn"),

                cell: (props) => formatFileSize(props.getValue() as number),
                enableSorting: true,
                sortingFn: (rowA, rowB, columnId) => {
                    const a = rowA.getValue(columnId) as number
                    const b = rowB.getValue(columnId) as number
                    return a < b ? -1 : a > b ? 1 : 0
                },
                invertSorting: true,
            },
            {
                accessorKey: "createdAt",
                header: t("dateColumn"),
                cell: (props) =>
                    format.dateTime(new Date(props.getValue() as string), {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                    }),
                enableSorting: true,
                sortingFn: (rowA, rowB, columnId) => {
                    const a = rowA.getValue(columnId) as string
                    const b = rowB.getValue(columnId) as string
                    return a < b ? -1 : a > b ? 1 : 0
                },
                invertSorting: true,
            },
            {
                accessorKey: "deleteCode",
                cell: (props) => {
                    const content = props.getValue() as string
                    return (
                        <Button
                            variant="red"
                            onClick={() => handleDelete(content)}
                            icon={<LuTrash2 />}
                            size="slim"
                        />
                    )
                },
                // enableSorting: false
            },
        ],
        [data, format, t]
    )

    const table = useReactTable({
        columns,
        data,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination,
        },
    })

    return (
        <>
            <table>
                {table.getHeaderGroups().map((group) => {
                    return (
                        <thead key={group.id} className="header">
                            <tr>
                                {group.headers.map((header) => {
                                    return (
                                        <th
                                            key={header.id}
                                            onClick={header.column.getToggleSortingHandler()}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {
                                                header.column.columnDef
                                                    .header as any
                                            }
                                            {{
                                                asc: " ↑",
                                                desc: " ↓",
                                            }[
                                                header.column.getIsSorted() as string
                                            ] ?? null}
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                    )
                })}
                <TooltipImage
                    singleton={source}
                    moveTransition="transform 0.1s cubic-bezier(0, 1, 0.36, 1)"
                    placement="auto-start"
                    arrow={false}
                />
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <TooltipImage
                            key={row.id}
                            content={
                                <FilePreview
                                    upload={row.original}
                                    shouldHideData={true}
                                    videoProps={{ autoPlay: true, muted: true }}

                                />
                            }
                            singleton={target}
                            placement="auto"
                            appendTo={"parent"}
                            delay={[0,0]}
                            followCursor={true}
                        >
                            <tr>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </TooltipImage>
                    ))}
                </tbody>
            </table>
            <UploadViewNavigation table={table} />
        </>
    )
}
