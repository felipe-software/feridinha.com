import session from "@/handlers/session";
import database from "@/services/database";
import { RequestHandler } from "express";
import asyncHandler from "@/utils/asyncHandler";

const authMiddleware =
    (options: { strict: boolean }): RequestHandler =>
    asyncHandler(async (req, res, next) => {
        const authorizationHeader = req.headers.authorization?.trim();
        const apiKeyString = req.headers["token"]?.toString();

        if (authorizationHeader && apiKeyString) {
            return res.status(400).error(req.t("auth.multipleCredentials"), "multiple_credentials");
        }

        if (!authorizationHeader && !apiKeyString) {
            if (options.strict) {
                return res.status(401).error(req.t("auth.tokenNotProvided"), "token_not_provided");
            }
            req.session = {};
            return next();
        }

        if (apiKeyString) {
            const apiKey = await database.apiKey.findFirst({
                where: {
                    secret: apiKeyString,
                },
                include: {
                    user: {
                        include: {
                            uploads: true,
                            achievements: true,
                            albums: true,
                            moderatedCommunities: { select: { name: true, id: true } },
                        },
                    },
                },
            });

            if (!apiKey) return res.status(401).error(req.t("auth.invalidApiKey"), "invalid_api_key");
            req.session = { user: apiKey.user };
            return next();
        }

        const rawToken = authorizationHeader!.replace(/^Bearer\s+/i, "").trim();
        if (!rawToken) return res.status(401).error(req.t("auth.invalidToken"), "invalid_token");

        try {
            const user = await session.verify(rawToken);
            req.session = { user };
            return next();
        } catch (error) {
            const errorName = error instanceof Error ? error.name : "";
            if (errorName === "TokenExpiredError") {
                return res.status(401).error(req.t("auth.sessionExpired"), "session_expired");
            }
            if (errorName === "session_not_found") {
                return res.status(401).error(req.t("auth.sessionNotFound"), "session_not_found");
            }
            return res.status(401).error(req.t("auth.invalidToken"), "invalid_token");
        }
    });

export default authMiddleware;
