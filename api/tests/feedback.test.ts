import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { baseURL } from "./setup";
import database from "@/services/database";
import { createTestUser, deleteTestUser, TestUser } from "./helpers";
import { getRandomItems } from "@/routes/feedback";

let testUser: TestUser;
let testUser2: TestUser;
let createdReviewId: string;

beforeAll(async () => {
    testUser = await createTestUser("feedback");
    testUser2 = await createTestUser("feedback2");
});

afterAll(async () => {
    await deleteTestUser(testUser.id);
    await deleteTestUser(testUser2.id);
});

describe("Feedback Routes", () => {
    test("embaralhador não altera entrada e respeita limite", () => {
        const input = [1, 2, 3, 4];
        const result = getRandomItems(input, 2);
        expect(result).toHaveLength(2);
        expect(input).toEqual([1, 2, 3, 4]);
        expect(result.every((item) => input.includes(item))).toBe(true);
    });
    describe("GET /feedback/home-reviews", () => {
        test("falha de banco retorna erro público", async () => {
            const original = database.review.findMany;
            database.review.findMany = (async () => Promise.reject(new Error("database details"))) as never;
            try {
                const res = await fetch(`${baseURL}/feedback/home-reviews`);
                expect(res.status).toBe(200);
                const body = await res.text();
                expect(JSON.parse(body).success).toBe(false);
                expect(body).not.toContain("database details");
            } finally {
                database.review.findMany = original;
            }
        });
        test("sem autenticação → 200", async () => {
            const res = await fetch(`${baseURL}/feedback/home-reviews`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { public: unknown[]; yours: unknown } };
            expect(json.data.public).toBeDefined();
            expect(json.data.yours).toBeNull();
        });

        test("com autenticação sem review → 200 yours=null", async () => {
            const res = await fetch(`${baseURL}/feedback/home-reviews`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { public: unknown[]; yours: unknown } };
            expect(json.data.yours).toBeNull();
        });
    });

    describe("POST /feedback/review/create", () => {
        test("sem autenticação → 401", async () => {
            const res = await fetch(`${baseURL}/feedback/review/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ review: "Great service!" }),
            });
            expect(res.status).toBe(401);
        });

        test("body vazio → 422", async () => {
            const res = await fetch(`${baseURL}/feedback/review/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(422);
        });

        test("review < 3 chars → 422", async () => {
            const res = await fetch(`${baseURL}/feedback/review/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ review: "ab" }),
            });
            expect(res.status).toBe(422);
        });

        test("review > 300 chars → 422", async () => {
            const res = await fetch(`${baseURL}/feedback/review/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ review: "a".repeat(301) }),
            });
            expect(res.status).toBe(422);
        });

        test("suggestion > 300 chars → 422", async () => {
            const res = await fetch(`${baseURL}/feedback/review/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ review: "Valid review", suggestion: "a".repeat(301) }),
            });
            expect(res.status).toBe(422);
        });

        test("criação válida sem suggestion → 200", async () => {
            const res = await fetch(`${baseURL}/feedback/review/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ review: "This is my review" }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { id: string; content: string; hasBeenApproved: boolean } };
            expect(json.data.content).toBe("This is my review");
            expect(json.data.hasBeenApproved).toBe(false);
            createdReviewId = json.data.id;
        });

        test("criação duplicada (mesmo usuário) → erro", async () => {
            const res = await fetch(`${baseURL}/feedback/review/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser.token,
                },
                body: JSON.stringify({ review: "Another review" }),
            });
            const json = (await res.json()) as { success: boolean };
            expect(json.success).toBe(false);
        });

        test("outro usuário pode criar review → 200", async () => {
            const res = await fetch(`${baseURL}/feedback/review/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: testUser2.token,
                },
                body: JSON.stringify({ review: "User 2 review", suggestion: "Add more features" }),
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { suggestion: string } };
            expect(json.data.suggestion).toBe("Add more features");
        });
    });

    describe("GET /feedback/home-reviews (após criar reviews)", () => {
        test("com autenticação após criar review → 200 yours preenchido", async () => {
            const res = await fetch(`${baseURL}/feedback/home-reviews`, {
                headers: { Authorization: testUser.token },
            });
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { yours: { id: string } } };
            expect(json.data.yours).toBeDefined();
            expect(json.data.yours.id).toBe(createdReviewId);
        });

        test("reviews não aprovadas não aparecem em public → 200", async () => {
            const res = await fetch(`${baseURL}/feedback/home-reviews`);
            expect(res.status).toBe(200);
            const json = (await res.json()) as { data: { public: Array<{ id: string }> } };
            expect(json.data.public.some((r) => r.id === createdReviewId)).toBe(false);
        });

        test("review aprovada é salva no banco → verificação direta", async () => {
            await database.review.update({
                where: { id: createdReviewId },
                data: { hasBeenApproved: true },
            });

            const review = await database.review.findUnique({ where: { id: createdReviewId } });
            expect(review?.hasBeenApproved).toBe(true);
        });
    });
});
