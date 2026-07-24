import { describe, expect, test } from "bun:test";
import {
    allowedHostsForHop,
    hostMatchesRule,
    isBlockedIp,
    readBodyWithLimit,
    safeFetchExternal,
    validateExternalDestination,
} from "@/services/external-post/safeFetchExternal";
import {
    downloadExternalMedia,
    extFromContentType,
    filenameFromContentDisposition,
    resolveExternalMediaType,
    uploadExternalPost,
} from "@/services/external-post/uploader";

describe("safeFetchExternal", () => {
    test("host allowlist usa limite de ponto", () => {
        expect(hostMatchesRule("media.example.com", "example.com")).toBe(true);
        expect(hostMatchesRule("example.com", ".example.com")).toBe(true);
        expect(hostMatchesRule("example.com.attacker.test", "example.com")).toBe(false);
    });

    test("política initial-only restringe só o primeiro host", () => {
        const policy = { mode: "initial-only", hosts: ["vxinstagram.com"] } as const;
        expect(allowedHostsForHop(policy, 0)).toEqual(["vxinstagram.com"]);
        expect(allowedHostsForHop(policy, 1)).toBeUndefined();
        expect(allowedHostsForHop({ mode: "every-hop", hosts: ["proxy.test"] }, 3)).toEqual(["proxy.test"]);
        expect(allowedHostsForHop({ mode: "public-only" }, 0)).toBeUndefined();
    });

    test.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1", "::1", "0:0:0:0:0:0:0:1", "::ffff:7f00:1", "fc00::1", "fe80::1", "fec0::1", "ff02::1"])(
        "bloqueia endereço %s",
        (address) => expect(isBlockedIp(address)).toBe(true),
    );

    test.each([
        "0.0.0.0",
        "100.64.0.1",
        "172.16.0.1",
        "192.0.0.1",
        "198.18.0.1",
        "198.51.100.1",
        "203.0.113.1",
        "224.0.0.1",
        "2001:db8::1",
        "::ffff:127.0.0.1",
        "not-an-ip",
    ])("bloqueia faixa especial %s", (address) => expect(isBlockedIp(address)).toBe(true));

    test.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])("aceita IP público %s", (address) => {
        expect(isBlockedIp(address)).toBe(false);
    });

    test("aborta body sem Content-Length acima do limite", async () => {
        const response = new Response(
            new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array(6));
                    controller.enqueue(new Uint8Array(6));
                    controller.close();
                },
            }),
        );
        const abortController = new AbortController();
        await expect(readBodyWithLimit(response, 10, abortController)).rejects.toEqual(
            expect.objectContaining({ code: "body_too_large" }),
        );
        expect(abortController.signal.aborted).toBe(true);
    });

    test("rejeita localhost e HTTP antes do fetch", async () => {
        const controller = new AbortController();
        await expect(
            validateExternalDestination(
                new URL("https://localhost/media.mp4"),
                ["localhost"],
                controller.signal,
            ),
        ).rejects.toEqual(expect.objectContaining({ code: "private_address" }));
        await expect(
            validateExternalDestination(
                new URL("http://example.com/media.mp4"),
                ["example.com"],
                controller.signal,
            ),
        ).rejects.toEqual(expect.objectContaining({ code: "https_required" }));
    });

    test("rejeita credenciais e hosts fora da allowlist ativa", async () => {
        const controller = new AbortController();
        await expect(
            validateExternalDestination(
                new URL("https://user:password@example.com/media.mp4"),
                ["example.com"],
                controller.signal,
            ),
        ).rejects.toEqual(expect.objectContaining({ code: "url_credentials_forbidden" }));
        await expect(
            validateExternalDestination(
                new URL("https://example.com/media.mp4"),
                ["media.example.com"],
                controller.signal,
            ),
        ).rejects.toEqual(expect.objectContaining({ code: "platform_host_not_allowed" }));
    });

    test("rejeita Content-Length antecipadamente e body vazio", async () => {
        const oversized = new Response("abc", { headers: { "Content-Length": "100" } });
        await expect(readBodyWithLimit(oversized, 10, new AbortController())).rejects.toEqual(
            expect.objectContaining({ code: "body_too_large" }),
        );
        const empty = new Response(null);
        await expect(readBodyWithLimit(empty, 10, new AbortController())).rejects.toEqual(
            expect.objectContaining({ code: "empty_body" }),
        );
    });

    test("revalida redirects e bloqueia destino privado", async () => {
        const server = Bun.serve({
            port: 0,
            fetch: () => Response.redirect("https://127.0.0.1/private", 302),
        });
        try {
            await expect(
                safeFetchExternal(`http://localhost:${server.port}/redirect`, {
                    hostPolicy: { mode: "initial-only", hosts: ["localhost"] },
                    maxBytes: 100,
                    allowTestLocalhost: true,
                }),
            ).rejects.toEqual(expect.objectContaining({ code: "private_address" }));
        } finally {
            server.stop();
        }
    });

    test("aplica timeout ao download completo", async () => {
        const server = Bun.serve({
            port: 0,
            fetch: async () => {
                await Bun.sleep(100);
                return new Response("late");
            },
        });
        try {
            await expect(
                safeFetchExternal(`http://localhost:${server.port}/slow`, {
                    hostPolicy: { mode: "every-hop", hosts: ["localhost"] },
                    maxBytes: 100,
                    timeoutMs: 10,
                    allowTestLocalhost: true,
                }),
            ).rejects.toEqual(expect.objectContaining({ code: "timeout" }));
        } finally {
            server.stop();
        }
    });

    test("segue redirect relativo e devolve body, MIME e URL final", async () => {
        const server = Bun.serve({
            port: 0,
            fetch(req) {
                if (new URL(req.url).pathname === "/start") {
                    return new Response(null, { status: 302, headers: { Location: "/final" } });
                }
                return new Response("media", {
                    headers: { "Content-Type": "video/mp4", "Content-Disposition": "attachment; filename=media.mp4" },
                });
            },
        });
        try {
            const result = await safeFetchExternal(`http://localhost:${server.port}/start`, {
                hostPolicy: { mode: "initial-only", hosts: ["localhost"] },
                maxBytes: 100,
                allowTestLocalhost: true,
            });
            expect(result.body.toString()).toBe("media");
            expect(result.contentType).toBe("video/mp4");
            expect(result.contentDisposition).toContain("media.mp4");
            expect(result.finalUrl.pathname).toBe("/final");
        } finally {
            server.stop();
        }
    });

    test("rejeita redirect sem Location, redirects demais e erro upstream", async () => {
        const server = Bun.serve({
            port: 0,
            fetch(req) {
                const pathname = new URL(req.url).pathname;
                if (pathname === "/missing") return new Response(null, { status: 302 });
                if (pathname === "/loop") return new Response(null, { status: 302, headers: { Location: "/loop" } });
                return new Response("no", { status: 503 });
            },
        });
        const options = {
            hostPolicy: { mode: "every-hop", hosts: ["localhost"] },
            maxBytes: 100,
            allowTestLocalhost: true,
        } as const;
        try {
            await expect(safeFetchExternal(`http://localhost:${server.port}/missing`, options)).rejects.toEqual(
                expect.objectContaining({ code: "invalid_redirect" }),
            );
            await expect(
                safeFetchExternal(`http://localhost:${server.port}/loop`, { ...options, maxRedirects: 1 }),
            ).rejects.toEqual(expect.objectContaining({ code: "too_many_redirects" }));
            await expect(safeFetchExternal(`http://localhost:${server.port}/error`, options)).rejects.toEqual(
                expect.objectContaining({ code: "upstream_fetch_failed" }),
            );
        } finally {
            server.stop();
        }
    });

    test("rejeita MIME desconhecido", () => {
        expect(extFromContentType("video/mp4; charset=binary")).toBe("mp4");
        expect(extFromContentType("IMAGE/JPEG")).toBe("jpg");
        expect(() => extFromContentType("text/html")).toThrow("Unsupported external content type");
    });

    test("normaliza octet-stream usando Content-Disposition ou URL final", () => {
        expect(filenameFromContentDisposition('attachment; filename="video.mp4"')).toBe("video.mp4");
        expect(filenameFromContentDisposition("attachment; filename*=UTF-8''meu%20video.webm")).toBe("meu video.webm");
        expect(resolveExternalMediaType("application/octet-stream", "attachment; filename=video.mp4")).toEqual({
            extension: "mp4",
            contentType: "video/mp4",
        });
        expect(resolveExternalMediaType("application/octet-stream", null, new URL("https://cdn.test/image.webp"))).toEqual({
            extension: "webp",
            contentType: "image/webp",
        });
        expect(() => resolveExternalMediaType("application/octet-stream", "attachment; filename=malware.exe")).toThrow(
            "Unsupported external content type",
        );
        expect(() => resolveExternalMediaType("application/octet-stream")).toThrow("Unsupported external content type");
    });

    test("regressão Instagram aceita vxinstagram e MP4 servido por CDN de redirect", async () => {
        const media = await downloadExternalMedia(
            { contentUrl: "https://vxinstagram.com/offload/DbBZk3vt5NA/0.mp4", contentType: "VIDEO" },
            "instagram",
            15 * 1024 * 1024,
            (async (_url: string, options: { hostPolicy: unknown; maxBytes: number }) => {
                expect(options.hostPolicy).toEqual({
                    mode: "initial-only",
                    hosts: [
                        "zzinstagram.com",
                        "vxinstagram.com",
                        "oginstagram.com",
                        "eeinstagram.com",
                        "uuinstagram.com",
                    ],
                });
                expect(options.maxBytes).toBe(15 * 1024 * 1024);
                return {
                    body: Buffer.alloc(9_508_023),
                    contentType: "application/octet-stream",
                    contentDisposition: "attachment; filename=arquivo.mp4",
                    finalUrl: new URL("https://d.rapidcdn.app/v2?token=test"),
                };
            }) as never,
        );

        expect(media).toMatchObject({ extension: "mp4", contentType: "video/mp4", size: 9_508_023 });
    });

    test("regressão Instagram aceita oginstagram como host inicial de mídia", async () => {
        const media = await downloadExternalMedia(
            { contentUrl: "https://oginstagram.com/offload/C1AIp0POMSX/1", contentType: "VIDEO" },
            "instagram",
            15 * 1024 * 1024,
            (async (_url: string, options: { hostPolicy: unknown; maxBytes: number }) => {
                expect(options.hostPolicy).toEqual({
                    mode: "initial-only",
                    hosts: [
                        "zzinstagram.com",
                        "vxinstagram.com",
                        "oginstagram.com",
                        "eeinstagram.com",
                        "uuinstagram.com",
                    ],
                });
                expect(options.maxBytes).toBe(15 * 1024 * 1024);
                return {
                    body: Buffer.alloc(11_919_235),
                    contentType: "video/mp4",
                    contentDisposition: null,
                    finalUrl: new URL("https://scontent.cdninstagram.com/video.mp4"),
                };
            }) as never,
        );

        expect(media).toMatchObject({ extension: "mp4", contentType: "video/mp4", size: 11_919_235 });
    });

    test.each(["eeinstagram.com", "uuinstagram.com"])(
        "regressão Instagram aceita %s como host inicial de mídia",
        async (hostname) => {
            const media = await downloadExternalMedia(
                { contentUrl: `https://${hostname}/offload/DZNQYl-BJfz/0.mp4`, contentType: "VIDEO" },
                "instagram",
                15 * 1024 * 1024,
                (async (
                    url: string,
                    options: { hostPolicy: { mode: string; hosts: string[] }; maxBytes: number },
                ) => {
                    expect(new URL(url).hostname).toBe(hostname);
                    expect(options.hostPolicy.hosts).toContain(hostname);
                    expect(options.maxBytes).toBe(15 * 1024 * 1024);
                    return {
                        body: Buffer.from("video"),
                        contentType: "video/mp4",
                        contentDisposition: null,
                        finalUrl: new URL(url),
                    };
                }) as never,
            );

            expect(media).toMatchObject({ extension: "mp4", contentType: "video/mp4", size: 5 });
        },
    );

    test("uploader externo escreve, envia ao S3 e limpa o temporário", async () => {
        const calls: string[] = [];
        const result = await uploadExternalPost(
            { contentUrl: "https://media.example/video", contentType: "VIDEO" },
            "post-id",
            "reddit",
            {
                fetcher: (async () => ({
                    body: Buffer.from("video"),
                    contentType: "video/webm; charset=binary",
                    contentDisposition: null,
                    finalUrl: new URL("https://media.example/video"),
                })) as never,
                writeFile: (async (body: Buffer, target: string) => {
                    expect(body.toString()).toBe("video");
                    calls.push(`write:${target}`);
                    return true;
                }) as never,
                uploadFile: (async ({ from, to, isAbsolute }: { from: string; to: string; isAbsolute?: boolean }) => {
                    calls.push(`upload:${from}:${to}:${isAbsolute}`);
                }) as never,
                deleteFile: (async (target: string) => {
                    calls.push(`delete:${target}`);
                    return true;
                }) as never,
                now: () => 123,
            },
        );
        expect(result).toEndWith("/mural/post-id_1.webm");
        expect(calls[0]).toContain("mural_upload_post-id_123.webm");
        expect(calls[1]).toContain("mural/post-id_1.webm:true");
        expect(calls[2]).toStartWith("delete:");
    });

    test("uploader externo limpa temporário quando o S3 falha", async () => {
        let deleted = false;
        await expect(
            uploadExternalPost(
                { contentUrl: "https://media.example/image", contentType: "IMAGE" },
                "failed-post",
                "instagram",
                {
                    fetcher: (async () => ({
                        body: Buffer.from("image"),
                        contentType: "image/png",
                        contentDisposition: null,
                        finalUrl: new URL("https://media.example/image"),
                    })) as never,
                    writeFile: (async () => true) as never,
                    uploadFile: (async () => Promise.reject(new Error("s3 failed"))) as never,
                    deleteFile: (async () => {
                        deleted = true;
                        return true;
                    }) as never,
                },
            ),
        ).rejects.toThrow("s3 failed");
        expect(deleted).toBe(true);
    });
});
