"use client"

import Loading from "@/components/Loading"
import { useAlbumQuery } from "@/hooks/useAlbumQuery"
import { PageContainer } from "@/components/dashboard/styles"
import { cdnUrl, formatFileSize } from "@/utils"
import { motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import styled from "styled-components"
import relativeTime from "dayjs/plugin/relativeTime"
import dayjs from "dayjs"
import "dayjs/locale/en"
import "dayjs/locale/pt-br"
import { Upload } from "@/hooks/useUserDataStore"
import { getFileType } from "@/components/FilePreviewGrid"
import { Button } from "@/components/Button"
import apiService, { Album } from "@/services/api"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
dayjs.extend(relativeTime)

const Container = styled(PageContainer)`
    display: flex;
    height: 100%;
    padding: 2rem 1rem;

    .content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: fit-content;
        width: 100%;
        max-width: 55rem;
        border-radius: 2rem;
        padding: 1rem;

        .header {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;

            .title-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }

            h1 {
                font-size: clamp(1.5rem, 4vw, 2.25rem);
                line-height: 1.15;
                overflow-wrap: anywhere;
            }

            a.author {
                font-weight: 600;
            }
        }

        .edit-title {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid var(--dracula-gray);
            border-radius: 0.5rem;
            background: var(--base);
            color: var(--foreground);
            font-size: 1.25rem;

            &:focus {
                outline: 2px solid var(--dracula-cyan);
                outline-offset: 2px;
            }
        }

        .edit-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        background-color: var(--base-dark);

        .item {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
            padding: 1rem 0;

            .title {
                display: flex;
                gap: 0.5rem;

                a {
                    color: var(--dracula-cyan);
                }
                span {
                    color: var(--dracula-gray);
                }
            }

            border-radius: 0.5rem;

            &:hover {
                background-color: var(--base);
            }

            p {
                color: var(--dracula-red);
            }

            .description,
            .description-placeholder {
                width: min(100%, 42rem);
                color: var(--foreground);
                line-height: 1.6;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }

            .description-placeholder {
                color: #a6a7b2;
                font-style: italic;
            }

            .description-field {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
                width: min(100%, 42rem);

                textarea {
                    width: 100%;
                    min-height: 6rem;
                    resize: vertical;
                    padding: 0.75rem;
                    border: 1px solid var(--dracula-gray);
                    border-radius: 0.5rem;
                    background: var(--base);
                    color: var(--foreground);
                    line-height: 1.5;

                    &:focus {
                        outline: 2px solid var(--dracula-cyan);
                        outline-offset: 2px;
                    }
                }

                small {
                    align-self: flex-end;
                    color: #a6a7b2;
                }
            }
        }

        .preview-wrapper {
            display: flex;
            justify-content: center;
            width: 100%;
            height: fit-content;
            --grey: #cccccc16;
            background-image: linear-gradient(
                    45deg,
                    var(--grey) 25%,
                    transparent 25%
                ),
                linear-gradient(-45deg, var(--grey) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, var(--grey) 75%),
                linear-gradient(-45deg, transparent 75%, var(--grey) 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
            background-color: var(--base);
            width: fit-content;
            border-radius: 0.25rem;

            img,
            video {
                width: 100%;
                height: auto;
                max-height: 15rem;
                object-fit: contain;
                border-radius: 0.5rem;
            }
        }
    }
`

const AlbumItem = ({
    upload,
    isEditing,
    description,
    onDescriptionChange,
}: {
    upload: Upload
    isEditing: boolean
    description: string
    onDescriptionChange: (description: string) => void
}) => {
    const type = getFileType(upload.mimeType)
    const t = useTranslations("Album")

    return (
        <div className="item" key={upload.name} style={{ viewTransitionName: "page-content" }}>
            <div className="title">
                <a
                    href={`${cdnUrl}/${upload.name}`}
                    target="_blank"
                >
                    {upload.name}
                </a>
                <span>{formatFileSize(upload.size)}</span>
            </div>
            {type === "image" && (
                <div className="preview-wrapper">
                    <img
                        src={`${cdnUrl}/${upload.name}`}
                        alt={upload.description || upload.name}
                        className="preview"
                    />
                </div>
            )}

            {type === "video" && (
                <div className="preview-wrapper">
                    <video
                        src={`${cdnUrl}/${upload.name}`}
                        controls={true}
                        className="preview"
                    />
                </div>
            )}

            {type === "invalid" && (
                <div className="preview-wrapper">
                    <p>{t("previewUnavailable")}</p>
                </div>
            )}
            {isEditing ? (
                <label className="description-field">
                    <span>{t("imageDescription")}</span>
                    <textarea
                        value={description}
                        onChange={(event) => onDescriptionChange(event.target.value)}
                        placeholder={t("descriptionPlaceholder")}
                        aria-label={`${t("imageDescription")}: ${upload.name}`}
                        maxLength={500}
                    />
                    <small>{description.length}/500</small>
                </label>
            ) : upload.description ? (
                <p className="description">{upload.description}</p>
            ) : null}
        </div>
    )
}

export default function AlbumPageClient() {
    const params = useParams()
    const albumId = params.albumId as string
    const album = useAlbumQuery(albumId)
    const locale = useLocale()
    const t = useTranslations("Album")
    const queryClient = useQueryClient()
    const albumData = album.data
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [draftTitle, setDraftTitle] = useState("")
    const [draftDescriptions, setDraftDescriptions] = useState<Record<string, string>>({})

    const uploads = albumData?.uploads
    dayjs.locale(locale === "pt-BR" ? "pt-br" : "en")

    useEffect(() => {
        if (!albumData || isEditing) return
        setDraftTitle(albumData.title ?? "")
        setDraftDescriptions(
            Object.fromEntries(albumData.uploads.map((upload) => [upload.name, upload.description ?? ""])),
        )
    }, [albumData, isEditing])

    const startEditing = () => {
        if (!albumData) return
        setDraftTitle(albumData.title ?? "")
        setDraftDescriptions(
            Object.fromEntries(albumData.uploads.map((upload) => [upload.name, upload.description ?? ""])),
        )
        setIsEditing(true)
    }

    const cancelEditing = () => {
        setIsEditing(false)
    }

    const saveMetadata = async () => {
        if (!albumData) return
        setIsSaving(true)

        try {
            const response = await apiService.updateAlbumMetadata(albumData.id, {
                title: draftTitle,
                uploads: albumData.uploads.map((upload) => ({
                    name: upload.name,
                    description: draftDescriptions[upload.name]?.trim() || null,
                })),
            })

            if (!response.success || !response.data) {
                toast.error(response.success ? t("saveError") : response.error)
                return
            }

            queryClient.setQueryData<Album>(["album", albumId], response.data)
            setIsEditing(false)
            toast.success(response.message ?? t("saved"))
        } catch {
            toast.error(t("saveError"))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Container>
            <Loading isLoading={album.isLoading} />
            {albumData && (
                <motion.div className="content">
                    <div className="header">
                        <div className="title-row">
                            {isEditing ? (
                                <input
                                    className="edit-title"
                                    value={draftTitle}
                                    onChange={(event) => setDraftTitle(event.target.value)}
                                    placeholder={t("titlePlaceholder")}
                                    maxLength={120}
                                    aria-label={t("albumTitle")}
                                />
                            ) : (
                                <h1>{albumData.title || t("untitled")}</h1>
                            )}
                            {albumData.canEdit && !isEditing && (
                                <Button variant="grey" size="semi-slim" onClick={startEditing}>
                                    {t("edit")}
                                </Button>
                            )}
                        </div>
                        <p>
                            {t.rich("createdBy", {
                                author: (chunks) => (
                                    <a
                                        className="author"
                                        href="#"
                                        target="_blank"
                                        style={{ color: albumData.user.color }}
                                    >
                                        {chunks}
                                    </a>
                                ),
                                name: albumData.user.name,
                                time: dayjs(albumData.createdAt).fromNow(),
                                count: uploads!.length,
                                views: albumData.viewCount,
                            })}
                        </p>
                        {isEditing && (
                            <div className="edit-actions">
                                <Button variant="transparent" onClick={cancelEditing} disabled={isSaving}>
                                    {t("cancel")}
                                </Button>
                                <Button variant="green" onClick={saveMetadata} isLoading={isSaving}>
                                    {t("save")}
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="items">
                        {albumData.uploads.map((upload) => (
                            <AlbumItem
                                upload={upload}
                                key={upload.name}
                                isEditing={isEditing}
                                description={draftDescriptions[upload.name] ?? ""}
                                onDescriptionChange={(description) =>
                                    setDraftDescriptions((current) => ({
                                        ...current,
                                        [upload.name]: description,
                                    }))
                                }
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </Container>
    )
}
