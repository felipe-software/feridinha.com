import { motion } from "motion/react"
import { useEffect, useState } from "react"
import styled from "styled-components"


const Container = styled(motion.div)`
    --color-1: rgb(255, 128, 191);
    --color-2: rgb(149, 131, 255);


    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 200% auto;
    transition: background 2s;
    animation: complexGradient 1s linear infinite reverse;

    &.yellow {
        --color-1: #f1fa8c;
        --color-2: #ffb86c;
    }

    @keyframes complexGradient {
        0% {
            background-position: 0% center;
        }
        100% {
            background-position: -200% center;
        }
    }
`

export const AnimatedText = () => {
    const [string, setString] = useState("linear-gradient(90deg, red, green, red)")

    useEffect(() => {
        setTimeout(() => {
            setString("linear-gradient(90deg, blue, yellow, blue)")
        }, 10_000)
    }, [])

    return (
        <Container
            animate={{
                background: string,
                backgroundSize: "200% auto",
            }}
            transition={{ background: { duration: 1, ease: 'linear' } }}
            className="yellow"
        >
            <h1>Feridinha.com</h1>
        </Container>
    )
}

export default AnimatedText
