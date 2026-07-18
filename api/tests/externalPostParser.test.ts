import { describe, expect, test } from "bun:test";
import { externalPostParser } from "@/services/external-post/parser";

const INSTAGRAM_HTML = `<!DOCTYPE html><html lang="en"><head><base href="https://instafix.zzinstagram.com"/><meta charset="utf-8"/><meta name="theme-color" content="#CE0071"/><meta name="twitter:card" content="player"/><meta name="twitter:title" content="@jumoproject"/><meta name="twitter:player:width" content="0"/><meta name="twitter:player:height" content="0"/><meta name="twitter:player:stream" content="https://instafix.zzinstagram.com/videos/DU04xhLCKEr/1"/><meta name="twitter:player:stream:content_type" content="video/mp4"/><meta property="og:site_name" content="InstaFix"/><meta property="og:url" content="https://instagram.com/reels/DU04xhLCKEr/?"/><meta property="og:description" content="Paris, c'est le génial @giirls_band qui assurera la première partie de mon concert à @laboulenoire_ le 17 mars ! 😬🙌🏻🌌 Les dernières places sont disponibles via le lien dans ma bio ;)"/><meta property="og:video" content="https://instafix.zzinstagram.com/videos/DU04xhLCKEr/1"/><meta property="og:video:secure_url" content="https://instafix.zzinstagram.com/videos/DU04xhLCKEr/1"/><meta property="og:video:type" content="video/mp4"/></head><body></body></html>`;

const TIKTOK_HTML = `<html lang="en"><head><meta property="og:site_name" content="fxTikTok"/><meta property="og:title" content="Carlão (@carlo99992)"/><meta property="og:url" content="https://www.tiktok.com/@carlo99992/video/7607681087707417876"/><meta property="og:description" content="benção # vida abençoada ##LIVEIncentiveProgram"/><meta property="og:video" content="https://offload.tnktok.com/generate/video/7607681087707417876.mp4"/><meta property="og:video:type" content="video/mp4"/><meta property="twitter:player:stream" content="https://offload.tnktok.com/generate/video/7607681087707417876.mp4"/></head></html>`;

const REDDIT_HTML = `<!DOCTYPE html><html lang="en"><head><meta property="og:site_name" content="vxReddit"/><meta name="twitter:card" content="player"/><meta name="twitter:title" content="Tic Tac"/><meta name="twitter:creator" content="/u/SERGI0_Man0waR_ on r/7vidas"/><meta name="twitter:player:stream" content="https://vxreddit.com/redditvideo.mp4?video_url=https%3A%2F%2Fv.redd.it%2Fepcqrklak3lg1%2FCMAF_360.mp4&audio_url=https%3A%2F%2Fv.redd.it%2Fepcqrklak3lg1%2FCMAF_AUDIO_128.mp4"/><meta property="og:url" content="https://www.reddit.com/r/7vidas/comments/1rbuxgv/tic_tac/"/><meta property="og:video" content="https://vxreddit.com/redditvideo.mp4?video_url=https%3A%2F%2Fv.redd.it%2Fepcqrklak3lg1%2FCMAF_360.mp4&audio_url=https%3A%2F%2Fv.redd.it%2Fepcqrklak3lg1%2FCMAF_AUDIO_128.mp4"/><meta property="og:video:secure_url" content="https://vxreddit.com/redditvideo.mp4?video_url=https%3A%2F%2Fv.redd.it%2Fepcqrklak3lg1%2FCMAF_360.mp4&audio_url=https%3A%2F%2Fv.redd.it%2Fepcqrklak3lg1%2FCMAF_AUDIO_128.mp4"/></head><body></body></html>`;

describe("externalPostParser", () => {
    describe("parseInstagramHtml", () => {
        test("extrai videoUrl, title e description", () => {
            const result = externalPostParser.parseInstagramHtml(INSTAGRAM_HTML);
            expect(result.contentUrl).toBe("https://instafix.zzinstagram.com/videos/DU04xhLCKEr/1");
            expect(result.title).toBe("@jumoproject");
            expect(result.description).toContain("Paris, c'est le génial");
        });
    });

    describe("parseTiktokHtml", () => {
        test("extrai videoUrl, title e description", () => {
            const result = externalPostParser.parseTiktokHtml(TIKTOK_HTML);
            expect(result.contentUrl).toBe("https://offload.tnktok.com/generate/video/7607681087707417876.mp4");
            expect(result.title).toBe("Carlão (@carlo99992)");
            expect(result.description).toContain("benção");
        });
    });

    describe("parseRedditHtml", () => {
        test("extrai videoUrl, title, subreddit e description", () => {
            const result = externalPostParser.parseRedditHtml(REDDIT_HTML);
            expect(result.contentUrl).toMatch(/^https:\/\//);
            expect(result.contentUrl).toContain("vxreddit.com");
            expect(result.title).toBe("Tic Tac");
        });

        test("aceita imagem e fallback de subreddit no creator", () => {
            const result = externalPostParser.parseRedditHtml(`
                <meta name="twitter:image" content="https://preview.redd.it/image.png">
                <meta name="twitter:creator" content="user on r/typescript">
                <meta name="twitter:title" content="Image post">
            `);
            expect(result.contentType).toBe("IMAGE");
            expect(result.contentUrl).toBe("https://preview.redd.it/image.png");
        });
    });

    describe("parseTwitterHtml", () => {
        test("extrai vídeo e usa fallbacks twitter", () => {
            const result = externalPostParser.parseTwitterHtml(`
                <meta name="twitter:player:stream" content="https://video.twimg.com/post.mp4">
                <meta name="twitter:title" content="Tweet">
                <meta property="og:description" content="Descrição">
            `);
            expect(result).toEqual({
                contentUrl: "https://video.twimg.com/post.mp4",
                title: "Tweet",
                description: "Descrição",
                contentType: "VIDEO",
            });
        });

        test("aceita imagem", () => {
            expect(
                externalPostParser.parseTwitterHtml(
                    '<meta name="twitter:image" content="https://pbs.twimg.com/media/image.jpg">',
                ).contentType,
            ).toBe("IMAGE");
        });
    });

    test.each([
        ["reddit", REDDIT_HTML, "VIDEO"],
        ["instagram", INSTAGRAM_HTML, "VIDEO"],
        ["tiktok", TIKTOK_HTML, "VIDEO"],
        [
            "twitter",
            '<meta property="og:image" content="https://pbs.twimg.com/media/image.jpg">',
            "IMAGE",
        ],
    ] as const)("despacha parser de %s", async (platform, html, contentType) => {
        const result = await externalPostParser.parse(platform, html);
        expect(result?.contentType).toBe(contentType);
    });

    test("retorna null para plataforma desconhecida em chamada defensiva", async () => {
        expect(await externalPostParser.parse("unknown" as never, "<html></html>")).toBeNull();
    });
});
