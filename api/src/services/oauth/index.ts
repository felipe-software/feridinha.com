import { OAuthProvider } from "@prisma/client";
import discord from "./discord";
import google from "./google";
import twitch from "./twitch";
import type { OAuthProviderAdapter } from "./types";

export const OAUTH_PROVIDER_SLUGS = ["twitch", "google", "discord"] as const;
export type OAuthProviderSlug = (typeof OAUTH_PROVIDER_SLUGS)[number];

const providers: Record<OAuthProviderSlug, OAuthProviderAdapter> = {
    twitch,
    google,
    discord,
};

export const parseOAuthProvider = (value: unknown): OAuthProviderSlug | null =>
    typeof value === "string" && OAUTH_PROVIDER_SLUGS.includes(value as OAuthProviderSlug)
        ? (value as OAuthProviderSlug)
        : null;

export const getOAuthProvider = (slug: OAuthProviderSlug) => providers[slug];

export const providerToSlug = (provider: OAuthProvider): OAuthProviderSlug => provider.toLowerCase() as OAuthProviderSlug;

export type { OAuthProfile, OAuthProviderAdapter, OAuthToken } from "./types";
