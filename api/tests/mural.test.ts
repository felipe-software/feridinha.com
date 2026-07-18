import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { baseURL } from "./setup";
import database from "@/services/database";
import { createTestUser, deleteTestUser, createTestMuralPost, TestUser } from "./helpers";
import { ensureGeralCommunity } from "@/services/muralCommunity";
import { MuralPost } from "@prisma/client";
import { externalPostResolver } from "@/services/external-post/resolver";
import { externalPostParser } from "@/services/external-post/parser";
import { externalPostUploader } from "@/services/external-post/uploader";
import { redisClient } from "@/services/redis";

let testUser: TestUser;
let testUser2: TestUser;
let createdPostId: string;
let approvedPost1: MuralPost;
let approvedPost2: MuralPost;

beforeAll(async () => {
    testUser = await createTestUser("mural");
    testUser2 = await createTestUser("mural2");

    await ensureGeralCommunity();
    await database.muralCommunity.update({
        where: { id: "geral" },
        data: { moderators: { connect: { id: testUser.id } } },
    });

    approvedPost1 = await createTestMuralPost(testUser.id, { approvedById: testUser.id });
    approvedPost2 = await createTestMuralPost(testUser.id, {
        approvedById: testUser.id,
        upvotes: 5,
    });
    createdPostId = (
        await createTestMuralPost(testUser.id, { communityId: "geral" })
    ).id;
});

afterAll(async () => {
    await deleteTestUser(testUser.id);
    await deleteTestUser(testUser2.id);
});

