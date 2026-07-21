import { afterAll, describe, expect, test } from "bun:test";
import cryptography from "@/config/cryptography";
import cloudflare from "@/services/cloudflare";
import database from "@/services/database";
import { s3Service } from "@/services/s3";
import { baseURL } from "./setup";
import { saveUserUploadAndAchievements, translateUploadError } from "@/controllers/upload";
import achievements from "@/handlers/achievements";

const names: string[] = [];

const createUpload = async (options: { deleted?: boolean; version?: "LEGACY" | "NEW"; mismatched?: boolean } = {}) => {
    const name = `delete-test-${crypto.randomUUID()}.png`;
    names.push(name);
    const deleteCode = await cryptography.encryptLegacyDeletionCode(options.mismatched ? "different.png" : name);
    return database.upload.create({
        data: {
            name,
            size: 10,
            mimeType: "image/png",
            deleteCode: deleteCode as string,
            deleteCodeVersion: options.version ?? "LEGACY",
            deletedAt: options.deleted ? new Date() : null,
        },
    });
};

afterAll(async () => {
    await database.upload.deleteMany({ where: { name: { in: names } } });
});

describe("DELETE /upload/:deleteCode", () => {
    test("rejeita link inexistente", async () => {
        const res = await fetch(`${baseURL}/upload/not-found`, { method: "DELETE" });
        expect(res.status).toBe(404);
    });

    test("rejeita arquivo já deletado", async () => {
        const upload = await createUpload({ deleted: true });
        const res = await fetch(`${baseURL}/upload/${upload.deleteCode}`, { method: "DELETE" });
        expect(res.status).toBe(400);
    });

    test("rejeita versão de código não legada e código divergente", async () => {
        const modern = await createUpload({ version: "NEW" });
        expect((await fetch(`${baseURL}/upload/${modern.deleteCode}`, { method: "DELETE" })).status).toBe(400);
        const mismatched = await createUpload({ mismatched: true });
        expect((await fetch(`${baseURL}/upload/${mismatched.deleteCode}`, { method: "DELETE" })).status).toBe(400);
    });

    test("trata falha ao remover objeto do S3", async () => {
        const upload = await createUpload();
        const originalDelete = s3Service.deleteFile;
        s3Service.deleteFile = async () => Promise.reject(new Error("delete failed"));
        try {
            const res = await fetch(`${baseURL}/upload/${upload.deleteCode}`, { method: "DELETE" });
            expect(res.status).toBe(500);
        } finally {
            s3Service.deleteFile = originalDelete;
        }
    });

    test("trata falha ao publicar imagem substituta", async () => {
        const upload = await createUpload();
        const originalDelete = s3Service.deleteFile;
        const originalUpload = s3Service.uploadFile;
        s3Service.deleteFile = async () => true;
        s3Service.uploadFile = async () => Promise.reject(new Error("replacement failed"));
        try {
            const res = await fetch(`${baseURL}/upload/${upload.deleteCode}`, { method: "DELETE" });
            expect(res.status).toBe(500);
        } finally {
            s3Service.deleteFile = originalDelete;
            s3Service.uploadFile = originalUpload;
        }
    });

    test("marca como deletado, substitui objeto e limpa CDN", async () => {
        const upload = await createUpload();
        const originalDelete = s3Service.deleteFile;
        const originalUpload = s3Service.uploadFile;
        const originalPurge = cloudflare.purgeCacheFromCdn;
        const calls: string[] = [];
        s3Service.deleteFile = async ({ from }) => {
            calls.push(`delete:${from}`);
            return true;
        };
        s3Service.uploadFile = async ({ to }) => {
            calls.push(`upload:${to}`);
            return true;
        };
        cloudflare.purgeCacheFromCdn = async (filename) => {
            calls.push(`purge:${filename}`);
            return true;
        };
        try {
            const res = await fetch(`${baseURL}/upload/${upload.deleteCode}`, { method: "DELETE" });
            expect(res.status).toBe(200);
            expect(calls).toEqual([`delete:${upload.name}`, `upload:${upload.name}`, `purge:${upload.name}`]);
            expect((await database.upload.findUniqueOrThrow({ where: { name: upload.name } })).deletedAt).not.toBeNull();
        } finally {
            s3Service.deleteFile = originalDelete;
            s3Service.uploadFile = originalUpload;
            cloudflare.purgeCacheFromCdn = originalPurge;
        }
    });
});

describe("upload controller helpers", () => {
    test("traduz todos os códigos de erro e preserva fallback", () => {
        const req = { t: (key: string, values?: unknown) => `${key}:${JSON.stringify(values ?? null)}` } as never;
        expect(translateUploadError(req, "wrong_form_field")).toContain("upload.wrongFormField");
        expect(translateUploadError(req, "extension_not_allowed")).toContain("upload.extensionNotAllowed");
        expect(translateUploadError(req, "bad_request")).toContain("upload.badRequest");
        expect(translateUploadError(req, "max_file_size_reached", undefined, 15)).toContain('"mb":15');
        expect(translateUploadError(req, "unknown", "fallback")).toBe("fallback");
        expect(translateUploadError(req, "unknown")).toContain("common.internalError");
    });

    test("salva upload anônimo e continua quando persistência falha", async () => {
        const originalCreate = database.upload.create;
        const payloads: unknown[] = [];
        database.upload.create = (async (args: unknown) => {
            payloads.push(args);
            throw new Error("db failed");
        }) as never;
        try {
            await saveUserUploadAndAchievements({
                uploadName: { filename: "anonymous.png", filenameWithPath: "/tmp/anonymous.png" },
                uploadSize: 10,
                deleteCode: "delete-code",
                userAgent: "test-agent",
            })();
            expect(payloads).toHaveLength(1);
        } finally {
            database.upload.create = originalCreate;
        }
    });

    test("atualiza conquistas antes de salvar upload autenticado", async () => {
        const originalCreate = database.upload.create;
        const originalAchievements = achievements.handleUpdate;
        let achievementCalled = false;
        achievements.handleUpdate = (async () => {
            achievementCalled = true;
            return [];
        }) as never;
        database.upload.create = (async ({ data }: { data: unknown }) => data) as never;
        try {
            await saveUserUploadAndAchievements({
                user: { id: "user-id", name: "User" } as never,
                uploadName: { filename: "authenticated.jpg", filenameWithPath: "/tmp/authenticated.jpg" },
                uploadSize: 20,
                deleteCode: "delete-code",
            })();
            expect(achievementCalled).toBe(true);
        } finally {
            database.upload.create = originalCreate;
            achievements.handleUpdate = originalAchievements;
        }
    });
});
