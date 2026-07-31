import env, { myEnv } from "@/config/env";
import achievements, { achievementsOrder } from "@/handlers/achievements";
import session from "@/handlers/session";
import { AUTHENTICATED_USER_INCLUDE } from "@/models/userModel";
import database from "@/services/database";
import { findOrCreateOAuthUser } from "@/services/oauth/accounts";
import { mergeOAuthUsers, OAuthMergeError } from "@/services/oauth/merge";
import {
    getOAuthProvider,
    parseOAuthProvider,
    providerToSlug,
    type OAuthProviderSlug,
} from "@/services/oauth";
import {
    createOAuthState,
    linkCompletionStore,
    linkInitStore,
    mergeConfirmationStore,
    oauthStateMaxAgeMs,
    oauthStatesMatch,
    oauthStateStore,
} from "@/services/oauth/state";
import { readCookie } from "@/utils/cookies";
import { ExternalServiceError } from "@/utils/httpErrors";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import type { Request, RequestHandler, Response } from "express";
import constants from "@/constants";

export { createOAuthState, oauthStatesMatch };

export const OAUTH_STATE_COOKIE = "fd_oauth_state";
const TOKEN_COOKIE_MAX_AGE = 2 * 60 * 1000;

const oauthCookieOptions = (provider: OAuthProviderSlug) => ({
    httpOnly: true,
    sameSite: "lax" as const,
    secure: myEnv.NODE_ENV === "production",
    path: `/login/${provider}`,
});

const resolveProvider = (req: Request, res: Response) => {
    const slug = parseOAuthProvider(req.params.provider);
    if (!slug) {
        res.status(404).error(req.t("auth.oauthProviderInvalid"), "oauth_provider_invalid");
        return null;
    }
    return { slug, adapter: getOAuthProvider(slug) };
};

const sendProviderError = (req: Request, res: Response, error: unknown) => {
    const status = error instanceof ExternalServiceError ? error.upstreamStatus : 502;
    return res.status(status).error(req.t("auth.oauthUpstreamError"), "oauth_upstream_error");
};

const clientRedirect = (pathname: string, fragmentKey: string, value: string) => {
    const url = new URL(pathname, env.CLIENT_URL);
    url.hash = `${fragmentKey}=${encodeURIComponent(value)}`;
    return url.toString();
};

const redirectWithOAuthError = (res: Response, code: string) =>
    res.redirect(clientRedirect("/", "oauth-error", code));

const oauthRedirect: RequestHandler = async (req, res) => {
    const provider = resolveProvider(req, res);
    if (!provider) return;

    const state = await oauthStateStore.create({
        provider: provider.adapter.provider,
        intent: "login",
    });
    res.cookie(OAUTH_STATE_COOKIE, state, {
        ...oauthCookieOptions(provider.slug),
        maxAge: oauthStateMaxAgeMs,
    });
    res.redirect(provider.adapter.getAuthorizationUrl(state));
};

const startLink: RequestHandler = async (req, res) => {
    const provider = resolveProvider(req, res);
    if (!provider) return;

    const alreadyLinked = await database.oAuthAccount.findUnique({
        where: {
            userId_provider: {
                userId: req.session.user!.id,
                provider: provider.adapter.provider,
            },
        },
    });
    if (alreadyLinked) {
        return res
            .status(409)
            .error(req.t("auth.oauthProviderAlreadyLinked"), "oauth_provider_already_linked");
    }

    const ticket = await linkInitStore.create({
        provider: provider.adapter.provider,
        expectedUserId: req.session.user!.id,
    });
    const redirectUrl = new URL(`/login/${provider.slug}/link/redirect`, provider.adapter.redirectUri);
    redirectUrl.searchParams.set("ticket", ticket);
    res.success(null, { redirectUrl: redirectUrl.toString() }, "oauth_link_started");
};

const linkRedirect: RequestHandler = async (req, res) => {
    const provider = resolveProvider(req, res);
    if (!provider) return;
    const ticket = typeof req.query.ticket === "string" ? req.query.ticket : "";
    const linkData = ticket ? await linkInitStore.consume(ticket) : null;

    if (!linkData || linkData.provider !== provider.adapter.provider) {
        return res.status(400).error(req.t("auth.oauthLinkTicketInvalid"), "oauth_link_ticket_invalid");
    }

    const state = await oauthStateStore.create({
        provider: provider.adapter.provider,
        intent: "link",
        expectedUserId: linkData.expectedUserId,
    });
    res.cookie(OAUTH_STATE_COOKIE, state, {
        ...oauthCookieOptions(provider.slug),
        maxAge: oauthStateMaxAgeMs,
    });
    res.redirect(provider.adapter.getAuthorizationUrl(state));
};

const createApplicationSession = async (userId: string) => {
    const sessionId = crypto.randomUUID();
    const token = await session.createJwt(sessionId);
    const user = await database.user.update({
        where: { id: userId },
        data: { sessions: { push: sessionId } },
        include: AUTHENTICATED_USER_INCLUDE,
    });
    return { token, user };
};

