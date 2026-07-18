import { UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import path from "node:path";
import constants from "../src/constants";
import { baseURL, deleteLinks } from "./setup";
import database from "@/services/database";

const originalWhitelist = [...constants.whitelistedExtensions];
const originalLimits = { ...constants.upload.fileLimitPerRole };

const file = Bun.file(path.resolve(__dirname, "./assets/inside-limit.jpg"));
const fileBiggerThanLimit = Bun.file(path.resolve(__dirname, "./assets/inside-limit.jpg"));

beforeAll(() => {
    Object.assign(constants.upload.fileLimitPerRole, {
        [UserRole.ADMIN]: 100 * 1024 * 1024,
        [UserRole.USER]: 100 * 1024 * 1024,
        [UserRole.ANONYMOUS]: 100 * 1024 * 1024,
    });
});
describe("Upload cycle", () => {
    describe("Base Upload Behavior", () => {
        test("POST /upload empty body → 400", async () => {
            const res = await fetch(`${baseURL}/upload`, { method: "POST" });
            expect(res.status).toBe(400);
        });

        test("POST /upload multipart malformado → 500 sanitizado", async () => {
            const res = await fetch(`${baseURL}/upload`, {
                method: "POST",
                headers: { "Content-Type": "multipart/form-data; boundary=broken" },
                body: "not-a-valid-multipart-body",
            });
            expect(res.status).toBe(500);
            const body = await res.text();
            expect(body).not.toContain("Formidable");
        });

        test("POST /upload inside limit → 200", async () => {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch(`${baseURL}/upload`, { method: "POST", body: form });
            expect(res.status).toBe(200);
            const json = (await res.json()) as any;
            deleteLinks.push(json.delete);
        });

        test("POST /upload inside limit again → 200", async () => {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch(`${baseURL}/upload`, { method: "POST", body: form });
            expect(res.status).toBe(200);
            const json = (await res.json()) as any;
            deleteLinks.push(json.delete);
        });
    });

    describe("Validation with modified constants", () => {
        test("max-size set to 1 B → 413", async () => {
            const prev = constants.upload.fileLimitPerRole[UserRole.ANONYMOUS];
            constants.upload.fileLimitPerRole[UserRole.ANONYMOUS] = 1;
            const form = new FormData();
            form.append("file", fileBiggerThanLimit);
            const res = await fetch(`${baseURL}/upload`, { method: "POST", body: form });
            expect(res.status).toBe(413);
            constants.upload.fileLimitPerRole[UserRole.ANONYMOUS] = prev;
        });

        test("remove .jpg/.jpeg/.png from whitelist → 415", async () => {
            constants.whitelistedExtensions = constants.whitelistedExtensions.filter(
                (e) => e !== ".jpg" && e !== ".jpeg" && e !== ".png"
            );
            const form = new FormData();
            form.append("file", file);
            const res = await fetch(`${baseURL}/upload`, { method: "POST", body: form });
            expect(res.status).toBe(415);
            constants.whitelistedExtensions = originalWhitelist;
        });
    });

    describe("Upload after constants reset", () => {
        beforeAll(() => {
            constants.whitelistedExtensions = originalWhitelist;
            Object.assign(constants.upload.fileLimitPerRole, originalLimits);
        });

        test("POST /upload succeeds again → 200", async () => {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch(`${baseURL}/upload`, { method: "POST", body: form });
            expect(res.status).toBe(200);
            const json = (await res.json()) as any;
            deleteLinks.push(json.delete);
        });
    });

    afterAll(async () => {
        const loop = async () => {
            const uploads = await database.upload.findMany({ where: { deletedAt: { equals: null } } });
            if (uploads.length < deleteLinks.length) {
                console.debug("Uploads where not saved to database yet.", {
                    deleteLinks: deleteLinks.length,
                    uploads: uploads.length,
                });
                await Bun.sleep(500);
                return loop();
            }

            console.log(`Got ${uploads.length} uploads from database, deleting them`);

            for (let upload of uploads) {
                const res = await fetch(`${baseURL}/upload/${upload.deleteCode}`, { method: "DELETE" });
                const json = (await res.json()) as any;
                expect(res.status).toBe(200);
                expect(json.data.name).toBe(upload.name);
                console.log(`${upload.name} deleted`)
            }
        };

        await loop();
    });
});
