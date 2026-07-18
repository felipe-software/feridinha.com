import database from "@/services/database";
import { redisClient } from "@/services/redis";
import { POST_RESPONSE_INCLUDE, POST_USER_SELECT } from "@/models/communityModel";
import {
    createPostSchema,
    listPostsQuerySchema,
    votePostParamsSchema,
    approvePostParamsSchema,
    approvePostSchema,
} from "@/validations/mural";
import { RequestHandler } from "express";
import { z } from "zod";
import type { $ApiMuralListItem, $ApiMuralListResponse } from "api-types";
import { externalPostResolver } from "@/services/external-post/resolver";
import { externalPostParser } from "@/services/external-post/parser";
import { externalPostUploader } from "@/services/external-post/uploader";
import { GERAL_COMMUNITY_ID } from "@/services/muralCommunity";
import { Prisma } from "@prisma/client";
import { tryP } from "@/utils/promises";
import logger from "@/config/logger";
import posthog from "@/services/posthog";

const createPost: RequestHandler = async (req, res) => {
    const body = req.body as z.infer<typeof createPostSchema>;
    const user = req.session!.user!;

    const linkPlatform = externalPostResolver.detectPlatform(body.link);

    if (!linkPlatform) {
        return res.error(req.t("upload.linkPlatformUnknown"));
    }

    const [fetchErr, html] = await tryP(externalPostResolver.resolveHtml(body.link));
    if (fetchErr) {
        logger.error({ msg: "Erro ao buscar conteúdo externo", error: fetchErr, link: body.link });
        posthog.capture(user.id, "mural_post_error", { platform: linkPlatform, error_stage: "fetch" });
        return res.error(req.t("mural.fetchLinkError"));
    }

    const [parseErr, content] = await tryP(externalPostParser.parse(linkPlatform, html));
    if (parseErr || !content) {
        logger.error({ msg: "Erro ao processar conteúdo externo", error: parseErr, link: body.link });
        posthog.capture(user.id, "mural_post_error", { platform: linkPlatform, error_stage: "parse" });
        return res.error(req.t("mural.parseLinkError"));
    }

    const communityId = req.muralCommunity!.id;

    const post = await database.muralPost.create({
        data: {
            bareContent: body.link,
            contentOrigin: linkPlatform.toUpperCase() as Uppercase<typeof linkPlatform>,
            contentType: content.contentType,
            processedContent: content.contentUrl,
            communityId,
            userId: user.id,
            title: body.title ?? content.title,
            description: body.description,
        },
        include: {
            user: { select: POST_USER_SELECT },
        },
    });

    const [uploadErr, cdnUrl] = await tryP(externalPostUploader.uploadExternalPost(content, post.id, linkPlatform));
    if (uploadErr) {
        logger.error({ msg: "Erro ao fazer upload do conteúdo", error: uploadErr, postId: post.id });
    }

    if (cdnUrl) {
        await database.muralPost.update({
            where: { id: post.id },
            data: { processedContent: cdnUrl },
        });
        post.processedContent = cdnUrl;
    }

    posthog.capture(user.id, "mural_post_created", { platform: linkPlatform });

    return res.success<$ApiMuralListItem>(req.t("mural.postCreated"), {
        ...post,
        approvalStatus: "pending" as const,
        myVote: null,
    });
};

