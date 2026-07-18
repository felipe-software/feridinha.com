import { subpageTransition } from "@/components/PageTransition"
import { useModalStore } from "@/hooks/useModalStore"
import useUserDataStore, { Upload } from "@/hooks/useUserDataStore"
import { UploadsBox } from "@/components/dashboard/styles"
import { UploadsTitle } from "@/components/dashboard/UploadsView/UploadsTitle"
import { UploadsViewGrid } from "@/components/dashboard/UploadsView/UploadsViewGrid"
import { UploadsViewTable } from "@/components/dashboard/UploadsView/UploadsViewTable"
import { ViewFileModal } from "@/components/ViewFileModal"
import apiService from "@/services/api"
import SelectionArea from "@viselect/vanilla"
import { useInView } from "motion/react"
import { useTranslations } from "next-intl"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { LuFolderOpen, LuLayoutGrid, LuTable } from "react-icons/lu"
import { toast } from "react-toastify"
import useMeasure from "react-use-measure"

export const UploadsView = memo(
    ({
        handleChangeView,
    }: {
        handleChangeView: (view: "uploads" | "albuns") => void
    }) => {
        const updateUpload = useUserDataStore((d) => d.updateUpload)
        const uploads = useUserDataStore((d) => d.userData?.uploads)
        const t = useTranslations("Dashboard")
        const [measureRef_, size] = useMeasure()
        const measureRef = useRef<HTMLDivElement>(null)
        const isInView = useInView(measureRef)
        const selectionRef = useRef<SelectionArea | null>(null)

        useEffect(() => {
            if (!measureRef.current) return
            measureRef_(measureRef.current)
        }, [measureRef])

        const [currentView, setView] = useState<"table" | "grid">(
            localStorage.getItem("defaultGridView") === "table"
                ? "table"
                : "grid"
        ) // comparação para evitar casos de corrupção no localstorage

        const items = useMemo(
            () =>
                uploads
                    ?.filter((d) => !Boolean(d.deletedAt))
                    .toSorted(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    ) || [],
            [uploads]
        )
        const boxRef = useRef<HTMLDivElement>(null)

        const [selected, setSelected] = useState<Set<string>>(() => new Set())

        const { setPage } = useModalStore()

        const handleDelete = useCallback(
            async (deleteCode: string) => {
                const response = await apiService.deleteUpload(deleteCode)
                if (response.success) {
                    updateUpload(response.data!)
                    toast.success(t("fileDeleted"))
                    return
                }

                toast.error(response.error)
            },
            [t, updateUpload]
        )

        const handleOpenInspectionModal = useCallback(
            (upload: Upload) => {
                setPage({ jsx: <ViewFileModal file={upload} /> })
            },
            [setPage]
        )

        useEffect(() => {
            localStorage.setItem("defaultGridView", currentView)
        }, [currentView])

        const toggleView = useCallback(() => {
            setView((prevView) => (prevView === "table" ? "grid" : "table"))
        }, [])

        const handleViewAlbums = useCallback(() => {
            handleChangeView("albuns")
        }, [handleChangeView])

        const folderOpenIcon = useMemo(() => <LuFolderOpen />, [])

        const viewToggleIcon = useMemo(
            () => (currentView === "table" ? <LuLayoutGrid /> : <LuTable />),
            [currentView]
        )

        const handleDeselect = useCallback(() => {
            const selectables = selectionRef.current
                ?.getSelectables()
                .filter(
                    (d) =>
                        d.getAttribute("data-key") && d.ariaSelected === "true"
                )

            selectables?.forEach((d) => {
                selectionRef.current?.deselect(d)
            })
        }, [selected])

        const uploadsTitleProps = {
            itemsCount: items.length,
            currentView: currentView,
            selected: selected,
            setSelected: setSelected,
            onViewAlbums: handleViewAlbums,
            onToggleView: toggleView,
            folderOpenIcon,
            viewToggleIcon,
            handleDeselect,
            selectionRef,
        }

        return (
            <UploadsBox {...subpageTransition} ref={boxRef}>
                <UploadsTitle ref={measureRef} {...uploadsTitleProps} />
                {createPortal(
                    <UploadsTitle
                        {...uploadsTitleProps}
                        size={size}
                        isVisible={!isInView}
                        isPortal={true}
                    />,
                    document.body
                )}
                {currentView === "table" && items.length > 0 && (
                    <UploadsViewTable
                        currentData={items}
                        handleDelete={handleDelete}
                    />
                )}
                {currentView === "grid" && items.length > 0 && (
                    <UploadsViewGrid
                        // handleSelection={handleSelection}
                        parentRef={boxRef}
                        currentData={items}
                        handleDelete={handleDelete}
                        handleInspect={handleOpenInspectionModal}
                        // selected={selected}
                        setSelected={setSelected}
                        selectionRef={selectionRef}
                    />
                )}
            </UploadsBox>
        )
    }
)
