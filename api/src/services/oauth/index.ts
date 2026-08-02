import env from "@/config/env";
import logger from "@/config/logger";
import { OAuthProvider } from "@prisma/client";
import createDiscordOAuthProvider from "./discord";
import createGoogleOAuthProvider from "./google";
import twitch from "./twitch";
import type { OAuthProviderAdapter } from "./types";

export const OAUTH_PROVIDER_SLUGS = ["twitch", "google", "discord"] as const;
export type OAuthProviderSlug = (typeof OAUTH_PROVIDER_SLUGS)[number];

const providerNames: Record<OAuthProviderSlug, OAuthProvider> = {
    twitch: OAuthProvider.TWITCH,
    google: OAuthProvider.GOOGLE,
    discord: OAuthProvider.DISCORD,
};

interface OptionalOAuthProviderConfig {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
}

interface OAuthProviderConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export const hasCompleteOAuthProviderConfig = (
    config: OptionalOAuthProviderConfig,
): config is OAuthProviderConfig => Boolean(
    config.clientId && config.clientSecret && config.redirectUri,
);

const providers: Partial<Record<OAuthProviderSlug, OAuthProviderAdapter>> = {
    twitch,
};

const registerOptionalProvider = (
    slug: "google" | "discord",
    config: OptionalOAuthProviderConfig,
    createAdapter: (completeConfig: OAuthProviderConfig) => OAuthProviderAdapter,
) => {
    if (!hasCompleteOAuthProviderConfig(config)) {
        logger.info({ provider: slug }, "OAuth provider disabled (missing configuration)");
        return;
    }
    providers[slug] = createAdapter(config);
};

registerOptionalProvider("google", {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URL,
}, createGoogleOAuthProvider);

registerOptionalProvider("discord", {
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    redirectUri: env.DISCORD_REDIRECT_URL,
}, createDiscordOAuthProvider);

export const parseOAuthProvider = (value: unknown): OAuthProviderSlug | null =>
    typeof value === "string" && OAUTH_PROVIDER_SLUGS.includes(value as OAuthProviderSlug)
        ? (value as OAuthProviderSlug)
        : null;

export const isOAuthProviderEnabled = (slug: OAuthProviderSlug) => Boolean(providers[slug]);

export const getOAuthProvider = (slug: OAuthProviderSlug) => {
    const provider = providers[slug];
    if (!provider) throw new Error(`OAuth provider "${slug}" is disabled`);
    return provider;
};

export const providerFromSlug = (slug: OAuthProviderSlug) => providerNames[slug];

export const providerToSlug = (provider: OAuthProvider): OAuthProviderSlug => provider.toLowerCase() as OAuthProviderSlug;

export type { OAuthProfile, OAuthProviderAdapter, OAuthToken } from "./types";
