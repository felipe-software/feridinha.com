import database from "@/services/database";
import { Prisma } from "@prisma/client";

export const GERAL_COMMUNITY_ID = "geral";

export async function ensureGeralCommunity() {
    const community = await database.muralCommunity.upsert({
        where: { id: GERAL_COMMUNITY_ID },
        create: {
            id: GERAL_COMMUNITY_ID,
            name: "geral",
            description: "Comunidade geral do mural",
            createdById: null,
        },
        update: {},
    });

    const admins = await database.user.findMany({
        where: { role: "ADMIN" },
    });

    const mergedModeratorIds = [...new Set([...community.moderatorIds, ...admins.map((admin) => admin.id)])];

    await database.muralCommunity.update({
        where: { id: GERAL_COMMUNITY_ID },
        data: {
            moderators: {
                connect: mergedModeratorIds.map((id) => ({ id })),
            },
        },
    });

    // const baseDate = new Date("2026-03-01T22:32:24.378Z");

    // const updatedPosts = await database.muralPost.findMany({ orderBy: { createdAt: "desc" } });
    // console.log("Posts", updatedPosts.length);

    // let i = 1;
    // for (const u of updatedPosts) {
    //     await database.muralPost.update({
    //         where: { id: u.id },
    //         data: {
    //             title: "Título " + i,
    //             description: "descrição " + i,
    //             createdAt: new Date(baseDate.getTime() - i * 1000),
    //         },
    //     });
    //     i++;
    //     console.log(i);
    // }
}
