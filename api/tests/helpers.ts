import database from "@/services/database";
import session from "@/handlers/session";
import crypto from "crypto";
import { MuralPostType } from "@prisma/client";

export interface TestUser {
    id: string;
    token: string;
    twitchId: string;
}

export const createTestUser = async (suffix: string = ""): Promise<TestUser> => {
    const twitchId = `test-${suffix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const user = await database.user.create({
        data: {
            twitchId,
            name: `Test User ${suffix}`,
            profileImage: "https://example.com/avatar.png",
            sessions: [],
        },
    });

    const sessionId = crypto.randomUUID();
    await database.user.update({
        where: { id: user.id },
        data: { sessions: { push: sessionId } },
    });

    const token = await session.createJwt(sessionId);
    return { id: user.id, token, twitchId };
};

export const deleteTestUser = async (userId: string) => {
    await database.$transaction(async (tx) => {
        await tx.apiKey.deleteMany({ where: { userId } });
        await tx.review.deleteMany({ where: { userId } });
        await tx.upload.deleteMany({ where: { userId } });
        await tx.album.deleteMany({ where: { userId } });
        await tx.muralPost.updateMany({ where: { approvedById: userId }, data: { approvedById: null } });
        await tx.muralPostVote.deleteMany({ where: { userId } });
        await tx.muralPostVote.deleteMany({ where: { post: { userId } } });
        await tx.muralPost.deleteMany({ where: { userId } });

        const communitiesToUpdate = await tx.muralCommunity.findMany({
            where: {
                OR: [
                    { createdById: userId },
                    { moderators: { some: { id: userId } } },
                    { members: { some: { id: userId } } },
                ],
            },
        });

        for (const c of communitiesToUpdate) {
            if (c.createdById === userId) {
                if (c.id === "geral") {
                    await tx.muralCommunity.update({
                        where: { id: "geral" },
                        data: { createdById: null },
                    });
                } else {
                    await tx.muralPost.updateMany({ where: { communityId: c.id }, data: { communityId: "geral" } });
                    await tx.muralCommunity.delete({ where: { id: c.id } });
                }
            } else {
                await tx.muralCommunity.update({
                    where: { id: c.id },
                    data: {
                        moderators: { disconnect: { id: userId } },
                        members: { disconnect: { id: userId } },
                    },
                });
            }
        }

        await tx.user.delete({ where: { id: userId } });
    });
};

export const createTestMuralPost = async (
    userId: string,
    options?: { approvedById?: string; upvotes?: number; communityId?: string }
) => {
    return database.muralPost.create({
        data: {
            bareContent: `Test post ${Date.now()}`,
            contentType: "IMAGE",
            contentOrigin: "FERIDINHA",
            communityId: options?.communityId ?? "geral",
            userId,
            ...(options?.approvedById && {
                approvedById: options.approvedById,
                aprovedAt: new Date(),
            }),
            ...(options?.upvotes !== undefined && { upvotes: options.upvotes }),
        },
    });
};

export const createTestUpload = async (userId: string, name?: string) => {
    const uploadName = name || `test-upload-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.png`;
    return database.upload.create({
        data: {
            name: uploadName,
            size: 1024,
            mimeType: "image/png",
            deleteCode: crypto.randomUUID(),
            deleteCodeVersion: "NEW",
            userId,
        },
    });
};
