import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { previewHandler, tempPreviewDir, MAX_PREVIEW_FILES } from "@/handlers/preview";
import tmpUtils from "@/utils/tmp";
import fs from "fs/promises";
import path from "path";
const TEST_FILENAME = "test-magrelo.mp4";
const PREVIEW_OUTPUT_NAME = `preview-${TEST_FILENAME}.webp`;

let fileServer: ReturnType<typeof Bun.serve>;
let fileServerUrl: string;

beforeAll(async () => {
    await tmpUtils.ensureDirsExist();

    const videoPath = path.resolve(__dirname, "./assets/magrelo.mp4");
    const videoFile = Bun.file(videoPath);

    fileServer = Bun.serve({
        port: 0,
        fetch: async () => {
            return new Response(videoFile, {
                headers: { "Content-Type": "video/mp4" },
            });
        },
    });

    fileServerUrl = `http://localhost:${fileServer.port}/${TEST_FILENAME}`;
    console.log(`[preview.test] File server ready at ${fileServerUrl}`);
});

afterAll(async () => {
    fileServer.stop();

    const filesToClean = [
        path.join(tempPreviewDir, `input-${TEST_FILENAME}`),
        path.join(tempPreviewDir, `palette-${TEST_FILENAME}.png`),
        path.join(tempPreviewDir, PREVIEW_OUTPUT_NAME),
    ];

    for (const file of filesToClean) {
        await fs.rm(file, { force: true }).catch(() => {});
    }

    console.log("[preview.test] Cleanup complete");
});

describe("Preview GIF Generation", () => {
    test("generates GIF from video", async () => {
        const result = await previewHandler.generateGifPreview(TEST_FILENAME, fileServerUrl);

        expect(result.name).toBe(PREVIEW_OUTPUT_NAME);
        expect(result.size).toBeGreaterThan(0);
        expect(result.path).toContain(tempPreviewDir);

        const outputFile = Bun.file(result.path);
        expect(await outputFile.exists()).toBe(true);
    }, 30000);

    test("returns cached GIF on second call", async () => {
        const outputPath = path.join(tempPreviewDir, PREVIEW_OUTPUT_NAME);
        const fileBefore = Bun.file(outputPath);
        const sizeBefore = fileBefore.size;
        const mtimeBefore = (await fs.stat(outputPath)).mtimeMs;

        await Bun.sleep(100);

        const result = await previewHandler.generateGifPreview(TEST_FILENAME, fileServerUrl);

        const mtimeAfter = (await fs.stat(outputPath)).mtimeMs;

        expect(result.name).toBe(PREVIEW_OUTPUT_NAME);
        expect(result.size).toBe(sizeBefore);
        expect(mtimeAfter).toBe(mtimeBefore);
    });

    test("throws error for file too small", async () => {
        const tinyServer = Bun.serve({
            port: 0,
            fetch: () => new Response(Buffer.alloc(100), {
                headers: { "Content-Type": "video/mp4" },
            }),
        });

        const tinyUrl = `http://localhost:${tinyServer.port}/tiny.mp4`;

        await expect(
            previewHandler.generateGifPreview("tiny-video.mp4", tinyUrl)
        ).rejects.toThrow("File too small");

        tinyServer.stop();
    });

    test("throws error for file too large", async () => {
        const hugeServer = Bun.serve({
            port: 0,
            fetch: () => new Response(Buffer.alloc(60 * 1024 * 1024), {
                headers: { "Content-Type": "video/mp4" },
            }),
        });

        const hugeUrl = `http://localhost:${hugeServer.port}/huge.mp4`;

        await expect(
            previewHandler.generateGifPreview("huge-video.mp4", hugeUrl)
        ).rejects.toThrow("File too large");

        hugeServer.stop();
    });

    test("throws error for invalid URL", async () => {
        await expect(
            previewHandler.generateGifPreview("invalid.mp4", "http://localhost:59999/nonexistent.mp4")
        ).rejects.toThrow("Failed to download video");
    });

    test("cleans preview directory when exceeding limit (deletes oldest files)", async () => {
        const existingFiles = await fs.readdir(tempPreviewDir);
        for (const file of existingFiles) {
            await fs.rm(path.join(tempPreviewDir, file), { force: true }).catch(() => {});
        }

        const createdDummyFiles: string[] = [];
        const dummyCount = MAX_PREVIEW_FILES + 4;
        for (let i = 0; i < dummyCount; i++) {
            const dummyPath = path.join(tempPreviewDir, `dummy-${i}.webp`);
            await Bun.write(dummyPath, `dummy content ${i}`);
            createdDummyFiles.push(`dummy-${i}.webp`);
            await Bun.sleep(50);
        }

        const filesBeforeGeneration = await fs.readdir(tempPreviewDir);
        expect(filesBeforeGeneration.length).toBe(dummyCount);

        const uniqueFilename = `cleanup-test-${Date.now()}.mp4`;
        await previewHandler.generateGifPreview(uniqueFilename, fileServerUrl);

        const filesAfterGeneration = await fs.readdir(tempPreviewDir);
        expect(filesAfterGeneration.length).toBe(MAX_PREVIEW_FILES);

        const filesToBeDeleted = (dummyCount + 1) - MAX_PREVIEW_FILES;
        const oldestFiles = createdDummyFiles.slice(0, filesToBeDeleted);
        for (const oldFile of oldestFiles) {
            expect(filesAfterGeneration).not.toContain(oldFile);
        }

        const newestDummyFiles = createdDummyFiles.slice(filesToBeDeleted);
        for (const newFile of newestDummyFiles) {
            expect(filesAfterGeneration).toContain(newFile);
        }

        const generatedPreview = `preview-${uniqueFilename}.webp`;
        expect(filesAfterGeneration).toContain(generatedPreview);

        for (const file of filesAfterGeneration) {
            await fs.rm(path.join(tempPreviewDir, file), { force: true }).catch(() => {});
        }
    }, 30000);
});
