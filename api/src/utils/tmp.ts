import path from "path";
import os from "os";
import fs from "fs/promises";
import logger from "@/config/logger";

const BASE_TMP_DIR = path.join(os.tmpdir(), "feridinha-dot-com");

const paths = {
    base: BASE_TMP_DIR,
    upload: path.join(BASE_TMP_DIR, "upload"),
    preview: path.join(BASE_TMP_DIR, "preview"),
};

const ensureDirsExist = async () => {
    await fs.mkdir(paths.upload, { recursive: true });
    await fs.mkdir(paths.preview, { recursive: true });
    logger.info(`Diretório temporário: ${paths.base}`);
};

const getUploadTmpPath = (filename: string) => {
    return path.join(paths.upload, filename);
};

const getPreviewTmpPath = (filename: string) => {
    return path.join(paths.preview, filename);
};

const tmpUtils = {
    paths,
    ensureDirsExist,
    getUploadTmpPath,
    getPreviewTmpPath,
};

export default tmpUtils;
