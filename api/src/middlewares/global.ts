import logger from "@/config/logger";
import { ApiLocale } from "@/i18n/config";
import type {
    CommunityWithModeratorsId,
    CommunityWithModeratorsFull,
    PostWithCommunity,
} from "@/models/communityModel";
import { Prisma } from "@prisma/client";
import { Request, RequestHandler, Response } from "express";
import ms from "ms";

type ExpressRequest = Request;

declare global {
    namespace Express {
        interface Response {
            success: <T = undefined>(message: string | null, data?: T, code?: string) => void;
            error: <T = undefined>(error: T, code?: string) => void;
        }

        interface Request {
            perfomanceStart: number;
            perfomanceEnd?: number;
            session: {
                user?: Prisma.UserGetPayload<{
                    include: { uploads: true; achievements: true };
                }>;
            };
            getIdentity: (req: ExpressRequest) => string;
            muralCommunity?: CommunityWithModeratorsId | CommunityWithModeratorsFull;
            muralPost?: PostWithCommunity;
            locale?: ApiLocale;
            t: (key: string, options?: Record<string, unknown>) => string;
        }
    }
}

const handleSuccess = (res: Response) => (message: string | null, data?: any, code?: string) => {
    res.json({
        success: true,
        message,
        data,
        code,
    });
};

const handleError = (res: Response) => (error: any, code?: string) => {
    res.json({
        success: false,
        error,
        code,
    });
};

const globalMiddleware: RequestHandler = (req, res, next) => {
    req.locale = (req.language as ApiLocale | undefined) ?? "pt-BR";
    req.perfomanceStart = performance.now();
    req.on("end", () => {
        const time = performance.now() - req.perfomanceStart;
        const timePretty = ms(Number(time.toFixed(2)));
        logger.info({
            msg: `${req.method} (${req.getIdentity(req)}) ${req.path} ${timePretty}`,
            ip: req.ip,
            from: req.headers["origin"] ?? "none",
            path: req.path,
            method: req.method,
            userAgent: (req.headers["user-agent"]) ?? "none",
            timeTaken: time
        });
    });
    res.success = handleSuccess(res);
    res.error = handleError(res);
    req.getIdentity = (req: ExpressRequest) => {
        if (req.session && req.session.user) {
            return `${req.session.user.name}@${req.ip}`;
        }
        return `anonymous@${req.ip}`;
    };
    next();
};

export default globalMiddleware;
