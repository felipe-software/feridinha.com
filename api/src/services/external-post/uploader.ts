import logger from "@/config/logger";
import { s3Service } from "@/services/s3";
import fileUtils from "@/utils/file";
import tmpUtils from "@/utils/tmp";
import type { RedditParsed } from "@/validations/externalPostParsed";
import { myEnv } from "@/config/env";
import { PLATFORM_MEDIA_HOSTS, PROXY_DOMAINS } from "@/services/external-post/constants";
import { safeFetchExternal } from "@/services/external-post/safeFetchExternal";

const MAX_BYTES = 100 * 1024 * 1024;

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogg",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
};

const EXT_TO_CONTENT_TYPE: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
};

export function extFromContentType(contentType: string): string {
    const base = contentType.split(";")[0].trim().toLowerCase();
    const extension = CONTENT_TYPE_TO_EXT[base];
    if (!extension) throw new Error("Unsupported external content type");
    return extension;
}

const safeExtensionFromFilename = (filename?: string | null): string | null => {
    if (!filename) return null;
    const basename = filename.trim().replace(/^['"]|['"]$/g, "").split(/[\\/]/).at(-1) ?? "";
    const extension = basename.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    return extension && EXT_TO_CONTENT_TYPE[extension] ? extension : null;
};

export const filenameFromContentDisposition = (contentDisposition?: string | null): string | null => {
    if (!contentDisposition) return null;

    const encoded = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
    if (encoded) {
        const value = encoded.includes("''") ? encoded.slice(encoded.indexOf("''") + 2) : encoded;
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }

    return contentDisposition.match(/filename\s*=\s*("[^"]*"|[^;]+)/i)?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? null;
};

export const resolveExternalMediaType = (
    contentType?: string | null,
    contentDisposition?: string | null,
    finalUrl?: URL,
): { extension: string; contentType: string } => {
    const normalizedContentType = (contentType ?? "").split(";")[0].trim().toLowerCase();
    const contentTypeExtension = CONTENT_TYPE_TO_EXT[normalizedContentType];
    if (contentTypeExtension) {
        return { extension: contentTypeExtension, contentType: normalizedContentType };
    }

    const dispositionExtension = safeExtensionFromFilename(filenameFromContentDisposition(contentDisposition));
    const finalUrlExtension = safeExtensionFromFilename(finalUrl?.pathname);
    const extension = dispositionExtension ?? finalUrlExtension;
    if (!extension) throw new Error("Unsupported external content type");

    return { extension, contentType: EXT_TO_CONTENT_TYPE[extension] };
};

export interface ExternalMediaDownload {
    body: Buffer;
    contentType: string;
    extension: string;
    size: number;
}

export async function downloadExternalMedia(
    parsed: RedditParsed,
    platform: keyof typeof PROXY_DOMAINS,
    maxBytes = MAX_BYTES,
    fetcher: typeof safeFetchExternal = safeFetchExternal,
): Promise<ExternalMediaDownload> {
    const result = await fetcher(parsed.contentUrl, {
        hostPolicy: { mode: "initial-only", hosts: PLATFORM_MEDIA_HOSTS[platform] },
        maxBytes,
    });
    const mediaType = resolveExternalMediaType(result.contentType, result.contentDisposition, result.finalUrl);

    return {
        body: result.body,
        contentType: mediaType.contentType,
        extension: mediaType.extension,
        size: result.body.byteLength,
    };
}

export async function uploadExternalPost(
    parsed: RedditParsed,
    postId: string,
    platform: keyof typeof PROXY_DOMAINS,
    dependencies: {
        fetcher?: typeof safeFetchExternal;
        writeFile?: typeof fileUtils.writeFileFromBuffer;
        uploadFile?: typeof s3Service.uploadFile;
        deleteFile?: typeof fileUtils.deleteFile;
        now?: () => number;
    } = {},
): Promise<string> {
    const fetcher = dependencies.fetcher ?? safeFetchExternal;
    const writeFile = dependencies.writeFile ?? fileUtils.writeFileFromBuffer;
    const uploadFile = dependencies.uploadFile ?? s3Service.uploadFile;
    const deleteFile = dependencies.deleteFile ?? fileUtils.deleteFile;
    const result = await downloadExternalMedia(parsed, platform, MAX_BYTES, fetcher);
    const ext = result.extension;
    const s3Key = `mural/${postId}_1.${ext}`;
    const tempFilename = `mural_upload_${postId}_${(dependencies.now ?? Date.now)()}.${ext}`;
    const tempPath = tmpUtils.getUploadTmpPath(tempFilename);

    try {
        await writeFile(result.body, tempPath);
        await uploadFile({ from: tempPath, to: s3Key, isAbsolute: true });
    } finally {
        await deleteFile(tempPath, { surpressError: true });
    }

    const resultUrl = `${myEnv.S3_RESULT_URL}/${s3Key}`;

    logger.info({ msg: "[external-post/uploader] Upload complete", postId, s3Key, resultUrl });

    return resultUrl;
}

export const externalPostUploader = { downloadExternalMedia, uploadExternalPost };
