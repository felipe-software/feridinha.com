import database from "@/services/database";
import {
    COMMUNITY_INCLUDE_MODERATORS_ID,
    COMMUNITY_INCLUDE_MODERATORS_FULL,
    POST_INCLUDE_COMMUNITY,
} from "@/models/communityModel";
import { RequestHandler } from "express";
import { GERAL_COMMUNITY_ID } from "@/services/muralCommunity";
import asyncHandler from "@/utils/asyncHandler";

type CommunitySource = "query" | "body" | "params" | "fromPost";

const communityMiddleware =
    (options: {
        source: CommunitySource;
        param?: string;
        /** Quando true, comunidade inexistente não retorna 404; segue sem req.muralCommunity */
        allowMissing?: boolean;
        /** Incluir moderadores com id, name, color (para GET /moderator) */
        moderatorsFull?: boolean;
    }): RequestHandler =>
    asyncHandler(async (req, res, next) => {
        const param = options.param ?? (options.source === "fromPost" ? "id" : "communityId");

        let communityId: string | undefined;

        if (options.source === "fromPost") {
            const postId = req.params[param];
            if (!postId) return next();

            const post = await database.muralPost.findUnique({
                where: { id: postId },
                include: POST_INCLUDE_COMMUNITY,
            });

            if (!post) {
                return res.status(404).error(req.t("mural.postNotFound"));
            }

            req.muralPost = post;
            req.muralCommunity = post.community;
            return next();
        }

        const source = req[options.source] as Record<string, unknown>;
        communityId = source?.[param] as string | undefined;

        if (!communityId) {
            communityId = options.source === "query" ? GERAL_COMMUNITY_ID : undefined;
        }

        if (!communityId) return next();

        const community = await database.muralCommunity.findUnique({
            where: { id: communityId },
            include: options.moderatorsFull ? COMMUNITY_INCLUDE_MODERATORS_FULL : COMMUNITY_INCLUDE_MODERATORS_ID,
        });

        if (!community) {
            if (options.allowMissing) return next();
            return res.status(404).error(req.t("community.notFound"));
        }

        req.muralCommunity = community;
        next();
    });

export default communityMiddleware;
