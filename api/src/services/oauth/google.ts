import env from "@/config/env";
import logger from "@/config/logger";
import { ExternalServiceError, getUpstreamStatus } from "@/utils/httpErrors";
import { OAuthProvider } from "@prisma/client";
import axios from "axios";
import { z } from "zod";
import type { OAuthProviderAdapter } from "./types";

interface GoogleOAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

const tokenSchema = z.object({
    access_token: z.string().min(1),
});

const profileSchema = z.object({
    sub: z.string().min(1),
    name: z.string().min(1).optional(),
    picture: z.string().url().optional(),
});

const fallbackImage = () => new URL("/icon.png", env.CLIENT_URL).toString();

const createGoogleOAuthProvider = ({
    clientId,
    clientSecret,
    redirectUri,
}: GoogleOAuthConfig): OAuthProviderAdapter => ({
    provider: OAuthProvider.GOOGLE,
    redirectUri,

    getAuthorizationUrl(state) {
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        url.search = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "openid profile",
            state,
            prompt: "select_account",
        }).toString();
        return url.toString();
    },

    async exchangeCode(code) {
        try {
            const response = await axios.post(
                "https://oauth2.googleapis.com/token",
                new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: "authorization_code",
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
            );
            const data = tokenSchema.parse(response.data);
            return { accessToken: data.access_token };
        } catch (error) {
            const upstreamStatus = getUpstreamStatus(error);
            logger.error({ service: "google", operation: "exchange_code", upstreamStatus }, "Google request failed");
            throw new ExternalServiceError("google_auth_failed", upstreamStatus);
        }
    },

    async fetchProfile(accessToken) {
        try {
            const response = await axios.get("https://openidconnect.googleapis.com/v1/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = profileSchema.parse(response.data);
            return {
                providerAccountId: data.sub,
                displayName: data.name ?? "Google User",
                profileImage: data.picture ?? fallbackImage(),
                color: "#ffffff",
            };
        } catch (error) {
            const upstreamStatus = getUpstreamStatus(error);
            logger.error({ service: "google", operation: "fetch_profile", upstreamStatus }, "Google request failed");
            throw new ExternalServiceError("google_profile_failed", upstreamStatus);
        }
    },
});

export default createGoogleOAuthProvider;
