import logger from "@/config/logger";
import { PROXY_DOMAINS } from "@/services/external-post/constants";
import {
    instagramParsedSchema,
    redditParsedSchema,
    tiktokParsedSchema,
    twitterParsedSchema,
} from "@/validations/externalPostParsed";
import { MuralPostType } from "@prisma/client";
import * as cheerio from "cheerio";
import z from "zod";

function getMeta($: cheerio.CheerioAPI, property: string | string[]): string | undefined {
    const props = Array.isArray(property) ? property : [property];
    for (const prop of props) {
        const selector = prop.startsWith("og:") ? `meta[property="${prop}"]` : `meta[name="${prop}"]`;
        const content = $(selector).first().attr("content");
        if (content) return content;
    }
    return undefined;
}

function normalizeInstagramMediaUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    return new URL(url, PROXY_DOMAINS.instagram).toString();
}

export function parseInstagramHtml(html: string) {
    const $ = cheerio.load(html);
    const videoUrl = normalizeInstagramMediaUrl(
        getMeta($, "og:video:secure_url") ?? getMeta($, "og:video") ?? getMeta($, "twitter:player:stream"),
    );
    const imageUrl = normalizeInstagramMediaUrl(getMeta($, "og:image"));
    const title = getMeta($, "og:title") ?? getMeta($, "twitter:title");
    const description = getMeta($, "og:description");

    return instagramParsedSchema.parse({
        contentUrl: videoUrl ?? imageUrl,
        title: title ?? undefined,
        description: description ?? undefined,
        contentType: videoUrl ? "VIDEO" : "IMAGE",
    });
}

export function parseTiktokHtml(html: string) {
    const $ = cheerio.load(html);
    const videoUrl = getMeta($, "og:video") ?? getMeta($, "twitter:player") ?? getMeta($, "twitter:player:stream");
    const title = getMeta($, "og:title") ?? getMeta($, "twitter:title");
    const description = getMeta($, "og:description");

    return tiktokParsedSchema.parse({
        contentUrl: videoUrl,
        description,
        title,
        contentType: "VIDEO",
    });
}

export function parseRedditHtml(html: string) {
    const $ = cheerio.load(html);
    const videoUrl = getMeta($, "og:video:secure_url") ?? getMeta($, "og:video") ?? getMeta($, "twitter:player:stream");

    const imageUrl = getMeta($, "twitter:image");
    const title = getMeta($, "og:title") ?? getMeta($, "twitter:title");
    const description = getMeta($, "og:description");

    let subreddit: string | undefined;
    const ogUrl = getMeta($, "og:url");
    if (ogUrl) {
        const match = ogUrl.match(/reddit\.com\/(r\/[\w]+)/);
        if (match) subreddit = match[1];
    }
    const creator = getMeta($, "twitter:creator");
    if (!subreddit && creator) {
        const match = creator.match(/on\s+(r\/[\w]+)/);
        if (match) subreddit = match[1];
    }

    let contentType: MuralPostType | undefined = undefined;

    if (videoUrl) {
        contentType = "VIDEO";
    } else if (imageUrl) {
        contentType = "IMAGE";
    }

    logger.info({ msg: "[external-post/parser](REDDIT) Resultado parser", contentUrl: videoUrl ?? imageUrl });

    const result = {
        title,
        description: description ?? undefined,
        contentUrl: videoUrl ?? imageUrl,
        contentType,
    };

    return redditParsedSchema.parse(result);
}

export function parseTwitterHtml(html: string) {
    const $ = cheerio.load(html);
    const videoUrl = getMeta($, "og:video:secure_url") ?? getMeta($, "og:video") ?? getMeta($, "twitter:player:stream");
    const imageUrl = getMeta($, "og:image") ?? getMeta($, "twitter:image");
    const title = getMeta($, "og:title") ?? getMeta($, "twitter:title");
    const description = getMeta($, "og:description");

    return twitterParsedSchema.parse({
        contentUrl: videoUrl ?? imageUrl,
        title: title ?? undefined,
        description: description ?? undefined,
        contentType: videoUrl ? "VIDEO" : "IMAGE",
    });
}

export const parse = async (
    platform: keyof typeof PROXY_DOMAINS,
    html: string,
): Promise<z.infer<typeof redditParsedSchema> | null> => {
    switch (platform) {
        case "reddit":
            return parseRedditHtml(html);
        case "instagram":
            return parseInstagramHtml(html);
        case "tiktok":
            return parseTiktokHtml(html);
        case "twitter":
            return parseTwitterHtml(html);
    }

    return null;
};

export const externalPostParser = {
    parseInstagramHtml,
    parseTiktokHtml,
    parseRedditHtml,
    parseTwitterHtml,
    parse,
};
