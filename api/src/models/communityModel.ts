import type { Prisma } from "@prisma/client";

/** Campos padrão de moderador: id, name, color */
export const MODERATOR_SELECT = {
    id: true,
    name: true,
    color: true,
} as const;

/** Campos padrão de user em post: name, color, profileImage */
export const POST_USER_SELECT = {
    name: true,
    color: true,
    profileImage: true,
} as const;

/** Include de comunidade para middleware/validação (só ids dos mods) */
export const COMMUNITY_INCLUDE_MODERATORS_ID = {
    moderators: { select: { id: true } },
} as const;

/** Include de comunidade com moderadores completos (id, name, color) */
export const COMMUNITY_INCLUDE_MODERATORS_FULL = {
    moderators: { select: MODERATOR_SELECT },
} as const;

/** Include de post com community (para moderate) */
export const POST_INCLUDE_COMMUNITY = {
    community: {
        include: { moderators: { select: { id: true } } },
    },
} as const;

/** Include de post para resposta da API (user + approvedBy) */
export const POST_RESPONSE_INCLUDE = {
    user: { select: POST_USER_SELECT },
    approvedBy: { select: MODERATOR_SELECT },
} as const;

/** Include de comunidade para getCommunity (detalhe) */
export const COMMUNITY_DETAIL_INCLUDE = {
    moderators: { select: MODERATOR_SELECT },
    createdBy: { select: MODERATOR_SELECT },
    _count: { select: { posts: true } },
} as const;

/** Include de comunidade para listCommunities */
export const COMMUNITY_LIST_INCLUDE = {
    createdBy: { select: { name: true, color: true } },
    _count: { select: { posts: true, members: true, moderators: true } },
} as const;

export type CommunityWithModeratorsId = Prisma.MuralCommunityGetPayload<{
    include: typeof COMMUNITY_INCLUDE_MODERATORS_ID;
}>;

export type CommunityWithModeratorsFull = Prisma.MuralCommunityGetPayload<{
    include: typeof COMMUNITY_INCLUDE_MODERATORS_FULL;
}>;

export type PostWithCommunity = Prisma.MuralPostGetPayload<{
    include: typeof POST_INCLUDE_COMMUNITY;
}>;
