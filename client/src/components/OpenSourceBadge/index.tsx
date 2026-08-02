"use client"

import { GITHUB_REPOSITORY_URL } from "@/lib/links"
import { Container, Content, Spotlight } from "@/components/OpenSourceBadge/styles"
import { animate, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react"
import { useTranslations } from "next-intl"
import { usePostHog } from "posthog-js/react"
import { useRef } from "react"
import type { FocusEventHandler, PointerEventHandler } from "react"
import { FaGithub } from "react-icons/fa6"

export const OpenSourceBadge = ({
    isOpenSource,
    username,
}: {
    isOpenSource: boolean
    username?: string
}) => {
    const t = useTranslations("Nav")
    const posthog = usePostHog()
    const spotlightX = useMotionValue(0)
    const spotlightY = useMotionValue(0)
    const spotlightRadius = useMotionValue(0)
    const clipPath = useMotionTemplate`circle(${spotlightRadius}px at ${spotlightX}px ${spotlightY}px)`
    const shouldReduceMotion = useReducedMotion()
    const radiusAnimationRef = useRef<ReturnType<typeof animate>>(null)

    if (!isOpenSource) return null

    const moveSpotlight: PointerEventHandler<HTMLAnchorElement> = (event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
        const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height))

        spotlightX.set(x)
        spotlightY.set(y)
    }

    const openSpotlight = () => {
        const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        const targetRadius = rootFontSize * 7

        radiusAnimationRef.current?.stop()

        if (shouldReduceMotion) {
            spotlightRadius.set(targetRadius)
            return
        }

        radiusAnimationRef.current = animate(spotlightRadius, targetRadius, {
            duration: 0.2,
            ease: "easeInOut",
        })
    }

    const handlePointerEnter: PointerEventHandler<HTMLAnchorElement> = (event) => {
        moveSpotlight(event)
        openSpotlight()
    }

    const closeSpotlight = () => {
        radiusAnimationRef.current?.stop()

        if (shouldReduceMotion) {
            spotlightRadius.set(0)
            return
        }

        radiusAnimationRef.current = animate(spotlightRadius, 0, {
            duration: 0.4,
            ease: "easeInOut",
        })
    }

    const handleFocus: FocusEventHandler<HTMLAnchorElement> = (event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        spotlightX.set(rect.width / 2)
        spotlightY.set(rect.height / 2)
        openSpotlight()
    }

    return (
        <Container
            className="base"
            href={GITHUB_REPOSITORY_URL}
            target="_blank"
            rel="external noopener noreferrer"
            aria-label={t("openSourceSpotlight")}
            onPointerMove={moveSpotlight}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={closeSpotlight}
            onFocus={handleFocus}
            onBlur={closeSpotlight}
            onClick={() => {
                posthog.capture("open_source_clicked", {
                    url: GITHUB_REPOSITORY_URL,
                    ...(username ? { username } : {}),
                })
            }}
        >
            <Content>
                <FaGithub />
                {t("openSource")}
            </Content>
            <Spotlight style={{ clipPath }} aria-hidden="true">
                <FaGithub />
                {t("openSourceSpotlight")}
            </Spotlight>
        </Container>
    )
}
