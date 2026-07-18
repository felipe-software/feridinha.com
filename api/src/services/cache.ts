import fs from "fs";
import fsPromises from "fs/promises";
import { Writable } from "stream";
import { Emitter } from "strict-event-emitter";
import logger from "@/config/logger";
import tmpUtils from "@/utils/tmp";

interface CacheItem {
    buffer: Buffer | null;
    name: string | null;
    stream?: Writable;
    filePath?: string | null;
}
const cache = new Map<string, CacheItem>();

type CacheEvents = {
    "cache-deleted": [CacheItem];
};

const emitter = new Emitter<CacheEvents>();

const updateKey = (key: string, data: Partial<CacheItem>) => {
    cache.set(key, { ...cache.get(key)!, ...data });
};

const MAX_BUFFER_SIZE = 1 * 1024 * 1024; // 1MB
const getStream = (key: string, extension: string = "") => {
    const chunks: Buffer[] = [];
    let streamBytes = 0;
    let fileStream: fs.WriteStream | null = null;
    let tmpFilePath: string | null = null;

    const stream = new Writable({
        write(chunk, encoding, callback) {
            if (fileStream) {
                fileStream.write(chunk, callback);
            } else {
                streamBytes += chunk.length;
                if (streamBytes > MAX_BUFFER_SIZE) {
                    tmpFilePath = tmpUtils.getUploadTmpPath(`${key}-${Date.now()}${extension}`);
                    logger.info({ key, tmpFilePath, streamBytes }, "Arquivo excedeu o tamanho máximo permitido em memória");
                    fileStream = fs.createWriteStream(tmpFilePath);
                    for (const buf of chunks) fileStream.write(buf);
                    chunks.length = 0;
                    fileStream.write(chunk, callback);
                    updateKey(key, { filePath: tmpFilePath });
                } else {
                    chunks.push(chunk);
                    callback();
                }
            }
        },
        final(callback) {
            if (fileStream) {
                // If we've fallen back to a file
                updateKey(key, { filePath: tmpFilePath });
                fileStream.end(() => {
                    callback();
                });
            } else {
                // If everything fit in memory
                const buffer = Buffer.concat(chunks);
                updateKey(key, { buffer });
                callback();
            }
        },
    });

    stream.on("error", async (err) => {
        if (tmpFilePath) {
            logger.error({ msg: "Deletando stream do /tmp", err, tmpFilePath });
            await fsPromises.rm(tmpFilePath);
            logger.info({ msg: "Arquivo /tmp deletado", tmpFilePath });
        } else {
            logger.error({ msg: "Stream deu erro porém não há cache no /tmp", err });
        }
    });

    updateKey(key, { stream });
    return stream;
};

const getCacheItem = (key: string) => cache.get(key);

const setUploadName = (key: string, name: string) => {
    updateKey(key, { name });
};

const getCacheByUploadName = (uploadName: string): CacheItem | null => {
    let target: CacheItem | null = null;
    cache.forEach((item) => {
        if (item.name === uploadName) {
            target = item;
        }
    });

    // logger.info(`${uploadName} ${target ? "" : "não"} existe em cache}`);

    return target;
};

const freeCache = async (key: string) => {
    const item = cache.get(key)!;
    const itemWithoutBuffer = item.stream ? { ...item, buffer: "[]...]" } : item;
    logger.info({ msg: "Apagando do cache", itemWithoutBuffer });
    if (item.filePath) {
        try {
            await fsPromises.rm(item.filePath);
            logger.info({ msg: "Arquivo /tmp deletado", itemWithoutBuffer });
        } catch (err) {
            logger.warn({ msg: "Não foi possível deletar tmp do arquivo com erro", err, key, itemWithoutBuffer });
        }
    }
    cache.delete(key);
    emitter.emit("cache-deleted", item);
};

const getStatus = () => {
    logger.info({
        msg: "Cache status",
        size: cache.size,
        elements: Array.from(cache.values(), (value) => value.name),
    });
};

export const cacheService = {
    getStream,
    setUploadName,
    getCacheItem,
    freeCache,
    getCacheByUploadName,
    getEmitter: () => emitter,
    getStatus,
};

setInterval(getStatus, 10 * 60 * 1000)
