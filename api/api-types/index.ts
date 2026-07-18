import type { z } from "zod";
import type {
    createPostSchema,
    listPostsQuerySchema,
    votePostParamsSchema,
    approvePostParamsSchema,
    approvePostSchema,
} from "../src/validations/mural";
import type {
    createCommunitySchema,
    moderatorIdSchema,
    findUserQuerySchema,
    communityParamsSchema,
} from "../src/validations/community";
import type { Prisma } from "@prisma/client";

export type $ApiMuralCreateParams = z.infer<typeof createPostSchema>;
export type $ApiMuralListParams = z.infer<typeof listPostsQuerySchema>;
export type $ApiMuralVoteParams = z.infer<typeof votePostParamsSchema>;

export type $ApiMuralListItem = Prisma.MuralPostGetPayload<{
    include: { user: { select: { name: true; color: true; profileImage: true } } };
}> & { approvalStatus: "approved" | "pending"; myVote: "up" | "down" | null };

export type $ApiMuralListResponse = {
    posts: $ApiMuralListItem[];
    nextCursor: string | null;
};

export type $ApiMuralApproveParams = z.infer<typeof approvePostParamsSchema>;
export type $ApiMuralApproveBody = z.infer<typeof approvePostSchema>;

// Community
export type $ApiMuralCommunityCreateParams = z.infer<typeof createCommunitySchema>;
export type $ApiMuralCommunityParams = z.infer<typeof communityParamsSchema>;
export type $ApiMuralCommunityFindUserParams = z.infer<typeof findUserQuerySchema>;

/** Params da rota (community id) para moderator/add, moderator/remove e GET moderator */
export type $ApiMuralCommunityModeratorRouteParams = z.infer<typeof communityParamsSchema>;

/** Body para moderator/add e moderator/remove (id = userId) */
export type $ApiMuralCommunityModeratorBody = z.infer<typeof moderatorIdSchema>;

/** @deprecated Use $ApiMuralCommunityModeratorRouteParams para GET moderator */
export type $ApiMuralCommunityModeratorParams = $ApiMuralCommunityModeratorRouteParams;

/** Params para addMod/removeMod: communityId na URL + id (userId) no body */
export type $ApiMuralCommunityModeratorAddParams = {
    communityId: string;
    id: string;
};

export type $ApiMuralCommunityModeratorPreview = {
    id: string;
    name: string;
    color: string;
};

export type $ApiMuralCommunityListItem = Prisma.MuralCommunityGetPayload<{
    include: {
        createdBy: { select: { name: true; color: true } };
        _count: { select: { posts: true } };
    };
}>;

export type $ApiMuralCommunityDetail = Prisma.MuralCommunityGetPayload<{
    include: {
        moderators: { select: { id: true; name: true; color: true } };
        createdBy: { select: { id: true; name: true; color: true } };
        _count: { select: { posts: true } };
    };
}>;