const oauthCallback: RequestHandler = async (req, res) => {
    const provider = resolveProvider(req, res);
    if (!provider) return;

    const cookieOptions = oauthCookieOptions(provider.slug);
    const storedState = readCookie(req.headers.cookie, OAUTH_STATE_COOKIE);
    res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions);
    if (!oauthStatesMatch(storedState, req.query.state)) {
        return res.status(400).error(req.t("auth.oauthStateInvalid"), "oauth_state_invalid");
    }

    const stateData = await oauthStateStore.consume(storedState!);
    if (!stateData || stateData.provider !== provider.adapter.provider) {
        return res.status(400).error(req.t("auth.oauthStateInvalid"), "oauth_state_invalid");
    }

    if (typeof req.query.error === "string") {
        return redirectWithOAuthError(res, "oauth_access_denied");
    }
    if (typeof req.query.code !== "string" || !req.query.code) {
        return res.status(400).error(req.t("auth.oauthCodeInvalid"), "oauth_code_invalid");
    }

    try {
        const token = await provider.adapter.exchangeCode(req.query.code);
        const profile = await provider.adapter.fetchProfile(token.accessToken);

        if (stateData.intent === "link") {
            if (!stateData.expectedUserId) {
                return res.status(400).error(req.t("auth.oauthStateInvalid"), "oauth_state_invalid");
            }
            const completionTicket = await linkCompletionStore.create({
                provider: provider.adapter.provider,
                providerAccountId: profile.providerAccountId,
                expectedUserId: stateData.expectedUserId,
            });
            return res.redirect(clientRedirect("/dashboard", "oauth-link", completionTicket));
        }

        const oauthUser = await findOrCreateOAuthUser(provider.adapter.provider, profile);
        const appSession = await createApplicationSession(oauthUser.id);
        req.session = { user: appSession.user };
        res.cookie("Token", appSession.token, {
            httpOnly: false,
            sameSite: "lax",
            secure: myEnv.NODE_ENV === "production",
            path: "/",
            domain: myEnv.COOKIE_DOMAIN,
            maxAge: TOKEN_COOKIE_MAX_AGE,
        });
        return res.redirect(new URL("/", env.CLIENT_URL).toString());
    } catch (error) {
        return sendProviderError(req, res, error);
    }
};

const completeLink: RequestHandler = async (req, res) => {
    const ticket = typeof req.body?.ticket === "string" ? req.body.ticket : "";
    const linkData = ticket ? await linkCompletionStore.consume(ticket) : null;
    if (!linkData) {
        return res.status(400).error(req.t("auth.oauthLinkTicketInvalid"), "oauth_link_ticket_invalid");
    }
    if (linkData.expectedUserId !== req.session.user!.id) {
        return res.status(403).error(req.t("auth.oauthLinkUserMismatch"), "oauth_link_user_mismatch");
    }

    const identityWhere = {
        provider_providerAccountId: {
            provider: linkData.provider,
            providerAccountId: linkData.providerAccountId,
        },
    };
    const existingIdentity = await database.oAuthAccount.findUnique({ where: identityWhere });
    if (existingIdentity) {
        if (existingIdentity.userId !== req.session.user!.id) {
            const mergeTicket = await mergeConfirmationStore.create({
                provider: linkData.provider,
                providerAccountId: linkData.providerAccountId,
                expectedUserId: req.session.user!.id,
                sourceUserId: existingIdentity.userId,
            });
            return res.success(
                req.t("auth.oauthMergeRequired"),
                {
                    kind: "merge_required" as const,
                    provider: providerToSlug(linkData.provider),
                    ticket: mergeTicket,
                },
                "oauth_merge_required",
            );
        }
        return res.success(
            req.t("auth.oauthLinked"),
            {
                kind: "linked" as const,
                provider: providerToSlug(linkData.provider),
                linkedAt: existingIdentity.createdAt,
            },
            "oauth_account_linked",
        );
    }

    const existingProvider = await database.oAuthAccount.findUnique({
        where: {
            userId_provider: {
                userId: req.session.user!.id,
                provider: linkData.provider,
            },
        },
    });
    if (existingProvider) {
        return res
            .status(409)
            .error(req.t("auth.oauthProviderAlreadyLinked"), "oauth_provider_already_linked");
    }

    try {
        const account = await database.$transaction(async (tx) => {
            return tx.oAuthAccount.create({
                data: {
                    provider: linkData.provider,
                    providerAccountId: linkData.providerAccountId,
                    userId: req.session.user!.id,
                    lastLoginAt: new Date(),
                },
            });
        });
        return res.success(
            req.t("auth.oauthLinked"),
            {
                kind: "linked" as const,
                provider: providerToSlug(account.provider),
                linkedAt: account.createdAt,
            },
            "oauth_account_linked",
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const concurrentIdentity = await database.oAuthAccount.findUnique({
                where: identityWhere,
            });
            if (concurrentIdentity?.userId === req.session.user!.id) {
                return res.success(
                    req.t("auth.oauthLinked"),
                    {
                        kind: "linked" as const,
                        provider: providerToSlug(concurrentIdentity.provider),
                        linkedAt: concurrentIdentity.createdAt,
                    },
                    "oauth_account_linked",
                );
            }
            if (concurrentIdentity) {
                const mergeTicket = await mergeConfirmationStore.create({
                    provider: linkData.provider,
                    providerAccountId: linkData.providerAccountId,
                    expectedUserId: req.session.user!.id,
                    sourceUserId: concurrentIdentity.userId,
                });
                return res.success(
                    req.t("auth.oauthMergeRequired"),
                    {
                        kind: "merge_required" as const,
                        provider: providerToSlug(linkData.provider),
                        ticket: mergeTicket,
                    },
                    "oauth_merge_required",
                );
            }

            const concurrentProvider = await database.oAuthAccount.findUnique({
                where: {
                    userId_provider: {
                        userId: req.session.user!.id,
                        provider: linkData.provider,
                    },
                },
            });
            if (concurrentProvider) {
                return res
                    .status(409)
                    .error(req.t("auth.oauthProviderAlreadyLinked"), "oauth_provider_already_linked");
            }
            return res
                .status(409)
                .error(req.t("auth.oauthAccountAlreadyLinked"), "oauth_account_already_linked");
        }
        throw error;
    }
};

