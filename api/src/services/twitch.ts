import env from "@/config/env"
import logger from "@/config/logger"
import { ExternalServiceError, getUpstreamStatus } from "@/utils/httpErrors"
import axios, { AxiosError, AxiosResponse } from "axios"
import { z } from "zod"
axios.defaults.headers.common["Accept-Encoding"] = "gzip"

const getRedirectUrl = (state: string) =>
    [
        "https://id.twitch.tv/oauth2/authorize",
        `?response_type=code&client_id=${env.TWITCH_CLIENT_ID}`,
        `&redirect_uri=${env.TWITCH_REDIRECT_URL}&scope=&state=${state}`,
    ].join("")

export const twitchCallbackSchema = z
    .object({
        code: z.string(),
        scope: z.string(),
        state: z.string(),
    })
    .strict()

export interface TwitchTokenData {
    client_id: string
    login: string
    user_id: string
    scopes: Array<string>
    expires_in: number
}

export interface TwitchAuthData {
    access_token: string
    expires_in: number
    refresh_token: string
    token_type: string
}

export interface TwitchUser {
    id: string
    login: string
    display_name: string
    type: string
    broadcaster_type: string
    description: string
    profile_image_url: string
    view_count: number
    created_at: string
}

export interface TwitchColorUser {
    user_id: string
    user_login: string
    user_name: string
    color?: string
}

const fetchAuthDataFromCallback = async (code: string): Promise<TwitchAuthData> => {
    const response = await axios({
        method: "post",
        url: `https://id.twitch.tv/oauth2/token`,
        data: {
            client_id: env.TWITCH_CLIENT_ID,
            client_secret: env.TWITCH_SECRET,
            code: code,
            grant_type: "authorization_code",
            redirect_uri: `${env.TWITCH_REDIRECT_URL}`,
        },
    })
        .then((response: AxiosResponse<TwitchAuthData>): TwitchAuthData => response.data)
        .catch((err: AxiosError) => {
            const upstreamStatus = getUpstreamStatus(err)
            logger.error({ service: "twitch", operation: "exchange_code", upstreamStatus }, "Twitch request failed")
            throw new ExternalServiceError("twitch_auth_failed", upstreamStatus)
        })

    return response
}

const fetchTokenData = async (access_token: string): Promise<TwitchTokenData> =>
    axios({
        method: "get",
        url: "https://id.twitch.tv/oauth2/validate",
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })
        .then((response: AxiosResponse<TwitchTokenData>) => response.data)
        .catch((err) => {
            const upstreamStatus = getUpstreamStatus(err)
            logger.error({ service: "twitch", operation: "validate_token", upstreamStatus }, "Twitch request failed")
            throw new ExternalServiceError("twitch_token_validation_failed", upstreamStatus)
        })

const fetchUserData = async (username: string): Promise<TwitchUser> =>
    axios({
        method: "get",
        url: `https://api.twitch.tv/helix/users?login=${username}`,
        headers: {
            Authorization: `Bearer ${env.TMI_ACCESS_TOKEN}`,
            "Client-Id": env.TMI_CLIENT_ID,
        },
    })
        .then((response) => response.data.data[0])
        .catch((err) => {
            const upstreamStatus = getUpstreamStatus(err)
            logger.error({ service: "twitch", operation: "fetch_user", upstreamStatus }, "Twitch request failed")
            throw new ExternalServiceError("twitch_user_fetch_failed", upstreamStatus)
        })

const fetchUserColor = async (user_id: string): Promise<TwitchColorUser> =>
    axios({
        method: "get",
        url: `https://api.twitch.tv/helix/chat/color?user_id=${user_id}`,
        headers: {
            Authorization: `Bearer ${env.TMI_ACCESS_TOKEN}`,
            "Client-Id": env.TMI_CLIENT_ID,
        },
    })
        .then((response: any): TwitchColorUser => response.data.data[0])
        .catch((err) => {
            const upstreamStatus = getUpstreamStatus(err)
            logger.error({ service: "twitch", operation: "fetch_color", upstreamStatus }, "Twitch request failed")
            throw new ExternalServiceError("twitch_color_fetch_failed", upstreamStatus)
        })

const getReadableDisplayName = (login: string, display_name: string) => {
    if (login.toLowerCase() === display_name.toLowerCase()) return display_name
    return login
}


const twitch = {
    fetchAuthDataFromCallback,
    fetchTokenData,
    fetchUserData,
    fetchUserColor,
    getReadableDisplayName,
    getRedirectUrl,
}
export default twitch
