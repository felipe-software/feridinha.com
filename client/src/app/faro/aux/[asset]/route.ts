import { POSTHOG_PROXY_PATH } from "@/config/posthog"
import { NextRequest } from "next/server"

const POSTHOG_API_HOST = "https://us.i.posthog.com"
const POSTHOG_ASSET_HOST = "https://us-assets.i.posthog.com"
const FORWARDED_RESPONSE_HEADERS = [
    "cache-control",
    "content-type",
    "etag",
    "last-modified",
] as const

const decodeAssetPath = (encodedPath: string) => {
    try {
        const decodedPath = Buffer.from(encodedPath, "base64url").toString("utf8")
        const url = new URL(decodedPath, "https://posthog-proxy.invalid")

        if (!url.pathname.startsWith(`${POSTHOG_PROXY_PATH}/`)) return null
        return url
    } catch {
        return null
    }
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ asset: string }> },
) {
    const { asset } = await params
    const requestedAsset = decodeAssetPath(asset)

    if (!requestedAsset) {
        return new Response("Invalid asset", { status: 400 })
    }

    const upstreamPath = requestedAsset.pathname.slice(POSTHOG_PROXY_PATH.length)
    const upstreamHost =
        upstreamPath.startsWith("/static/") || upstreamPath.startsWith("/array/")
            ? POSTHOG_ASSET_HOST
            : POSTHOG_API_HOST
    const upstreamUrl = new URL(upstreamPath, upstreamHost)
    upstreamUrl.search = requestedAsset.search

    const upstreamResponse = await fetch(upstreamUrl, {
        headers: { accept: "*/*" },
    })
    const responseHeaders = new Headers()

    for (const header of FORWARDED_RESPONSE_HEADERS) {
        const value = upstreamResponse.headers.get(header)
        if (value) responseHeaders.set(header, value)
    }

    return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
    })
}
