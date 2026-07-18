import { Button } from "@/components/Button"
import { ButtonIcon } from "@/components/ButtonIcon"
import Tooltip from "@/components/Tooltip"
import { Upload } from "@/hooks/useUserDataStore"
import { cdnUrl, formatFileSize } from "@/utils"
import { useFormatter, useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DivProps, ImgProps, VideoProps } from "react-html-props"
import { LuCheck } from "react-icons/lu"
import { useInView } from "react-intersection-observer"
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

    &.loading-mock {
        width: 100%;
    }

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
    &.audio {
        aspect-ratio: 1/1;

        display: flex;
        justify-content: center;
        align-items: center;
    }

    border-radius: 0.25rem;

    overflow: hidden;

    &::before {
        position: absolute;
        content: "";
        width: 100%;
        height: 100%;
        inset: 0;
        border-radius: inherit;
        background-color: rgba(149, 128, 255, 0.301);
        pointer-events: none;

        opacity: 0;
        transition: opacity 0.2s;
        backdrop-filter: blur(2px) brightness(0.5) grayscale(0.5);
        /* z-index: -1; */
        visibility: hidden;
        pointer-events: none;
    }

    &[aria-selected="true"]::before {
        opacity: 1;
        visibility: visible;
        /* z-index: 1; */
    }

    &[aria-selected="true"]::after {
        background: var(--purple-gradient);
    }

    &[aria-selected="true"] .file-data {
        opacity: 1;
    }

    a {
        color: var(--dracula-cyan);
    }

    p {
        color: var(--foreground);
    }

    position: relative;

    video {
        pointer-events: none; 

        &::-webkit-media-controls {
            display: none;
        }

        &::-webkit-media-controls {
            display: none !important;
        }

        &::-webkit-media-controls-enclosure {
            display: none !important;
        }
    }

    .file-data {
        position: absolute;
        bottom: 0;

        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;

        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        opacity: 0;
        transition: 0.15s;
        font-size: 0.8rem;
        justify-content: flex-start;
        /* pointer-events: all; */
        /* z-index: 2; */
    }

    .center-content {
        position: absolute;
        margin: auto;
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;

        button {
            display: flex;
            background-color: #0000009e;
            border-radius: 0.5rem;
            backdrop-filter: blur(5px);
            pointer-events: auto;

            span {
                font-size: 1.5rem;
            }
        }
    }

    & > *:not(.checkbox-wrapper) {
        width: 100%;
    }

    .checkbox-wrapper {
        position: absolute;
        display: flex;
        top: 0.5rem;
        left: 0.5rem;
        width: fit-content;

        button {
            aspect-ratio: 1/1;
            content: "";
            z-index: 2;
            box-shadow: 0px 0px 0px 2px var(--base-dark);
            border-radius: 1.5rem;
            padding: 0.1rem;
            background-color: transparent;
            border-radius: 0.2rem;
            svg {
                width: 1rem;
                height: 1rem;
                opacity: 0;
                transform: scale(0);
                transition: 0.2s;
                stroke-width: 3;
            }
            transition: 0.2s;
        }
    }

    &[aria-selected="true"] .checkbox {
        background-color: #9580ff;

        svg {
            transform: scale(1);
            opacity: 1;
        }
    }

    &:hover {
        .file-data {
            opacity: 1;
        }

        .center-content {
            opacity: 1;
        }
    }
