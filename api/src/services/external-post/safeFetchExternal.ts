import { myEnv } from "@/config/env";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const DEFAULT_TIMEOUT_MS = 15_000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export class SafeFetchError extends Error {
    constructor(readonly code: string) {
        super(code);
        this.name = "SafeFetchError";
    }
}

export const hostMatchesRule = (hostname: string, rule: string) => {
    const normalizedHost = hostname.toLowerCase().replace(/\.$/, "");
    const normalizedRule = rule.toLowerCase().replace(/^\./, "").replace(/\.$/, "");
    return normalizedHost === normalizedRule || normalizedHost.endsWith(`.${normalizedRule}`);
};

export const isBlockedIp = (address: string) => {
    const version = isIP(address);
    if (version === 4) {
        const parts = address.split(".").map(Number);
        const [a, b] = parts;
        if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
        return (
            a === 0 ||
            a === 10 ||
            a === 127 ||
            (a === 100 && b >= 64 && b <= 127) ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && (b === 0 || b === 168)) ||
            (a === 198 && (b === 18 || b === 19 || b === 51)) ||
            (a === 203 && b === 0) ||
            a >= 224
        );
    }

    if (version === 6) {
        const normalized = address.toLowerCase().split("%")[0];
        const embeddedIpv4 = normalized.match(/(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
        if (embeddedIpv4 && isBlockedIp(embeddedIpv4)) return true;
        const [headPart, tailPart = ""] = normalized.split("::");
        const head = headPart ? headPart.split(":") : [];
        const tail = tailPart ? tailPart.split(":") : [];
        const expanded = [...head, ...Array(Math.max(0, 8 - head.length - tail.length)).fill("0"), ...tail].map(
            (part) => Number.parseInt(part || "0", 16),
        );
        if (expanded.every((part) => part === 0)) return true;
        if (expanded.slice(0, 7).every((part) => part === 0) && expanded[7] === 1) return true;
        if (expanded.slice(0, 5).every((part) => part === 0) && expanded[5] === 0xffff) {
            const mapped = `${expanded[6] >> 8}.${expanded[6] & 0xff}.${expanded[7] >> 8}.${expanded[7] & 0xff}`;
            if (isBlockedIp(mapped)) return true;
        }
        const first = Number.parseInt(normalized.split(":")[0] || "0", 16);
        return (
            (first & 0xfe00) === 0xfc00 ||
            (first & 0xffc0) === 0xfe80 ||
            (first & 0xffc0) === 0xfec0 ||
            (first & 0xff00) === 0xff00 ||
            normalized.startsWith("2001:db8:")
        );
    }

    return true;
};

export const validateExternalDestination = async (
    url: URL,
    platformHosts: readonly string[],
    globalHosts: readonly string[],
    signal: AbortSignal,
    allowTestLocalhost = false,
) => {
    const isTestLocalhost = allowTestLocalhost && myEnv.NODE_ENV === "test" && url.hostname === "localhost";
    if (url.protocol !== "https:" && !isTestLocalhost) throw new SafeFetchError("https_required");
    if (url.username || url.password) throw new SafeFetchError("url_credentials_forbidden");

    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (hostname === "localhost" && !isTestLocalhost) throw new SafeFetchError("private_address");
    if (!platformHosts.some((rule) => hostMatchesRule(hostname, rule))) {
        throw new SafeFetchError("platform_host_not_allowed");
    }
    if (!globalHosts.some((rule) => hostMatchesRule(hostname, rule))) {
        throw new SafeFetchError("host_not_allowed");
    }

    const addresses = isIP(hostname)
        ? [{ address: hostname }]
        : await Promise.race([
              lookup(hostname, { all: true, verbatim: true }),
              new Promise<never>((_, reject) =>
                  signal.addEventListener("abort", () => reject(new SafeFetchError("timeout")), { once: true }),
              ),
          ]);
    if (addresses.length === 0 || (!isTestLocalhost && addresses.some(({ address }) => isBlockedIp(address)))) {
        throw new SafeFetchError("private_address");
    }
};

export interface SafeFetchOptions {
    platformHosts: readonly string[];
    globalHosts?: readonly string[];
    maxBytes: number;
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxRedirects?: number;
    allowTestLocalhost?: boolean;
}

export const readBodyWithLimit = async (response: Response, maxBytes: number, controller: AbortController) => {
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        await response.body?.cancel();
        throw new SafeFetchError("body_too_large");
    }
    if (!response.body) throw new SafeFetchError("empty_body");

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value.byteLength;
            if (totalBytes > maxBytes) {
                controller.abort();
                throw new SafeFetchError("body_too_large");
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes);
};

export const safeFetchExternal = async (input: string, options: SafeFetchOptions) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    let currentUrl = new URL(input);

    try {
        const maxRedirects = options.maxRedirects ?? 3;
        let response: Response | undefined;

        for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
            await validateExternalDestination(
                currentUrl,
                options.platformHosts,
                options.globalHosts ?? myEnv.MURAL_MEDIA_ALLOWED_HOSTS,
                controller.signal,
                options.allowTestLocalhost,
            );
            response = await fetch(currentUrl, {
                headers: options.headers,
                redirect: "manual",
                signal: controller.signal,
            });

            if (!REDIRECT_STATUSES.has(response.status)) break;
            if (redirects === maxRedirects) throw new SafeFetchError("too_many_redirects");
            const location = response.headers.get("location");
            if (!location) throw new SafeFetchError("invalid_redirect");
            await response.body?.cancel();
            currentUrl = new URL(location, currentUrl);
        }

        if (!response || !response.ok) throw new SafeFetchError("upstream_fetch_failed");
        const body = await readBodyWithLimit(response, options.maxBytes, controller);

        return {
            body,
            contentType: response.headers.get("content-type"),
            finalUrl: currentUrl,
        };
    } catch (error) {
        if (controller.signal.aborted && !(error instanceof SafeFetchError)) {
            throw new SafeFetchError("timeout");
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
};
