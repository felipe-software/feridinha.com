import env from "@/config/env";
import logger from "@/config/logger";
import * as Sentry from "@sentry/bun";
import { $ } from "bun";
import {
    redactSensitiveTelemetry,
    stripLoginQuery,
} from "@/utils/sanitizeTelemetry";

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

export const sanitizeSentryEvent = <T extends {
    request?: {
        url?: string;
        query_string?: unknown;
        headers?: Record<string, string>;
        data?: unknown;
        cookies?: unknown;
    };
    breadcrumbs?: Array<{ data?: Record<string, unknown> }>;
    contexts?: Record<string, unknown>;
    extra?: Record<string, unknown>;
}>(
    event: T,
) => {
    const request = event.request;
    if (request) {
        if (request.url) {
            const sanitizedUrl = stripLoginQuery(request.url);
            if (sanitizedUrl !== request.url) {
                request.url = sanitizedUrl;
                request.query_string = undefined;
            }
        }

        if (request.headers) {
            for (const key of Object.keys(request.headers)) {
                if (["authorization", "cookie", "set-cookie"].includes(key.toLowerCase())) {
                    delete request.headers[key];
                }
            }
        }
        if ("cookies" in request) delete request.cookies;
        redactSensitiveTelemetry(request.data);
    }

    redactSensitiveTelemetry(event.extra);
    redactSensitiveTelemetry(event.contexts);
    for (const breadcrumb of event.breadcrumbs ?? []) {
        if (breadcrumb.data) {
            redactSensitiveTelemetry(breadcrumb.data);
            const url = breadcrumb.data.url;
            if (typeof url === "string") breadcrumb.data.url = stripLoginQuery(url);
        }
    }

    return event;
};

if (env.NODE_ENV !== "development") {
    Sentry.init({
        dsn: env.SENTRY_DSN,
        tracesSampleRate: 1.0,
        release,
        environment: env.NODE_ENV,
        beforeSend: sanitizeSentryEvent,
        beforeSendTransaction: sanitizeSentryEvent,
    });
    logger.info({ msg: "Sentry iniciado", release, environment: env.NODE_ENV });
} else {
    logger.warn({ msg: "Sentry desativado em ambiente de desenvolvimento" });
}
