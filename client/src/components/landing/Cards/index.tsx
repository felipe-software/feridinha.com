import { memo } from "react"
import { useTranslations } from "next-intl"
import { Card, Container } from "./styles"

const CardBase = memo((props: any) => {
    return (
        <Card
            // data-tilt
            // data-tilt-gyroscope="false"
            // data-tilt-glare="true"
            // data-tilt-max-glare="0.09"
            // data-tilt-speed="5000"
            // data-tilt-scale="1.1"
            {...props}
            options={{
                speed: 500,
                glare: true,
                "max-glare": 0.09,
                gyroscope: false,
                scale: 1.1,
            }}
            className={"no-select"}
        />
    )
})

const Cards = () => {
    const t = useTranslations("Landing")
    return (
        <Container
            // variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            // viewport={{ once: true }}
        >
            <CardBase key={1} color={"#ff5555"} glow={"#ff5555"} delay={0}>
                <span className="notranslate card-icon no-select">electric_bolt</span>
                <div className="text-wrapper">
                    <h2>{t("cards.fast.title")}</h2>
                    <h4>
                        {t.rich("cards.fast.description", {
                            highlight: (chunks) => <span>{chunks}</span>,
                        })}
                    </h4>
                </div>
            </CardBase>
            <CardBase key={2} color={"#ffb86c"} glow={"#ffb86c7f"} delay={0.3}>
                <span className="notranslate card-icon no-select">visibility_off</span>
                <div className="text-wrapper">
                    <h2>{t("cards.private.title")}</h2>
                    <h4>
                        {t.rich("cards.private.description", {
                            highlight: (chunks) => <span>{chunks}</span>,
                        })}
                    </h4>
                </div>
            </CardBase>
            <CardBase key={3} color={"#9580ff"} glow={"#9580ff"} delay={0.6}>
                <span className="notranslate card-icon no-select">tune</span>
                <div className="text-wrapper">
                    <h2>{t("cards.robust.title")}</h2>
                    <h4>
                        {t.rich("cards.robust.description", {
                            years: new Date().getFullYear() - 2021,
                            highlight: (chunks) => <span>{chunks}</span>,
                        })}
                    </h4>
                </div>
            </CardBase>
            <CardBase key={4} color={"#8be9fd"} glow={"#8be8fd61"} delay={0.9}>
                <span className="notranslate card-icon no-select">verified_user</span>
                <div className="text-wrapper">
                    <h2>{t("cards.reliable.title")}</h2>
                    <h4>
                        {t.rich("cards.reliable.description", {
                            highlight: (chunks) => <span>{chunks}</span>,
                        })}
                    </h4>
                </div>
            </CardBase>
        </Container>
    )
}

export default Cards
