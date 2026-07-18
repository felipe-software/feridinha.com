import env from "@/config/env";
import expressRateLimit from "express-rate-limit";

export const rateLimitMessage = (req: any) => ({
    success: false,
    error: req.t("common.rateLimited"),
    code: "rate_limited",
});

const headers = { standardHeaders: false, legacyHeaders: false };

const forcedRateLimit = env.NODE_ENV === "test" ? 99999999 : null

const rateLimit = {
    login: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 20,
        ...headers,
        message: rateLimitMessage,
    }),
    upload: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 20,
        ...headers,
        message: rateLimitMessage,
    }),

    delete: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 15,
        ...headers,
        message: rateLimitMessage,
    }),

    user: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 60,
        ...headers,
        message: rateLimitMessage,
    }),

    apiKey: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 30,
        ...headers,
        message: rateLimitMessage,
    }),

    deleteAuthenticated: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 100,
        ...headers,
        message: rateLimitMessage,
    }),
    feedback: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 20,
        ...headers,
        message: rateLimitMessage,
    }),

    mural: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 60,
        ...headers,
        message: rateLimitMessage,
    }),
    album: expressRateLimit({
        windowMs: 1 * 60 * 1000,
        max: forcedRateLimit ?? 120,
        ...headers,
        message: rateLimitMessage,
    }),
};

export default rateLimit;
