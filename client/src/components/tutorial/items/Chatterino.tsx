import Loading from "@/components/Loading"
import Tooltip from "@/components/Tooltip"
import { useTutorialApiKey } from "@/hooks/useApiKeys"
import useTokenStore from "@/hooks/useToken"
import { TippyProps } from "@tippyjs/react"
import { ReactNode, useRef, useState } from "react"
import { TDProps } from "react-html-props"
import { Instance } from "tippy.js"
import { Container, Table } from "./styles"
import useUserDataStore from "@/hooks/useUserDataStore"
import { useWindowSize } from "usehooks-ts"
import { useTranslations } from "next-intl"

export const Data = ({
    text,
    customTooltip,
    customCopy,
    visible,
    placement,
    isIntegrationToken,
    customProps,
}: {
    text: string
    customTooltip?: ReactNode
    customCopy?: string
    visible?: boolean
    placement?: TippyProps["placement"]
    isIntegrationToken?: boolean
    customProps?: TDProps
}) => {
    const [clicked, setClicked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const tutorialKey = useTutorialApiKey()
    const tooltipRef = useRef<Instance | null>(null)
    const [isTooltipVisible, setTooltipVisible] = useState(!!isIntegrationToken)
    const t = useTranslations("Tutorial")
    const commonT = useTranslations("Common")

    const handleClipboardCopy = async (text: string) => {
        if (isIntegrationToken) {
            setIsLoading(true)
            const apiKey = await tutorialKey.get()
            setIsLoading(false)
            if (!apiKey) return
            setClicked(true)
            navigator.clipboard.writeText(`token: ${apiKey?.secret}`)
            return
        }
        navigator.clipboard.writeText(text)
    }

    return (
        <Tooltip
            placement={placement || "top"}
            content={
                <div className="content">
                    <>
                        {(!clicked &&
                            (customTooltip || t("copyHint"))) ||
                            commonT("copied")}
                    </>
                </div>
            }
            // @ts-ignore
            onClick={() => setClicked(true)}
            hideOnClick={false}
            onTrigger={() => setClicked(false)}
            onCreate={(instance) => {
                if (isIntegrationToken) {
                    instance.show()
                }
                tooltipRef.current = instance
            }}
            onHide={() => {
                setTooltipVisible(false)
            }}
            children={
                <td
                    onClick={(e) => {
                        e.stopPropagation()
                        handleClipboardCopy(customCopy || text)
                    }}
                    {...customProps}
                    aria-current={isTooltipVisible}
                >
                    <Loading
                        isLoading={isLoading}
                        message={t("creatingIntegrationToken")}
                    />
                    {text}
                </td>
            }
            visible={visible}
        />
    )
}

export const Sharex = () => {
    const [isLoading, setIsLoading] = useState(false)
    const fakeLinkRef = useRef<HTMLAnchorElement>(null)
    const tutorialKey = useTutorialApiKey()
    const user = useUserDataStore()
    const tokenStore = useTokenStore()
    const t = useTranslations("Tutorial")

    const handleDownload = async () => {
        if (!fakeLinkRef.current) return
        setIsLoading(true)
        const key = await tutorialKey.get()
        setIsLoading(false)

        const Headers = key?.secret
            ? {
                  token: key.secret,
              }
            : undefined

        const userLabel =
            user.userData?.name && tokenStore.token
                ? t("loggedInAs", { name: user.userData.name })
                : t("anonymousUser")

        const jsonContent = {
            Version: "14.0.1",
            Name: `Feridinha.com (${userLabel})`,
            DestinationType: "ImageUploader, FileUploader",
            RequestMethod: "POST",
            RequestURL: `${window.location.origin}/upload`,
            Headers: Headers,
            Body: "MultipartFormData",
            FileFormName: "file",
            URL: "{json:message}",
            ThumbnailURL: "{json:message}",
            DeletionURL: "{json:delete}",
            ErrorMessage: "{json:error}",
        }

        // Converter o objeto para JSON string
        const jsonString = JSON.stringify(jsonContent, null, 2)

        // Criar um Blob com o conteúdo JSON
        const blob = new Blob([jsonString], { type: "application/json" })

        fakeLinkRef.current.href = URL.createObjectURL(blob)

        fakeLinkRef.current.download = `Feridinha.com Sharex (${userLabel}).sxcu`
        fakeLinkRef.current.click()
    }

    return (
        <Container>
            <a ref={fakeLinkRef}></a>
            <ul
                style={{
                    fontSize: "1rem",
                    listStyle: "inside",
                }}
            >
                <li>
                    {t("sharexIntro")}
                </li>
                <li>
                    <strong>{t("sharexTokenNotice")}</strong>
                </li>
                <li>
                    <a
                        onClick={(e) => {
                            e.stopPropagation()
                            handleDownload()
                        }}
                    >
                        {t("sharexDownload")}
                    </a>
                </li>
            </ul>
            <Loading
                isLoading={isLoading}
                message={t("sharexLoading")}
            />
        </Container>
    )
}

export default function Chatterino() {
    const windowSize = useWindowSize()
    const placement = windowSize.width > 800 ? "right" : "auto"
    const t = useTranslations("Tutorial")

    return (
        <Container>
            <Table>
                <thead>
                    <tr>
                        <th>{t("tableItem")}</th>
                        <th>{t("tableValue")}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{t("requestUrl")}</td>
                        <Data text={"https://feridinha.com/upload"} />
                    </tr>
                    <tr>
                        <td>{t("formField")}</td>
                        <Data text={"file"} />
                    </tr>
                    <tr>
                        <td>{t("extraHeaders")}</td>
                        <Data
                            text="token: **********"
                            isIntegrationToken={true}
                            customTooltip={t("integrationTokenTooltip")}
                            placement={placement}
                        />
                    </tr>
                    <tr>
                        <td>{t("imageLink")}</td>
                        <Data text={"{message}"} />
                    </tr>
                    <tr>
                        <td>{t("deletionLink")}</td>
                        <Data text={"{delete}"} />
                    </tr>
                </tbody>
            </Table>
            <a
                onClick={(e) => e.stopPropagation()}
                href="https://c.feridinha.com/HNPDQ.mp4"
                target="_blank"
            >
                {t("tutorialVideo")}
            </a>
            <p>{t("configurePath")}</p>
        </Container>
    )
}