describe("Mural Routes", () => {
    describe("POST /mural/create", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/mural/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ link: "https://www.tiktok.com/@user/video/123" }),
            });
            expect(res.status).toBe(401);
        });

        test("body vazio → 422", async () => {
            const res = await fetch(`${baseURL}/mural/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(422);
        });

        test("link inválido (não url) → 422", async () => {
            const res = await fetch(`${baseURL}/mural/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ link: "nao-e-uma-url" }),
            });
            expect(res.status).toBe(422);
        });

        test("plataforma desconhecida → erro público", async () => {
            const res = await fetch(`${baseURL}/mural/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: testUser.token },
                body: JSON.stringify({ link: "https://example.com/post/1" }),
            });
            expect(res.status).toBe(200);
            expect(((await res.json()) as { success: boolean }).success).toBe(false);
        });

        test.each(["fetch", "parse"] as const)("falha controlada no estágio %s", async (stage) => {
            const originalResolve = externalPostResolver.resolveHtml;
            const originalParse = externalPostParser.parse;
            externalPostResolver.resolveHtml = stage === "fetch" ? async () => Promise.reject(new Error("fetch")) : async () => "<html>";
            externalPostParser.parse = stage === "parse" ? async () => Promise.reject(new Error("parse")) : originalParse;
            try {
                const res = await fetch(`${baseURL}/mural/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: testUser.token },
                    body: JSON.stringify({ link: "https://www.tiktok.com/@user/video/123" }),
                });
                expect(res.status).toBe(200);
                expect(((await res.json()) as { success: boolean }).success).toBe(false);
            } finally {
                externalPostResolver.resolveHtml = originalResolve;
                externalPostParser.parse = originalParse;
            }
        });

        test.each(["cdn", "fallback"] as const)("cria post com resultado de upload %s", async (mode) => {
            const originalResolve = externalPostResolver.resolveHtml;
            const originalParse = externalPostParser.parse;
            const originalUpload = externalPostUploader.uploadExternalPost;
            externalPostResolver.resolveHtml = async () => "<html>";
            externalPostParser.parse = async () => ({
                contentUrl: "https://offload.tnktok.com/video.mp4",
                contentType: "VIDEO",
                title: "Parsed title",
            });
            externalPostUploader.uploadExternalPost =
                mode === "cdn" ? async () => "https://cdn.example.com/mural/video.mp4" : async () => Promise.reject(new Error("upload"));
            try {
                const res = await fetch(`${baseURL}/mural/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: testUser.token },
                    body: JSON.stringify({
                        link: "https://www.tiktok.com/@user/video/123",
                        title: mode === "cdn" ? "Custom title" : undefined,
                        description: "Description",
                    }),
                });
                expect(res.status).toBe(200);
                const json = (await res.json()) as { success: boolean; data: { id: string; processedContent: string; title: string } };
                expect(json.success).toBe(true);
                expect(json.data.title).toBe(mode === "cdn" ? "Custom title" : "Parsed title");
                expect(json.data.processedContent).toBe(
                    mode === "cdn" ? "https://cdn.example.com/mural/video.mp4" : "https://offload.tnktok.com/video.mp4",
                );
            } finally {
                externalPostResolver.resolveHtml = originalResolve;
                externalPostParser.parse = originalParse;
                externalPostUploader.uploadExternalPost = originalUpload;
            }
        });
    });

    describe("POST /mural/:id/vote/:vote", () => {
        test("post inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/00000000-0000-0000-0000-000000000000/vote/up`, {
                method: "POST",
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(404);
        });

        test("id inválido (não uuid) → 422", async () => {
            const res = await fetch(`${baseURL}/mural/not-a-uuid/vote/up`, {
                method: "POST",
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(422);
        });

        test("upvote em post existente → 200", async () => {
            const before = await database.muralPost.findUnique({
                where: { id: approvedPost1.id },
            });
            const res = await fetch(`${baseURL}/mural/${approvedPost1.id}/vote/up`, {
                method: "POST",
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { upvotes: number } };
            expect(json.data.upvotes).toBe((before?.upvotes ?? 0) + 1);
        });

        test("voto repetido é rejeitado e troca de voto aplica delta", async () => {
            const repeated = await fetch(`${baseURL}/mural/${approvedPost1.id}/vote/up`, {
                method: "POST",
                headers: { Authorization: testUser.token },
            });
            expect(((await repeated.json()) as { success: boolean }).success).toBe(false);

            const changed = await fetch(`${baseURL}/mural/${approvedPost1.id}/vote/down`, {
                method: "POST",
                headers: { Authorization: testUser.token },
            });
            expect(changed.status).toBe(200);
            expect(((await changed.json()) as { data: { myVote: string } }).data.myVote).toBe("down");
        });

        test("lock concorrente e erro de persistência são tratados", async () => {
            const originalSet = redisClient.set;
            redisClient.set = (async () => null) as never;
            try {
                const locked = await fetch(`${baseURL}/mural/${approvedPost2.id}/vote/up`, {
                    method: "POST",
                    headers: { Authorization: testUser.token },
                });
                expect(((await locked.json()) as { success: boolean }).success).toBe(false);
            } finally {
                redisClient.set = originalSet;
            }

            const originalUpdate = database.muralPost.update;
            database.muralPost.update = (async () => Promise.reject(new Error("db"))) as never;
            try {
                const failed = await fetch(`${baseURL}/mural/${approvedPost2.id}/vote/down`, {
                    method: "POST",
                    headers: { Authorization: testUser2.token },
                });
                expect(((await failed.json()) as { success: boolean }).success).toBe(false);
            } finally {
                database.muralPost.update = originalUpdate;
            }
        });
    });

    describe("GET /mural/list", () => {
        test("lista posts aprovados → 200", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: { posts: Array<{ id: string }>; nextCursor: string | null };
            };
            expect(Array.isArray(json.data.posts)).toBe(true);
            expect(json.data.posts.some((p) => p.id === approvedPost1.id)).toBe(true);
            expect(json.data.posts.some((p) => p.id === approvedPost2.id)).toBe(true);
        });

        test("posts não aprovados não aparecem na lista → 200", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: { posts: Array<{ id: string }> };
            };
            expect(json.data.posts.some((p) => p.id === createdPostId)).toBe(false);
        });

        test("aceita limit entre 20 e 100 → 200", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral&limit=25`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { posts: unknown[] } };
            expect(json.data.posts.length).toBeLessThanOrEqual(25);
        });

        test("limit < 20 → 422", async () => {
            const res = await fetch(`${baseURL}/mural/list?limit=10`);
            expect(res.status).toBe(422);
        });

        test("limit > 100 → 422", async () => {
            const res = await fetch(`${baseURL}/mural/list?limit=101`);
            expect(res.status).toBe(422);
        });

        test("sortBy=upvotes ordena por upvotes → 200", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral&limit=20&sortBy=upvotes`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: { posts: Array<{ id: string; upvotes: number }> };
            };
            for (let i = 1; i < json.data.posts.length; i++) {
                const prev = json.data.posts[i - 1].upvotes;
                const curr = json.data.posts[i].upvotes;
                expect(curr).toBeLessThanOrEqual(prev);
            }
        });

        test("cursor after retorna próxima página → 200", async () => {
            const firstRes = await fetch(`${baseURL}/mural/list?communityId=geral&limit=1`);
            const firstJson = (await firstRes.json()) as {
                data: { posts: Array<{ id: string }>; nextCursor: string | null };
            };
            if (!firstJson.data || !firstJson.data.posts || firstJson.data.posts.length === 0 || !firstJson.data.nextCursor) {
                return;
            }
            const after = firstJson.data.posts[0].id;
            const secondRes = await fetch(`${baseURL}/mural/list?communityId=geral&limit=20&after=${after}`);
            expect(secondRes.status).toBe(200);
            const secondJson = (await secondRes.json()) as {
                data: { posts: Array<{ id: string }> };
            };
            expect(secondJson.data.posts.some((p) => p.id === after)).toBe(false);
        });

        test("retorna user em cada post → 200", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral&limit=20`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: {
                    posts: Array<{ user: { name: string; color: string; profileImage: string } }>;
                };
            };
            if (json.data.posts.length > 0) {
                expect(json.data.posts[0].user.name).toBeDefined();
                expect(json.data.posts[0].user.color).toBeDefined();
                expect(json.data.posts[0].user.profileImage).toBeDefined();
            }
        });

        test("filtra posts por comunidade → 200", async () => {
            const geralRes = await fetch(`${baseURL}/mural/list?communityId=geral&limit=20`);
            const geralJson = (await geralRes.json()) as { data: { posts: Array<{ id: string }> } };
            const geralIds = new Set(geralJson.data.posts.map((p) => p.id));
            expect(geralIds.has(approvedPost1.id)).toBe(true);
        });

        test("comunidade inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=comunidade-inexistente&limit=20`);
            expect(res.status).toBe(404);
        });

        test("username inexistente → 404 e existente filtra", async () => {
            const missing = await fetch(`${baseURL}/mural/list?communityId=geral&username=definitely-missing-user`);
            expect(missing.status).toBe(404);

            const existing = await fetch(`${baseURL}/mural/list?communityId=geral&username=${encodeURIComponent("Test User mural")}`);
            expect(existing.status).toBe(200);
            const json = (await existing.json()) as { data: { posts: Array<{ userId: string }> } };
            expect(json.data.posts.every((post) => post.userId === testUser.id)).toBe(true);
        });

        test("usuário autenticado recebe o próprio voto", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { posts: Array<{ id: string; myVote: string | null }> } };
            expect(json.data.posts.find((post) => post.id === approvedPost1.id)?.myVote).toBe("down");
        });

        test("approvalStatus=pending sem auth → 401", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral&approvalStatus=pending`);
            expect(res.status).toBe(401);
        });

        test("approvalStatus=pending sem ser mod → 403", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral&approvalStatus=pending`, {
                headers: { Authorization: testUser2.token },
            });
            expect(res.status).toBe(403);
        });

        test("approvalStatus=pending como mod lista posts não aprovados → 200", async () => {
            const res = await fetch(`${baseURL}/mural/list?communityId=geral&approvalStatus=pending`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { posts: Array<{ id: string }> } };
            expect(json.data.posts.some((p) => p.id === createdPostId)).toBe(true);
            expect(json.data.posts.some((p) => p.id === approvedPost1.id)).toBe(false);
        });

        test("approvalStatus=rejected lista posts rejeitados para moderador", async () => {
            const rejected = await createTestMuralPost(testUser.id, { communityId: "geral" });
            await database.muralPost.update({
                where: { id: rejected.id },
                data: { approvedById: testUser.id, notApprovedReason: "reason" },
            });
            const res = await fetch(`${baseURL}/mural/list?communityId=geral&approvalStatus=rejected`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { posts: Array<{ id: string }> } };
            expect(json.data.posts.some((post) => post.id === rejected.id)).toBe(true);
        });
    });

    describe("POST /mural/:id/moderate", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/mural/${createdPostId}/moderate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approved: true }),
            });
            expect(res.status).toBe(401);
        });

        test("post inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/00000000-0000-0000-0000-000000000000/moderate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ approved: true }),
            });
            expect(res.status).toBe(404);
        });

        test("não mod tenta aprovar → 403", async () => {
            const res = await fetch(`${baseURL}/mural/${createdPostId}/moderate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser2.token,
                },
                body: JSON.stringify({ approved: true }),
            });
            expect(res.status).toBe(403);
        });

        test("rejeitar sem motivo → 422", async () => {
            const pendingPost = await createTestMuralPost(testUser.id, { communityId: "geral" });
            const res = await fetch(`${baseURL}/mural/${pendingPost.id}/moderate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ approved: false }),
            });
            expect(res.status).toBe(422);
        });

        test("aprovar post → 200", async () => {
            const res = await fetch(`${baseURL}/mural/${createdPostId}/moderate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ approved: true }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { aprovedAt: string; approvedBy: { id: string } } };
            expect(json.data.aprovedAt).toBeDefined();
            expect(json.data.approvedBy.id).toBe(testUser.id);

            const post = await database.muralPost.findUnique({ where: { id: createdPostId } });
            expect(post?.aprovedAt).not.toBeNull();
            expect(post?.approvedById).toBe(testUser.id);
        });

        test("rejeitar post com motivo → 200", async () => {
            const pendingPost = await createTestMuralPost(testUser.id, { communityId: "geral" });
            const res = await fetch(`${baseURL}/mural/${pendingPost.id}/moderate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ approved: false, reason: "Conteúdo inadequado" }),
            });
            expect(res.status).toBe(200);

            const updated = await database.muralPost.findUnique({
                where: { id: pendingPost.id },
            });
            expect(updated?.aprovedAt).toBeNull();
            expect(updated?.approvedById).toBe(testUser.id);
            expect(updated?.notApprovedReason).toBe("Conteúdo inadequado");
        });
    });
});
