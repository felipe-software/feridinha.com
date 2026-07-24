const sensitiveKeys = new Set([
    "access_token",
    "authorization",
    "client_secret",
    "code",
    "refresh_token",
    "state",
    "ticket",
]);

export const stripLoginQuery = (value: string) => {
    try {
        const url = new URL(value);
        if (!url.pathname.startsWith("/login/")) return value;
        url.search = "";
        return url.toString();
    } catch {
        const [pathname] = value.split("?");
        return pathname.startsWith("/login/") ? pathname : value;
    }
};

export const redactSensitiveTelemetry = (
    value: unknown,
    seen = new WeakSet<object>(),
): unknown => {
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return value;
    seen.add(value);

    if (Array.isArray(value)) {
        value.forEach((item) => redactSensitiveTelemetry(item, seen));
        return value;
    }

    const record = value as Record<string, unknown>;
    for (const [key, item] of Object.entries(record)) {
        if (sensitiveKeys.has(key.toLowerCase())) {
            record[key] = "[REDACTED]";
            continue;
        }
        if (key.toLowerCase() === "url" && typeof item === "string") {
            record[key] = stripLoginQuery(item);
            continue;
        }
        redactSensitiveTelemetry(item, seen);
    }
    return value;
};
