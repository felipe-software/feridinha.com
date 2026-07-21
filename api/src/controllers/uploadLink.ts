import cryptography from "@/config/cryptography";
import env from "@/config/env";
import logger from "@/config/logger";
import constants from "@/constants";
import { saveUserUploadAndAchievements } from "@/controllers/upload";
import { externalPostParser } from "@/services/external-post/parser";
import { externalPostResolver } from "@/services/external-post/resolver";
import { SafeFetchError } from "@/services/external-post/safeFetchExternal";
import { externalPostUploader } from "@/services/external-post/uploader";
import posthog from "@/services/posthog";
import { s3Service } from "@/services/s3";
import fileUtils from "@/utils/file";
import { tryP } from "@/utils/promises";
import tmpUtils from "@/utils/tmp";
import uploadUtils from "@/utils/upload";
import { uploadLinkSchema } from "@/validations/upload";
import { UserRole } from "@prisma/client";
import crypto from "crypto";
import type { RequestHandler } from "express";
import type { z } from "zod";

type LinkUploadStage = "resolve" | "parse" | "download" | "metadata" | "s3" | "database";

const handleLinkUpload: RequestHandler = async (req, res) => {
    const { link } = req.body as z.infer<typeof uploadLinkSchema>;
    const platform = externalPostResolver.detectPlatform(link);
    const userRole = req.session?.user?.role ?? UserRole.ANONYMOUS;
    const userLimit = constants.upload.fileLimitPerRole[userRole];
    const userId = req.session?.user?.id ?? "anonymous";
    const userAgent = req.headers["user-agent"];
    const startedAt = performance.now();
    let tempPath: string | undefined;
    let uploadedFilename: string | undefined;
    let currentStage: LinkUploadStage = "resolve";

    const captureError = (stage: LinkUploadStage, error: unknown) => {
        logger.error({ msg: "Falha ao importar link externo", stage, platform, link, error });
        posthog.capture(userId, "upload_error", {
            upload_source: "social_link",
            platform,
            error_stage: stage,
            error_code: error instanceof SafeFetchError ? error.code : "unknown",
        });
    };

    if (!platform) {
        posthog.capture(userId, "upload_error", {
            upload_source: "social_link",
            error_stage: "resolve",
            error_code: "link_platform_unknown",
        });
        return res.status(400).error(req.t("upload.linkPlatformUnknown"), "link_platform_unknown");
    }

    const processUpload = async () => {
        currentStage = "resolve";
        const [resolveError, html] = await tryP(externalPostResolver.resolveHtml(link));
        if (resolveError) {
            captureError("resolve", resolveError);
            return res.status(502).error(req.t("upload.externalLinkFetchFailed"), "external_link_fetch_failed");
        }

        currentStage = "parse";
        const [parseError, parsed] = await tryP(externalPostParser.parse(platform, html));
        if (parseError || !parsed) {
            captureError("parse", parseError ?? new Error("External post parser returned no media"));
            return res.status(422).error(req.t("upload.externalLinkParseFailed"), "external_link_parse_failed");
        }

        currentStage = "download";
        const [downloadError, media] = await tryP(
            externalPostUploader.downloadExternalMedia(parsed, platform, userLimit),
        );
        if (downloadError) {
            captureError("download", downloadError);
            if (downloadError instanceof SafeFetchError && downloadError.code === "body_too_large") {
                return res
                    .status(413)
                    .error(
                        req.t("upload.maxFileSizeReached", { mb: userLimit / 1024 / 1024 }),
                        "max_file_size_reached",
                    );
            }
            if (downloadError.message === "Unsupported external content type") {
                return res
                    .status(415)
                    .error(req.t("upload.externalContentTypeUnsupported"), "external_content_type_unsupported");
            }
            return res.status(502).error(req.t("upload.externalLinkFetchFailed"), "external_link_fetch_failed");
        }

        currentStage = "metadata";
        const [uploadNameError, uploadName] = await tryP(
            uploadUtils.generateUploadName(`social.${media.extension}`),
        );
        if (uploadNameError) {
            captureError("metadata", uploadNameError);
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        const [deleteCodeError, deleteCode] = await tryP(
            cryptography.encryptLegacyDeletionCode(uploadName.filename),
        );
        if (deleteCodeError || !deleteCode) {
            captureError("metadata", deleteCodeError ?? new Error("Could not generate deletion code"));
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        tempPath = tmpUtils.getUploadTmpPath(`external_upload_${crypto.randomUUID()}.${media.extension}`);

        const [writeError, written] = await tryP(fileUtils.writeFileFromBuffer(media.body, tempPath));
        if (writeError || !written) {
            captureError("metadata", writeError ?? new Error("Could not write external media to temporary storage"));
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        const [metadataError] = await tryP(uploadUtils.stripMetadata(tempPath));
        if (metadataError) {
            captureError("metadata", metadataError);
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        currentStage = "s3";
        const [s3Error, uploaded] = await tryP(
            s3Service.uploadFile({ from: tempPath, to: uploadName.filename, isAbsolute: true }),
        );
        if (s3Error || !uploaded) {
            captureError("s3", s3Error ?? new Error("S3 upload returned false"));
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }
        uploadedFilename = uploadName.filename;

        currentStage = "database";
        const [databaseError, saved] = await tryP(
            saveUserUploadAndAchievements({
                deleteCode,
                uploadSize: media.size,
                mimeType: media.contentType,
                uploadName,
                userAgent,
                user: req.session.user,
            })(),
        );
        if (databaseError || !saved) {
            captureError("database", databaseError ?? new Error("Could not persist external upload"));
            await tryP(s3Service.deleteFile({ from: uploadName.filename }));
            uploadedFilename = undefined;
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        const time = performance.now() - startedAt;
        posthog.capture(userId, "upload_success", {
            upload_source: "social_link",
            platform,
            file_size: media.size,
            file_extension: `.${media.extension}`,
            processing_time_ms: time,
        });

        return res.send({
            success: true,
            message: `${env.IMAGE_PREFIX_URL}${uploadName.filename}`,
            delete: `${env.CLIENT_URL}/delete/${deleteCode}`,
            filename: uploadName.filename,
            code: "new_upload_created",
            mimeType: media.contentType,
            size: media.size,
            sourcePlatform: platform,
            optimized: false,
            time,
        });
    };

    const [processError, response] = await tryP(processUpload());
    if (tempPath) await tryP(fileUtils.deleteFile(tempPath, { surpressError: true }));
    if (uploadedFilename) {
        logger.info({ msg: "Upload externo finalizado", upload: uploadedFilename, platform, user: userId });
    }

    if (processError) {
        captureError(currentStage, processError);
        if (res.headersSent) return res;
        return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
    }

    return response;
};

export default { handleLinkUpload };
