import { Button } from "@/components/Button"
import { Dropdown } from "@/components/Dropdown"
import { FilePreviewGrid } from "@/components/FilePreviewGrid"
import useUserDataStore, { Upload } from "@/hooks/useUserDataStore"
import { MansoryContainer } from "@/components/dashboard/styles"
import apiService from "@/services/api"
import SelectionArea from "@viselect/vanilla"
import { useInView } from "motion/react"
import { useTranslations } from "next-intl"
import React, {
    memo,
    MutableRefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import {
    LuFolderPlus,
    LuSquareDashedMousePointer,
    LuTrash2,
    LuX,
} from "react-icons/lu"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import { toast } from "react-toastify"

export const UploadsActionsDropdown = ({
    selected,
    setSelected,
    handleDeselect
}: {
    selected: Set<string>
    setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
    handleDeselect: () => void
}) => {
    const t = useTranslations("Dashboard")
    const userUploads = useUserDataStore((d) => d.userData?.uploads)
    const updateUpload = useUserDataStore((d) => d.updateUpload)

    const itemsToDelete = useMemo(() => {
        const items = new Set<{ name: string; code: string }>()
        userUploads?.forEach((upload) => {
            if (selected.has(upload.name)) {
                items.add({
                    name: upload.name,
                    code: upload.deleteCode,
                })
            }
        })
        return items
    }, [selected, userUploads])

    const handleBatchDelete = useCallback(async () => {
        let index = 0
        const totalSelected = selected.size
        const template = (filename?: string) =>
            t("deletingFileProgress", {
                filename: filename ?? "",
                current: index + 1,
                total: totalSelected,
            })

        const toastId = toast.loading(
            t("startingDelete", { count: totalSelected }),
            { isLoading: true, progress: 0, autoClose: false }
        )

        let localSelected: Set<string> = new Set(selected)

        for (const item of itemsToDelete) {
            index += 1
            // await new Promise((r) => setTimeout(r, 200))

            await apiService.deleteUpload(item.code).then((response) => {
                if (response.success) {
                    updateUpload({
                        ...response.data!,
                        deletedAt: new Date().toISOString(),
                    })
                    localSelected.delete(item.name)
                    setSelected(new Set(localSelected))
                } else {
                    toast.error(response.error)
                }
            })
            toast.update(toastId, {
                render: template(item.name),
                progress: totalSelected > 1 ? index / (totalSelected - 1) : 1,
                isLoading: true,
            })
        }

        selected = new Set()
        setSelected(selected)

        toast.update(toastId, {
            render: t("batchDeleteSuccess", { count: totalSelected }),
            type: "success",
            // autoClose: false,
            progress: 1,
            autoClose: 5000,
        })
    }, [selected, setSelected, userUploads, updateUpload, t])

    const handleGroup = useCallback(async () => {
        const itemsToGroup: string[] = Array.from(selected)

        const response = await apiService.createAlbum(itemsToGroup)

        if (response.success) {
            toast.success(t("albumCreated"))
            window.open(`/album/${response.data?.id}`, "_blank")
        } else {
            toast.error(response.error)
        }

        setSelected(new Set())
    }, [selected, setSelected, t])

    const handlePointerUp = useCallback(() => {
        if (selected.size === 0) {
            toast.info(t("selectionHelp"))
        }
    }, [selected.size, t])

    const dropdownStyle = useMemo(() => ({ pointerEvents: "all" }), [])

    const trashIcon = useMemo(() => <LuTrash2 />, [])
    const folderPlusIcon = useMemo(() => <LuFolderPlus />, [])
    const deselectIcon = useMemo(() => <LuX />, [])
    const folderOpenIcon = useMemo(() => <LuSquareDashedMousePointer />, [])

    const noFilesSelectedText = useMemo(
        () => t("selectionHint"),
        [t]
    )
    const selectedFilesText = useMemo(
        () => t("selectedCount", { count: selected.size }),
        [selected, t]
    )

    const memoizedBoxShadowNone = useMemo(() => ({ boxShadow: "none" }), [])

    const dropdownItems = useMemo(() => {
        if (selected.size === 0) {
            return [<p key="no-selection">{t("selectionEmpty")}</p>]
        }

        return [
            <Button
                key="delete"
                icon={trashIcon}
                children={t("deleteSelected")}
                size="slim"
                variant="red"
                onClick={handleBatchDelete}
            />,
            <Button
                key="group"
                icon={folderPlusIcon}
                children={t("groupSelected")}
                size="slim"
                variant="green"
                style={memoizedBoxShadowNone}
                onClick={handleGroup}
            />,
            <Button
                key="deselect"
                icon={deselectIcon}
                children={t("deselectAll")}
                size="slim"
                variant="deselect"
                style={memoizedBoxShadowNone}
                onClick={handleDeselect}
            />,
        ]
    }, [
        selected.size,
        handleBatchDelete,
        handleGroup,
        trashIcon,
        folderPlusIcon,
        handleDeselect,
        t,
    ])

    const emptyOnClick = useCallback(() => {}, [])

    return (
        <Dropdown items={dropdownItems}>
            <div
                className="dropdown-child"
                onPointerUp={handlePointerUp}
                style={dropdownStyle as any}
            >
                <Button
                    size="slim"
                    variant={selected.size > 0 ? "purple" : "grey"}
                    icon={folderOpenIcon}
                    children={
                        selected.size > 0
                            ? selectedFilesText
                            : noFilesSelectedText
                    }
                    onClick={emptyOnClick}
                    // forceHover={selected.size > 0}
                    disabled={selected.size === 0}
                />
            </div>
        </Dropdown>
    )
}

const UploadsGrid_ = ({
    currentData,
    handleInspect,
    setSelected,
    selectionRef
}: {
    currentData: Upload[]
    handleDelete: (deleteCode: string) => void
    parentRef: React.RefObject<HTMLDivElement | null>
    handleInspect: (upload: Upload) => void
    setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
    selectionRef: MutableRefObject<SelectionArea | null>
}) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const [page, setPage] = useState(1)
    const [isDragging, setIsDragging] = useState(false)
    const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const mousePositionRef = useRef({ x: 0, y: 0 })

    useEffect(() => {
        if (!containerRef.current) return

        const selection = new SelectionArea({
            selectables: ".selectable",
            boundaries: containerRef.current,
            // boundaries: document.documentElement,

            behaviour: {
                scrolling: {
                    startScrollMargins: {
                        x: 20,
                        y: 400,
                    },
                    manualSpeed: 1.25,
                },
                startThreshold: {
                    x: 5,
                    y: 5,
                },
            },
            features: {
                deselectOnBlur: false,
                singleTap: {
                    allow: false,
                },
            },
        })
            .on("beforestart", ({ event }) => {
                if (event) {
                    const rect = containerRef.current?.getBoundingClientRect()
                    if ("clientX" in event && rect) {
                        const rect =
                            containerRef.current!.getBoundingClientRect()
                        const relX = event.clientX - rect.left
                        const relY = event.clientY - rect.top
                        if (
                            relX >= 0 &&
                            relX <= rect.width &&
                            relY >= 0 &&
                            relY <= rect.height
                        ) {
                            return true
                        }
                    }
                    return false
                }
            })
            .on(
                "move",
                ({
                    store: {
                        changed: { added, removed },
                    },
                }) => {
                    if (added.length === 0 && removed.length === 0) return
                    setSelected((prev) => {
                        const next = new Set(prev)
                        added.forEach((el) => {
                            const id = el.getAttribute("data-key")!
                            el.ariaSelected = "true"
                            next.add(id)
                        })
                        removed.forEach((el) => {
                            const id = el.getAttribute("data-key")!
                            el.ariaSelected = "false"
                            // el.className = "file-preview"
                            next.delete(id)
                        })
                        return next
                    })
                }
            )
        selectionRef.current = selection

        return () => selection.destroy()
    }, [])

    const handleInspectCallback = useCallback(
        (upload: Upload) => () => {
            handleInspect(upload)
        },
        [handleInspect]
    )

    const bottomRef = useRef(null)
    const isBottomVisible = useInView(bottomRef)

    useEffect(() => {
        if (isBottomVisible) {
            setPage((e) => e + 1)
        }
    }, [isBottomVisible])

    useEffect(() => {
        const intervalId = setInterval(async () => {
            selectionRef.current?.resolveSelectables()
            await new Promise((r) => setTimeout(r, 150))
            selectionRef.current?.resolveSelectables()
        }, 150)
        return () => clearInterval(intervalId)
    }, [page])

    const splicedData = currentData.slice(0, page * 50)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePositionRef.current = { x: e.clientX, y: e.clientY }
        }

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove)

            scrollIntervalRef.current = setInterval(() => {
                const { y } = mousePositionRef.current
                const { innerHeight } = window

                // Calculate 10% of the viewport height
                const edgeThreshold = innerHeight * 0.1
                const maxScrollSpeed = 20 // Maximum pixels per interval

                let scrollSpeed = 0

                if (y < edgeThreshold) {
                    scrollSpeed =
                        -((edgeThreshold - y) / edgeThreshold) * maxScrollSpeed
                } else if (y > innerHeight - edgeThreshold) {
                    scrollSpeed =
                        ((y - (innerHeight - edgeThreshold)) / edgeThreshold) *
                        maxScrollSpeed
                }

                if (scrollSpeed !== 0) {
                    window.scrollBy(0, scrollSpeed)
                }
            }, 10)
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current)
                scrollIntervalRef.current = null as any
            }
        }
    }, [isDragging])

    const handleMouseDown = () => {
        setIsDragging(true)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleSelectSingleItem = useCallback(
        (itemName: string) => {
            const isSelected = !!selectionRef.current
                ?.getSelectables()
                .find(
                    (d) =>
                        d.getAttribute("data-key") === itemName &&
                        d.ariaSelected === "true"
                )
            const itemId = `[id="selectable-${itemName}"]`
            if (!isSelected) {
                selectionRef.current?.select(itemId)
            } else {
                selectionRef.current?.deselect(itemId)
            }
        },
        [selectionRef]
    )

    return (
        <MansoryContainer
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            ref={containerRef}
            className="erm-mansory-container"
        >
            <div
                className="top"
                style={{
                    position: "absolute",
                    height: "1rem",
                    top: 0,
                    width: "100%",
                    left: 0,
                }}
            ></div>
            <ResponsiveMasonry
                columnsCountBreakPoints={{
                    350: 2,
                    750: 2,
                    900: 3,
                    1200: 4,
                    1600: 5,
                }}
            >
                <Masonry sequential={true}>
                    {splicedData.map((item, index) => (
                        <FilePreviewGrid
                            className={"file-preview selectable "}
                            key={item.name}
                            upload={item}
                            data-key={item.name}
                            id={`selectable-${item.name}`}
                            imageProps={{ loading: "lazy" }}
                            videoProps={{}}
                            handleInspect={handleInspectCallback(item)}
                            index={index}
                            handleSelect={handleSelectSingleItem}
                        />
                    ))}
                </Masonry>
            </ResponsiveMasonry>
            <div
                className="bottom"
                style={{
                    position: "absolute",
                    height: "100vh",
                    bottom: 0,
                    width: "100%",
                    left: 0,
                    pointerEvents: "none",
                    // backgroundColor: "red"
                }}
                ref={bottomRef}
            ></div>
        </MansoryContainer>
    )
}

export const UploadsViewGrid = memo(UploadsGrid_)
