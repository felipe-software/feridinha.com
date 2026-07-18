import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { previewHandler } from "@/handlers/preview";
import { cacheService } from "@/services/cache";
import cloudflare, { acceptAnyStatus, purgeCacheFromCdn } from "@/services/cloudflare";
import { rateLimitMessage } from "@/middlewares/rate-limit";
import database from "@/services/database";
import staticServe, { getPreviewContent, waitForCacheRelease } from "@/services/static";
import { ensureGeralCommunity } from "@/services/muralCommunity";
import { createTestUpload, createTestUser, deleteTestUser, type TestUser } from "./helpers";

let user: TestUser;
const uploadNames: string[] = [];

beforeAll(async () => {
    user = await createTestUser("services");
});

afterAll(async () => {
    await deleteTestUser(user.id);
});

describe("Cloudflare cache purge", () => {
    test("aceita qualquer status HTTP e localiza resposta de rate limit", () => {
        expect(acceptAnyStatus()).toBe(true);
        expect(rateLimitMessage({ t: (key: string) => `translated:${key}` })).toEqual({
            success: false,
            error: "translated:common.rateLimited",
            code: "rate_limited",
        });
    });
    test("retorna false quando integração está desabilitada", async () => {
        expect(await cloudflare.purgeCacheFromCdn("file.png")).toBe(false);
    });

    test.each([true, false])("propaga resultado success=%s", async (success) => {
        const calls: unknown[][] = [];
        const client = {
            post: async (...args: unknown[]) => {
                calls.push(args);
                return { data: { success } };
            },
        };
        expect(await purgeCacheFromCdn("file.png", client as never, false)).toBe(success);
        expect(calls).toHaveLength(1);
        expect(calls[0][0]).toContain("/purge_cache");
        expect(calls[0][1]).toEqual({ files: [expect.stringContaining("/file.png")] });
    });
});

describe("static/CDN resolver", () => {
    test("retorna null para upload inexistente", async () => {
        expect(await getPreviewContent("missing-file.png", "image/png")).toBeNull();
    });

    test("formata metadados de imagem com autor", async () => {
        const upload = await createTestUpload(user.id, `service-${crypto.randomUUID()}.png`);
        uploadNames.push(upload.name);
        const result = await getPreviewContent(upload.name, "image/png");
        expect(result).toMatchObject({
            title: upload.name,
            contentType: "image/png",
            extraTitle: expect.stringContaining("Test User services"),
        });
        expect(result?.cdnUrl).toContain(`${upload.name}?chatterino`);
    });

    test("usa preview customizado e faz fallback quando a geração falha", async () => {
        const upload = await createTestUpload(user.id, `service-${crypto.randomUUID()}.mp4`);
        uploadNames.push(upload.name);
        const original = previewHandler.generateGifPreview;
        try {
            previewHandler.generateGifPreview = async () => ({ path: "/tmp/preview.webp", name: "preview.webp", size: 10 });
            expect((await getPreviewContent(upload.name, "video/mp4"))?.cdnUrl).toContain("p/preview.webp");
            previewHandler.generateGifPreview = async () => Promise.reject(new Error("ffmpeg failed"));
            expect((await getPreviewContent(upload.name, false))?.cdnUrl).toContain(upload.name);
            expect((await getPreviewContent(upload.name, false))?.contentType).toBe("unknown");
        } finally {
            previewHandler.generateGifPreview = original;
        }
    });

    test("renderiza para Chatterino e redireciona os demais clientes", async () => {
        const upload = await createTestUpload(user.id, `service-${crypto.randomUUID()}.jpg`);
        uploadNames.push(upload.name);
        const rendered: Array<[string, unknown]> = [];
        const response = {
            render: (view: string, data: unknown) => {
                rendered.push([view, data]);
                return response;
            },
            status: () => response,
            setHeader: () => response,
            end: () => response,
        };
        await staticServe.middleware(
            { url: `/${upload.name}`, headers: { "user-agent": "chatterino-api-cache test link-resolver" } } as never,
            response as never,
            (() => {}) as never,
        );
        expect(rendered[0][0]).toBe("preview");

        let location = "";
        const redirectResponse = {
            status: (status: number) => {
                expect(status).toBe(302);
                return redirectResponse;
            },
            setHeader: (_name: string, value: string) => {
                location = value;
                return redirectResponse;
            },
            end: () => redirectResponse,
        };
        await staticServe.middleware(
            { url: "/not-cached.png", headers: {} } as never,
            redirectResponse as never,
            (() => {}) as never,
        );
        expect(location).toEndWith("/not-cached.png");

        await staticServe.middleware(
            { url: "/missing-chatterino.png", headers: { "user-agent": "chatterino-api-cache link-resolver" } } as never,
            redirectResponse as never,
            (() => {}) as never,
        );
        expect(location).toEndWith("/missing-chatterino.png");
    });

    test("aguarda cache em processamento antes do redirect", async () => {
        const key = `static-${crypto.randomUUID()}`;
        const stream = cacheService.getStream(key);
        cacheService.setUploadName(key, "processing.png");
        setTimeout(() => {
            stream.end(Buffer.from("done"));
            void cacheService.freeCache(key);
        }, 20);
        let ended = false;
        const response = {
            status: () => response,
            setHeader: () => response,
            end: () => {
                ended = true;
                return response;
            },
        };
        await staticServe.middleware(
            { url: "/processing.png", headers: {} } as never,
            response as never,
            (() => {}) as never,
        );
        expect(ended).toBe(true);
    });

    test("encerra espera de cache no timeout configurado", async () => {
        const key = `static-timeout-${crypto.randomUUID()}`;
        cacheService.getStream(key);
        cacheService.setUploadName(key, "stuck.png");
        const started = performance.now();
        await waitForCacheRelease("stuck.png", { contentType: "image/png", isChatterinoResolver: false }, 1, 1);
        expect(performance.now() - started).toBeLessThan(100);
        await cacheService.freeCache(key);
    });
});

describe("comunidade geral", () => {
    test("sincroniza administradores como moderadores sem duplicar IDs", async () => {
        await database.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
        await ensureGeralCommunity();
        await ensureGeralCommunity();
        const community = await database.muralCommunity.findUniqueOrThrow({
            where: { id: "geral" },
            include: { moderators: true },
        });
        expect(community.moderators.filter((moderator) => moderator.id === user.id)).toHaveLength(1);
    });
});
