import { useEffect, useRef, useState } from "react"
import { SpanProps } from "react-html-props"
import styled from "styled-components"

interface Props extends SpanProps {
    textLength: number
    width: number
    charactersType: "any" | "titlecase"
    includeNumbers: boolean
    includeLetters: boolean
}

const SpanStyled = styled.span`
    display: inline-block;

    /* background-color: red; */
    text-align: left;
`

export const RandomText = (props: Props) => {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [text, setText] = useState("")

    const getRandomText = () => {
        let characters = ""

        if(props.includeNumbers) {
            characters += "0123456789"
        }
        if(props.includeLetters) {
            characters += "abcdefghijklmnopqrstuvwxyz"
            
            if(props.charactersType !== "titlecase") {
                characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            }
        }
        

        let result = ""
        for (let i = 0; i < props.textLength; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            )
        }

        if(props.charactersType === "titlecase") {
            result = result.charAt(0).toUpperCase() + result.slice(1)
        }

        return result
    }

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setText(getRandomText())
        }, 250)
        return () => {
            clearInterval(intervalRef.current!)
        }
    }, [])

    return (
        <SpanStyled
            className="random-text"
            {...props}
            style={{
                minWidth: `${props.width}rem`,
                maxWidth: `${props.width}rem`,
            }}
        >
            {text}
        </SpanStyled>
    )
}
