import { myEnv } from "@/config/env";
import logger from "@/config/logger";
import "@/config/sentry";
import achievements from "@/handlers/achievements";
import { i18nMiddleware } from "@/i18n";
import { ensureGeralCommunity } from "@/services/muralCommunity";
import staticServe from "@/services/static";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import path from "path";
import middlewares from "./middlewares";
import routes from "./routes";
import os from "os";
import { tempPreviewDir } from "@/handlers/preview";
import { mkdir } from "fs";
import asyncHandler from "@/utils/asyncHandler";
import { publicErrorDetails } from "@/utils/httpErrors";
import type { ErrorRequestHandler } from "express";

const app = express();
app.set("trust proxy", myEnv.PROXY_TRUST);
app.disable("x-powered-by");
const clientOrigin = new URL(myEnv.CLIENT_URL).origin;
app.use(
    cors({
        credentials: false,
        origin: (origin, callback) => callback(null, !origin || origin === clientOrigin),
    }),
);
app.use(bodyParser.json({}));
app.use(i18nMiddleware);
app.use(middlewares.global);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/f/p", express.static(tempPreviewDir));
app.use("/f", asyncHandler(staticServe.middleware));
app.use(routes);


// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: req.t("common.routeNotFound"),
        code: "not_found",
    });
});

const finalErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    logger.error(
        { error: publicErrorDetails(error), method: req.method, path: req.path },
        "Unhandled request error",
    );
    if (res.headersSent) return;
    res.status(500).json({
        success: false,
        error: req.t("common.internalError"),
        code: "internal_error",
    });
};

app.use(finalErrorHandler);

// Initialize achievements
achievements.init();

ensureGeralCommunity().catch((err) => {
    logger.error({ err }, "Erro ao garantir comunidade geral");
});

mkdir(tempPreviewDir, { recursive: true }, (err) => {
    if (err) {
        logger.error({ error: err }, "Erro ao criar diretório temporário para previews");
    }
})
logger.info(`Diretório temporário para previews: ${tempPreviewDir}`);

export default app;
