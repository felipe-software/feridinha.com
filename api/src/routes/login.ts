import loginController from "@/controllers/login";
import middlewares from "@/middlewares";
import rateLimit from "@/middlewares/rate-limit";
import asyncHandler from "@/utils/asyncHandler";
import { Router } from "express";

const route = Router();
const strictAuth = middlewares.auth({ strict: true });

route.use(rateLimit.login);
route.post("/accounts/link/complete", strictAuth, asyncHandler(loginController.completeLink));
route.post("/accounts/merge/complete", strictAuth, asyncHandler(loginController.completeMerge));
route.put("/accounts/primary", strictAuth, asyncHandler(loginController.setPrimaryAccount));
route.delete("/accounts/:provider", strictAuth, asyncHandler(loginController.unlinkAccount));
route.post("/:provider/link", strictAuth, asyncHandler(loginController.startLink));
route.get("/:provider/link/redirect", asyncHandler(loginController.linkRedirect));
route.get("/:provider/redirect", asyncHandler(loginController.oauthRedirect));
route.get("/:provider/callback", asyncHandler(loginController.oauthCallback));
route.get("/validate", strictAuth, asyncHandler(loginController.validateLogin));

export default route;
