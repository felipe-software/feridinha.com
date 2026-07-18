import logger from "@/config/logger";
import middlewares from "@/middlewares";
import database from "@/services/database";
import { tryP } from "@/utils/promises";
import { Review } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import asyncHandler from "@/utils/asyncHandler";

const route = Router();
route.use(middlewares.rateLimit.feedback);
let lastTimeFetched: Date | null = null;
let homeReviewsCache: Review[] = [];

export const getRandomItems = <T>(arr: T[], n: number): T[] => {
    const result = arr.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result.slice(0, n);
};

const isCacheFresh = () => {
    if (lastTimeFetched === null) return false;
    return new Date().getTime() - lastTimeFetched!.getTime() < 1000 * 60 * 5;
};

route.get(
    "/home-reviews",
    middlewares.auth({
        strict: false,
    }),
    asyncHandler(async (req, res) => {
        const [error, result] = await tryP(
            database.review.findMany({
                where: { hasBeenApproved: true },
                include: {
                    user: {
                        select: {
                            name: true,
                            createdAt: true,
                            uploadCount: true,
                            color: true,
                            profileImage: true,
                        },
                    },
                },
            })
        );

        let userResult: Review | null = null;
        let userError: unknown;
        if (req.session.user?.id) {
            const [_userError, _userResult] = await tryP(
                database.review.findUnique({
                    where: { userId: req.session.user!.id },
                    include: {
                        user: {
                            select: {
                                name: true,
                                createdAt: true,
                                uploadCount: true,
                                color: true,
                                profileImage: true,
                            },
                        },
                    },
                })
            );

            userResult = _userResult as Review;
            userError = _userError;
        }

        if (error || userError) {
            res.error(req.t("feedback.reviewListError"));
            return logger.error({ msg: "Erro ao buscar reviews", error, userError });
        }

        if (isCacheFresh())
            return res.success(null, { public: getRandomItems(homeReviewsCache, 50), yours: userResult });

        lastTimeFetched = new Date();
        homeReviewsCache = result;

        res.success(null, { public: getRandomItems(result, 50), yours: userResult });
    })
);

const feedbackReviewSchema = z.object({
    review: z.string().min(3).max(300),
    suggestion: z.string().max(300).optional(),
});

route.post(
    "/review/create",
    middlewares.auth({ strict: true }),
    middlewares.zod(feedbackReviewSchema, "body"),
    asyncHandler(async (req, res) => {
        const body = req.body as z.infer<typeof feedbackReviewSchema>;
        const [error, result] = await tryP(
            database.review.create({
                data: {
                    content: body.review,
                    suggestion: body.suggestion,
                    hasBeenApproved: false,
                    userId: req.session.user!.id,
                },
            })
        );

        if (error) {
            logger.error({ msg: "Erro ao criar review", error, body });
            return res.error(req.t("feedback.reviewCreateError"));
        }

        res.success(req.t("feedback.reviewCreated"), result);
    })
);

export default route;
