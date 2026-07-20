"use client"

import { Button } from "@/components/Button"
import { FilePreview } from "@/components/FilePreview"
import Tooltip, { TooltipImage } from "@/components/Tooltip"
import { UploadItem } from "@/components/landing/UploadBox/ResultPage"
import { formatFileSize } from "@/utils"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import prettyMs from "pretty-ms"
import { useEffect } from "react"
import { LuClipboard, LuTrash2, LuZap } from "react-icons/lu"
import styled from "styled-components"
import { followCursor } from "tippy.js"

const Container = styled(motion.div)`
    position: relative;
    display: flex;
    background-color: var(--base);
    width: 100%;
    padding-top: 0;
    padding: 1rem 1rem;
    gap: 1rem;
    border-radius: 0.5rem;

    .buttons-row {
        display: flex;
        margin-left: auto;
        gap: 0.5rem;
    }

    .optimized-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: 0.2s;
        color: #ff5555;
        svg {
            fill: #ff5555;
            filter: drop-shadow(0px 0px 1px #ff55554a) drop-shadow(0px 0px 5px #ff55559f);
        }

        &:hover {
            background-color: var(--base-dark);
        }
    }

    .progress {
        background-color: var(--purple-gradient);
        height: 0.25rem;
        border-radius: 0.125rem;
        width: 0%;
        /* width: 50%; */
        transition: background-color 0.4s;

        &.done {
            background-color: #50fa7b;
        }

        &.error {
            background-color: #ff5555;
        }

        &.indeterminate {
            width: 35%;
            animation: social-upload-progress 1.2s ease-in-out infinite;
        }
    }

    @keyframes social-upload-progress {
        0% { transform: translateX(0); }
        50% { transform: translateX(185%); }
        100% { transform: translateX(0); }
    }

    p.size {
        color: var(--dracula-gray);
    }

    .column {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 0.5rem;
    }

    .sub-row {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    a {
        color: var(--dracula-cyan);
    }

    .sub-row button:first-of-type {
        margin-left: auto;
    }
`

export const ResultItem = ({
    upload,
    index,
}: {
    upload: UploadItem

    index: number
}) => {
    const t = useTranslations("UploadBox")
    const filename = upload.file?.name || upload.label || t("fileNumber", { count: index + 1 })
    const uploadedSize = upload.response?.success ? upload.response.size : undefined

    const handleCopy = () => {
        if (!upload.response || !upload.response.success) return
        navigator.clipboard.writeText(upload.response?.message!)
    }

    const handleDelete = () => {
        if (!upload.response || !upload.response.success) return
        window.open(upload.response?.delete!, "_blank")
    }

    useEffect(() => {
        handleCopy()
    }, [upload.response?.success])

    const shouldShowEstimate = Boolean( upload.progress && upload.progress.estimated && upload.status === "loading")

    return (
        <Container
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* <input type="checkbox"></input> */}
            <div className="column">
                <div className="sub-row">
                    {upload.response?.success ? (
                        <TooltipImage
                            content={
                                <FilePreview
                                    upload={{
                                        name: upload.response.filename
                                            .split("/")
                                            .at(-1)!,
                                        mimeType: upload.response.mimeType,
                                    }}
                                    shouldHideData={true}
                                    videoProps={{
                                        muted: true,
                                        autoPlay: true
                                    }}
                                />
                            }
                            plugins={[followCursor]}
                            followCursor={true}
                        >
                            <a href={upload.response.message!} target="_blank">
                                {upload.response?.message.split("/").pop()}
                            </a>
                        </TooltipImage>
                    ) : (
                        <p>{filename}</p>
                    )}
                    {shouldShowEstimate && (
                        <p>
                            {prettyMs(
                                Math.round(upload.progress!.estimated! * 1000),
                                {
                                    compact: false,
                                    secondsDecimalDigits: 0,
                                }
                            ).replace(/\s+/g, "")}
                        </p>
                    )}
                    {(upload.file?.size || uploadedSize) && (
                        <p className="size">
                            {formatFileSize(upload.file?.size || uploadedSize!)}
                        </p>
                    )}

                    {upload.response?.success && (upload.response.time && upload.response.optimized) && (
                        <Tooltip
                            content={t("optimizedUpload", {
                                time: prettyMs(upload.response.time, {}),
                            })}
                        >
                            <div className="optimized-icon">
                                <LuZap />
                            </div>
                        </Tooltip>
                    )}

                    {upload.response?.success && (
                        <div className="buttons-row">
                            <Tooltip content={t("copyLink")}>
                                <div>
                                    <Button
                                        style={{
                                            display: "flex",
                                            padding: ".5rem",
                                        }}
                                        size="slim"
                                        variant="white"
                                        onClick={handleCopy}
                                    >
                                        <LuClipboard size={"1.25rem"} />
                                    </Button>
                                </div>
                            </Tooltip>
                            <Tooltip content={t("deleteFile")}>
                                <div>
                                    <Button
                                        variant="red"
                                        style={{
                                            display: "flex",
                                            padding: ".5rem",
                                        }}
                                        size="slim"
                                        onClick={handleDelete}
                                    >
                                        <LuTrash2 size={"1.25rem"} />
                                    </Button>
                                </div>
                            </Tooltip>
                        </div>
                    )}
                </div>
                <motion.div
                    className={`progress ${upload.status} ${upload.indeterminate && upload.status === "loading" ? "indeterminate" : ""}`}
                    initial={{ width: "0.5%" }}
                    animate={{
                        width:
                            upload.status !== "loading"
                                ? "100%"
                                : upload.indeterminate
                                  ? "35%"
                                  : `${(upload.progress?.progress || 0.05) * 100}%`,
                    }}
                ></motion.div>
            </div>
        </Container>
    )
}
