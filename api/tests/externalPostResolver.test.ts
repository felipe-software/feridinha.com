import { describe, expect, test } from "bun:test";
import { externalPostResolver, fetchHtml, toProxyUrl } from "@/services/external-post/resolver";

const TEST_URLS = {
    reddit: "https://www.reddit.com/r/7vidas/comments/1rbuxgv/tic_tac/",
    instagram: "https://www.instagram.com/reels/DU04xhLCKEr/",
    tiktok: "https://www.tiktok.com/@carlo99992/video/7607681087707417876",
};

function looksLikeHtml(str: string): boolean {
    return str.length > 0 && (str.includes("<html") || str.includes("<!DOCTYPE") || str.includes("<HTML"));
}

describe.skip("externalPostResolver live integration", () => {
    describe("resolveReddit", () => {
        test("executa sem erro e retorna HTML", async () => {
            const html = await externalPostResolver.resolveReddit(TEST_URLS.reddit);
            expect(html).toBeDefined();
            expect(typeof html).toBe("string");
            expect(looksLikeHtml(html)).toBe(true);
        }, 20_000);
    });

    describe("resolveInstagram", () => {
        test("executa sem erro e retorna HTML", async () => {
            const html = await externalPostResolver.resolveInstagram(TEST_URLS.instagram);
            expect(html).toBeDefined();
            expect(typeof html).toBe("string");
            expect(looksLikeHtml(html)).toBe(true);
        }, 20_000);
    });

    describe("resolveTiktok", () => {
        test("executa sem erro e retorna HTML", async () => {
            const html = await externalPostResolver.resolveTiktok(TEST_URLS.tiktok);
            expect(html).toBeDefined();
            expect(typeof html).toBe("string");
            expect(looksLikeHtml(html)).toBe(true);
        }, 20_000);
    });

    describe("resolve", () => {
        test("reddit: executa sem erro e retorna HTML", async () => {
            const html = await externalPostResolver.resolveHtml(TEST_URLS.reddit);
            expect(html).toBeDefined();
            expect(typeof html).toBe("string");
            expect(looksLikeHtml(html)).toBe(true);
        }, 20_000);

        test("instagram: executa sem erro e retorna HTML", async () => {
            const html = await externalPostResolver.resolveHtml(TEST_URLS.instagram);
            expect(html).toBeDefined();
            expect(typeof html).toBe("string");
            expect(looksLikeHtml(html)).toBe(true);
        }, 20_000);

        test("tiktok: executa sem erro e retorna HTML", async () => {
            const html = await externalPostResolver.resolveHtml(TEST_URLS.tiktok);
            expect(html).toBeDefined();
            expect(typeof html).toBe("string");
            expect(looksLikeHtml(html)).toBe(true);
        }, 20_000);
    });
});

describe("externalPostResolver platform detection", () => {
    test.each([
        [TEST_URLS.reddit, "reddit"],
        [TEST_URLS.instagram, "instagram"],
        [TEST_URLS.tiktok, "tiktok"],
        ["https://x.com/example/status/123", "twitter"],
    ] as const)("detects %s", (url, platform) => {
        expect(externalPostResolver.detectPlatform(url)).toBe(platform);
    });

    test("rejects unsupported origins before fetching", async () => {
        await expect(externalPostResolver.resolveHtml("https://example.com/post/1")).rejects.toThrow(
            "Unsupported external post URL",
        );
    });

    test("converte URL para o proxy e preserva caminho/query", () => {
        const result = new URL(toProxyUrl("https://www.reddit.com/r/test?x=1", "reddit"));
        expect(result.pathname).toBe("/r/test");
        expect(result.searchParams.get("x")).toBe("1");
        expect(result.hostname).not.toBe("www.reddit.com");
        expect(toProxyUrl("not a url", "reddit")).toBe("not a url");
    });

    test("fetchHtml aplica headers/limite da plataforma e decodifica UTF-8", async () => {
        const fakeFetch = async (_url: string, options: { maxBytes: number; headers?: Record<string, string> }) => {
            expect(options.maxBytes).toBe(5 * 1024 * 1024);
            expect(options.headers?.["User-Agent"]).toBeTruthy();
            return {
                body: Buffer.from("olá"),
                contentType: "text/html",
                finalUrl: new URL("https://example.com"),
            };
        };
        expect(await fetchHtml("https://vxreddit.com/post", "reddit", fakeFetch as never)).toBe("olá");
    });

    test.each(Object.entries(TEST_URLS) as Array<[keyof typeof TEST_URLS, string]>)(
        "resolve %s usa fetch seguro injetado",
        async (platform, url) => {
            const calls: string[] = [];
            const fakeFetch = async (target: string) => {
                calls.push(target);
                return {
                    body: Buffer.from(`<html>${platform}</html>`),
                    contentType: "text/html",
                    finalUrl: new URL(target),
                };
            };
            const direct = await externalPostResolver[
                platform === "reddit" ? "resolveReddit" : platform === "instagram" ? "resolveInstagram" : "resolveTiktok"
            ](url, fakeFetch as never);
            expect(direct).toContain(platform);
            expect(await externalPostResolver.resolveHtml(url, fakeFetch as never)).toContain(platform);
            expect(calls).toHaveLength(2);
        },
    );

    test("resolve Twitter usa o proxy correspondente", async () => {
        const fakeFetch = async (target: string) => ({
            body: Buffer.from("twitter"),
            contentType: "text/html",
            finalUrl: new URL(target),
        });
        expect(await externalPostResolver.resolveTwitter("https://x.com/user/status/1", fakeFetch as never)).toBe("twitter");
        expect(await externalPostResolver.resolveHtml("https://x.com/user/status/1", fakeFetch as never)).toBe("twitter");
    });
});
