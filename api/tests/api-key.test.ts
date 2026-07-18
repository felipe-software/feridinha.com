import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { baseURL } from "./setup";
import database from "@/services/database";
import { createTestUser, deleteTestUser, TestUser } from "./helpers";

let testUser: TestUser;
let testUser2: TestUser;
let createdApiKeyId: string;
let createdApiKeySecret: string;

beforeAll(async () => {
    testUser = await createTestUser("apikey");
    testUser2 = await createTestUser("apikey2");
});

afterAll(async () => {
    await deleteTestUser(testUser.id);
    await deleteTestUser(testUser2.id);
});

describe("API Key Routes", () => {
    describe("POST /api-key/create", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Test Key" }),
            });
            expect(res.status).toBe(401);
        });

        test("body vazio → 422", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(422);
        });

        test("name < 3 chars → 422", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ name: "ab" }),
            });
            expect(res.status).toBe(422);
        });

        test("name > 30 chars → 422", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ name: "a".repeat(31) }),
            });
            expect(res.status).toBe(422);
        });

        test("tag < 3 chars → 422", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ name: "Valid Name", tag: "ab" }),
            });
            expect(res.status).toBe(422);
        });

        test("tag > 20 chars → 422", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ name: "Valid Name", tag: "a".repeat(21) }),
            });
            expect(res.status).toBe(422);
        });

        test("criação válida sem tag → 200", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ name: "My API Key" }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { id: string; secret: string; name: string } };
            expect(json.data.name).toBe("My API Key");
            expect(json.data.secret).toBeDefined();
            expect(json.data.secret.length).toBe(16);
            createdApiKeyId = json.data.id;
            createdApiKeySecret = json.data.secret;
        });

        test("criação válida com tag → 200", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ name: "Tagged Key", tag: "sharex" }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { id: string; tag: string } };
            expect(json.data.tag).toBe("sharex");
            await database.apiKey.delete({ where: { id: json.data.id } });
        });

        test("autenticação via api-key header → 200", async () => {
            const res = await fetch(`${baseURL}/api-key/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: createdApiKeySecret,
                },
                body: JSON.stringify({ name: "Created Via API Key" }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { id: string } };
            await database.apiKey.delete({ where: { id: json.data.id } });
        });
    });

    describe("GET /api-key/list", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/api-key/list`);
            expect(res.status).toBe(401);
        });

        test("lista api keys do usuário → 200", async () => {
            const res = await fetch(`${baseURL}/api-key/list`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: Array<{ id: string }> };
            expect(Array.isArray(json.data)).toBe(true);
            expect(json.data.some((k) => k.id === createdApiKeyId)).toBe(true);
        });

        test("outro usuário não vê api keys do primeiro → 200", async () => {
            const res = await fetch(`${baseURL}/api-key/list`, {
                headers: { Authorization: testUser2.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: Array<{ id: string }> };
            expect(json.data.some((k) => k.id === createdApiKeyId)).toBe(false);
        });
    });

    describe("DELETE /api-key/:id", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/api-key/${createdApiKeyId}`, {
                method: "DELETE",
            });
            expect(res.status).toBe(401);
        });

        test("id inexistente → resposta de erro", async () => {
            const res = await fetch(`${baseURL}/api-key/inexistente-id-12345`, {
                method: "DELETE",
                headers: { Authorization: testUser.token },
            });
            const json = (await res.json()) as { success: boolean };
            expect(json.success).toBe(false);
        });

        test("deletar api key de outro usuário → resposta de erro", async () => {
            const res = await fetch(`${baseURL}/api-key/${createdApiKeyId}`, {
                method: "DELETE",
                headers: { Authorization: testUser2.token },
            });
            const json = (await res.json()) as { success: boolean };
            expect(json.success).toBe(false);
        });

        test("deletar própria api key → 200", async () => {
            const res = await fetch(`${baseURL}/api-key/${createdApiKeyId}`, {
                method: "DELETE",
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
        });

        test("api key deletada não aparece mais na lista → 200", async () => {
            const res = await fetch(`${baseURL}/api-key/list`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: Array<{ id: string }> };
            expect(json.data.some((k) => k.id === createdApiKeyId)).toBe(false);
        });
    });
});