`

export const getFileType = (mimeType: string) => {
    let type = mimeType.split("/")[0]
    const isVideo =
        mimeType.includes("mp4") ||
        mimeType.includes("mkv") ||
        mimeType.includes("mov")

    if (isVideo) {
        type = "video"
    }

    if (type !== "image" && type !== "video" && type !== "audio") {
        return "invalid"
    }

    return type
}

export const FilePreviewGrid = ({
    upload,
    autoplay,
    imageProps,
    videoProps,
    handleInspect,
    shouldHideData,
    index,
    handleSelect,
    ...rest
}: {
    upload: Upload
    autoplay?: boolean
    imageProps?: ImgProps
    videoProps?: VideoProps
    handleInspect?: () => void
    shouldHideData?: boolean
    index: number
    handleSelect: (name: string) => void
} & DivProps) => {
    const { ref: inViewRef, inView } = useInView()
    const tAlbum = useTranslations("Album")
    const tDashboard = useTranslations("Dashboard")
    const format = useFormatter()
    const [canRender, setCanRender] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)
    const clickRef = useRef<{ startX: number; startY: number } | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    const type = useMemo(() => getFileType(upload.mimeType), [upload.mimeType])
    const url = useMemo(() => `${cdnUrl}/${upload.name}`, [upload.name])

    useEffect(() => {
        if ((inView && !canRender && hasLoaded) || type === "invalid") {
            setCanRender(true)
        }
    }, [inView, canRender, hasLoaded, type])

    const handleInspectClick = useCallback(() => {
        if (handleInspect) handleInspect()
    }, [handleInspect])

    const handleCheckboxClick: React.MouseEventHandler<unknown> =
        useCallback(() => {
            handleSelect(upload.name)
        }, [upload.name])

    const checkIcon = useMemo(() => <LuCheck />, [])

    const handlePointerDown = useCallback((e: React.PointerEvent<unknown>) => {
        clickRef.current = { startX: e.clientX, startY: e.clientY }
    }, [])

    const handlePointerUp = useCallback((e: React.PointerEvent<unknown>) => {
        if (clickRef.current) {
            const { startX, startY } = clickRef.current
            const xDiff = Math.abs(e.clientX - startX)
            const yDiff = Math.abs(e.clientY - startY)
            if (xDiff < 5 && yDiff < 5) {
                handleSelect(upload.name)
            }
        }

        clickRef.current = null
    }, [])

    const handleVideoPlayback = useCallback(
        (action: "play" | "pause") => () => {
            if(!videoRef.current) return
            if (action === "play") {
                videoRef.current.controls = true
                videoRef.current.play()
            } else {
                videoRef.current.controls = false
                videoRef.current.pause()
            }
        },
        []
    )

    const Renderer = useMemo(
        () => () =>
            (
                <>
                    {type === "image" && (
                        <img
                            src={url}
                            alt={upload.name}
                            className={`preview ${
                                hasLoaded ? "loaded" : "loading"
                            }`}
                            draggable={false}
                            {...imageProps}
                            onLoad={() => setHasLoaded(true)}
                            loading="lazy"
                            // onClick={handleCheckboxClick}
                            onPointerDown={handlePointerDown}
                            onPointerUp={handlePointerUp}
                        />
                    )}

                    {type === "video" && (
                        <video
                            src={url}
                            controls={false}
                            className="preview"
                            autoPlay={false}
                            draggable={false}
                            onLoadStart={() => setHasLoaded(true)}
                            {...videoProps}
                            onPointerDown={handlePointerDown}
                            onPointerUp={handlePointerUp}
                            onMouseEnter={handleVideoPlayback("play")}
                            onMouseLeave={handleVideoPlayback("pause")}
                            muted={true}
                            // preload="metadata"
                            
                            ref={videoRef}
                        />
                    )}

                    {type === "audio" && (
                        <audio
                            src={url}
                            controls
                            className="preview"
                            autoPlay={false}
                            draggable={false}
                            onLoadStart={() => setHasLoaded(true)}
                            {...videoProps}
                            onPointerDown={handlePointerDown}
                            onPointerUp={handlePointerUp}
                        />
                    )}
                </>
            ),
        [url, type, hasLoaded]
    )

    if (!canRender)
        return (
            <Container
                {...rest}
                className="loading-mock"
                style={{ height: "5rem", opacity: 0 }}
                ref={inViewRef}
                children={inView && <Renderer />}
            />
        )

    return (
        // @ts-ignore
        <Container
            {...rest}
            className={`${rest.className} ${
                type === "invalid" ? "invalid-type" : ""
            } ${type}`}
            draggable={false}
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            {type === "invalid" && (
                <p draggable={false}>
                    {tAlbum("previewUnavailableInline")} {`(${upload.mimeType}) `}
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        {tAlbum("openLink")}
                    </a>
                </p>
            )}
            {!shouldHideData && (
                <div className="file-data">
                    <a
                        className="title"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {upload.name}
                    </a>
                    <p className="size">{formatFileSize(upload.size)}</p>
                    <p>
                        {format.dateTime(new Date(upload.createdAt), {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        })}
                    </p>
                </div>
            )}
            {handleInspect && type !== "invalid" && (
                <div
                    className="center-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ButtonIcon
                        icon="visibility"
                        onClick={handleInspectClick}
                        activeColor="transparent"
                        background="transparent"
                        activeForeground="var(--foreground)"
                        scaleHover={1.25}
                    />
                </div>
            )}
            <Renderer />
            <Tooltip content={tDashboard("selectFile")}>
                <div className="checkbox-wrapper">
                    <Button
                        draggable={false}
                        icon={checkIcon}
                        onClick={handleCheckboxClick}
                        variant="purple"
                        size="slim"
                        className="checkbox"
                    />
                </div>
            </Tooltip>
        </Container>
    )
}
