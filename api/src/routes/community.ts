import communityController from "@/controllers/community";
import middlewares from "@/middlewares";
import { communityValidations } from "@/validations/community";
import { Router } from "express";
import asyncHandler from "@/utils/asyncHandler";

const route = Router();

route.use(middlewares.rateLimit.mural);

route.post(
    "/create",
    middlewares.auth({ strict: true }),
    middlewares.zod(communityValidations.createCommunitySchema, "body"),
    asyncHandler(communityController.createCommunity)
);

route.get(
    "/list",
    asyncHandler(communityController.listCommunities)
);

route.get(
    "/user",
    middlewares.auth({ strict: true }),
    middlewares.zod(communityValidations.findUserQuerySchema, "query"),
    middlewares.mural.community({ source: "query", param: "communityId" }),
    middlewares.mural.muralAuth(),
    asyncHandler(communityController.findUser)
);

route.get(
    "/:id/moderator",
    middlewares.auth({ strict: true }),
    middlewares.zod(communityValidations.communityParamsSchema, "params"),
    middlewares.mural.community({ source: "params", param: "id", moderatorsFull: true }),
    middlewares.mural.muralAuth(),
    asyncHandler(communityController.getModerators)
);

route.post(
    "/:id/moderator/add",
    middlewares.auth({ strict: true }),
    middlewares.zod(communityValidations.communityParamsSchema, "params"),
    middlewares.zod(communityValidations.moderatorIdSchema, "body"),
    middlewares.mural.community({ source: "params", param: "id" }),
    middlewares.mural.muralAuth(),
    asyncHandler(communityController.addModerator)
);

route.post(
    "/:id/moderator/remove",
    middlewares.auth({ strict: true }),
    middlewares.zod(communityValidations.communityParamsSchema, "params"),
    middlewares.zod(communityValidations.moderatorIdSchema, "body"),
    middlewares.mural.community({ source: "params", param: "id" }),
    middlewares.mural.muralAuth(),
    asyncHandler(communityController.removeModerator)
);

route.get(
    "/:id",
    middlewares.zod(communityValidations.communityParamsSchema, "params"),
    asyncHandler(communityController.getCommunity)
);

export default route;
