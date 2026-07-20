import { ButtonIcon } from "@/components/ButtonIcon"
import { ResultItem } from "@/components/landing/UploadBox/ResultItem"
import { Album, UploadResponse } from "@/services/api"
import { AxiosProgressEvent } from "axios"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"
import useMeasure, { RectReadOnly } from "react-use-measure"
import styled from "styled-components"

const Container = styled(motion.div)`
    position: absolute;
    width: 100%;

    max-height: calc(80% - 1rem);
    border-radius: inherit;
    z-index: 2;
    bottom: 0;
    left: 0;
    padding-top: 0 !important;

    display: flex;
    flex-direction: column;
    /* justify-content: flex-end; */
    padding: 1rem;
    gap: 0.5rem;

    .uploads-wrapper {
        display: flex;
        flex-direction: column;
        margin-top: auto;
        max-height: 80%;
        width: 100%;
        /* background-color: var(--base); */
        padding: 0.5rem;
        cursor: auto;
        gap: 0.5rem;
        overflow-y: auto;
        border-radius: 0.5rem;
        /* margin-top: auto; */
    }

    .header {
        display: flex;
        align-items: center;
        padding: 0 1rem;
        justify-content: space-between;
        width: 100%;
        p.title {
            font-size: 1.5rem;
            font-weight: 600;
        }

        a {
            color: var(--dracula-cyan);
        }
    }
`

export interface UploadItem {
    uuid: string
    status: "error" | "loading" | "done"
    file: File | null
    progress?: AxiosProgressEvent
    error?: {
        message: string
        code: string
    }
    response?: UploadResponse
    source?: "file" | "social_link"
    label?: string
    indeterminate?: boolean
}

export default function ResultPage({
    uploads,
    onSize,
    album,
    handleCreateAlbum,
}: {
    uploads: UploadItem[]
    album?: Album | null
    onSize: (rect: RectReadOnly) => void
    handleCreateAlbum: () => void
}) {
    const t = useTranslations("UploadBox")
    const [ref, size] = useMeasure()

    useEffect(() => {
        onSize(size)
    }, [size])

    const isAllowedToCreateAlbum = useMemo(() => {
        return uploads.filter((i) => i.response?.success).length > 0
    }, [uploads])

    return (
        <Container
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="header">
                <p className="title">
                    {album
                        ? t("yourAlbum", { count: uploads.length })
                        : t("yourUploads", { count: uploads.length })}
                </p>
                {!album && (
                    <ButtonIcon
                        onClick={handleCreateAlbum}
                        icon={!album ? "create_new_folder" : "folder"}
                        tooltip={t("createAlbumTooltip")}
                        text={
                            !album ? t("groupIntoAlbum") : t("alreadyGrouped")
                        }
                        disabled={Boolean(album) || !isAllowedToCreateAlbum}
                        className={album ? "force-hover" : ""}
                    />
                )}
                {album && (
                    <a target="_blank" href={`/album/${album.id}`}>
                        {t("viewAlbum")}
                    </a>
                )}
            </div>
            <div
                className="uploads-wrapper"
                onClick={(e) => e.stopPropagation()}
            >
                {uploads.map((upload, i) => (
                    <ResultItem upload={upload} key={upload.uuid} index={i} />
                ))}
            </div>
        </Container>
    )
}
