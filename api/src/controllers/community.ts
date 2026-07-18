import database from "@/services/database";
import {
    COMMUNITY_DETAIL_INCLUDE,
    COMMUNITY_LIST_INCLUDE,
    MODERATOR_SELECT,
} from "@/models/communityModel";
import { toSlug } from "@/utils/slug";
import { RequestHandler } from "express";
import { z } from "zod";
import {
    createCommunitySchema,
    moderatorIdSchema,
    findUserQuerySchema,
    communityParamsSchema,
} from "@/validations/community";

const createCommunity: RequestHandler = async (req, res) => {
    const body = req.body as z.infer<typeof createCommunitySchema>;
    const user = req.session!.user!;

    const id = toSlug(body.name);
    if (!id) {
        return res.status(422).error(req.t("community.invalidNameSlug"));
    }

    const existing = await database.muralCommunity.findUnique({
        where: { id },
    });
    if (existing) {
        return res.status(409).error(req.t("community.duplicateName"));
    }

    const community = await database.muralCommunity.create({
        data: {
            id,
            name: body.name,
            description: body.description ?? null,
            createdById: user.id,
            moderators: { connect: { id: user.id } },
        },
        include: COMMUNITY_LIST_INCLUDE,
    });

    return res.success(req.t("community.created"), community);
};

const addModerator: RequestHandler = async (req, res) => {
    const community = req.muralCommunity!;
    const { id: userId } = req.body as z.infer<typeof moderatorIdSchema>;

    const user = await database.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });

    if (!user) {
        return res.status(404).error(req.t("community.userNotFound"));
    }

    const alreadyModerator = community.moderators.some((m) => m.id === user.id);
    if (alreadyModerator) {
        return res.status(409).error(req.t("community.moderatorAlreadyExists"));
    }

    await database.muralCommunity.update({
        where: { id: community.id },
        data: { moderators: { connect: { id: user.id } } },
    });

    return res.success(req.t("community.moderatorAdded"));
};

const removeModerator: RequestHandler = async (req, res) => {
    const community = req.muralCommunity!;
    const { id: userId } = req.body as z.infer<typeof moderatorIdSchema>;

    const user = await database.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });

    if (!user) {
        return res.status(404).error(req.t("community.userNotFound"));
    }

    const isModerator = community.moderators.some((m) => m.id === user.id);
    if (!isModerator) {
        return res.status(404).error(req.t("community.moderatorMissing"));
    }

    if (community.createdById === user.id) {
        return res.status(422).error(req.t("community.moderatorOwnerRemoval"));
    }

    await database.muralCommunity.update({
        where: { id: community.id },
        data: { moderators: { disconnect: { id: user.id } } },
    });

    return res.success(req.t("community.moderatorRemoved"));
};

const findUser: RequestHandler = async (req, res) => {
    const query = req.query as z.infer<typeof findUserQuerySchema>;

    const users = await database.user.findMany({
        where: {
            name: { contains: query.q, mode: "insensitive" },
        },
        take: 10,
        select: MODERATOR_SELECT,
    });

    return res.success(null, users);
};

const getModerators: RequestHandler = async (req, res) => {
    const community = req.muralCommunity!;
    const full = await database.muralCommunity.findUnique({
        where: { id: community.id },
        include: { moderators: { select: MODERATOR_SELECT } },
    });
    return res.success(null, full!.moderators);
};

const getCommunity: RequestHandler = async (req, res) => {
    const { id } = req.params as z.infer<typeof communityParamsSchema>;

    const community = await database.muralCommunity.findUnique({
        where: { id },
        include: COMMUNITY_DETAIL_INCLUDE,
    });

    if (!community) {
        return res.status(404).error(req.t("community.notFound"));
    }

    return res.success(null, community);
};

const listCommunities: RequestHandler = async (_req, res) => {
    const communities = await database.muralCommunity.findMany({
        include: COMMUNITY_LIST_INCLUDE,
    });

    return res.success(null, communities);
};

const communityController = {
    createCommunity,
    addModerator,
    removeModerator,
    findUser,
    getModerators,
    getCommunity,
    listCommunities,
};

export default communityController;
