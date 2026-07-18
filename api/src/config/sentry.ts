import env from "@/config/env";
import logger from "@/config/logger";
import * as Sentry from "@sentry/bun";
import { $ } from "bun";

const getRelease = async () => {
    try {
        const branch = await $`git rev-parse --abbrev-ref HEAD`.quiet();
        const commit = await $`git rev-parse --short HEAD`.quiet();
        return `${branch.stdout.toString().trim()}#${commit.stdout.toString().trim()}`;
    } catch (_err) {
        return process.env.SENTRY_RELEASE_ENV ?? "unknown"
    }
};

const release = await getRelease();

if (env.NODE_ENV !== "development") {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        tracesSampleRate: 1.0,
        release,
        environment: env.NODE_ENV,
    });
    logger.info({ msg: "Sentry iniciado", release, environment: env.NODE_ENV });
} else {
    logger.warn({ msg: "Sentry desativado em ambiente de desenvolvimento" });
}