const completeMerge: RequestHandler = async (req, res) => {
    const ticket = typeof req.body?.ticket === "string" ? req.body.ticket : "";
    const mergeData = ticket ? await mergeConfirmationStore.consume(ticket) : null;
    if (!mergeData) {
        return res.status(400).error(req.t("auth.oauthMergeTicketInvalid"), "oauth_merge_ticket_invalid");
    }
    if (mergeData.expectedUserId !== req.session.user!.id) {
        return res.status(403).error(req.t("auth.oauthMergeUserMismatch"), "oauth_merge_user_mismatch");
    }

    try {
        const result = await mergeOAuthUsers({
            targetUserId: req.session.user!.id,
            sourceUserId: mergeData.sourceUserId,
            provider: mergeData.provider,
            providerAccountId: mergeData.providerAccountId,
        });
        return res.success(
            req.t("auth.oauthMerged"),
            {
                provider: providerToSlug(mergeData.provider),
                linkedAt: result.linkedAt,
            },
            "oauth_users_merged",
        );
    } catch (error) {
        if (error instanceof OAuthMergeError) {
            if (error.code === "provider_conflict") {
                return res
                    .status(409)
                    .error(req.t("auth.oauthMergeProviderConflict"), "oauth_merge_provider_conflict");
            }
            return res.status(409).error(req.t("auth.oauthMergeStale"), "oauth_merge_stale");
        }
        throw error;
    }
};

const unlinkAccount: RequestHandler = async (req, res) => {
    const provider = resolveProvider(req, res);
    if (!provider) return;

    const result = await database.$transaction(async (tx) => {
        await tx.$queryRaw(
            Prisma.sql`SELECT "id" FROM "User" WHERE "id" = ${req.session.user!.id} FOR UPDATE`,
        );
        const accounts = await tx.oAuthAccount.findMany({
            where: { userId: req.session.user!.id },
            select: { provider: true, providerAccountId: true },
        });
        const target = accounts.find((account) => account.provider === provider.adapter.provider);
        if (!target) return "missing" as const;
        if (accounts.length <= 1) return "last" as const;

        await tx.oAuthAccount.delete({
            where: {
                provider_providerAccountId: {
                    provider: target.provider,
                    providerAccountId: target.providerAccountId,
                },
            },
        });
        return "deleted" as const;
    });

    if (result === "missing") {
        return res.status(404).error(req.t("auth.oauthAccountNotLinked"), "oauth_account_not_linked");
    }
    if (result === "last") {
        return res.status(409).error(req.t("auth.oauthLastProvider"), "last_login_provider");
    }
    return res.success(req.t("auth.oauthUnlinked"), { provider: provider.slug }, "oauth_account_unlinked");
};

const validateLogin: RequestHandler = async (req, res) => {
    const user = req.session.user!;
    await achievements.handleUpdate(user, { context: "login" });
    const allAchievements = await database.achievement.findMany({});
    const userAchievementsIds = user.achievements.map((achievement) => achievement.id);
    const resultAchievements = allAchievements
        .map((achievement) => {
            const order = (achievementsOrder as Record<string, number>)[achievement.id];
            if (userAchievementsIds.includes(achievement.id)) return { ...achievement, order };
            return { ...achievement, secretUrl: null, description: null, order };
        })
        .toSorted((a, b) => a.order - b.order);
    const readableLimit = constants.upload.fileLimitPerRole[user.role] / 1024 / 1024;

    return res.success(null, {
        id: user.id,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        color: user.color,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        albums: user.albums,
        uploads: user.uploads,
        uploadCount: user.uploadCount,
        moderatedCommunities: user.moderatedCommunities,
        achievements: resultAchievements,
        readableLimit,
        authProviders: user.oauthAccounts.map((account) => ({
            provider: providerToSlug(account.provider),
            linkedAt: account.createdAt,
        })),
    });
};

const loginController = {
    validateLogin,
    oauthCallback,
    oauthRedirect,
    startLink,
    linkRedirect,
    completeLink,
    completeMerge,
    unlinkAccount,
};

export default loginController;
