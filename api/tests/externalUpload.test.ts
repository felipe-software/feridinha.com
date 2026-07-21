import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { baseURL } from "./setup";
import { createTestUser, deleteTestUser, type TestUser } from "./helpers";
import achievements from "@/handlers/achievements";
import constants from "@/constants";
import database from "@/services/database";
import { externalPostParser } from "@/services/external-post/parser";
import { externalPostResolver } from "@/services/external-post/resolver";
import { SafeFetchError } from "@/services/external-post/safeFetchExternal";
import { externalPostUploader } from "@/services/external-post/uploader";
import { s3Service } from "@/services/s3";
import uploadUtils from "@/utils/upload";
import { UserRole } from "@prisma/client";

const createdUploads: string[] = [];
let testUser: TestUser;

interface LinkUploadResponse {
    success: boolean;
    code: string;
    filename: string;
    delete: string;
    mimeType: string;
    size: number;
    sourcePlatform: string;
}

const originals = {
    resolveHtml: externalPostResolver.resolveHtml,
    parse: externalPostParser.parse,
    downloadExternalMedia: externalPostUploader.downloadExternalMedia,
    uploadFile: s3Service.uploadFile,
    stripMetadata: uploadUtils.stripMetadata,
    handleAchievement: achievements.handleUpdate,
};

beforeAll(async () => {
    testUser = await createTestUser("external-upload");
});

afterAll(async () => {
    externalPostResolver.resolveHtml = originals.resolveHtml;
    externalPostParser.parse = originals.parse;
    externalPostUploader.downloadExternalMedia = originals.downloadExternalMedia;
    s3Service.uploadFile = originals.uploadFile;
    uploadUtils.stripMetadata = originals.stripMetadata;
    achievements.handleUpdate = originals.handleAchievement;
    await database.upload.deleteMany({ where: { name: { in: createdUploads } } });
    await deleteTestUser(testUser.id);
});

const stubSuccessfulPipeline = (onLimit: (limit: number) => void = () => {}) => {
    externalPostResolver.resolveHtml = async () => "<html></html>";
    externalPostParser.parse = async () => ({
        contentUrl: "https://offload.tnktok.com/video.mp4",
        contentType: "VIDEO",
    });
    externalPostUploader.downloadExternalMedia = (async (
        _parsed: Parameters<typeof originals.downloadExternalMedia>[0],
        _platform: Parameters<typeof originals.downloadExternalMedia>[1],
        limit?: number,
    ) => {
        onLimit(limit ?? 0);
        return {
            body: Buffer.from("video"),
            contentType: "video/mp4",
            extension: "mp4",
            size: 5,
        };
    }) as never;
    uploadUtils.stripMetadata = async () => true;
    s3Service.uploadFile = async ({ to }) => {
        expect(to).not.toStartWith("mural/");
        return true;
    };
};

describe("POST /upload/link", () => {
    test("validates the request and rejects unsupported platforms", async () => {
        const empty = await fetch(`${baseURL}/upload/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        expect(empty.status).toBe(422);

        const invalid = await fetch(`${baseURL}/upload/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ link: "not-a-url" }),
        });
        expect(invalid.status).toBe(422);

        const unsupported = await fetch(`${baseURL}/upload/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ link: "https://example.com/post/1" }),
        });
        expect(unsupported.status).toBe(400);
        expect(((await unsupported.json()) as { code: string }).code).toBe("link_platform_unknown");
    });

    test("imports anonymously using the 15 MB limit and persists a normal upload", async () => {
        let receivedLimit = 0;
        stubSuccessfulPipeline((limit) => (receivedLimit = limit));

        const response = await fetch(`${baseURL}/upload/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ link: "https://www.tiktok.com/@user/video/123" }),
        });
        const json = (await response.json()) as LinkUploadResponse;
        expect(response.status).toBe(200);
        expect(json).toMatchObject({
            success: true,
            code: "new_upload_created",
            mimeType: "video/mp4",
            size: 5,
            sourcePlatform: "tiktok",
        });
        expect(receivedLimit).toBe(constants.upload.fileLimitPerRole[UserRole.ANONYMOUS]);
        createdUploads.push(json.filename);

        const saved = await database.upload.findUniqueOrThrow({ where: { name: json.filename } });
        expect(saved).toMatchObject({ size: 5, mimeType: "video/mp4", userId: null });
        expect(json.delete).toContain(saved.deleteCode);
    });

    test("uses the authenticated limit and counts the import as an upload achievement event", async () => {
        let receivedLimit = 0;
        let achievementSize = 0;
        stubSuccessfulPipeline((limit) => (receivedLimit = limit));
        achievements.handleUpdate = (async (
            _user: Parameters<typeof originals.handleAchievement>[0],
            metadata: Parameters<typeof originals.handleAchievement>[1],
        ) => {
            if (metadata.context === "upload") achievementSize = metadata.uploadSize;
            return [];
        }) as never;

        const response = await fetch(`${baseURL}/upload/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: testUser.token },
            body: JSON.stringify({ link: "https://www.tiktok.com/@user/video/456" }),
        });
        const json = (await response.json()) as LinkUploadResponse;
        expect(response.status).toBe(200);
        expect(receivedLimit).toBe(constants.upload.fileLimitPerRole[UserRole.USER]);
        expect(achievementSize).toBe(5);
        createdUploads.push(json.filename);
        expect((await database.upload.findUniqueOrThrow({ where: { name: json.filename } })).userId).toBe(testUser.id);
    });

    test("maps oversized and unsupported media to public upload errors", async () => {
        externalPostResolver.resolveHtml = async () => "<html></html>";
        externalPostParser.parse = async () => ({
            contentUrl: "https://offload.tnktok.com/video.mp4",
            contentType: "VIDEO",
        });

        externalPostUploader.downloadExternalMedia = async () => Promise.reject(new SafeFetchError("body_too_large"));
        const oversized = await fetch(`${baseURL}/upload/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ link: "https://www.tiktok.com/@user/video/789" }),
        });
        expect(oversized.status).toBe(413);
        expect(((await oversized.json()) as { code: string }).code).toBe("max_file_size_reached");

        externalPostUploader.downloadExternalMedia = async () =>
            Promise.reject(new Error("Unsupported external content type"));
        const unsupported = await fetch(`${baseURL}/upload/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ link: "https://www.tiktok.com/@user/video/999" }),
        });
        expect(unsupported.status).toBe(415);
        expect(((await unsupported.json()) as { code: string }).code).toBe("external_content_type_unsupported");
    });
});
