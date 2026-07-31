import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { baseURL } from "./setup";
import database from "@/services/database";
import { createTestUser, deleteTestUser, createTestUpload, TestUser } from "./helpers";
import { Upload } from "@prisma/client";
import { waitForOwnedUploads } from "@/controllers/album";

let testUser: TestUser;
let testUser2: TestUser;
let upload1: Upload;
let upload2: Upload;
let upload3: Upload;
let uploadUser2: Upload;
let createdAlbumId: string;

beforeAll(async () => {
    testUser = await createTestUser("album");
    testUser2 = await createTestUser("album2");

    upload1 = await createTestUpload(testUser.id);
    upload2 = await createTestUpload(testUser.id);
    upload3 = await createTestUpload(testUser.id);
    uploadUser2 = await createTestUpload(testUser2.id);
});

afterAll(async () => {
    await deleteTestUser(testUser.id);
    await deleteTestUser(testUser2.id);
});

describe("Album Routes", () => {
    describe("POST /album/create", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: [upload1.name] }),
            });
            expect(res.status).toBe(401);
        });

        test("body vazio → 422", async () => {
            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(422);
        });

        test("files vazio → 422", async () => {
            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ files: [] }),
            });
            expect(res.status).toBe(422);
        });

        test("files > 25 itens → 422", async () => {
            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ files: Array(26).fill("fake-file.png") }),
            });
            expect(res.status).toBe(422);
        });

        test("arquivo inexistente esgota o polling", async () => {
            const result = await waitForOwnedUploads(["arquivo-que-nao-existe.png"], testUser.id, {
                timeoutMs: 10,
                pollIntervalMs: 1,
            });
            expect(result.status).toBe("timeout");
        });

        test("arquivo de outro usuário → 403", async () => {
            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ files: [uploadUser2.name] }),
            });
            expect(res.status).toBe(403);
        });

        test("mix de arquivo próprio e de outro → 403", async () => {
            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ files: [upload1.name, uploadUser2.name] }),
            });
            expect(res.status).toBe(403);
        });

        test("aguarda arquivo pendente no banco antes de criar → 200", async () => {
            const pendingName = `pending-album-upload-${Date.now()}.png`;
            const persistence = (async () => {
                await Bun.sleep(50);
                return createTestUpload(testUser.id, pendingName);
            })();

            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ files: [pendingName] }),
            });
            await persistence;

            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { id: string; uploads: Array<{ name: string }> } };
            expect(json.data.uploads[0].name).toBe(pendingName);
            await database.album.delete({ where: { id: json.data.id } });
        });

        test("criação válida com 1 arquivo → 200", async () => {
            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ files: [upload1.name] }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { id: string; uploads: Array<{ name: string }> } };
            expect(json.data.id).toBeDefined();
            expect(json.data.uploads.length).toBe(1);
            expect(json.data.uploads[0].name).toBe(upload1.name);
            createdAlbumId = json.data.id;
        });

        test("criação válida com múltiplos arquivos → 200", async () => {
            const res = await fetch(`${baseURL}/album/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ files: [upload2.name, upload3.name] }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { id: string; uploads: Array<{ name: string }> } };
            expect(json.data.uploads.length).toBe(2);
            await database.album.delete({ where: { id: json.data.id } });
        });
    });

    describe("GET /album/:id", () => {
        test("erro inesperado do banco chega sanitizado ao handler final", async () => {
            const originalUpdate = database.album.update;
            database.album.update = (async () => Promise.reject(new Error("database internals"))) as never;
            try {
                const res = await fetch(`${baseURL}/album/unexpected-error`);
                expect(res.status).toBe(500);
                const body = await res.text();
                expect(body).not.toContain("database internals");
                expect(JSON.parse(body).code).toBe("internal_error");
            } finally {
                database.album.update = originalUpdate;
            }
        });

        test("album inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/album/definitely-missing-album`);
            expect(res.status).toBe(404);
        });

        test("album existente sem auth → 200", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: { id: string; viewCount: number; uploads: unknown[]; canEdit: boolean; title: string };
            };
            expect(json.data.id).toBe(createdAlbumId);
            expect(json.data.viewCount).toBeGreaterThan(0);
            expect(json.data.uploads.length).toBe(1);
            expect(json.data.canEdit).toBe(false);
            expect(json.data.title).toBe("");
        });

        test("album existente com auth → 200", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { canEdit: boolean } };
            expect(json.data.canEdit).toBe(true);
        });

        test("viewCount incrementa a cada acesso → 200", async () => {
            const res1 = await fetch(`${baseURL}/album/${createdAlbumId}`);
            const json1 = (await res1.json()) as { data: { viewCount: number } };
            const count1 = json1.data.viewCount;

            const res2 = await fetch(`${baseURL}/album/${createdAlbumId}`);
            const json2 = (await res2.json()) as { data: { viewCount: number } };
            expect(json2.data.viewCount).toBe(count1 + 1);
        });

        test("viewCount preserva incrementos concorrentes", async () => {
            const before = await database.album.findUniqueOrThrow({ where: { id: createdAlbumId } });
            const responses = await Promise.all(
                Array.from({ length: 10 }, () => fetch(`${baseURL}/album/${createdAlbumId}`)),
            );
            expect(responses.every((response) => response.status === 200)).toBe(true);
            const after = await database.album.findUniqueOrThrow({ where: { id: createdAlbumId } });
            expect(after.viewCount).toBe(before.viewCount + 10);
        });

        test("não expõe deleteCode nos uploads → 200", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`);
            const json = (await res.json()) as { data: { uploads: Array<Record<string, unknown>> } };
            expect(json.data.uploads[0].deleteCode).toBeUndefined();
            expect(json.data.uploads[0].userId).toBeUndefined();
        });

        test("retorna informações do usuário dono → 200", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`);
            const json = (await res.json()) as { data: { user: { name: string; color: string } } };
            expect(json.data.user.name).toBeDefined();
            expect(json.data.user.color).toBeDefined();
        });
    });

    describe("GET /album/list-my", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/album/list-my`);
            expect(res.status).toBe(401);
        });

        test("lista albums do usuário → 200", async () => {
            const res = await fetch(`${baseURL}/album/list-my`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: Array<{ id: string }> };
            expect(Array.isArray(json.data)).toBe(true);
            expect(json.data.some((a) => a.id === createdAlbumId)).toBe(true);
        });

        test("outro usuário não vê albums do primeiro → 200", async () => {
            const res = await fetch(`${baseURL}/album/list-my`, {
                headers: { Authorization: testUser2.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: Array<{ id: string }> };
            expect(json.data.some((a) => a.id === createdAlbumId)).toBe(false);
        });
    });

    describe("POST /album/update-my/:id", () => {
        let extraUpload: Upload;

        beforeAll(async () => {
            extraUpload = await createTestUpload(testUser.id);
        });

        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/album/update-my/${createdAlbumId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemsToPush: [extraUpload.name] }),
            });
            expect(res.status).toBe(401);
        });

        test("album inexistente → 404", async () => {
            const res = await fetch(`${baseURL}/album/update-my/album-inexistente`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ itemsToPush: [extraUpload.name] }),
            });
            expect(res.status).toBe(404);
        });

        test("album de outro usuário → 404", async () => {
            const res = await fetch(`${baseURL}/album/update-my/${createdAlbumId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser2.token,
                },
                body: JSON.stringify({ itemsToPush: [uploadUser2.name] }),
            });
            expect(res.status).toBe(404);
        });

        test("adicionar arquivo de outro usuário → 403", async () => {
            const res = await fetch(`${baseURL}/album/update-my/${createdAlbumId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ itemsToPush: [uploadUser2.name] }),
            });
            expect(res.status).toBe(403);
        });

        test("adicionar arquivo inexistente → 403", async () => {
            const res = await fetch(`${baseURL}/album/update-my/${createdAlbumId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ itemsToPush: ["arquivo-fake.png"] }),
            });
            expect(res.status).toBe(403);
        });

        test("body inválido (sem itemsToPush) → 422", async () => {
            const res = await fetch(`${baseURL}/album/update-my/${createdAlbumId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(422);
        });

        test("adicionar arquivo próprio → 200", async () => {
            const res = await fetch(`${baseURL}/album/update-my/${createdAlbumId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ itemsToPush: [extraUpload.name] }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { uploads: Array<{ name: string }> } };
            expect(json.data.uploads.length).toBe(2);
            expect(json.data.uploads.some((u) => u.name === extraUpload.name)).toBe(true);
        });

        test("verificar que upload foi adicionado → 200", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`);
            const json = (await res.json()) as { data: { uploads: Array<{ name: string }> } };
            expect(json.data.uploads.length).toBe(2);
        });
    });

    describe("PATCH /album/:id", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Meu álbum" }),
            });
            expect(res.status).toBe(401);
        });

        test("body vazio → 422", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(422);
        });

        test("título acima do limite → 422", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ title: "a".repeat(121) }),
            });
            expect(res.status).toBe(422);
        });

        test("outro usuário não pode editar → 404", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser2.token,
                },
                body: JSON.stringify({ title: "Não autorizado" }),
            });
            expect(res.status).toBe(404);
        });

        test("não permite editar descrição de upload fora do álbum → 403", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({
                    uploads: [{ name: upload2.name, description: "Descrição indevida" }],
                }),
            });
            expect(res.status).toBe(403);
        });

        test("criador atualiza título e descrição → 200", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({
                    title: "  Memórias da viagem  ",
                    uploads: [{ name: upload1.name, description: "  Primeiro dia  " }],
                }),
            });

            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: { title: string; canEdit: boolean; uploads: Array<{ name: string; description: string | null }> };
            };
            expect(json.data.title).toBe("Memórias da viagem");
            expect(json.data.canEdit).toBe(true);
            expect(json.data.uploads.find((upload) => upload.name === upload1.name)?.description).toBe("Primeiro dia");
        });

        test("metadados atualizados ficam públicos, mas não editáveis → 200", async () => {
            const res = await fetch(`${baseURL}/album/${createdAlbumId}`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as {
                data: { title: string; canEdit: boolean; uploads: Array<{ name: string; description: string | null }> };
            };
            expect(json.data.title).toBe("Memórias da viagem");
            expect(json.data.canEdit).toBe(false);
            expect(json.data.uploads.find((upload) => upload.name === upload1.name)?.description).toBe("Primeiro dia");
        });
    });
});
