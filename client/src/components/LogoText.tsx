import { motion, MotionProps } from "motion/react"
import { memo, useEffect, useRef } from "react"
import styled from "styled-components"

const Container = styled(motion.h1)`
    position: relative;
    width: max-content;
    white-space: nowrap;
    font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

    --color-1: rgb(255, 148, 191);
    --color-2: rgb(149, 131, 255);
    transition: transform 0.15s ease;

    .base {
        display: block;
        opacity: 0;
        pointer-events: none;
        user-select: none;
    }

    .animated {
        position: absolute;
        inset: 0;
        display: flex;
    }

    .animated span {
        display: inline-block;
        font-family: inherit;
        background: linear-gradient(
            130deg,
            var(--color-1) 0%,
            var(--color-2) 50%,
            var(--color-1) 100%
        );
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gradient 4s linear infinite reverse;
        /* text-shadow: 0px 0px 1px #f8f8f8; */
        /* outline: 1px solid red; */
        text-rendering: optimizeLegibility;

        &:hover {
            color: white !important;
            
        }
    }

    &:hover {
        transform: scale(1.025);
    }

    @keyframes gradient {
        0% {
            background-position: var(--start-pos, 0px) center;
        }
        100% {
            background-position: var(--end-pos, 0px) center;
        }
    }
`

type DelayPattern =
    | "left-to-right"
    | "right-to-left"
    | "center-to-edges"
    | "edges-to-center"
    | "random"

const getDelay = ({
    pattern,
    totalChildren,
    index,
    targetPoint,
}: {
    pattern: DelayPattern
    totalChildren: number
    index: number
    targetPoint?: number
}): number => {
    const baseDelay = 0.05

    switch (pattern) {
        case "left-to-right":
            return index * baseDelay
        case "right-to-left":
            return (totalChildren - 1 - index) * baseDelay
        case "center-to-edges": {
            const middle = targetPoint ?? (totalChildren - 1) / 2
            return Math.abs(index - middle) * baseDelay
        }
        case "edges-to-center": {
            const distanceFromEdge = Math.min(index, totalChildren - 1 - index)
            return distanceFromEdge * baseDelay
        }
        case "random":
            return Math.random() * ((totalChildren - 1) * baseDelay)
        default:
            return 0
    }
}

export const LogoText = memo(
    (
        props: MotionProps & {
            children: string
            autoAnimate?: boolean
            autoAnimateTiming?: number
            autoAnimateDelay?: number
        }
    ) => {
        const ref = useRef<HTMLHeadingElement>(null)
        const spanRefs = useRef<(HTMLSpanElement | null)[]>(
            Array.from({ length: props.children.length }, () => null)
        )
        const isAnimatingRef = useRef<boolean>(false)
        const intervalRef = useRef<any | null>(null)
        const timeoutRef = useRef<any | null>(null)
        const lastTargetRef = useRef<DelayPattern | null>(null)
        const lastMouseMoveX = useRef<number | null>(null)

        const animator = (pattern: DelayPattern, targetPoint?: number) => {
            if (!spanRefs.current) return
            lastTargetRef.current = pattern

            const children = spanRefs.current
            const total = children.length

            let xKeyframes: number[] | [number, number, number] = [0, 0, 0]
            if (pattern === "left-to-right") xKeyframes = [0, 4, 0]
            else if (pattern === "right-to-left") xKeyframes = [0, -4, 0]

            children.forEach((el, i) => {
                const delaySec = getDelay({
                    pattern,
                    totalChildren: total,
                    index: i,
                    targetPoint,
                })

                const keyframes: Keyframe[] = [
                    {
                        transform: `translateX(${xKeyframes[0]}px) translateY(0)`,
                        fontWeight: "600",
                        filter: "hue-rotate(0deg) saturate(1)",
                    },
                    {
                        transform: `translateX(${xKeyframes[1]}px) translateY(-5px)`,
                        fontWeight: "900",
                        filter: "hue-rotate(90deg) saturate(.65) brightness(1.35)",
                    },
                    {
                        transform: `translateX(${xKeyframes[2]}px) translateY(0)`,
                        fontWeight: "600",
                        filter: "hue-rotate(0deg) saturate(1)",
                    },
                ]

                const options: KeyframeAnimationOptions = {
                    duration: 350,
                    delay: delaySec * 1000,
                    fill: "forwards",
                }
                if (!el) return
                const animation = el.animate(keyframes, options)
                animation.onfinish = () => {
                    if (i + 1 === total) {
                        isAnimatingRef.current = false
                    }
                }
            })
        }

        const onMouseEnter = () => {
            if (isAnimatingRef.current) return
            isAnimatingRef.current = true
            const patterns = [
                "center-to-edges",
                "edges-to-center",
                "random",
                "right-to-left",
                "left-to-right",
            ].filter((d) => d !== lastTargetRef.current) as DelayPattern[]

            const pattern =
                patterns[Math.floor(Math.random() * patterns.length)]

            animator(pattern)
        }

        const onPointerDown = (index: number) => () => {
            if (isAnimatingRef.current) return
            isAnimatingRef.current = true

            animator("center-to-edges", index)
        }



        const onMouseMove = (e: MouseEvent) => {
            if (isAnimatingRef.current) return
            if (lastMouseMoveX.current === e.clientX) return
            if (!lastMouseMoveX.current)
                return (lastMouseMoveX.current = e.clientX)

            const currentX = e.clientX

            const distance = currentX - lastMouseMoveX.current
            const diff = Math.abs(distance)

            if (diff < 50) return
            isAnimatingRef.current = true
            lastMouseMoveX.current = null
            if (distance > 0) {
                animator("left-to-right")
            } else {
                animator("right-to-left")
            }
        }

        useEffect(() => {
            clearInterval(intervalRef.current!)
            clearTimeout(timeoutRef.current!)
            if (!props.autoAnimate) return

            timeoutRef.current = setTimeout(() => {
                intervalRef.current = setInterval(() => {
                    onMouseEnter()
                }, props.autoAnimateTiming || 1000)
            }, props.autoAnimateDelay || 0)
        }, [props.autoAnimate, props.autoAnimateDelay, props.autoAnimateTiming])

        useEffect(() => {
            if (!ref.current) return
            const container = ref.current
            const containerWidth = container.offsetWidth
            const spans = container.querySelectorAll<HTMLSpanElement>(
                ".animated > span"
            )

            spans.forEach((span) => {
                const offsetLeft = span.offsetLeft
                span.style.setProperty("--start-pos", `-${offsetLeft}px`)
                span.style.setProperty(
                    "--end-pos",
                    `-${containerWidth + offsetLeft}px`
                )
                span.style.backgroundSize = `${containerWidth}px auto`
            })
        }, [props.children])

        return (
            <Container
                // onMouseEnter={onMouseEnter}
                {...props}
                ref={ref}
                aria-label={props.children}
                // @ts-ignore
                onMouseMove={onMouseMove}
                onMouseLeave={() => {
                    lastMouseMoveX.current = null
                }}
                className="notranslate"
            >
                <span className="base" aria-hidden="true">
                    {props.children}
                </span>
                <span className="animated" aria-hidden="true">
                    {props.children.split("").map((d, i) => (
                        <motion.span
                            style={{ willChange: "transform" }}
                            key={i}
                            aria-hidden="true"
                            onPointerDown={onPointerDown(i)}
                            ref={r => { spanRefs.current[i] = r }}
                        >
                            {d}
                        </motion.span>
                    ))}
                </span>
            </Container>
        )
    }
)
