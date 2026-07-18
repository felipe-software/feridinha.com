import { $ } from "bun";
import path from "path";
import fs from "fs/promises";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffprobePath from "@ffprobe-installer/ffprobe";
import { tryP } from "@/utils/promises";
import logger from "@/config/logger";
import tmpUtils from "@/utils/tmp";
import fsSync from "fs";
import env from "@/config/env";
import { safeFetchExternal } from "@/services/external-post/safeFetchExternal";

interface WebpGenerationResult {
    path: string;
    size: number;
    name: string;
}

export const tempPreviewDir = tmpUtils.paths.preview;

const MIN_FILE_SIZE = 1 * 1024 * 1024;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const MAX_PREVIEW_FILES = 50;

const cleanPreviewsDir = async () => {
    const files = await fs.readdir(tempPreviewDir);
    const sortedFiles = files.toSorted((a, b) => {
        const getCreatedAt = (file: string) => {
            const fileData = fsSync.statSync(path.join(tempPreviewDir, file));
            return fileData.birthtimeMs;
        };

        return getCreatedAt(b) - getCreatedAt(a);
    });

    const filesToDelete = sortedFiles.slice(MAX_PREVIEW_FILES);

    for (const file of filesToDelete) {
        logger.info`[preview/clean](1): Deletando arquivo temporário: ${file}`;
        await fs.unlink(path.join(tempPreviewDir, file));
    }
};

async function generateWebpPreview(
    filename: string,
    cdnUrl: string,
    maxSizeBytes: number = 4 * 1024 * 1024,
): Promise<WebpGenerationResult> {
    if (filename !== path.basename(filename) || !/^[\w.-]+$/.test(filename)) {
        throw new Error("Invalid preview filename");
    }
    logger.info`[preview/${filename}](1): Iniciando geração preview WebP`;

    const inputPath = path.join(tempPreviewDir, `input-${filename}`);
    const outputName = `preview-${filename}.webp`;
    const outputPath = path.join(tempPreviewDir, outputName);
    const ffmpeg = ffmpegPath.path;
    const ffprobe = ffprobePath.path;

    try {
        await fs.mkdir(tempPreviewDir, { recursive: true });
    } catch (error) {
        logger.error`[preview/${filename}](2): Erro ao criar diretório temporário: ${error}`;
    }

    const existingFile = Bun.file(outputPath);
    if (await existingFile.exists()) {
        logger.info`[preview/${filename}](3): Preview já existe, retornando cache`;
        return {
            path: outputPath,
            size: existingFile.size,
            name: outputName,
        };
    }

    const cdnHost = new URL(env.S3_RESULT_URL).hostname;
    const [downloadError, download] = await tryP(
        safeFetchExternal(cdnUrl, {
            platformHosts: [cdnHost, "localhost"],
            globalHosts: [cdnHost, "localhost"],
            maxBytes: MAX_FILE_SIZE,
            allowTestLocalhost: true,
        }),
    );
    if (downloadError) {
        logger.error`[preview/${filename}](5): Falha ao baixar vídeo: ${downloadError.message}`;
        if (downloadError.message === "body_too_large") {
            throw new Error(`File too large: exceeds ${MAX_FILE_SIZE} bytes`);
        }
        throw new Error(`Failed to download video: ${downloadError.message}`);
    }

    const buffer = download.body;
    const fileSize = buffer.length;

    if (fileSize < MIN_FILE_SIZE) {
        logger.warn`[preview/${filename}](7): Arquivo muito pequeno: ${fileSize} bytes (mínimo: ${MIN_FILE_SIZE})`;
        throw new Error(`File too small: ${fileSize} bytes (minimum: ${MIN_FILE_SIZE} bytes)`);
    }

    if (fileSize > MAX_FILE_SIZE) {
        logger.warn`[preview/${filename}](8): Arquivo muito grande: ${fileSize} bytes (máximo: ${MAX_FILE_SIZE})`;
        throw new Error(`File too large: ${fileSize} bytes (maximum: ${MAX_FILE_SIZE} bytes)`);
    }

    await Bun.write(inputPath, buffer);

    const [probeError, probeResult] = await tryP(
        $`${ffprobe} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${inputPath}`.text(),
    );

    if (probeError) {
        logger.error`[preview/${filename}](10): Erro ao obter duração do vídeo: ${probeError.message}`;
        throw new Error(`Failed to probe video: ${probeError.message}`);
    }

    const duration = parseFloat(probeResult.trim());

    const targetDuration = 5;
    const speedMultiplier = duration / targetDuration;
    const fps = 20;
    const scale = 200;
    const quality = 75;
    const maxAspectRatio = 1.5;

    logger.info`[preview/${filename}](11): Duração: ${duration}s, multiplicador: ${speedMultiplier}x`;

    const cropHeight = `if(gte(ih/iw\\,${maxAspectRatio})\\,iw*${maxAspectRatio}\\,ih)`;
    const cropY = `(ih-${cropHeight})/2`;
    const cropFilter = `crop=iw:${cropHeight}:0:${cropY}`;

    const [webpError] = await tryP(
        $`${ffmpeg} -i ${inputPath} -vf "${cropFilter},setpts=PTS/${speedMultiplier},fps=${fps},scale=${scale}:-1:flags=lanczos" -c:v libwebp -quality ${quality} -loop 0 -t 2 -y ${outputPath}`.quiet(),
    );

    if (webpError) {
        logger.error`[preview/${filename}](14): Erro ao gerar WebP: ${webpError.message}`;
        throw new Error(`Failed to generate WebP: ${webpError.message}`);
    }

    const outputFile = Bun.file(outputPath);
    logger.info`[preview/${filename}](15): Preview gerado com sucesso - ${outputFile.size} bytes`;

    await Bun.file(inputPath).delete();
    await cleanPreviewsDir();

    return {
        path: outputPath,
        size: outputFile.size,
        name: outputName,
    };
}

export const previewHandler = { generateGifPreview: generateWebpPreview };
