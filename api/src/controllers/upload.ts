import cryptography from "@/config/cryptography";
import env, { myEnv } from "@/config/env";
import logger from "@/config/logger";
import constants from "@/constants";
import achievements from "@/handlers/achievements";
import { cacheService } from "@/services/cache";
import cloudflare from "@/services/cloudflare";
import database from "@/services/database";
import { externalPostParser } from "@/services/external-post/parser";
import { externalPostResolver } from "@/services/external-post/resolver";
import { SafeFetchError } from "@/services/external-post/safeFetchExternal";
import { externalPostUploader } from "@/services/external-post/uploader";
import posthog from "@/services/posthog";
import { s3Service } from "@/services/s3";
import fileUtils from "@/utils/file";
import { tryP } from "@/utils/promises";
import tmpUtils from "@/utils/tmp";
import uploadUtils, { UploadErrorType, UploadNameResult } from "@/utils/upload";
import { uploadLinkSchema } from "@/validations/upload";
import { DeleteCodeVersion, Upload, UserRole } from "@prisma/client";
import crypto from "crypto";
import { Request, RequestHandler } from "express";
import formidable, { Fields, File, Files } from "formidable";
import mimetype from "mime-types";
import path from "path";
import { z } from "zod";

export const translateUploadError = (req: Request, code?: string, fallbackMessage?: string, userLimitMb?: number) => {
    switch (code) {
        case "wrong_form_field":
            return req.t("upload.wrongFormField");
        case "extension_not_allowed":
            return req.t("upload.extensionNotAllowed");
        case "bad_request":
            return req.t("upload.badRequest");
        case "max_file_size_reached":
            return req.t("upload.maxFileSizeReached", { mb: userLimitMb });
        default:
            return fallbackMessage ?? req.t("common.internalError");
    }
};

export const saveUserUploadAndAchievements =
    ({
        user,
        uploadName,
        uploadSize,
        mimeType,
        userAgent,
        deleteCode,
    }: {
        user?: Required<Request["session"]["user"]>;
        uploadName: UploadNameResult;
        uploadSize: number;
        mimeType?: string;
        userAgent?: string;
        deleteCode: string;
    }) =>
    async () => {
        logger.info({
            msg: "Salvando informações de upload",
            user: user?.name ?? "anonymous",
            uploadName: uploadName.filename,
        });
        if (user) {
            await achievements.handleUpdate(
                user,
                { context: "upload", uploadSize },
                { uploadCount: { increment: 1 } },
            );
        }
        const data = {
            name: uploadName.filename,
            size: uploadSize,
            mimeType: mimeType ?? (mimetype.lookup(uploadName.filename) || "application/octet-stream"),
            userId: user?.id,
            userAgent,
        } as Upload;
        const [dbError, dbData] = await tryP(
            database.upload.create({
                data: { ...data, deleteCode: (deleteCode as DeleteCodeVersion)!, deleteCodeVersion: "LEGACY" },
            }),
        );

        if (dbError) {
            logger.error({ msg: "Falha ao salvar upload no database", error: dbError });
            return false;
        }
        return true;
    };

const parseForm = (req: any, streamUUID: string, userLimit: number): Promise<Files> =>
    new Promise((resolve, reject) => {
        let uploadError: UploadErrorType | null = null;
        const form = formidable({
            maxFields: 1,
            maxFiles: 1,
            allowEmptyFiles: false,
            maxFileSize: userLimit,
            fileWriteStreamHandler: (file) => {
                const originalFilename = (file as { originalFilename?: string })?.originalFilename;
                const ext = originalFilename ? path.extname(originalFilename) : "";
                return cacheService.getStream(streamUUID, ext);
            },
            filter: (part) => {
                if (uploadError) return false;
                const err = uploadUtils.filterUpload({ originalFilename: part.originalFilename, fieldName: part.name });
                if (!err) return true;
                uploadError = err;
                return false;
            },
        });

        form.on("error", async (err) => {
            if (uploadError) return reject(uploadError);
            if ((err as any).code === 1009) {
                const mb = userLimit / 1024 / 1024;
                return reject({
                    code: "max_file_size_reached",
                    message: `Esse arquivo é maior que ${mb}mb`,
                    statusCode: 413,
                });
            }
            reject({ code: "internal_server_error", message: "Erro interno do servidor", statusCode: 500 });
        });

        form.parse(req, (err, _fields: Fields, files: Files) => {
            if (uploadError) reject(uploadError);
            if (err) return reject(err); // handled by "error"
            if (!files.file) return reject({ code: "bad_request", message: "Bad request", statusCode: 400 });
            resolve(files);
        });
    });

