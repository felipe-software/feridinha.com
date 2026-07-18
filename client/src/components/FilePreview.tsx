import { ButtonIcon } from "@/components/ButtonIcon"
import { getFileType } from "@/components/FilePreviewGrid"

import { cdnUrl, formatFileSize } from "@/utils"
import { useTranslations } from "next-intl"
import { useInView } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { DivProps, ImgProps, VideoProps } from "react-html-props"
import styled from "styled-components"

const Container = styled.div`
    position: relative;
    --grey: #cccccc16;
    background-image: linear-gradient(45deg, var(--grey) 25%, transparent 25%),
        linear-gradient(-45deg, var(--grey) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--grey) 75%),
        linear-gradient(-45deg, transparent 75%, var(--grey) 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    background-color: var(--base);

    position: relative;
    display: flex;
    width: 100%;
    outline: 2px solid #00000000;
    transition: all 0.2s;
    opacity: 1 !important;

    &.invalid-type {
        min-height: 15rem;
        /* background-color: var(--dracula-base); */
        padding: 0.5rem;

        p {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin: auto;
        }
    }

    > * {
        margin: auto;
        max-width: 100%;
    }

    &.audio {
        aspect-ratio: 1/1;

        display: flex;
        justify-content: center;
        align-items: center;
    }
    border-radius: 0.25rem;

    overflow: hidden;
`

export const FileUploadRenderer = ({
    upload,
    skipLazy,
}: {
    upload: { name: string; mimeType: string }
    skipLazy?: boolean
}) => {
    const [hasLoaded, setHasLoaded] = useState(false)
    const type = getFileType(upload.mimeType)
    const t = useTranslations("Album")

    const invalidType = type === "invalid"
    const url = `${cdnUrl}/${upload.name}`
    return (
        <>
            {type === "image" && (
                <img
                    src={url}
                    alt={upload.name}
                    className="preview"
                    draggable={false}
                    onLoad={() => setHasLoaded(true)}
                    loading="lazy"
                    style={
                        hasLoaded || skipLazy
                            ? {}
                            : { height: "20rem", width: "20rem", opacity: 0 }
                    }
                />
            )}

            {type === "video" && (
                <video
                    src={url}
                    controls={true}
                    className="preview"
                    autoPlay={false}
                    draggable={false}
                />
            )}

            {type === "audio" && (
                <audio
                    src={url}
                    controls={true}
                    className="preview"
                    autoPlay={false}
                    draggable={false}
                />
            )}

            {invalidType && (
                <p draggable={false}>
                    {t("previewUnavailableInline")}{" "}
                    <a href={url} target="_blank">
                        {t("openLink")}
                    </a>
                </p>
            )}
        </>
    )
}

export const FilePreview = ({
    upload,
    autoplay,
    imageProps,
    videoProps,
    handleInspect,
    shouldHideData,
    ...props
}: {
    upload: { name: string; mimeType: string; size?: number }
    autoplay?: boolean
    imageProps?: ImgProps
    videoProps?: VideoProps
    handleInspect?: () => void
    shouldHideData?: boolean
} & DivProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref)
    const t = useTranslations("Album")
    const [canRender, setCanRender] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)
    const type = getFileType(upload.mimeType)

    const invalidType = type === "invalid"
    const url = `${cdnUrl}/${upload.name}`

    useEffect(() => {
        if (!isInView) return
        if (canRender) return
        setCanRender(true)
    }, [isInView])

    if (!canRender)
        return <Container style={{ height: "20rem", width: "20rem" }} ref={ref} />

    return (
        // @ts-ignore
        <Container
            {...props}
            className={
                props.className +
                " " +
                (invalidType ? "invalid-type" : "") +
                " " +
                type
            }
            draggable={false}
        >
            {type === "image" && (
                <img
                    src={url}
                    alt={upload.name}
                    className="preview"
                    draggable={false}
                    {...imageProps}
                    onLoad={() => setHasLoaded(true)}
                    loading="lazy"
                    style={
                        hasLoaded
                            ? {}
                            : { height: "20rem", width: "20rem", opacity: 0 }
                    }
                />
            )}

            {type === "video" && (
                <video
                    src={url}
                    controls={true}
                    className="preview"
                    autoPlay={autoplay}
                    draggable={false}
                    {...videoProps}
                />
            )}

            {type === "audio" && (
                <audio
                    src={url}
                    controls={true}
                    className="preview"
                    autoPlay={autoplay}
                    draggable={false}
                    {...videoProps}
                />
            )}

            {invalidType && (
                <p draggable={false}>
                    {t("previewUnavailableInline")}{" "}
                    <a href={url} target="_blank">
                        {t("openLink")}
                    </a>
                </p>
            )}
            {!shouldHideData && (
                <div className="file-data">
                    <a className="title" href={url} target="_blank">
                        {upload.name}
                    </a>
                    <p className="size">{formatFileSize(upload.size ?? 0)}</p>
                </div>
            )}
            {handleInspect && (
                <div className="center-content">
                    <ButtonIcon
                        icon="visibility"
                        onClick={handleInspect}
                        activeColor={"transparent"}
                        background={"transparent"}
                        activeForeground="var(--foreground)"
                        scaleHover={1.25}
                        // className=""
                    ></ButtonIcon>
                </div>
            )}
        </Container>
    )
}
