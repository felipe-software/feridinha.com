import muralController from "@/controllers/mural";
import communityRoute from "./community";
import middlewares from "@/middlewares";
import { muralValidations } from "@/validations/mural";
import { Router } from "express";
import asyncHandler from "@/utils/asyncHandler";

const route = Router();

route.use(middlewares.rateLimit.mural);
route.use("/community", communityRoute);

route.post(
    "/create",
    middlewares.auth({ strict: true }),
    middlewares.zod(muralValidations.createPostSchema, "body"),
    middlewares.mural.community({ source: "body" }),
    asyncHandler(muralController.createPost)
);

route.post(
    "/:id/vote/:vote",
    middlewares.auth({ strict: true }),
    middlewares.zod(muralValidations.votePostParamsSchema, "params"),
    asyncHandler(muralController.upvotePost)
);

route.post(
    "/:id/moderate",
    middlewares.auth({ strict: true }),
    middlewares.zod(muralValidations.approvePostParamsSchema, "params"),
    middlewares.zod(muralValidations.approvePostSchema, "body"),
    middlewares.mural.community({ source: "fromPost" }),
    middlewares.mural.muralAuth(),
    asyncHandler(muralController.moderatePost)
);

route.get(
    "/list",
    middlewares.auth({ strict: false }),
    middlewares.zod(muralValidations.listPostsQuerySchema, "query"),
    middlewares.mural.community({ source: "query" }),
    middlewares.mural.muralAuth({ onlyWhen: (req) => req.query.approvalStatus != "approved" }),
    asyncHandler(muralController.listPosts)
);

export default route;
