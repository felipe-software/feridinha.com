import { Request, RequestHandler } from "express";

type OnlyWhenPredicate = (req: Request) => boolean;

const muralAuthMiddleware =
    (options?: { onlyWhen?: OnlyWhenPredicate }): RequestHandler =>
    (req, res, next) => {
        if (options?.onlyWhen && !options.onlyWhen(req)) {
            return next();
        }

        const user = req.session?.user;
        if (!user) {
            return res.status(401).error(req.t("auth.authenticationRequired"));
        }

        const community = req.muralCommunity;
        if (!community) {
            return res.status(500).error(req.t("community.loadMissing"));
        }

        const isMod =
            (community.createdById != null && community.createdById === user.id) ||
            community.moderators.some((m) => m.id === user.id);

        if (!isMod) {
            return res.status(403).error(req.t("community.modOnly"));
        }

        next();
    };

export default muralAuthMiddleware;
