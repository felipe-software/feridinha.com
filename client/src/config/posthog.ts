export const POSTHOG_PROXY_PATH = "/faro"
export const POSTHOG_ASSET_PROXY_PATH = `${POSTHOG_PROXY_PATH}/aux`

export const obfuscatePostHogAssetUrl = (source: string) => {
    const url = new URL(source)
    const assetPath = `${url.pathname}${url.search}`
    const encodedPath = btoa(assetPath)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "")

    return `${url.origin}${POSTHOG_ASSET_PROXY_PATH}/${encodedPath}`
}
