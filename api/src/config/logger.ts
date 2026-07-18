import pino from "pino";
import type { PrettyOptions } from "pino-pretty";
import type { LokiOptions } from "pino-loki";
import axios from "axios";
import { myEnv } from "@/config/env";
import fs from "fs"
import path from "path";

const targetLogsFolder = path.join(process.cwd(), "logs")
if(!fs.existsSync(targetLogsFolder)) {
    console.log("Creating logs folder at", targetLogsFolder)
    fs.mkdirSync(targetLogsFolder)
}

const pinoPrettyOptions: PrettyOptions = {
    colorize: true,
    singleLine: true,
    errorLikeObjectKeys: [],
    ignore: "pid,hostname",
    translateTime: "yyyy-mm-dd HH:MM:ss",
};

const isUsingLoki = !!(myEnv.LOKI_URL && myEnv.LOKI_USER && myEnv.LOKI_PASSWORD);

const targets: Array<{ target: string; level?: string; options?: unknown }> = [];

if (isUsingLoki) {
    targets.push({
        target: "pino-loki",
        options: {
            host: myEnv.LOKI_URL!,
            basicAuth: {
                username: myEnv.LOKI_USER!,
                password: myEnv.LOKI_PASSWORD!,
            },
            labels: {
                app: "feridinha",
                environment: myEnv.NODE_ENV,
            },
        } as LokiOptions,
    });
}

targets.push(
    {
        target: "pino-pretty",
        options: pinoPrettyOptions,
    },
    {
        target: "pino/file",
        level: "info",
        options: {
            destination: `./logs/${new Date().toISOString().slice(0, 10)}.log`,
        },
    }
);

const logger = pino({
    level: myEnv.LOG_LEVEL,
    redact: {
        paths: [
            "authorization",
            "Authorization",
            "client_secret",
            "access_token",
            "refresh_token",
            "*.authorization",
            "*.Authorization",
            "*.client_secret",
            "*.access_token",
            "*.refresh_token",
            "oauth.code",
            "*.oauth.code",
            "*.query.code",
            "*.body.code",
            "*.headers.authorization",
            "*.headers.Authorization",
        ],
        censor: "[REDACTED]",
    },
    transport: { targets: targets as any },
});

async function checkLokiAuth() {
    if (!isUsingLoki) {
        logger.info("Loki logging disabled (missing credentials or URL)");
        return;
    }

    const url = `${myEnv.LOKI_URL}/loki/api/v1/labels`;
    try {
        await axios.get(url, {
            auth: {
                username: myEnv.LOKI_USER!,
                password: myEnv.LOKI_PASSWORD!,
            },
            timeout: 5000,
        });
        logger.info({ lokiUrl: myEnv.LOKI_URL }, "Successfully authenticated to Loki");
    } catch (err) {
        logger.error({ err, lokiUrl: myEnv.LOKI_URL }, "Failed to authenticate to Loki");
    }
}

checkLokiAuth();

if (isUsingLoki) {
    // @ts-ignore: pino transport instance typing
    const lokiTarget = targets.find((t) => t.target === "pino-loki");
    if (lokiTarget && typeof lokiTarget === "object") {
        // @ts-ignore
        logger.on("error", (err: Error) => {
            logger.error({ err }, "Pino transport error");
        });
    }
}

export default logger;
