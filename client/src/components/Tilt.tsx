import { useEffect, useRef } from "react"
import VanillaTilt from "vanilla-tilt"

function Tilt(props: any) {
    const { options, ...rest } = props
    const tiltRef = useRef(null)
    const statusRef = useRef(false)

    useEffect(() => {
        if (tiltRef.current && !statusRef.current) {
            statusRef.current = true
            VanillaTilt.init(tiltRef.current, options)
        }
    }, [options])

    return <div ref={tiltRef} {...rest} suppressHydrationWarning />
}

export default Tilt
