import logger from "@/config/logger";
import constants from "@/constants";
import fileUtils from "@/utils/file";
import { tryP } from "@/utils/promises";
import { DefaultExiftoolArgs, DefaultExifToolOptions, ExifTool } from "exiftool-vendored";
import path from "path";

const exiftool = new ExifTool({
    ...DefaultExifToolOptions,
    exiftoolArgs: ["-overwrite_original_in_place", "-stay_open", "True", "-@", "-"],
});

export type UploadErrorType = {
    message: string;
    code: string;
    statusCode: number;
};

const filterUpload = ({
    originalFilename,
    fieldName,
}: {
    originalFilename: string | null;
    fieldName: string | null;
}): null | UploadErrorType => {
    let error: UploadErrorType | null = null;

    if (!fieldName || fieldName !== "file") {
        error = { code: "wrong_form_field", message: "Form field deve ser 'file'", statusCode: 400 };
        return error;
    }

    const extension = originalFilename?.split(".").at(-1);
    const isExtensionAllowed = extension && constants.whitelistedExtensions.includes("." + extension);
    if (!isExtensionAllowed) {
        error = { code: "extension_not_allowed", message: "Extensão não permitida", statusCode: 415 };
        return error;
    }

    return null;
};

export interface UploadNameResult {
    filename: string;
    filenameWithPath: string;
}

let iteration = 0;

const generateUploadName = async (originalName: string): Promise<UploadNameResult> => {
    const extension = path.extname(originalName);
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    result += extension;

    const fileWithPath = fileUtils.getUploadFilePath(result);
    const doesFileAlreadyExists = await fileUtils.checkIfFileExists(fileWithPath);
    if (doesFileAlreadyExists) {
        logger.warn({ filename: result, iteration }, "Arquivo já existe");
        iteration += 1;
        return generateUploadName(originalName);
    }
    return { filename: result, filenameWithPath: fileWithPath };
};

const generateAlbumName = async (): Promise<string> => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";
    for (let i = 0; i < 12; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
};

const stripMetadata = async (
    tempPath: string,
    tool: Pick<ExifTool, "deleteAllTags"> = exiftool,
) => {
    logger.info({ msg: "Starting exiftool", tempPath });
    const response = await tool
        .deleteAllTags(tempPath, { retain: ["Orientation"] })
        .then((data) => {
            return true;
        })
        .catch((error) => {
            logger.error({ msg: "Falha no exiftool", tempPath, error: error.message });
            return true;
        });

    tryP(fileUtils.deleteFile(tempPath + "_original", { surpressError: true }));
    return response;
};

const uploadUtils = { filterUpload, generateUploadName, stripMetadata, generateAlbumName };
export default uploadUtils;
