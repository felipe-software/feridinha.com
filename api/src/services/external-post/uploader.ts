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

export function extFromContentType(contentType: string): string {
    const base = contentType.split(";")[0].trim().toLowerCase();
    const extension = CONTENT_TYPE_TO_EXT[base];
    if (!extension) throw new Error("Unsupported external content type");
    return extension;
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
    const result = await fetcher(parsed.contentUrl, {
        platformHosts: PLATFORM_MEDIA_HOSTS[platform],
        maxBytes: MAX_BYTES,
    });
    const contentType = result.contentType ?? "";
    const ext = extFromContentType(contentType);
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

export const externalPostUploader = { uploadExternalPost };
