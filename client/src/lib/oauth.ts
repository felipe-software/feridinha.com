import type { OAuthProviderName } from "@/hooks/useUserDataStore"
import type { OAuthLinkCompletion } from "@/services/api"

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

type MergeResponse = { success: true } | { success: false; error: string }

export const resolveOAuthLinkCompletion = async (
    completion: OAuthLinkCompletion,
    confirmMerge: (provider: OAuthProviderName) => boolean,
    completeMerge: (ticket: string) => Promise<MergeResponse>,
) => {
    if (completion.kind === "linked") return { kind: "linked" as const }
    if (!confirmMerge(completion.provider)) return { kind: "cancelled" as const }

    const response = await completeMerge(completion.ticket)
    if (!response.success) return { kind: "error" as const, error: response.error }
    return { kind: "merged" as const }
}