const upvotePost: RequestHandler = async (req, res) => {
    const { id, vote } = req.params as z.infer<typeof votePostParamsSchema>;
    const user = req.session!.user!;

    const redisKey = `vote:${user.id}:${id}`;
    const acquired = await redisClient.set(redisKey, "1", "NX");

    if (acquired === null) {
        return res.error(req.t("mural.voteInProgress"));
    }

    const post = await database.muralPost.findUnique({ where: { id } });

    if (!post) {
        await redisClient.del(redisKey);
        return res.status(404).error(req.t("mural.postNotFound"));
    }

    const existingVote = await database.muralPostVote.findUnique({
        where: { userId_postId: { userId: user.id, postId: id } },
    });

    if (existingVote?.vote === vote) {
        await redisClient.del(redisKey);
        return res.error(req.t("mural.voteAlreadyRegistered"));
    }

    const upvotesDelta = existingVote ? (vote === "up" ? 2 : -2) : vote === "up" ? 1 : -1;

    const [err, updated] = await tryP(
        database.muralPost.update({
            where: { id },
            data: {
                upvotes: { increment: upvotesDelta },
                votes: existingVote
                    ? { update: { where: { userId_postId: { userId: user.id, postId: id } }, data: { vote } } }
                    : { create: { userId: user.id, vote } },
            },
            include: { user: { select: POST_USER_SELECT } },
        }),
    );

    await redisClient.del(redisKey);

    if (err) {
        return res.error(req.t("mural.voteRegisterError"));
    }

    return res.success<$ApiMuralListItem>(req.t("mural.voteRegistered"), {
        ...updated,
        approvalStatus: updated.aprovedAt != null ? ("approved" as const) : ("pending" as const),
        myVote: vote as "up" | "down",
    });
};

const listPosts: RequestHandler = async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listPostsQuerySchema>;
    const communityId = req.muralCommunity?.id ?? query.communityId ?? GERAL_COMMUNITY_ID;
    const after = query.after;
    const limit = query.limit;
    const sortBy = query.sortBy ?? "recent";
    const approvalStatus = query.approvalStatus ?? "approved";
    let userId: string | undefined = undefined;

    if (query.username) {
        const user = await database.user.findFirst({
            where: { name: { equals: query.username, mode: "insensitive" } },
        });
        if (!user) {
            return res.status(404).error(req.t("community.userNotFound"));
        }
        userId = user.id;
    }

    let approvedWhere: Prisma.MuralPostWhereInput | undefined = undefined;

    switch (approvalStatus) {
        case "approved":
            approvedWhere = { aprovedAt: { not: null } };
            break;
        case "pending":
            approvedWhere = { aprovedAt: null, approvedById: null };
            break;
        case "rejected":
            approvedWhere = { notApprovedReason: { not: null } };
            break;
    }

    const orderBy =
        sortBy === "upvotes"
            ? [{ upvotes: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }]
            : [{ createdAt: "desc" as const }, { id: "desc" as const }];

    const cursor = after ? { id: after } : undefined;

    const posts = await database.muralPost.findMany({
        take: limit + 1,
        ...(cursor && { cursor, skip: 1 }),
        where: {
            communityId,
            ...approvedWhere,
            userId,
        },
        orderBy,
        include: {
            user: { select: POST_USER_SELECT },
        },
    });

    const hasMore = posts.length > limit;
    const rawItems = hasMore ? posts.slice(0, limit) : posts;

    const sessionUserId = req.session?.user?.id;
    let userVotesMap = new Map<string, string>();

    if (sessionUserId) {
        const postIds = rawItems.map((p) => p.id);
        const votes = await database.muralPostVote.findMany({
            where: { userId: sessionUserId, postId: { in: postIds } },
            select: { postId: true, vote: true },
        });
        userVotesMap = new Map(votes.map((v) => [v.postId, v.vote]));
    }

    const items = rawItems.map((p) => ({
        ...p,
        approvalStatus: p.aprovedAt != null ? ("approved" as const) : ("pending" as const),
        myVote: (userVotesMap.get(p.id) ?? null) as "up" | "down" | null,
    }));
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return res.success<$ApiMuralListResponse>(null, { posts: items, nextCursor });
};

const moderatePost: RequestHandler = async (req, res) => {
    const { id } = req.params as z.infer<typeof approvePostParamsSchema>;
    const body = req.body as z.infer<typeof approvePostSchema>;
    const mod = req.session!.user!;

    const post = req.muralPost!;

    const updated = await database.muralPost.update({
        where: { id },
        data: {
            aprovedAt: body.approved ? new Date() : null,
            approvedById: mod.id,
            notApprovedReason: body.approved ? null : (body.reason ?? null),
        },
        include: POST_RESPONSE_INCLUDE,
    });

    return res.success(body.approved ? req.t("mural.postApproved") : req.t("mural.postRejected"), updated);
};

const muralController = {
    createPost,
    upvotePost,
    listPosts,
    moderatePost,
};

export default muralController;
