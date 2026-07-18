import fs from "fs/promises";
import path from "path";
import { tryP } from "./promises";
import fsExtra from "fs-extra";
import env from "@/config/env";
import logger from "@/config/logger";

const getUploadFilePath = (filename: string) => {
    const d = path.resolve(env.UPLOAD_PATH, filename);
    return d;
};

const checkIfFileExists = async (filename: string) => {
    const file = Bun.file(filename);
    return file.exists();
};

const moveFile = async (originPath: string, targetPath: string) => {
    const [error, result] = await tryP(fsExtra.move(originPath, targetPath));
    if (error) console.log({ error, originPath, targetPath });
    if (error) return false;
    return true;
};

const writeFileFromBuffer = async (buffer: Buffer, targetPath: string) => {
    const [error, result] = await tryP(fsExtra.writeFile(targetPath, buffer));
    if (error) {
        logger.error({ msg: "Erro ao salvar arquivo", error, targetPath });
        return;
    }

    return true;
};

const deleteFile = async (path: string, { surpressError = false } = {}) => {
    const [error, result] = await tryP(fsExtra.unlink(path));
    if(error && "code" in error && error.code === "ENOENT") return true;
    if (error && !surpressError) {
        logger.error({ msg: "Erro ao deletar arquivo", error, path });
        return false;
    }

    return true;
};

const fileUtils = { checkIfFileExists, getUploadFilePath, moveFile, writeFileFromBuffer, deleteFile };

export default fileUtils;
