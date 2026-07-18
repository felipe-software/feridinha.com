import { Button } from "@/components/Button"
import { Table } from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import { useCallback, useMemo } from "react"
import {
    LuChevronLeft,
    LuChevronRight,
    LuChevronsLeft,
    LuChevronsRight,
} from "react-icons/lu"
import styled from "styled-components"

   

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-content: center;
    width: 100%;
`

export const UploadViewNavigation = ({ table }: { table: Table<any> }) => {
    const t = useTranslations("Dashboard")
    const handleFirstPage = useCallback(() => {
        table.firstPage()
    }, [table])

    const handlePreviousPage = useCallback(() => {
        table.previousPage()
    }, [table])

    const handleNextPage = useCallback(() => {
        table.nextPage()
    }, [table])

    const handleLastPage = useCallback(() => {
        table.lastPage()
    }, [table])

    const pageSizeOptions = useMemo(() => [10, 50, 100, 200], [])

    const chevronsLeftIcon = useMemo(() => <LuChevronsLeft />, [])
    const chevronLeftIcon = useMemo(() => <LuChevronLeft />, [])
    const chevronRightIcon = useMemo(() => <LuChevronRight />, [])
    const chevronsRightIcon = useMemo(() => <LuChevronsRight />, [])

    return (
        <Container>
            <Button
                variant="purple"
                icon={chevronsLeftIcon}
                onClick={handleFirstPage}
                disabled={!table.getCanPreviousPage()}
            />
            <Button
                variant="purple"
                icon={chevronLeftIcon}
                onClick={handlePreviousPage}
                disabled={!table.getCanPreviousPage()}
            />

            <p className="page">
                <strong>
                    {t("pageOf", {
                        current: table.getState().pagination.pageIndex + 1,
                        total: table.getPageCount().toLocaleString(),
                    })}
                </strong>
            </p>
            {/* <span className="flex items-center gap-1">
                   | Go to page:
                   <input
                       type="number"
                       min="1"
                       max={table.getPageCount()}
                       defaultValue={table.getState().pagination.pageIndex + 1}
                       onChange={(e) => {
                           const page = e.target.value
                               ? Number(e.target.value) - 1
                               : 0
                           table.setPageIndex(page)
                       }}
                       className="border p-1 rounded w-16"
                   />
               </span> */}
            <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                    table.setPageSize(Number(e.target.value))
                }}
            >
                {pageSizeOptions.map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                        {t("showPerPage", { count: pageSize })}
                    </option>
                ))}
            </select>
            <Button
                variant="purple"
                icon={chevronRightIcon}
                onClick={handleNextPage}
                disabled={!table.getCanNextPage()}
            />
            <Button
                variant="purple"
                icon={chevronsRightIcon}
                onClick={handleLastPage}
                disabled={!table.getCanNextPage()}
            />
        </Container>
    )
}
