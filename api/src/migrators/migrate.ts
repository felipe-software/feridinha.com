import { myEnv } from "@/config/env";
import logger from "@/config/logger";
import { baseAchievements } from "@/handlers/achievements";
import database from "@/services/database";
import { s3Service } from "@/services/s3";
import fs from "fs/promises";
import achievements from "@/handlers/achievements";
import crypto from "crypto"
await achievements.init();

const handleUploadImage = async (file: string) => {
    const uuid = crypto.randomUUID();
    const targetS3Path = `assets/achievements/${uuid}.${file.split(".").at(-1)}`;
    logger.info(`Migrando ${file}`);
    const uploadResult = await s3Service.uploadFile({
        from: `./assets/achievements/${file}`,
        to: targetS3Path,
        isAbsolute: true,
    });

    if (uploadResult) {
        return `${myEnv.S3_RESULT_URL}/${targetS3Path}`;
    }

    return false;
};

const migrateImages = async () => {
    const achievementsFilesAll = await fs.readdir("./assets/achievements");

    const achievementsFiles: string[] = [];

    for (const file of achievementsFilesAll) {
        if (file.split(".").at(-1) === "jpg") return achievementsFiles.push(file);
        if (file.split(".").at(-1) === "png") achievementsFiles.push(file);
    }

    const achievements = baseAchievements;

    for (const achievement of achievements) {
        const targetFilename = achievementsFiles.find((filename) => {
            const idCorrect = filename.split(".").at(0) === achievement.id;
            return idCorrect && !filename.includes(".pixelated.");
        });
        if (!targetFilename) {
            logger.error(`Arquivo de imagem não encontrado para ${achievement.id}`);
            continue;
        }
        const publicTargetFilanme = `${achievement.id}.pixelated.png`;
        const publicUrl = await handleUploadImage(publicTargetFilanme);
        const privateUrl = await handleUploadImage(targetFilename);

        if (privateUrl && publicUrl) {
            logger.info(`Upload finalizado com sucesso ${privateUrl} ${publicUrl}`);
            await database.achievement.update({
                where: {
                    id: achievement.id,
                },
                data: {
                    secretUrl: privateUrl,
                    publicUrl: publicUrl,
                },
            });
        } else {
            logger.error(`Falha ao fazer upload para ${privateUrl}`);
        }
    }
};

await migrateImages();
