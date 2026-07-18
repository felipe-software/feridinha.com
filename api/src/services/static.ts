import env from "@/config/env";
import logger from "@/config/logger";
import { previewHandler } from "@/handlers/preview";
import { cacheService } from "@/services/cache";
import database from "@/services/database";
import { tryP } from "@/utils/promises";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { NextFunction, Request, Response } from "express";
import mime from "mime-types";
import prettyBytes from "pretty-bytes";

dayjs.extend(utc);
dayjs.extend(timezone);

const safePreviewMediaTypes = ["mp4", "mkv", "webm", "avif"];

export const waitForCacheRelease = async (
    rawName: string,
    context: { contentType: string | false; isChatterinoResolver: boolean },
    timeoutMs = 4000,
    pollMs = 50,
) => {
    let totalTime = 0;
    await new Promise<void>((resolve) => {
        const intervalId = setInterval(() => {
            totalTime += pollMs;
            if (totalTime > timeoutMs) {
                logger.error({
                    msg: "Não foi possível resolver o cache dentro do prazo",
                    rawName,
                    cacheItem: cacheService.getCacheByUploadName(rawName),
                    ...context,
                });
                clearInterval(intervalId);
                resolve();
                return;
            }
            const newCacheStatus = cacheService.getCacheByUploadName(rawName);
            if (!newCacheStatus) {
                logger.info({ msg: `Cache status atualizado depois de ${totalTime}`, rawName, ...context });
                clearInterval(intervalId);
                resolve();
            }
        }, pollMs);
    });
};

export const getPreviewContent = async (
    rawName: string,
    contentType: string | false,
): Promise<Record<string, any> | null> => {
    const contentTypeFormatted = contentType || "unknown";
    const upload = await database.upload.findUnique({ where: { name: rawName }, include: { user: true } });

    if (!upload) return null;

    const ext = upload.name.split(".").pop();
    const cdnUrl = env.S3_RESULT_URL + "/" + rawName;
    let customPreviewUrl: string | null = null;
    if (ext && safePreviewMediaTypes.includes(ext)) {
        const [previewError, customPreview] = await tryP(previewHandler.generateGifPreview(upload.name, cdnUrl));
        if (previewError) {
            logger.error`[preview/${upload.name}](16): Erro ao gerar preview customizado: ${previewError.message}`;
        } else {
            customPreviewUrl = env.IMAGE_PREFIX_URL + "p/" + customPreview.name;
        }
    }

    return {
        title: upload.name,
        cdnUrl: `${customPreviewUrl ?? cdnUrl}?chatterino`,
        size: `${prettyBytes(upload.size, { space: false })}`,
        contentType: contentTypeFormatted,
        createdAt: dayjs(upload.createdAt).tz("America/Sao_Paulo").format("HH:mm DD/MM/YYYY"),
        extraTitle: upload.user?.name ? `• Criado por @${upload.user.name}` : "• Criado por usuário anônimo",
    };
};

const middleware = async (req: Request, res: Response, next: NextFunction) => {
    const rawName = req.url.slice(1, req.url.length) as string;
    const contentType = mime.lookup(rawName);

    const isChatterinoResolver = Boolean(
        req.headers["user-agent"]?.startsWith("chatterino-api-cache") &&
            req.headers["user-agent"].endsWith("link-resolver"),
    );
    const safeName = rawName.replace(/[^\w.-]/g, "_");


    if (isChatterinoResolver) {
        const previewContent = await getPreviewContent(safeName, contentType);
        if (previewContent) {
            return res.render("preview", previewContent);
        }
    }
    const cacheItem = cacheService.getCacheByUploadName(rawName);
    if (cacheItem?.stream || cacheItem?.buffer) {
        await waitForCacheRelease(rawName, { contentType, isChatterinoResolver });
    }

    res.status(302).setHeader("Location", `${env.S3_RESULT_URL}/${rawName}`);

    return res.end();
};

const staticServe = { middleware };

export default staticServe;
