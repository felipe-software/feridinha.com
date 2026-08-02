import type { OAuthProvider } from "@prisma/client";

export interface OAuthToken {
    accessToken: string;
}

export interface OAuthProfile {
    providerAccountId: string;
    displayName: string;
    profileImage: string;
    color: string;
}

export interface OAuthProviderAdapter {
    provider: OAuthProvider;
    redirectUri: string;
    getAuthorizationUrl: (state: string) => string;
    exchangeCode: (code: string) => Promise<OAuthToken>;
    fetchProfile: (accessToken: string) => Promise<OAuthProfile>;
}
