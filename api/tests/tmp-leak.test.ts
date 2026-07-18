import { describe, test, expect } from "bun:test";
import { execSync } from "child_process";
import path from "node:path";
import { baseURL } from "./setup";
import tmpUtils from "@/utils/tmp";

const UPLOADS_PER_FILE = 50;
const UPLOAD_TMP_DIR = tmpUtils.paths.upload;

const files = [
    { name: "inside-limit.jpg", file: Bun.file(path.resolve(__dirname, "./assets/inside-limit.jpg")) },
    { name: "outside-limit.png", file: Bun.file(path.resolve(__dirname, "./assets/outside-limit.png")) },
    { name: "magrelo.mp4", file: Bun.file(path.resolve(__dirname, "./assets/magrelo.mp4")) },
];

const TOTAL_UPLOADS = files.length * UPLOADS_PER_FILE;

const countTempFiles = () => {
    try {
        const result = execSync(`ls "${UPLOAD_TMP_DIR}" 2>/dev/null | wc -l`, { encoding: "utf-8" });
        return parseInt(result.trim(), 10);
    } catch {
        return 0;
    }
};

const listTempFiles = () => {
    try {
        return execSync(`ls -la "${UPLOAD_TMP_DIR}" 2>/dev/null`, { encoding: "utf-8" });
    } catch {
        return "(nenhum arquivo)";
    }
};

describe("Temp file leak test", () => {
    test("should not leak temp files in upload tmp dir", async () => {
        const tempFilesBefore = countTempFiles();
        console.log(`Arquivos em ${UPLOAD_TMP_DIR} ANTES: ${tempFilesBefore}`);
        console.log(listTempFiles());

        console.log(`\nIniciando ${TOTAL_UPLOADS} uploads (${UPLOADS_PER_FILE} de cada arquivo)...\n`);

        let successCount = 0;
        let errorCount = 0;
        let uploadIndex = 0;

        for (const { name, file } of files) {
            console.log(`\nFazendo upload ${UPLOADS_PER_FILE}x ${name}...`);
            
            for (let i = 0; i < UPLOADS_PER_FILE; i++) {
                uploadIndex++;
                const form = new FormData();
                form.append("file", file);

                try {
                    const res = await fetch(`${baseURL}/upload`, { method: "POST", body: form });
                    if (res.ok) {
                        successCount++;
                        process.stdout.write(`\r  [${name}] ${i + 1}/${UPLOADS_PER_FILE} - OK`);
                    } else {
                        errorCount++;
                        process.stdout.write(`\r  [${name}] ${i + 1}/${UPLOADS_PER_FILE} - FAIL ${res.status}`);
                    }
                } catch (err: unknown) {
                    errorCount++;
                    const message = err instanceof Error ? err.message : "Unknown error";
                    process.stdout.write(`\r  [${name}] ${i + 1}/${UPLOADS_PER_FILE} - ERROR: ${message}`);
                }
            }
        }

        console.log("\n");
        console.log("Aguardando cleanup dos uploads...");

        const maxWaitTime = 60000;
        const pollInterval = 1000;
        let waited = 0;
        let tempFilesAfter = countTempFiles();

        while (tempFilesAfter > tempFilesBefore && waited < maxWaitTime) {
            await Bun.sleep(pollInterval);
            waited += pollInterval;
            tempFilesAfter = countTempFiles();
            process.stdout.write(`\r  Aguardando... ${waited / 1000}s (${tempFilesAfter} arquivos restantes)`);
        }

        console.log("\n");
        console.log(`Arquivos em ${UPLOAD_TMP_DIR} DEPOIS: ${tempFilesAfter}`);
        console.log(listTempFiles());

        const leaked = tempFilesAfter - tempFilesBefore;
        console.log(`\nRESULTADO:`);
        console.log(`  - Uploads: ${TOTAL_UPLOADS} (${successCount} success, ${errorCount} errors)`);
        console.log(`  - Arquivos vazados: ${leaked}`);

        expect(leaked).toBe(0);
    }, 120000);
});

