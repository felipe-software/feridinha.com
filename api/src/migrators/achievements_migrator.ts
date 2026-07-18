import achievements from "@/handlers/achievements";
import database from "@/services/database";

const migrateSingleUser = async (userId: string) => {
    const targetUser = await database.user.findUnique({
        where: { id: userId },
        include: { achievements: true, uploads: true },
    });
    if (targetUser) {
        await achievements.handleUpdate(
            targetUser,
            { context: "login" }
            // { uploads: { connect: [{ name: lastUpload.name }] } }
        );
        const biggestUpload = targetUser.uploads.toSorted((a, b) => b.size - a.size).at(-1);
        if (!biggestUpload) {
            console.log("Não tem nenhum upload", targetUser.name, targetUser.uploadCount);
            return 0
        }

        
        await achievements.handleUpdate(targetUser, { context: "login" });
        await achievements.handleUpdate(targetUser, { context: "upload", uploadSize: biggestUpload.size });
        console.log(`${targetUser.name} Atualizado OK achievements`);

    }
};

const main = async () => {
    const users = await database.user.findMany();
    for (const user of users) {
        await migrateSingleUser(user.id);
    }

    console.log("Atualizado com sucesso os usuários. total", users.length);
};

await main();
