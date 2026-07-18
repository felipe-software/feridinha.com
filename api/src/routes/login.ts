import loginController from "@/controllers/login";
import middlewares from "@/middlewares";
import rateLimit from "@/middlewares/rate-limit";
import { Router } from "express";
import asyncHandler from "@/utils/asyncHandler";

const route = Router();

route.use(rateLimit.login);
route.get("/twitch/redirect", loginController.twitchRedirect);
route.get("/twitch/callback", asyncHandler(loginController.twitchCallback));
route.get(
    "/validate",
    middlewares.auth({
        strict: true,
    }),
    asyncHandler(loginController.validateLogin)
);

export default route;
