"use client"
import Tilt from "@/components/Tilt"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import cardStyles from "./features-box-cards.module.css"
import styles from "./features-box.module.css"
import { useMediaQuery } from "usehooks-ts"

type TypeCard = "person-add" | "dns" | "data-object" | "auto-awesome"
let current: TypeCard = "person-add"

const cards: TypeCard[] = ["person-add", "dns", "data-object", "auto-awesome"]
let isActive = true
let currentInterval: any = null

const FeaturesBox = () => {
    const t = useTranslations("Landing")
    const [currentActive, setCurrentActive] = useState<TypeCard | null>("person-add")
    const isMobile = useMediaQuery("(max-width: 830px)")
    const setCardActive = () => {
        if (!isActive) return
        const currentIndex = cards.findIndex((n) => n === current)
        let targetIndex = currentIndex + 1
        window.document.getElementById("#root")
        if (targetIndex === cards.length) {
            targetIndex = 0
        }

        current = cards[targetIndex]
        setCurrentActive(cards[targetIndex])
    }

    const disableInterval = () => {
        isActive = false
        clearTimeout(currentInterval)
        setCurrentActive(null)
    }

    useEffect(() => {
        clearInterval(currentInterval)
        if(isMobile) {
            setCurrentActive(null)
            return
        }
        currentInterval = setInterval(setCardActive, 6000)
        return () => clearInterval(currentInterval)
    }, [isMobile])

    return (
        <Tilt
            data-tilt
            data-tilt-gyroscope="false"
            data-tilt-max="6"
            data-tilt-speed="7000"
            data-tilt-scale="1.05"
            onMouseEnter={disableInterval}
            className={styles.wrapper}
        >
            <div>
                <h1 className="main-text no-select">
                    {t.rich("heroTitle", {
                        highlight: (chunks) => <span>{chunks}</span>,
                    })}
                </h1>
            </div>
            <div
                className={`${cardStyles["card"]} ${cardStyles["card-person-add"]} ${
                    currentActive === "person-add" ? cardStyles["active"] : ""
                }`}
                id="person-add"
            >
                <span className={`${cardStyles["card-icon"]} no-select notranslate`}>person_add</span>
                <span className={`${cardStyles["card-icon-after"]} no-select notranslate`}>person_add</span>
                <h2>{t("featureAccount")}</h2>
            </div>
            <div
                className={`${cardStyles["card"]} ${cardStyles["card-dns"]} ${
                    currentActive === "dns" ? cardStyles["active"] : ""
                }`}
                id={styles.dns}
            >
                <span className={`${cardStyles["card-icon"]} no-select notranslate`}>dns</span>
                <span className={`${cardStyles["card-icon-after"]} no-select notranslate`}>dns</span>
                <h2>{t("featureUptime")}</h2>
            </div>
            <div
                className={`${cardStyles["card"]} ${cardStyles["card-data-object"]} ${
                    currentActive === "data-object" ? cardStyles["active"] : ""
                }`}
                id="data-object"
            >
                <span className={`${cardStyles["card-icon"]} no-select notranslate`}>data_object</span>
                <span className={`${cardStyles["card-icon-after"]} no-select notranslate`}>data_object</span>
                <h2>{t("featureApi")}</h2>
            </div>
            <div
                className={`${cardStyles["card"]} ${cardStyles["card-auto-awesome"]} ${
                    currentActive === "auto-awesome" ? cardStyles["active"] : ""
                }`}
                id="auto-awesome"
            >
                <span className={`${cardStyles["card-icon"]} no-select notranslate`}>auto_awesome</span>
                <span className={`${cardStyles["card-icon-after"]} no-select notranslate`}>auto_awesome</span>
                <h2>{t("featureAchievements")}</h2>
            </div>
        </Tilt>
    )
}
export default FeaturesBox
