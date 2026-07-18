import { Button } from "@/components/Button"
import { UploadsActionsDropdown } from "@/components/dashboard/UploadsView/UploadsViewGrid"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import React, { forwardRef, useEffect } from "react"
import { RectReadOnly } from "react-use-measure"
import styled from "styled-components"
import { hideAll } from "tippy.js"

export interface UploadsTitleProps {
    isPortal?: boolean
    itemsCount: number
    currentView: "table" | "grid"
    selected: Set<string>
    setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
    onViewAlbums: () => void
    onToggleView: () => void
    folderOpenIcon: React.ReactNode
    viewToggleIcon: React.ReactNode
    // ref?: (d: HTMLDivElement | null) => void
    size?: RectReadOnly
    isVisible?: boolean
    handleDeselect: () => void
}

const Container = styled(motion.div)`
    display: flex;
    align-items: center;
    /* justify-content: space-between; */
    width: 100%;
    padding: 0 0.5rem;
    gap: 1rem;

    p.title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #f8f8f8;
    }

    > button:first-of-type {
        margin-left: auto;
    }

    &.portal {
        position: fixed;
        top: 0.75rem;
        background-color: rgb(17, 18, 24, 0.95);
        backdrop-filter: blur(37px);
        z-index: 3;
        left: 0;
        padding: 1.5rem 0.5rem;
        overflow: hidden;
        border-radius: 1rem;
        visibility: hidden;
        /* outline: 2px solid red; */
    }
`

const UploadsTitleInner = (
    {
        isPortal,
        itemsCount,
        currentView,
        selected,
        setSelected,
        onViewAlbums,
        onToggleView,
        folderOpenIcon,
        viewToggleIcon,
        size,
        isVisible,
        handleDeselect
    }: UploadsTitleProps,
    ref: React.Ref<HTMLDivElement>
) => {
    const t = useTranslations("Dashboard")
    const portalStyles: React.CSSProperties =
        isPortal && size
            ? {
                  left: size.left,
                  height: size.height,
                  right: size.right,
                  width: size.width,
              }
            : {}

    const shouldShowPortal = isVisible

    useEffect(() => {
        if(isVisible) return
        return () => {
            hideAll()
        }
    }, [isVisible])
              
    return (
        <Container
            initial={isPortal ? { display: "none", visibility: "hidden" } : {}}
            animate={
                isPortal
                    ? {
                        //   display: "flex",
                          y: shouldShowPortal ? 0 : -40,
                          opacity: shouldShowPortal ? 1 : 0,
                          visibility: shouldShowPortal ? "visible" : "hidden",
                          display: shouldShowPortal ? "flex" : "none",
                      }
                    : {}
            }
            exit={isPortal ? { display: "none", visibility: "hidden" } : {}}
            ref={ref}
            className={isPortal ? "portal" : ""}
            style={portalStyles}
        >
            <p className="title">
                {t("yourUploads", { count: itemsCount })}
            </p>
            {currentView === "grid" && (
                <UploadsActionsDropdown
                    selected={selected}
                    setSelected={setSelected}
                    handleDeselect={handleDeselect}
                />
            )}
            <Button
                size="slim"
                variant="purple"
                icon={folderOpenIcon}
                onClick={onViewAlbums}
            >
                {t("viewMyAlbums")}
            </Button>
            <Button
                size="slim"
                variant="purple"
                icon={viewToggleIcon}
                onClick={onToggleView}
            >
                {currentView === "table" ? t("viewGrid") : t("viewTable")}
            </Button>
        </Container>
    )
}

// wrap in forwardRef then memo
export const UploadsTitle = React.memo(
    forwardRef<HTMLDivElement, UploadsTitleProps>(UploadsTitleInner)
)
