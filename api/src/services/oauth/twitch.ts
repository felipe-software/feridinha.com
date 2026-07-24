import env from "@/config/env";
import twitch from "@/services/twitch";
import { OAuthProvider } from "@prisma/client";
import type { OAuthProviderAdapter } from "./types";

const twitchAdapter: OAuthProviderAdapter = {
    provider: OAuthProvider.TWITCH,
    redirectUri: env.TWITCH_REDIRECT_URL,
    getAuthorizationUrl: twitch.getRedirectUrl,

    async exchangeCode(code) {
        const data = await twitch.fetchAuthDataFromCallback(code);
        return { accessToken: data.access_token };
    },

    async fetchProfile(accessToken) {
        const tokenData = await twitch.fetchTokenData(accessToken);
        const coloredUser = await twitch.fetchUserColor(tokenData.user_id);
        const userData = await twitch.fetchUserData(coloredUser.user_login);

        return {
            providerAccountId: tokenData.user_id,
            displayName: twitch.getReadableDisplayName(coloredUser.user_login, coloredUser.user_name),
            profileImage: userData.profile_image_url,
            color: coloredUser.color || "#ffffff",
        };
    },
};

export default twitchAdapter;
