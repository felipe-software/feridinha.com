import { externalPostRegexes, PROXY_DOMAINS, PROXY_HOSTS, PROXY_USER_AGENTS } from "@/services/external-post/constants";
import { safeFetchExternal } from "@/services/external-post/safeFetchExternal";

const MAX_HTML_BYTES = 5 * 1024 * 1024;

type ExternalFetcher = typeof safeFetchExternal;

export function toProxyUrl(url: string, platform: keyof typeof PROXY_DOMAINS): string {
    const proxyBase = PROXY_DOMAINS[platform];
    try {
        const parsed = new URL(url);
        const proxy = new URL(proxyBase);
        parsed.protocol = proxy.protocol;
        parsed.host = proxy.host;
        const result = parsed.toString();
        return result;
    } catch {
        return url;
    }
}

export async function fetchHtml(
    url: string,
    source: keyof typeof PROXY_DOMAINS,
    fetcher: ExternalFetcher = safeFetchExternal,
): Promise<string> {
    const result = await fetcher(url, {
        hostPolicy:
            source === "instagram"
                ? { mode: "initial-only", hosts: PROXY_HOSTS[source] }
                : { mode: "every-hop", hosts: PROXY_HOSTS[source] },
        trustedPrivateHosts: source === "reddit" ? [new URL(PROXY_DOMAINS.reddit).hostname] : undefined,
        maxBytes: MAX_HTML_BYTES,
        headers: { "User-Agent": PROXY_USER_AGENTS[source] },
    });
    return result.body.toString("utf8");
}

async function resolveReddit(url: string, fetcher?: ExternalFetcher): Promise<string> {
    const proxyUrl = toProxyUrl(url, "reddit");
    return fetchHtml(proxyUrl, "reddit", fetcher);
}

async function resolveInstagram(url: string, fetcher?: ExternalFetcher): Promise<string> {
    const proxyUrl = toProxyUrl(url, "instagram");
    return fetchHtml(proxyUrl, "instagram", fetcher);
}

async function resolveTiktok(url: string, fetcher?: ExternalFetcher): Promise<string> {
    const proxyUrl = toProxyUrl(url, "tiktok");
    return fetchHtml(proxyUrl, "tiktok", fetcher);
}

async function resolveTwitter(url: string, fetcher?: ExternalFetcher): Promise<string> {
    const proxyUrl = toProxyUrl(url, "twitter");
    return fetchHtml(proxyUrl, "twitter", fetcher);
}

function detectPlatform(url: string): keyof typeof PROXY_DOMAINS | null {
    if (externalPostRegexes.reddit.test(url)) return "reddit";
    if (externalPostRegexes.instagram.test(url)) return "instagram";
    if (externalPostRegexes.tiktok.test(url)) return "tiktok";
    if (externalPostRegexes.twitter.test(url)) return "twitter";
    return null;
}

async function resolveHtml(url: string, fetcher?: ExternalFetcher): Promise<string> {
    const platform = detectPlatform(url);
    if (!platform) {
        throw new Error(`Unsupported external post URL: ${url}`);
    }
    switch (platform) {
        case "reddit":
            return resolveReddit(url, fetcher);
        case "instagram":
            return resolveInstagram(url, fetcher);
        case "tiktok":
            return resolveTiktok(url, fetcher);
        case "twitter":
            return resolveTwitter(url, fetcher);
    }
}

export const externalPostResolver = {
    resolveHtml,
    resolveReddit,
    resolveInstagram,
    resolveTiktok,
    resolveTwitter,
    detectPlatform,
};
