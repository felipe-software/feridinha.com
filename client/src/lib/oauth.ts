import type { OAuthProviderName } from "@/hooks/useUserDataStore"

export const OAUTH_PROVIDERS = [
    "twitch",
    "google",
    "discord",
] as const satisfies readonly OAuthProviderName[]

export const getOAuthLoginUrl = (
    apiUrl: string,
    provider: OAuthProviderName,
) => `${apiUrl.replace(/\/$/, "")}/login/${provider}/redirect`

export const getOAuthFragmentValue = (
    hash: string,
    key: "oauth-error" | "oauth-link",
) => {
    const prefix = `#${key}=`
    if (!hash.startsWith(prefix)) return null

    const encodedValue = hash.slice(prefix.length)
    if (!encodedValue) return null

    try {
        return decodeURIComponent(encodedValue)
    } catch {
        return null
    }
}

export const stripOAuthFragmentFromUrl = (value: string) =>
    value.replace(/#oauth-(?:error|link)=[^#]*$/, "")
