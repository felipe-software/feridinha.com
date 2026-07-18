import { myEnv } from "@/config/env";
import fileUtils from "@/utils/file";
import bun from "bun";

const s3Client = new bun.S3Client({
    region: myEnv.S3_REGION,
    endpoint: myEnv.S3_ENDPOINT,
    accessKeyId: myEnv.S3_ACCESS_KEY_ID,
    secretAccessKey: myEnv.S3_SECRET_ACCESS_KEY,
    acl: "public-read",
    bucket: myEnv.S3_BUCKET,
});

const uploadFile = async ({ from, to, isAbsolute = false }: { from: string; to: string; isAbsolute?: boolean }): Promise<boolean> => {
    const fileWithPath = isAbsolute ? from : fileUtils.getUploadFilePath(from);
    const file = bun.file(fileWithPath);

    const result = await s3Client.write(to, file, { acl: "public-read" });

    return result === 0;
};

const deleteFile = async ({ from }: { from: string }) => {
    const file = s3Client.file(from);
    await file.delete();
    return true;
};

const getFile = async ({ from }: { from: string }) => {
    const file = s3Client.file(from);
    
    return file;
};

export const s3Service = { uploadFile, getFile, deleteFile };
