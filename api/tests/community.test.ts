import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { baseURL } from "./setup";
import database from "@/services/database";
import { createTestUser, deleteTestUser, TestUser } from "./helpers";
import { ensureGeralCommunity } from "@/services/muralCommunity";

let testUser: TestUser;
let testUser2: TestUser;
let createdCommunityId: string;

beforeAll(async () => {
    testUser = await createTestUser("community");
    testUser2 = await createTestUser("community2");

    await ensureGeralCommunity();
});

afterAll(async () => {
    await deleteTestUser(testUser.id);
    await deleteTestUser(testUser2.id);
});

describe("Mural Community Routes", () => {
    describe("POST /mural/community/create", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/mural/community/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Minha Comunidade" }),
            });
            expect(res.status).toBe(401);
        });

        test("body vazio → 422", async () => {
            const res = await fetch(`${baseURL}/mural/community/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(422);
        });

        test("nome sem slug válido → 422", async () => {
            const res = await fetch(`${baseURL}/mural/community/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: testUser.token },
                body: JSON.stringify({ name: "---" }),
            });
            expect(res.status).toBe(422);
        });

        test("criação válida → 200", async () => {
            const res = await fetch(`${baseURL}/mural/community/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({
                    name: "Test Community",
                    description: "Comunidade de teste",
                }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: { id: string; name: string; description: string };
            };
            expect(json.data.id).toBe("test-community");
            expect(json.data.name).toBe("Test Community");
            expect(json.data.description).toBe("Comunidade de teste");
            createdCommunityId = json.data.id;
        });

        test("nome duplicado → 409", async () => {
            const res = await fetch(`${baseURL}/mural/community/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ name: "Test Community" }),
            });
            expect(res.status).toBe(409);
        });
    });

    describe("GET /mural/community/list", () => {
        test("lista comunidades → 200", async () => {
            const res = await fetch(`${baseURL}/mural/community/list`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: Array<{ id: string; name: string }>;
            };
            expect(Array.isArray(json.data)).toBe(true);
            expect(json.data.some((c) => c.id === "geral")).toBe(true);
            expect(json.data.some((c) => c.id === createdCommunityId)).toBe(true);
        });
    });

    describe("GET /mural/community/user", () => {
        test("query com menos de 3 letras → 422", async () => {
            const res = await fetch(`${baseURL}/mural/community/user?q=ab`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(422);
        });

        test("busca retorna até 10 usuários → 200", async () => {
            const res = await fetch(`${baseURL}/mural/community/user?q=com&communityId=${createdCommunityId}`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: Array<{ id: string; name: string; color: string }> };
            expect(Array.isArray(json.data)).toBe(true);
            expect(json.data.length).toBeLessThanOrEqual(10);
            expect(json.data.some((u) => u.name.toLowerCase().includes("com"))).toBe(true);
            if (json.data.length > 0) {
                expect(json.data[0].id).toBeDefined();
                expect(json.data[0].name).toBeDefined();
                expect(json.data[0].color).toBeDefined();
            }
        });
    });

    describe("GET /mural/community/:id/moderator", () => {
        test("comunidade inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/community/inexistente-xyz/moderator`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(404);
        });

        test("retorna moderadores (id, name, color) → 200", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: Array<{ id: string; name: string; color: string }>;
            };
            expect(Array.isArray(json.data)).toBe(true);
            expect(json.data.some((m) => m.id === testUser.id)).toBe(true);
            if (json.data.length > 0) {
                expect(json.data[0].id).toBeDefined();
                expect(json.data[0].name).toBeDefined();
                expect(json.data[0].color).toBeDefined();
            }
        });
    });

    describe("GET /mural/community/:id", () => {
        test("comunidade inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/community/inexistente-xyz`);
            expect(res.status).toBe(404);
        });

        test("retorna infos da comunidade (nome, descrição, moderadores) → 200", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: {
                    id: string;
                    name: string;
                    description: string;
                    moderators: Array<{ id: string; name: string; color: string }>;
                };
            };
            expect(json.data.id).toBe(createdCommunityId);
            expect(json.data.name).toBe("Test Community");
            expect(json.data.description).toBe("Comunidade de teste");
            expect(Array.isArray(json.data.moderators)).toBe(true);
            expect(json.data.moderators.some((m) => m.id === testUser.id)).toBe(true);
            expect(json.data.moderators[0].color).toBeDefined();
        });
    });

    describe("POST /mural/community/:id/moderator/add", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: testUser2.id }),
            });
            expect(res.status).toBe(401);
        });

        test("comunidade inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/community/inexistente/moderator/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ id: testUser2.id }),
            });
            expect(res.status).toBe(404);
        });

        test("usuário inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({
                    id: "00000000-0000-0000-0000-000000000000",
                }),
            });
            expect(res.status).toBe(404);
        });

        test("usuário não autorizado (não é criador/mod) → 403", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser2.token,
                },
                body: JSON.stringify({ id: testUser.id }),
            });
            expect(res.status).toBe(403);
        });

        test("adiciona moderador por id → 200", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ id: testUser2.id }),
            });
            expect(res.status).toBe(200);

            const community = await database.muralCommunity.findUnique({
                where: { id: createdCommunityId },
                include: { moderators: true },
            });
            expect(community?.moderators.some((m) => m.id === testUser2.id)).toBe(true);
        });

        test("moderador já existente → 409", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ id: testUser2.id }),
            });
            expect(res.status).toBe(409);
        });
    });

    describe("POST /mural/community/:id/moderator/remove", () => {
        test("usuário inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/remove`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: testUser.token },
                body: JSON.stringify({ id: "00000000-0000-0000-0000-000000000000" }),
            });
            expect(res.status).toBe(404);
        });

        test("impede remover o criador", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/remove`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: testUser.token },
                body: JSON.stringify({ id: testUser.id }),
            });
            expect(res.status).toBe(422);
        });

        test("remove moderador → 200", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/remove`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ id: testUser2.id }),
            });
            expect(res.status).toBe(200);

            const community = await database.muralCommunity.findUnique({
                where: { id: createdCommunityId },
                include: { moderators: true },
            });
            expect(community?.moderators.some((m) => m.id === testUser2.id)).toBe(false);
        });

        test("moderador ausente → 404", async () => {
            const res = await fetch(`${baseURL}/mural/community/${createdCommunityId}/moderator/remove`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: testUser.token },
                body: JSON.stringify({ id: testUser2.id }),
            });
            expect(res.status).toBe(404);
        });
    });
});
