import Tooltip from "@/components/Tooltip"
import { ApiAchievement } from "@/hooks/useUserDataStore"
import { useTranslations } from "next-intl"
import styled from "styled-components"
const Info = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .title {
        font-size: 1.15rem;
        text-align: center;

        font-weight: 600;
        letter-spacing: 0.01rem;
    }

    &.locked .title {
        font-size: 1rem;
    }

    &.unlocked .description {
        color: var(--foreground);
    }

    .description {
        font-size: 0.9rem;
        color: var(--dracula-gray);
    }

    .date {
        opacity: 0.5;
        font-weight: 400;
        letter-spacing: 0.02rem;
        font-size: 0.65rem;
    }
`
const Card = styled.div`
    aspect-ratio: 1/1;
    transition: transform 0.15s ease;
    cursor: pointer;
    &:not(.locked):hover {
        z-index: 10 !important;

        img {
            filter: contrast(1.5) saturate(1.3) brightness(1);
            transform: scale(2);
            /* transform: scale(1.4); */

            box-shadow: 0px 0px 50px 25px rgba(0, 0, 0, 0.5);
        }
    }
    img {
        filter: contrast(1.2) saturate(1.2) brightness(1);
        image-rendering: pixelated !important;
        border-radius: 0.125rem;
        transition: 0.2s ease-in;

        z-index: 1;
        /* width:100%; */
        height: 100%;
    }
    &.locked {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: not-allowed;

        .lock-icon {
            position: absolute;
            z-index: 1;
            width: 1.5rem;
            height: 1.5rem;
            opacity: 0.45;
        }
    }

    &:not(:hover) {
        animation: zIndexFix 0.15s ease;
        /* outline: 2px solid red; */
    }

    @keyframes zIndexFix {
        0%,
        100% {
            z-index: 2;
        }
    }
`

const Achievement = ({ achievement }: { achievement: ApiAchievement }) => {
    const isUnlocked = Boolean(achievement.secretUrl)
    const t = useTranslations("Dashboard")

    return (
        <Tooltip
            arrow={false}
            content={
                <Info className={isUnlocked ? "unlocked" : "locked"}>
                    <p
                        className={
                            "title " +
                            (isUnlocked ? "pretty-text-animated" : "locked")
                        }
                    >
                        {isUnlocked ? achievement.name : t("achievementsLocked")}
                    </p>
                    <p className="description">
                        {isUnlocked
                            ? achievement.description
                            : achievement.hiddenDescription}
                    </p>
                </Info>
            }
            className={"achievement-tooltip " + (isUnlocked ? "purple" : "")}
            offset={[0, isUnlocked ? 35 : 10]}
        >
            <Card
                className={isUnlocked ? "" : "locked"}
            >
                <img
                    src={
                        isUnlocked
                            ? achievement.secretUrl
                            : achievement.publicUrl
                    }
                />
            </Card>
        </Tooltip>
    )
}

export default Achievement
