import env from "@/config/env";
import logger from "@/config/logger";

export const externalPostRegexes = {
    reddit: /https?:\/\/(?:www\.)?(?:vx)?reddit\.com\/r\/[\w]+\/comments\/[\w]+/i,
    instagram: /https?:\/\/(?:www\.)?(?:zz)?instagram\.com\/(?:reels?|p)\/[\w-]+/i,
    tiktok: /https?:\/\/(?:www\.)?(?:ti|tn)ktok\.com\/@[\w.]+\/video\/\d+/i,
    twitter: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/\w+\/status\/\d+/i,
} as const;

const _PROXY_DOMAINS = {
    reddit: env.MURAL_VXREDDIT_URL,
    instagram: "https://www.zzinstagram.com",
    tiktok: "https://www.tnktok.com",
    twitter: "https://vxtwitter.com",
} as const;

const _PROXY_USER_AGENTS = {
    reddit: "Mozilla/5.0",
    instagram: "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    tiktok: "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    twitter: "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
} as const;

Object.entries(_PROXY_DOMAINS).forEach(([key, value]) => {
    logger.info({ msg: `[Mural/constants](Proxy Domains): ${key}: ${value} with ${(_PROXY_USER_AGENTS as any)[key]}` });
});

// Object.entries(_PROXY_DOMAINS).forEach(([key, value]) => {
//     logger.info({ msg: `[Mural/constants](User agents): ${key}: ${value}` });
// })

export const PROXY_DOMAINS = _PROXY_DOMAINS;
export const PROXY_USER_AGENTS = _PROXY_USER_AGENTS;

export const PLATFORM_MEDIA_HOSTS = {
    reddit: [
        "vxreddit.com",
        "reddit.com",
        "redd.it",
        "redditmedia.com",
        "redditstatic.com",
        new URL(env.MURAL_VXREDDIT_URL).hostname,
    ],
    instagram: ["zzinstagram.com"],
    tiktok: ["tnktok.com"],
    twitter: ["vxtwitter.com", "twimg.com"],
} as const;
