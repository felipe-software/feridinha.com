import logger from "@/config/logger";
import constants from "@/constants";
import database from "@/services/database";
import { Achievement, Prisma } from "@prisma/client";
import path from "path";

type AchievementIds =
    | "upload-1st"
    | "upload-100"
    | "upload-1000"
    | "upload-5000"
    | "upload-15000"
    | "og"
    | "limit"
    | "bug-reporter"
    | "feature-suggester"
    | "video"
    | "audio"
    | "png-master";

type UserPopulated = Prisma.UserGetPayload<{
    include: { uploads: false; achievements: true };
}>;

type MetadataType =
    | {
          context: "upload";
          uploadSize: number;
      }
    | {
          context: "login";
      };

interface BaseAchievement extends Omit<Achievement, "usersIds" | "secretUrl" | "publicUrl"> {
    id: AchievementIds;
    checker: (user: UserPopulated, metadata: MetadataType) => boolean | Promise<boolean>;
    order?: number
    runContext: MetadataType["context"]
}

export const achievementsOrder: Record<AchievementIds, number> = {
    "upload-1st": 1,
    "upload-100": 2,
    "upload-1000": 3,
    "upload-5000": 4,
    "upload-15000": 5,
    "limit": 6,
    "video": 7,
    "audio": 8,
    "png-master": 9,
    "og": 10,
    "bug-reporter": 11,
    "feature-suggester": 12,
};

export const baseAchievements: BaseAchievement[] = [
    {
        id: "upload-1st",
        name: "O primeiro de muitos",
        description: "Faça seu primeiro upload",
        hiddenDescription: null,
        checker: async (user) => {
            if (!user) return false;
            const achievementsIds = user.achievements.map((b) => b.id);

            return !achievementsIds.includes("upload-1st");
        },
        runContext: "upload"
    },
    {
        id: "upload-100",
        name: "Ainda não é o suficiente",
        description: "Complete 100 uploads",
        hiddenDescription: "Complete ??? uploads",
        checker: async (user) => {
            return user?.uploadCount >= 100;
        },
        runContext: "upload"
    },
    {
        id: "upload-1000",
        name: "Viciado em compartilhar",
        description: "1.000 uploads?! Tá começando a ficar assustador...",
        hiddenDescription: "Faça ???? uploads",
        checker: async (user) => {
            return user?.uploadCount >= 1000;
        },
        runContext: "upload"
    },
    {
        id: "upload-5000",
        name: "Não consigo parar, não posso parar, mais mais mais...",
        description: "Faça 5.000 uploads. Isso se tornou um vício!",
        hiddenDescription: "Faça ???? uploads",
        checker: async (user) => {
            return user?.uploadCount >= 5000;
        },
        runContext: "upload"
    },
    {
        id: "upload-15000",
        name: "O QUEEEEEEEEEEEEEEEEEEEEE??????",
        description: "Faça 15.000 uploads. Isso é possível???",
        hiddenDescription: "Faça ???? uploads",
        checker: async (user) => {
            return user?.uploadCount >= 15000;
        },
        runContext: "upload"
    },
    {
        id: "og",
        name: "Apoiando desde o começo",
        description: "Seja um usuário desde o começo do projeto (conta criada antes de 2023).", 
        hiddenDescription: null,
        checker: async (user) => {
            const createdAt = user.createdAt.getTime()

            return createdAt < new Date("2023-01-01").getTime();
        },
        runContext: "login"
    },
    {
        id: "limit",
        name: "Na borda do antigo limite",
        description: "Faça um upload maior que 80mb",
        hiddenDescription: "Faça um upload maior que ??mb",
        checker: async (user, metadata) => {
            if (metadata.context !== "upload") return false;
            return metadata.uploadSize >= (80 * 1024 * 1024);
        },
        runContext: "upload"
    },
    {
        id: "bug-reporter",
        name: "Diferente de Cyberpunk...",
        description: "Reporte um bug",
        hiddenDescription: null,
        checker: async (user) => {
            const username = user.name.toLowerCase();
            return constants.users.bughunters.includes(username);
        },
        runContext: "login"
    },
    {
        id: "feature-suggester",
        name: "Quem usa entende",
        description: "Sugira uma feature",
        hiddenDescription: null,
        checker: async (user) => {
            const username = user.name.toLowerCase();
            return constants.users.suggesters.includes(username);
        },
        runContext: "login"
    },
    {
        id: "png-master",
        name: "Mestre do PNG",
        description: "Faça upload de mais de 5.000 PNG",
        hiddenDescription: "Faça upload de mais de ???? arquivos PNG",
        checker: async (user) => {
            if (user.uploadCount < 5000) return false;
            const uploads = await database.upload.findMany({
                where: { userId: user.id },
                select: { name: true },
            });
            return (
                uploads.filter((upload) => {
                    const ext = path.extname(upload.name);
                    return [".png"].includes(ext);
                }).length >= 5000
            );
            // return false;
        },
        runContext: "upload"
    },
    {
        id: "video",
        name: "Mestre dos vídeos",
        description: "Faça upload de mais de 1000 vídeos",
        hiddenDescription: "Faça upload de mais de ???? vídeos",
        checker: async (user) => {
            if (user.uploadCount < 1000) return false;
            const uploads = await database.upload.findMany({
                where: { userId: user.id },
                select: { name: true },
            });
            return (
                uploads.filter((upload) => {
                    const ext = path.extname(upload.name);
                    return [".mp4", ".mkv", ".mov"].includes(ext);
                }).length >= 1000
            );
            // return false;
        },
        runContext: "upload"
    },
    {
        id: "audio",
        name: "Mestre sonoplasta",
        description: "Faça upload de mais de 1000 áudios",
        hiddenDescription: "Faça upload de mais de ???? áudios",
        checker: async (user) => {
            if (user.uploadCount < 1000) return false;
            const uploads = await database.upload.findMany({
                where: { userId: user.id },
            });
            return (
                uploads.filter((upload) => {
                    const ext = path.extname(upload.name);
                    return [".mp3", ".wav", ".ogg"].includes(ext);
                }).length >= 1000
            );
            // return false;
        },
        runContext: "upload"
    },

];

