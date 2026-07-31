const REACT_REF_WARNING = "Accessing element.ref was removed in React 19"

type GlobalState = typeof globalThis & {
    __feridinhaReactRefWarningSuppressed?: boolean
}

const globalState = globalThis as GlobalState

if (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    !globalState.__feridinhaReactRefWarningSuppressed
) {
    const originalConsoleError = console.error.bind(console)

    console.error = (...args: Parameters<typeof console.error>) => {
        const isReactRefWarning = args.some(
            (arg) => typeof arg === "string" && arg.includes(REACT_REF_WARNING),
        )

        if (isReactRefWarning) return

        originalConsoleError(...args)
    }

    globalState.__feridinhaReactRefWarningSuppressed = true
}
