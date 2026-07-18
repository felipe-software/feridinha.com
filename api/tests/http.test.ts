import { describe, expect, test } from "bun:test";
import { baseURL } from "./setup";

describe("Base HTTP behavior", () => {
    test("GET / returns 200", async () => {
        const res = await fetch(`${baseURL}/`);
        expect(res.status).toBe(200);
    });

    test("GET /nonexist returns 404", async () => {
        const res = await fetch(`${baseURL}/nonexist`);
        expect(res.status).toBe(404);
    });
});

describe("Base CDN Serving behavior", () => {
    test("GET /f/deleted.png returns 302", async () => {
        const res = await fetch(`${baseURL}/f/deleted.png`, { redirect: "manual" });
        expect(res.status).toBe(302);
    });
});