const handleUpdate = async (
    user: UserPopulated,
    metadata: MetadataType,
    extraQuery?: Prisma.UserUpdateArgs["data"]
) => {
    let newAchievements: Achievement["id"][] = [];
    for (const achievement of baseAchievements) {
        if(achievement.runContext !== metadata.context) continue;
        const hasUnlocked = await achievement.checker(user, metadata);
        const alreadyUnlocked = user.achievements.find((d) => d.id === achievement.id);
        logger.debug({ id: achievement.id, hasUnlocked, alreadyUnlocked: !!alreadyUnlocked });
        if (alreadyUnlocked || !hasUnlocked) continue;
        newAchievements.push(achievement.id);
    }

    const hasNewAchievements = newAchievements.length > 0;

    const achievementsChanges: Prisma.UserUpdateArgs["data"]["achievements"] = {
        connect: newAchievements.map((id) => ({ id })),
    };

    if (!hasNewAchievements && !extraQuery) return;
    logger.info(`New achievements ${user.name} ${newAchievements.join(", ")}`);
    await database.user.update({
        where: { id: user.id },
        data: {
            achievements: newAchievements.length > 0 ? achievementsChanges : undefined,
            ...extraQuery,
        },
    });

    return newAchievements;
};

const init = async () => {
    for (const achievement of baseAchievements) {
        const result = await database.achievement.upsert({
            where: { id: achievement.id },
            create: {
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
            },
            update: {
                description: achievement.description,
                hiddenDescription: achievement.hiddenDescription,
                name: achievement.name,
            },
        });

        logger.trace(`Consquista ${result.id} criada com sucesso`);
    }
};

const achievements = {
    init,
    handleUpdate,
};

export default achievements;
