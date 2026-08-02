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
import "dayjs/locale/es"
import "dayjs/locale/pt-br"
import { Upload } from "@/hooks/useUserDataStore"
import { getFileType } from "@/components/FilePreviewGrid"
import { DAYJS_LOCALES, type AppLocale } from "@/i18n/config"
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
            a.author {
                font-weight: 600;
            }
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

const AlbumItem = ({ upload }: { upload: Upload }) => {
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
                        alt={upload.name}
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
        </div>
    )
}

export default function AlbumPageClient() {
    const params = useParams()
    const albumId = params.albumId as string
    const album = useAlbumQuery(albumId)
    const locale = useLocale() as AppLocale
    const t = useTranslations("Album")
    const albumData = album.data

    const uploads = albumData?.uploads
    dayjs.locale(DAYJS_LOCALES[locale])

    return (
        <Container>
            <Loading isLoading={album.isLoading} />
            {albumData && (
                <motion.div className="content">
                    <div className="header">
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
                    </div>
                    <div className="items">
                        {albumData.uploads.map((upload) => (
                            <AlbumItem upload={upload} key={upload.name} />
                        ))}
                    </div>
                </motion.div>
            )}
        </Container>
    )
}
