import { MotionProps } from "motion/react"
import styled from "styled-components"

export const pageTransition: MotionProps = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
    transition: { duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] },
  }

export const subpageTransition: MotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: "easeIn" },
}

export const BasePageContainer = styled.div`
    position: absolute;
    inset: 0;
    width: 100%;
    top: var(--navbar-height);
    background-color: var(--base);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: visible;
    height: 100%;
`