const handleUpload: RequestHandler = async (req, res) => {
    const streamUUID = crypto.randomUUID();
    const userRole = req.session?.user?.role ?? UserRole.ANONYMOUS;
    const userLimit = constants.upload.fileLimitPerRole[userRole];
    const userAgent = req.headers["user-agent"];
    const userId = req.session?.user?.id ?? "anonymous";
    let cleanupFiles: string[] = [];
    let file: File | undefined;
    try {
        const files = await parseForm(req, streamUUID, userLimit);
        file = (files.file as File[])[0];
        const cacheItem = cacheService.getCacheItem(streamUUID);
        const inMemory = !!cacheItem?.buffer && !cacheItem.filePath;
        const filePath = cacheItem?.filePath ?? file.filepath;

        if (cacheItem?.filePath) cleanupFiles.push(cacheItem.filePath);
        if (file?.filepath) cleanupFiles.push(file.filepath);

        const uploadName = await uploadUtils.generateUploadName(file.originalFilename!);
        cacheService.setUploadName(streamUUID, uploadName.filename);
        const deleteCode = await cryptography.encryptLegacyDeletionCode(uploadName.filename);
        if (!deleteCode) return res.error(req.t("upload.processedUploadError"));

        const time = performance.now() - req.perfomanceStart;

        res.send({
            success: true,
            message: `${env.IMAGE_PREFIX_URL}${uploadName.filename}`,
            delete: `${env.CLIENT_URL}/delete/${deleteCode}`,
            filename: uploadName.filename,
            code: "new_upload_created",
            mimeType: mimetype.lookup(uploadName.filename),
            optimized: inMemory,
            time,
        });

        posthog.capture(userId, "upload_success", {
            file_size: file.size,
            file_extension: path.extname(file.originalFilename ?? uploadName.filename),
            processing_time_ms: time,
        });

        if (inMemory) {
            const written = await fileUtils.writeFileFromBuffer(cacheItem!.buffer!, filePath);
            if (!written) return res.error(req.t("upload.processedUploadError"));
        }

        const isMetadataStripped = await uploadUtils.stripMetadata(filePath);
        await s3Service.uploadFile({ from: filePath, to: uploadName.filename });
        cacheService.freeCache(streamUUID);

        logger.info({
            meta: { name: uploadName.filename, author: req.session.user?.name || "anonymous" },
            msg: `Upload finalizado ${uploadName.filename}`,
            isMetadataStripped,
            inMemory,
        });

        Promise.resolve().then(async () => {
            await saveUserUploadAndAchievements({
                deleteCode,
                uploadSize: file!.size,
                uploadName,
                userAgent,
                user: req.session.user,
            })();
        });
    } catch (err: any) {
        posthog.capture(userId, "upload_error", {
            error_code: err.code ?? "unknown",
            ...(file && {
                file_size: file.size,
                file_extension: path.extname(file.originalFilename ?? ""),
            }),
        });
        await cacheService.freeCache(streamUUID).catch(() => {});
        return res
            .status(err.statusCode ?? 500)
            .error(translateUploadError(req, err.code, err.message, userLimit / 1024 / 1024), err.code);
    } finally {
        for (let tmpFile of cleanupFiles) {
            const [err, result] = await tryP(fileUtils.deleteFile(tmpFile));
            logger.info(`Arquivo temporário ${tmpFile} deletado ${result}`);
        }
    }
};

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

    try {
        let html: string;
        try {
            html = await externalPostResolver.resolveHtml(link);
        } catch (error) {
            captureError("resolve", error);
            return res.status(502).error(req.t("upload.externalLinkFetchFailed"), "external_link_fetch_failed");
        }

        let parsed: Awaited<ReturnType<typeof externalPostParser.parse>>;
        try {
            parsed = await externalPostParser.parse(platform, html);
            if (!parsed) throw new Error("External post parser returned no media");
        } catch (error) {
            captureError("parse", error);
            return res.status(422).error(req.t("upload.externalLinkParseFailed"), "external_link_parse_failed");
        }

        let media: Awaited<ReturnType<typeof externalPostUploader.downloadExternalMedia>>;
        try {
            media = await externalPostUploader.downloadExternalMedia(parsed, platform, userLimit);
        } catch (error) {
            captureError("download", error);
            if (error instanceof SafeFetchError && error.code === "body_too_large") {
                return res
                    .status(413)
                    .error(
                        req.t("upload.maxFileSizeReached", { mb: userLimit / 1024 / 1024 }),
                        "max_file_size_reached",
                    );
            }
            if (error instanceof Error && error.message === "Unsupported external content type") {
                return res
                    .status(415)
                    .error(req.t("upload.externalContentTypeUnsupported"), "external_content_type_unsupported");
            }
            return res.status(502).error(req.t("upload.externalLinkFetchFailed"), "external_link_fetch_failed");
        }

        const uploadName = await uploadUtils.generateUploadName(`social.${media.extension}`);
        const deleteCode = await cryptography.encryptLegacyDeletionCode(uploadName.filename);
        if (!deleteCode) {
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        tempPath = tmpUtils.getUploadTmpPath(`external_upload_${crypto.randomUUID()}.${media.extension}`);
        const written = await fileUtils.writeFileFromBuffer(media.body, tempPath);
        if (!written) {
            captureError("metadata", new Error("Could not write external media to temporary storage"));
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        try {
            await uploadUtils.stripMetadata(tempPath);
        } catch (error) {
            captureError("metadata", error);
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        try {
            const uploaded = await s3Service.uploadFile({ from: tempPath, to: uploadName.filename, isAbsolute: true });
            if (!uploaded) throw new Error("S3 upload returned false");
            uploadedFilename = uploadName.filename;
        } catch (error) {
            captureError("s3", error);
            return res.status(500).error(req.t("upload.processedUploadError"), "processed_upload_error");
        }

        try {
            const saved = await saveUserUploadAndAchievements({
                deleteCode,
                uploadSize: media.size,
                mimeType: media.contentType,
                uploadName,
                userAgent,
                user: req.session.user,
            })();
            if (!saved) throw new Error("Could not persist external upload");
        } catch (error) {
            captureError("database", error);
            await s3Service.deleteFile({ from: uploadName.filename }).catch(() => {});
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
    } finally {
        if (tempPath) await fileUtils.deleteFile(tempPath, { surpressError: true });
        if (uploadedFilename) {
            logger.info({ msg: "Upload externo finalizado", upload: uploadedFilename, platform, user: userId });
        }
    }
};

const deleteUpload: RequestHandler = async (req, res) => {
    const { encryptedFilename } = req.params;
    const target = await database.upload.findUnique({ where: { deleteCode: encryptedFilename } });

    if (!target) return res.status(404).error(req.t("upload.invalidDeleteLink"));
    if (target.deletedAt) return res.status(400).error(req.t("upload.fileAlreadyDeleted"));
    if (target.deleteCodeVersion !== "LEGACY") return res.status(400).error(req.t("upload.invalidDeleteCode"));

    const name = await cryptography.decryptLegacyDeletionCode(encryptedFilename);
    if (name !== target.name) return res.status(400).error(req.t("upload.invalidDeleteCode"));

    await database.upload.update({ where: { name: target.name }, data: { deletedAt: new Date() } });
    const [delErr] = await tryP(s3Service.deleteFile({ from: target.name }));
    if (delErr) {
        logger.error({ msg: "Erro ao deletar arquivo (s3)", delErr });
        return res.status(500).error(req.t("upload.deleteCdnError"));
    }

    const [repErr] = await tryP(s3Service.uploadFile({ from: myEnv.DELETE_REPLACER_PATH, to: target.name }));
    if (repErr) {
        logger.error({ msg: "Erro ao deletar arquivo (cache)", repErr });
        return res.status(500).error(req.t("upload.deleteCacheError"));
    }

    await cloudflare.purgeCacheFromCdn(target.name);
    logger.info({
        msg: "Arquivo deletado com sucesso",
        user: req.session.user?.name || "anonymous",
        upload: target.name,
    });
    return res.success(req.t("upload.fileDeleted"), target);
};

export default { handleUpload, handleLinkUpload, deleteUpload };
