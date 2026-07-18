import { validateSchema } from "@/middlewares/zod";
import globalMiddleware from "./global";
import authMiddleware from "@/middlewares/auth";
import rateLimit from "@/middlewares/rate-limit";
import { community as muralCommunity, muralAuth } from "./mural";

const middlewares = {
    global: globalMiddleware,
    auth: authMiddleware,
    zod: validateSchema,
    rateLimit: rateLimit,
    mural: {
        community: muralCommunity,
        muralAuth,
    },
};

export default middlewares;