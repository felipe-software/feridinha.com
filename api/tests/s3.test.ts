import { s3Service } from "@/services/s3";
import { describe, expect, test } from "bun:test";
import path from "path";

describe(async () => {
    test("It should not get from s3", async () => {
        const resultFile = await s3Service.getFile({ from: "upload-test-01.png" });
        const doesFileExists = await resultFile.exists();
        expect(doesFileExists).toBe(false);
    });

    test("It should upload to s3", async () => {
        const fileLocation = path.resolve(__dirname, "../assets/deleted.png");
        const result = await s3Service.uploadFile({ from: fileLocation, to: "upload-test-01.png", isAbsolute: true });
        expect(result).toBe(true);
    });

    test("It should get from s3", async () => {
        const resultFile = await s3Service.getFile({ from: "upload-test-01.png" });
        const doesFileExists = await resultFile.exists();
        expect(doesFileExists).toBe(true);
    });

    test("It should delete from s3", async () => {
        const result = await s3Service.deleteFile({ from: "upload-test-01.png" });
        expect(result).toBe(true);
    });

    test("It should not get from s3", async () => {
        const resultFile = await s3Service.getFile({ from: "upload-test-01.png" });
        const doesFileExists = await resultFile.exists();
        expect(doesFileExists).toBe(false);
    });
});
