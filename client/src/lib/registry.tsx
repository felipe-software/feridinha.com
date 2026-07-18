"use client"

import { useServerInsertedHTML } from "next/navigation"
import React, { useState } from "react"
import { ServerStyleSheet, StyleSheetManager } from "styled-components"
import isPropValid from "@emotion/is-prop-valid"



export default function StyledComponentsRegistry({
    children,
}: {
    children: React.ReactNode
}) {
    const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

    useServerInsertedHTML(() => {
        const styles = styledComponentsStyleSheet.getStyleElement()
        styledComponentsStyleSheet.instance.clearTag()
        return <>{styles}</>
    })

    // if (typeof window !== "undefined") return <>{children}</>

    return (
        <StyleSheetManager
            shouldForwardProp={(propName, elementToBeRendered) => {
                return typeof elementToBeRendered === "string"
                    ? isPropValid(propName)
                    : true
            }}
            sheet={typeof window !== "undefined" ? undefined : styledComponentsStyleSheet.instance}
        >
            {children as React.ReactElement}
        </StyleSheetManager>
    )
}
