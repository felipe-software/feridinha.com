import { Button } from "@/components/Button"
import Loading from "@/components/Loading"
import { subpageTransition } from "@/components/PageTransition"
import Tooltip from "@/components/Tooltip"
import queryClient from "@/config/queryClient"
import useApiKeys from "@/hooks/useApiKeys"
import useApiKeysStore, { ApiKey } from "@/hooks/useApiKeysStore"
import { BaseBox } from "@/components/dashboard/styles"
import apiService from "@/services/api"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { Link } from "@/i18n/navigation"
import { toast } from "react-toastify"
import useMeasure from "react-use-measure"
import styled from "styled-components"

const IntegrationsBox = styled(BaseBox)`
    margin-top: 1rem;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    gap: 1rem;
    /* max-width: 25rem; */
    min-height: fit-content;
    /* height: 16rem; */
    align-items: center;
    width: 100%;

    overflow: visible;
    .title {
        width: 100%;
        font-size: 1.2rem;
        font-weight: 500;
        letter-spacing: 0.02rem;
    }
    .keys-container {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        width: 100%;
        flex-shrink: 1;
        overflow: auto;
        flex-grow: 0;
    }

    .key-item {
        display: flex;
        align-items: center;
        /* justify-content: space-between; */
        background-color: #1f20296e;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: 0.1s;
        color: #c0d3fc70;
        gap: 0.25rem;

        p {
            margin-right: auto;
        }

        .tag {
            display: flex;
        }

        &:hover {
            background-color: #25273679;
        }

        button {
            display: flex;
            justify-content: center;
            transition: 0.2s;
            color: #c0d3fc70;

            &:hover {
                color: #c0d3fcb5;
            }
        }
    }

    /* button {
        border: none;
        background: none;

        cursor: pointer;
        font-weight: 500;
        &.create {
            background-color: var(--purple-gradient);
            padding: 0.75rem 1rem;
            color: var(--foreground);
            border-radius: 0.5rem;
        }

        &.close {
            color: #ff5555;
        }

        &.delete {
            background-color: #ff5555;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
        }
    } */
`

const SubPageContainer = styled(motion.div)`
    position: absolute;
    width: 100%;
    height: 12rem;
    inset: 0;
    background-color: #111218;
    z-index: 2;
    border-radius: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;

    button.close {
        position: absolute;
        top: 0rem;
        right: 0rem;
        transition: 0.2s;
        &:hover {
            transform: scale(1.2);
        }

        span {
            font-size: 1.5rem;
        }
        border: none;
        background: none;
        color: white;
        cursor: pointer;
    }

    input {
        background-color: #1f2029;
        border: none;
        padding: 0.75rem 1rem;
        color: #f8f8f8;
        border-radius: 0.5rem;

        &:focus {
            outline: 1px solid #f8f8f876;
            border: none;
            box-shadow: none;
        }
    }

    .input-area {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        text-align: left;
    }
`

const SubPageCreateApiKey = ({
    close,
    setHeight,
}: {
    close: () => void
    setHeight: (d: number) => void
}) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [ref, size] = useMeasure()
    const t = useTranslations("Dashboard")

    const handleCreateKey = async () => {
        const value = inputRef.current?.value
        if (!value) return
        if (value.length < 3)
            return toast.error(t("apiKeyNameMin"))
        if (value.length > 30)
            return toast.error(t("apiKeyNameMax"))

        setIsLoading(true)
        const response = await apiService.createApiKey(value)
        setIsLoading(false)
        if (response.success) {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] })
            useApiKeysStore.getState().add(response.data!)
            toast.success(response.message)
            return close()
        }

        toast.error(response.error)
    }

    useEffect(() => {
        setHeight(size.height)
    }, [size.height])

    return (
        <SubPageContainer {...subpageTransition} ref={ref}>
            <Loading isLoading={isLoading} />

            <button className="close" onClick={close}>
                <span
                    style={{ color: "white", fontSize: "1.75rem" }}
                    className="notranslate material-symbols-rounded"
                >
                    close
                </span>
            </button>
            <p className="title">{t("createKeyTitle")}</p>
            <input
                ref={inputRef}
                type="text"
                placeholder={t("apiKeyNamePlaceholder")}
                autoFocus={true}
                onSubmit={handleCreateKey}
                onKeyUp={(e) => {
                    const key = e.key
                    if (key === "Enter") {
                        e.stopPropagation()
                        handleCreateKey()
                    }
                }}
            ></input>
            <Button
                onClick={handleCreateKey}
                className="create"
                variant="purple"
            >
                {t("createKeyTitle")}
            </Button>
        </SubPageContainer>
    )
}

