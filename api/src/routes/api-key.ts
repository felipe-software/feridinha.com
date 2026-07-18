import crypto from "crypto";
import logger from "@/config/logger";
import middlewares from "@/middlewares";
import rateLimit from "@/middlewares/rate-limit";
import database from "@/services/database";
import { Router } from "express";
import { z } from "zod";
import asyncHandler from "@/utils/asyncHandler";

const route = Router();
route.use(rateLimit.apiKey);
route.get("/list", middlewares.auth({ strict: true }), asyncHandler(async (req, res) => {
    const apiKeys = await database.apiKey.findMany({ where: { userId: req.session.user!.id } });
    res.success(null, apiKeys);
}));

route.delete("/:id", middlewares.auth({ strict: true }), asyncHandler(async (req, res) => {
    const apiKey = await database.apiKey.findUnique({
        where: {
            id: req.params.id,
        },
        include: {
            user: true,
        },
    });

    if (!apiKey) {
        return res.error(req.t("apiKey.notFound"));
    }

    if (apiKey.userId !== req.session.user!.id) {
        logger.fatal({
            msg: "Usuário tentando apagar api-key do outro",
            apiKeyUserId: apiKey.id,
            userId: req.session.user!.id,
        });
        return res.error(req.t("apiKey.forbiddenDelete"));
    }

    await database.apiKey.delete({
        where: {
            id: req.params.id,
        },
    });

    res.success(req.t("apiKey.deleted"));
}));

const apiKeySchema = z.object({
    name: z.string().max(30).min(3),
    tag: z.string().max(20).min(3).optional(),
});

const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

const getId = () => {
    const bytes = crypto.randomBytes(16);
    return [...bytes].map((byte) => characters[byte % characters.length]).join("");
};

route.post(
    "/create",
    middlewares.auth({ strict: true }),
    middlewares.zod(apiKeySchema, "body"),
    asyncHandler(async (req, res) => {
        const body = req.body as z.infer<typeof apiKeySchema>;
        const secret = getId();
        const apiKey = await database.apiKey.create({
            data: {
                secret: secret,
                name: body.name,
                tag: body.tag,
                user: {
                    connect: {
                        id: req.session.user!.id,
                    },
                },
            },
        });

        res.success(req.t("apiKey.created"), apiKey, "new-api-key");
    })
);

export default route;
