import env from "@/config/env";
import logger from "@/config/logger";
import { ExternalServiceError, getUpstreamStatus } from "@/utils/httpErrors";
import { OAuthProvider } from "@prisma/client";
import axios from "axios";
import { z } from "zod";
import type { OAuthProviderAdapter } from "./types";

const tokenSchema = z.object({
    access_token: z.string().min(1),
});

const profileSchema = z.object({
    id: z.string().min(1),
    username: z.string().min(1),
    global_name: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    accent_color: z.number().int().nonnegative().nullable().optional(),
});

const fallbackImage = () => new URL("/icon.png", env.CLIENT_URL).toString();

const discord: OAuthProviderAdapter = {
    provider: OAuthProvider.DISCORD,
    redirectUri: env.DISCORD_REDIRECT_URL,

    getAuthorizationUrl(state) {
        const url = new URL("https://discord.com/oauth2/authorize");
        url.search = new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            redirect_uri: env.DISCORD_REDIRECT_URL,
            response_type: "code",
            scope: "identify",
            state,
        }).toString();
        return url.toString();
    },

    async exchangeCode(code) {
        try {
            const response = await axios.post(
                "https://discord.com/api/v10/oauth2/token",
                new URLSearchParams({
                    code,
                    client_id: env.DISCORD_CLIENT_ID,
                    client_secret: env.DISCORD_CLIENT_SECRET,
                    redirect_uri: env.DISCORD_REDIRECT_URL,
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
            logger.error({ service: "discord", operation: "exchange_code", upstreamStatus }, "Discord request failed");
            throw new ExternalServiceError("discord_auth_failed", upstreamStatus);
        }
    },

    async fetchProfile(accessToken) {
        try {
            const response = await axios.get("https://discord.com/api/v10/users/@me", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = profileSchema.parse(response.data);
            const profileImage = data.avatar
                ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`
                : fallbackImage();
            const color =
                data.accent_color === null || data.accent_color === undefined
                    ? "#ffffff"
                    : `#${data.accent_color.toString(16).padStart(6, "0")}`;

            return {
                providerAccountId: data.id,
                displayName: data.global_name ?? data.username,
                profileImage,
                color,
            };
        } catch (error) {
            const upstreamStatus = getUpstreamStatus(error);
            logger.error({ service: "discord", operation: "fetch_profile", upstreamStatus }, "Discord request failed");
            throw new ExternalServiceError("discord_profile_failed", upstreamStatus);
        }
    },
};

export default discord;
