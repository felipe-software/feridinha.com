import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import achievements, { baseAchievements } from "@/handlers/achievements";
import database from "@/services/database";
import { createTestUser, deleteTestUser, type TestUser } from "./helpers";

let testUser: TestUser;

const checker = (id: string) => baseAchievements.find((achievement) => achievement.id === id)!.checker;
const fixture = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "fixture-user",
        name: "ordinary-user",
        uploadCount: 0,
        achievements: [],
        createdAt: new Date("2024-01-01"),
        ...overrides,
    }) as never;

beforeAll(async () => {
    await achievements.init();
    testUser = await createTestUser("achievements");
});

afterAll(async () => {
    await deleteTestUser(testUser.id);
});

describe("achievement checkers", () => {
    test("primeiro upload respeita usuário e desbloqueio anterior", async () => {
        expect(await checker("upload-1st")(null as never, { context: "login" })).toBe(false);
        expect(await checker("upload-1st")(fixture(), { context: "upload", uploadSize: 1 })).toBe(true);
        expect(
            await checker("upload-1st")(fixture({ achievements: [{ id: "upload-1st" }] }), {
                context: "upload",
                uploadSize: 1,
            }),
        ).toBe(false);
    });

    test.each([
        ["upload-100", 99, false],
        ["upload-100", 100, true],
        ["upload-1000", 999, false],
        ["upload-1000", 1000, true],
        ["upload-5000", 4999, false],
        ["upload-5000", 5000, true],
        ["upload-15000", 14999, false],
        ["upload-15000", 15000, true],
    ] as const)("%s com %i uploads retorna %s", async (id, count, expected) => {
        expect(await checker(id)(fixture({ uploadCount: count }), { context: "upload", uploadSize: 1 })).toBe(expected);
    });

    test("conta antiga, limite e listas especiais", async () => {
        expect(await checker("og")(fixture({ createdAt: new Date("2022-12-31") }), { context: "login" })).toBe(true);
        expect(await checker("og")(fixture(), { context: "login" })).toBe(false);
        expect(await checker("limit")(fixture(), { context: "login" })).toBe(false);
        expect(await checker("limit")(fixture(), { context: "upload", uploadSize: 80 * 1024 * 1024 })).toBe(true);
        expect(await checker("limit")(fixture(), { context: "upload", uploadSize: 1 })).toBe(false);

        const bughunter = (await import("@/constants")).default.users.bughunters[0] ?? "__none__";
        const suggester = (await import("@/constants")).default.users.suggesters[0] ?? "__none__";
        expect(await checker("bug-reporter")(fixture({ name: bughunter.toUpperCase() }), { context: "login" })).toBe(
            bughunter !== "__none__",
        );
        expect(await checker("bug-reporter")(fixture(), { context: "login" })).toBe(false);
        expect(await checker("feature-suggester")(fixture({ name: suggester.toUpperCase() }), { context: "login" })).toBe(
            suggester !== "__none__",
        );
        expect(await checker("feature-suggester")(fixture(), { context: "login" })).toBe(false);
    });

    test("contadores por extensão cobrem atalhos e resultados", async () => {
        const originalFindMany = database.upload.findMany;
        try {
            expect(await checker("png-master")(fixture({ uploadCount: 4999 }), { context: "upload", uploadSize: 1 })).toBe(
                false,
            );
            expect(await checker("video")(fixture({ uploadCount: 999 }), { context: "upload", uploadSize: 1 })).toBe(false);
            expect(await checker("audio")(fixture({ uploadCount: 999 }), { context: "upload", uploadSize: 1 })).toBe(false);

            database.upload.findMany = (async () => Array.from({ length: 5000 }, (_, index) => ({
                name: index === 0 ? "other.jpg" : "image.png",
            }))) as never;
            expect(await checker("png-master")(fixture({ uploadCount: 5000 }), { context: "upload", uploadSize: 1 })).toBe(
                false,
            );
            database.upload.findMany = (async () => Array.from({ length: 5000 }, () => ({ name: "image.png" }))) as never;
            expect(await checker("png-master")(fixture({ uploadCount: 5000 }), { context: "upload", uploadSize: 1 })).toBe(
                true,
            );

            database.upload.findMany = (async () => [
                ...Array.from({ length: 1000 }, (_, index) => ({ name: `video-${index}.mp4` })),
                { name: "other.jpg" },
            ]) as never;
            expect(await checker("video")(fixture({ uploadCount: 1000 }), { context: "upload", uploadSize: 1 })).toBe(true);

            database.upload.findMany = (async () => [
                ...Array.from({ length: 1000 }, (_, index) => ({ name: `audio-${index}.ogg` })),
                { name: "other.jpg" },
            ]) as never;
            expect(await checker("audio")(fixture({ uploadCount: 1000 }), { context: "upload", uploadSize: 1 })).toBe(true);
        } finally {
            database.upload.findMany = originalFindMany;
        }
    });
});

describe("achievement orchestration", () => {
    test("não atualiza sem mudanças e aplica extraQuery", async () => {
        const user = await database.user.findUniqueOrThrow({
            where: { id: testUser.id },
            include: { achievements: true },
        });
        expect(await achievements.handleUpdate(user as never, { context: "login" })).toBeUndefined();
        expect(
            await achievements.handleUpdate(user as never, { context: "login" }, { uploadCount: { increment: 1 } }),
        ).toEqual([]);
        expect((await database.user.findUniqueOrThrow({ where: { id: testUser.id } })).uploadCount).toBe(1);
    });

    test("conecta novas conquistas e não as reconecta", async () => {
        const user = await database.user.findUniqueOrThrow({
            where: { id: testUser.id },
            include: { achievements: true },
        });
        const unlocked = await achievements.handleUpdate(user as never, { context: "upload", uploadSize: 1 });
        expect(unlocked).toContain("upload-1st");
        const updated = await database.user.findUniqueOrThrow({
            where: { id: testUser.id },
            include: { achievements: true },
        });
        expect(await achievements.handleUpdate(updated as never, { context: "upload", uploadSize: 1 })).toBeUndefined();
    });
});