const SubPageInspectApiKey = ({
    close,
    apiKey,
    setHeight,
}: {
    close: () => void
    apiKey: ApiKey
    setHeight: (d: number) => void
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const apiKeys = useApiKeysStore()
    const [ref, size] = useMeasure()
    const t = useTranslations("Dashboard")

    const handleDeleteKey = async () => {
        setIsLoading(true)
        const response = await apiService.deleteApiKey(apiKey.id)
        setIsLoading(false)
        if (response.success) {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] }) 
            apiKeys.removeById(apiKey.id)
            toast.success(response.message)
            return close()
        }

        toast.error(response.error)
    }

    useEffect(() => {
        setHeight(size.height)
    }, [size.height])

    return (
        <SubPageContainer {...subpageTransition} ref={ref}>
            <Loading isLoading={isLoading} />
            <button className="close reset-button" onClick={close}>
                <span
                    style={{ color: "white", fontSize: "1.75rem" }}
                    className="notranslate material-symbols-rounded"
                >
                    close
                </span>
            </button>
            <p className="title">{apiKey.name}</p>
            <div className="input-area">
                <label htmlFor="api-key-secret">{t("secretValue")}</label>
                <input
                    type="password"
                    value={apiKey.secret}
                    id="api-key-secret"
                    onSelect={() => {
                        try {
                            navigator.clipboard.writeText(apiKey.secret)
                            toast.info(t("clipboardCopying"))
                        } catch {
                            console.warn(t("clipboardUnavailable"))
                        }
                    }}
                ></input>
            </div>
            <Button onClick={handleDeleteKey} className="delete" variant="red">
                {t("deleteKey")}
            </Button>
        </SubPageContainer>
    )
}

const Integrations = () => {
    const { isLoading } = useApiKeys()
    const apiKeysStore = useApiKeysStore()
    const [isCreationPageOpen, setIsCreationPageOpen] = useState(false)
    const [inspectPageData, setIsInspectPageData] = useState<ApiKey | null>(
        null
    )
    const [height, setHeight] = useState<number | null>(null)
    const t = useTranslations("Dashboard")

    const hasPageOpen = inspectPageData || isCreationPageOpen

    useEffect(() => {
        if (!hasPageOpen && height) {
            setHeight(null)
        }
    }, [hasPageOpen])

    return (
        <IntegrationsBox animate={(height) ? { height, overflow: "hidden" } : { height: "fit-content" }}>
            <Loading isLoading={isLoading} />
            <motion.h1 className="title">{t("apiKeysTitle")}</motion.h1>
            <div
                className="keys-container"
                style={{
                    marginBottom:
                        apiKeysStore.apiKeys.length > 0 || isLoading
                            ? "auto"
                            : "0",
                }}
            >
                {apiKeysStore.apiKeys.map((apiKey) => {
                    return (
                        <div
                            className="key-item"
                            key={apiKey.id}
                            onClick={() => setIsInspectPageData(apiKey)}
                        >
                            <p>{apiKey.name}</p>
                            {apiKey.tag && (
                                <Tooltip
                                    content={t("apiKeyAutoCreatedTooltip")}
                                >
                                    <div className="tag">
                                        <span className="notranslate material-symbols-rounded">
                                            smart_toy
                                        </span>
                                    </div>
                                </Tooltip>
                            )}
                            <Button
                                variant="transparent"
                                onClick={() => setIsInspectPageData(apiKey)}
                                style={{ padding: ".25rem" }}
                            >
                                <span className="notranslate material-symbols-rounded">
                                    info
                                </span>
                            </Button>
                        </div>
                    )
                })}
                {Boolean(!isLoading && apiKeysStore.apiKeys.length === 0) && (
                    <p style={{ margin: "auto", paddingBottom: ".5rem", color: "var(--dracula-gray)" }}>
                        {t.rich("noApiKeys", {
                            link: (chunks) => (
                                <Link
                                    style={{ color: "var(--drasca-cyan)" }}
                                    href={"/tutorial"}
                                >
                                    {chunks}
                                </Link>
                            ),
                        })}
                    </p>
                )}
            </div>
            <AnimatePresence>
                {isCreationPageOpen && (
                    <SubPageCreateApiKey
                        close={() => setIsCreationPageOpen(false)}
                        key={1}
                        setHeight={setHeight}
                    />
                )}
                {inspectPageData && (
                    <SubPageInspectApiKey
                        close={() => setIsInspectPageData(null)}
                        key={2}
                        apiKey={inspectPageData}
                        setHeight={setHeight}
                    />
                )}
            </AnimatePresence>
            {/* <button
                onClick={() => setIsCreationPageOpen(true)}
                className="create"
                key={3}
                // style={{ marginTop: "auto" }}
            >
                Criar uma nova api key
            </button> */}
            <Button
                variant="purple"
                onClick={() => setIsCreationPageOpen(true)}
                className="create"
                key={3}
                style={{ transition: ".1s", opacity: hasPageOpen ? 0 : 1 }}
            >
                {t("createKey")}
            </Button>
        </IntegrationsBox>
    )
}

export default Integrations
