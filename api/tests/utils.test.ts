import { afterAll, describe, expect, test } from "bun:test";
import cryptography from "@/config/cryptography";
import { cacheService } from "@/services/cache";
import fileUtils from "@/utils/file";
import { ExternalServiceError, getUpstreamStatus, publicErrorDetails } from "@/utils/httpErrors";
import { readCookie } from "@/utils/cookies";
import { ApiError, sleep, tryP } from "@/utils/promises";
import tmpUtils from "@/utils/tmp";
import uploadUtils from "@/utils/upload";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "feridinha-utils-test-"));

afterAll(async () => {
    await fs.rm(workDir, { recursive: true, force: true });
});

describe("cookie e erros públicos", () => {
    test("lê cookies codificados e ignora entradas inválidas", () => {
        expect(readCookie(undefined, "token")).toBeUndefined();
        expect(readCookie("broken; other=1; token=ol%C3%A1", "token")).toBe("olá");
        expect(readCookie("token=%E0%A4%A", "token")).toBeUndefined();
        expect(readCookie("other=1", "token")).toBeUndefined();
    });

    test("sanitiza detalhes e normaliza status upstream", () => {
        const external = new ExternalServiceError("upstream_failed", 429);
        expect(external).toMatchObject({ name: "ExternalServiceError", code: "upstream_failed", upstreamStatus: 429 });
        expect(getUpstreamStatus({ response: { status: 404 } })).toBe(404);
        expect(getUpstreamStatus({ response: { status: 200 } })).toBe(502);
        expect(getUpstreamStatus(null)).toBe(502);
        expect(publicErrorDetails(new TypeError("bad"))).toEqual({ name: "TypeError", message: "bad" });
        expect(publicErrorDetails("secret object")).toEqual({ name: "UnknownError", message: "Unknown error" });
    });
});

describe("promises e criptografia", () => {
    test("tryP representa sucesso e falha sem rejeição", async () => {
        expect(await tryP(Promise.resolve(42))).toEqual([null, 42]);
        const error = new Error("failure");
        expect(await tryP(Promise.reject(error))).toEqual([error, null]);
        const apiError = new ApiError({ name: "session_not_found", message: "missing", code: "missing", cause: error });
        expect(apiError).toMatchObject({ name: "session_not_found", message: "missing", code: "missing", cause: error });
        await sleep(1);
    });

    test("round-trip de código legado e entrada inválida", async () => {
        const encrypted = await cryptography.encryptLegacyDeletionCode("arquivo.png");
        expect(typeof encrypted).toBe("string");
        expect(await cryptography.decryptLegacyDeletionCode(encrypted as string)).toBe("arquivo.png");
        expect(await cryptography.decryptLegacyDeletionCode("not-valid-ciphertext")).toBe(false);
    });
});

describe("arquivos e temporários", () => {
    test("cria caminhos, escreve, move e apaga arquivos", async () => {
        await tmpUtils.ensureDirsExist();
        expect(tmpUtils.getUploadTmpPath("x.txt")).toBe(path.join(tmpUtils.paths.upload, "x.txt"));
        expect(tmpUtils.getPreviewTmpPath("x.webp")).toBe(path.join(tmpUtils.paths.preview, "x.webp"));

        const source = path.join(workDir, "source.txt");
        const target = path.join(workDir, "target.txt");
        expect(await fileUtils.writeFileFromBuffer(Buffer.from("data"), source)).toBe(true);
        expect(await fileUtils.checkIfFileExists(source)).toBe(true);
        expect(await fileUtils.moveFile(source, target)).toBe(true);
        expect(await fileUtils.checkIfFileExists(target)).toBe(true);
        expect(await fileUtils.deleteFile(target)).toBe(true);
        expect(await fileUtils.deleteFile(target)).toBe(true);
    });

    test("retorna falha para operações inválidas", async () => {
        const missingParent = path.join(workDir, "missing", "file.txt");
        expect(await fileUtils.writeFileFromBuffer(Buffer.from("data"), missingParent)).toBeUndefined();
        expect(await fileUtils.moveFile(missingParent, path.join(workDir, "target-2.txt"))).toBe(false);
        expect(await fileUtils.deleteFile(workDir)).toBe(false);
        expect(await fileUtils.deleteFile(workDir, { surpressError: true })).toBe(true);
        expect(fileUtils.getUploadFilePath("x.png")).toEndWith(path.join("uploads", "x.png"));
    });
});

