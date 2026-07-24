import type { Prisma } from "@prisma/client";

export const AUTHENTICATED_USER_INCLUDE = {
    albums: true,
    uploads: true,
    achievements: true,
    oauthAccounts: {
        select: {
            provider: true,
            createdAt: true,
        },
    },
    moderatedCommunities: {
        select: {
            name: true,
            id: true,
        },
    },
} as const;

export type AuthenticatedUser = Prisma.UserGetPayload<{
    include: typeof AUTHENTICATED_USER_INCLUDE;
}>;
