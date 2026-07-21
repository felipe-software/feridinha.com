import Tooltip from "@/components/Tooltip"
import useTokenStore from "@/hooks/useToken"
import useUserDataStore from "@/hooks/useUserDataStore"
import ResultPage, { UploadItem } from "@/components/landing/UploadBox/ResultPage"
import SocialLinkForm from "@/components/landing/UploadBox/SocialLinkForm"
import { getClipboardHttpUrl, isEditablePasteTarget } from "@/components/landing/UploadBox/clipboard"
import { UploadBoxContainer, UploadBoxWrapper } from "@/components/landing/UploadBox/styles"
import apiService, { Album } from "@/services/api"
import { useTranslations } from "next-intl"
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from "react"
import { LuCircleHelp } from "react-icons/lu"
import { toast } from "react-toastify"
import { RectReadOnly } from "react-use-measure"

export default function UploadBox() {
    const t = useTranslations("UploadBox")
    const [uploads, setUploads] = useState<UploadItem[]>([])
    const [isResultOpen, setResultOpen] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const socialInputRef = useRef<HTMLInputElement>(null)
    const [resultSize, setResultSize] = useState<RectReadOnly | null>(null)
    const { token } = useTokenStore()
    const userStore = useUserDataStore()
    const [album, setAlbum] = useState<Album | null>(null)
    const [isDragActive, setDragActive] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [customStatus, setCustomStatus] = useState<string | null>(null)
    const [socialLink, setSocialLink] = useState("")

    const updateSingleUpload = useCallback(
        (uuid: string, changes: Partial<UploadItem>) =>
            setUploads((old) =>
                old.map((o) => {
                    if (o.uuid !== uuid) return o
                    return { ...o, ...changes }
                }),
            ),
        [],
    )

    const handleUpload = useCallback(
        async (file: File) => {
            const targetUUID = crypto.randomUUID()
            setUploads((old) => [
                ...old,
                {
                    file,
                    progressPercentage: 0,
                    status: "loading",
                    uuid: targetUUID,
                    source: "file",
                },
            ])
            const result = await apiService.uploadFile(file, (progress) => {
                updateSingleUpload(targetUUID, { progress, status: "loading" })
            })

            updateSingleUpload(targetUUID, {
                status: result.success ? "done" : "error",
                response: result,
            })
            if (!result.success) {
                // prettier-ignore
                const extra = (result.code === "max_file_size_reached" && !token) ? ` ${t("anonymousLimitUpsell")}` : ""
                toast.error(result.error + extra)
            }
        },
        [t, token, updateSingleUpload],
    )

    const handleSocialLink = useCallback(
        async (rawLink: string) => {
            const link = getClipboardHttpUrl(rawLink)
            if (!link) {
                toast.error(t("invalidSocialLink"))
                return
            }

            const targetUUID = crypto.randomUUID()
            setResultOpen(true)
            setSocialLink("")
            setUploads((old) => [
                ...old,
                {
                    file: null,
                    status: "loading",
                    uuid: targetUUID,
                    source: "social_link",
                    label: t("importingSocialLink"),
                    indeterminate: true,
                },
            ])

            try {
                const result = await apiService.uploadSocialLink(link)
                updateSingleUpload(targetUUID, {
                    status: result.success ? "done" : "error",
                    response: result,
                    indeterminate: false,
                })
                if (!result.success) toast.error(result.error)
            } catch {
                updateSingleUpload(targetUUID, {
                    status: "error",
                    indeterminate: false,
                    error: { message: t("socialLinkNetworkError"), code: "network_error" },
                })
                toast.error(t("socialLinkNetworkError"))
            }
        },
        [t, updateSingleUpload],
    )

    const handleFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        setResultOpen(true)
        const files = e?.target?.files || []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            handleUpload(file)
        }
    }

    const handleFileDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
        setResultOpen(true)
        setDragActive(false)
        e.preventDefault()
        const files = Array.from(e.dataTransfer?.files || [])
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            handleUpload(file)
        }
    }

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const clipboard = e.clipboardData
            if (!clipboard) return

            if (clipboard.files.length > 0) {
                e.preventDefault()
                setResultOpen(true)
                const files = Array.from(clipboard.files)
                files.forEach((file) => void handleUpload(file))
                return
            }

            if (isEditablePasteTarget(e.target, socialInputRef.current)) return
            const link = getClipboardHttpUrl(clipboard.getData("text/plain"))
            if (!link) return

            e.preventDefault()
            void handleSocialLink(link)
        }

        document.addEventListener("paste", handlePaste)
        return () => document.removeEventListener("paste", handlePaste)
    }, [handleUpload, handleSocialLink])

    const handleCreateAlbum = async () => {
        if (!token) {
            toast.info(t("createAccountForAlbum"))
            return
        }
        let names: string[] = []
        uploads.forEach((u) => {
            if (!u.response?.success) return
            names.push(u.response.message.split("/").pop()!)
        })

        const response = await apiService.createAlbum(names)
        setCustomStatus(null)

        if (response.success) {
            toast.success(response.message ?? t("albumCreated"))
            setAlbum(response.data!)
        } else {
            toast.error(response.error)
        }
    }

    const handleUpdateAlbum = async () => {
        const oldFiles = album!.uploads.map((u) => u.name)
        const newFiles = uploads
            .filter((d) => Boolean(d.response?.success))
            .map((u) => (u.response?.success ? u.response.filename : ""))
        const toPush = newFiles.filter((n) => !oldFiles.includes(n))

        if (toPush.length === 0) return console.log("Nada mudou, não vou atualizar o album")

        setCustomStatus(t("updatingAlbum"))
        const response = await apiService.updateMyAlbum(album!.id, toPush)
        setCustomStatus(null)
        if (response.success) {
            toast.success(response.message ?? t("albumUpdated"), { autoClose: 5_000 })
            setAlbum(response.data!)
        } else {
            toast.error(response.error)
        }
    }

    useEffect(() => {
        if (!album) return
        timeoutRef.current = setTimeout(handleUpdateAlbum, 1000)

        return () => {
            clearTimeout(timeoutRef.current!)
        }
        // handleUpdateAlbum()
    }, [album, uploads])

    const isLoggedIn = !!userStore.userData
    const userLimit = isLoggedIn ? `${userStore.userData!.readableLimit}MB` : "15MB"

    return (
        <UploadBoxWrapper>
            <SocialLinkForm
                inputRef={socialInputRef}
                value={socialLink}
                onChange={setSocialLink}
                onImport={(link) => void handleSocialLink(link)}
            />
            <UploadBoxContainer
                // {...getRootProps()}
                onClick={() => fileRef?.current?.click()}
                onDrop={handleFileDrop}
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                }}
                onDragStart={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                }}
                onDragEnter={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                }}
                onDragLeave={(e) => {
                    e.preventDefault()
                    setDragActive(false)
                }}
            >
                <div
                    className="content"
                    style={{
                        height: `calc(100% - ${resultSize?.height || 0}px - 2rem)`,
                    }}
                >
                    <div className="svg-wrapper">
                        <svg className="my-border" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <rect
                                className={isDragActive ? "path-active path" : "path"}
                                x="0.5rem"
                                y="0.5rem"
                                rx="0.5rem"
                                ry="0.5rem"
                                width="100%"
                                height="100%"
                            />
                        </svg>
                    </div>

                    <h4>
                        {!album && uploads.length === 0 && (
                            <>
                                {t("dropFileHere")}
                                <br />
                                <button className="click-to">{t("clickToChoose")}</button>
                                <br />
                                {t("toUpload")}
                            </>
                        )}
                        {!album && uploads.length > 0 && <>{t("continueUploading")}</>}
                        {album && <>{customStatus || t("continueUploadingToUpdateAlbum")}</>}
                    </h4>

                    <input
                        id="file"
                        type="file"
                        ref={fileRef}
                        onChange={handleFileChange}
                        multiple={true}
                        name="files[]"
                    />
                    {!isResultOpen && (
                        <div className="tos-notice" onClick={(e) => e.stopPropagation()}>
                            <p>
                                {t.rich("uploadAgreement", {
                                    terms: (chunks) => (
                                        <a href="/termos-de-servico.html" target="_blank">
                                            {chunks}
                                        </a>
                                    ),
                                })}
                            </p>
                            <Tooltip
                                content={
                                    <>
                                        <p>{t("maxFileSize", { limit: userLimit })}</p>
                                        {!isLoggedIn && <p>{t("increaseLimitUpsell")}</p>}
                                    </>
                                }
                                maxWidth={400}
                            >
                                <div className="limit-notice">
                                    {t("limitOf", { limit: userLimit })}
                                    <LuCircleHelp />
                                </div>
                            </Tooltip>
                        </div>
                    )}
                </div>
                {isResultOpen && (
                    <ResultPage
                        onSize={setResultSize}
                        album={album}
                        uploads={uploads}
                        handleCreateAlbum={handleCreateAlbum}
                    />
                )}
            </UploadBoxContainer>
        </UploadBoxWrapper>
    )
}