describe("validação e nomes de upload", () => {
    test("valida campo e extensão", () => {
        expect(uploadUtils.filterUpload({ originalFilename: "ok.png", fieldName: "wrong" })).toMatchObject({
            code: "wrong_form_field",
        });
        expect(uploadUtils.filterUpload({ originalFilename: "bad.exe", fieldName: "file" })).toMatchObject({
            code: "extension_not_allowed",
        });
        expect(uploadUtils.filterUpload({ originalFilename: "ok.png", fieldName: "file" })).toBeNull();
    });

    test("gera nomes com extensão e comprimentos esperados", async () => {
        const upload = await uploadUtils.generateUploadName("photo.png");
        expect(upload.filename).toMatch(/^[A-Za-z0-9]{5}\.png$/);
        expect(upload.filenameWithPath).toEndWith(upload.filename);
        expect(await uploadUtils.generateAlbumName()).toMatch(/^[A-Za-z0-9]{12}$/);
    });

    test("tenta novamente quando há colisão de nome", async () => {
        const originalCheck = fileUtils.checkIfFileExists;
        let calls = 0;
        fileUtils.checkIfFileExists = async () => ++calls === 1;
        try {
            expect((await uploadUtils.generateUploadName("photo.jpg")).filename).toEndWith(".jpg");
            expect(calls).toBe(2);
        } finally {
            fileUtils.checkIfFileExists = originalCheck;
        }
    });

    test("stripMetadata considera sucesso e falha do exiftool como não bloqueantes", async () => {
        const successTool = { deleteAllTags: async () => ({}) };
        const failureTool = { deleteAllTags: async () => Promise.reject(new Error("exif failed")) };
        expect(await uploadUtils.stripMetadata(path.join(workDir, "metadata-ok.jpg"), successTool as never)).toBe(true);
        expect(await uploadUtils.stripMetadata(path.join(workDir, "metadata-fail.jpg"), failureTool as never)).toBe(true);
    });
});

describe("cache de upload", () => {
    test("mantém arquivo pequeno em memória e emite evento ao liberar", async () => {
        const key = `small-${crypto.randomUUID()}`;
        const deleted = new Promise<void>((resolve) => {
            cacheService.getEmitter().once("cache-deleted", (item) => {
                expect(item.name).toBe("small.png");
                resolve();
            });
        });
        const stream = cacheService.getStream(key, ".png");
        cacheService.setUploadName(key, "small.png");
        stream.end(Buffer.from("small"));
        await new Promise<void>((resolve, reject) => stream.on("finish", resolve).on("error", reject));
        expect(cacheService.getCacheItem(key)?.buffer?.toString()).toBe("small");
        expect(cacheService.getCacheByUploadName("small.png")?.name).toBe("small.png");
        cacheService.getStatus();
        await cacheService.freeCache(key);
        await deleted;
        expect(cacheService.getCacheItem(key)).toBeUndefined();
    });

    test("migra stream grande para disco e remove temporário", async () => {
        const key = `large-${crypto.randomUUID()}`;
        const stream = cacheService.getStream(key, ".bin");
        stream.write(Buffer.alloc(1024 * 1024 + 1, 1));
        stream.end(Buffer.from("tail"));
        await new Promise<void>((resolve, reject) => stream.on("finish", resolve).on("error", reject));
        const item = cacheService.getCacheItem(key)!;
        expect(item.filePath).toBeTruthy();
        expect(await fileUtils.checkIfFileExists(item.filePath!)).toBe(true);
        await cacheService.freeCache(key);
        expect(await fileUtils.checkIfFileExists(item.filePath!)).toBe(false);
        cacheService.getStatus();
    });

    test("trata erro de stream com e sem arquivo temporário", async () => {
        const memoryKey = `error-memory-${crypto.randomUUID()}`;
        const memoryStream = cacheService.getStream(memoryKey);
        memoryStream.emit("error", new Error("memory stream failed"));
        await Bun.sleep(1);
        await cacheService.freeCache(memoryKey);

        const diskKey = `error-disk-${crypto.randomUUID()}`;
        const diskStream = cacheService.getStream(diskKey, ".bin");
        diskStream.end(Buffer.alloc(1024 * 1024 + 1));
        await new Promise<void>((resolve, reject) => diskStream.on("finish", resolve).on("error", reject));
        const filePath = cacheService.getCacheItem(diskKey)?.filePath;
        expect(filePath).toBeTruthy();
        diskStream.emit("error", new Error("disk stream failed"));
        await Bun.sleep(10);
        expect(await fileUtils.checkIfFileExists(filePath!)).toBe(false);
        await cacheService.freeCache(diskKey);
    });
});
