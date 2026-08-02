import { describe, expect, test } from "bun:test"
import nextConfig from "../next.config"
import {
    POSTHOG_ASSET_PROXY_PATH,
    obfuscatePostHogAssetUrl,
} from "@/config/posthog"

const decodeAlias = (alias: string) => {
    const encodedPath = new URL(alias).pathname.split("/").at(-1)!
    return Buffer.from(encodedPath, "base64url").toString("utf8")
}

describe("PostHog asset aliases", () => {
    test.each([
        "/faro/static/dead-clicks-autocapture.js?v=1.404.1",
        "/faro/static/recorder.js?v=1.404.1",
        "/faro/static/surveys.js?v=1.404.1",
        "/faro/array/phc_project/config.js",
    ])("hides and preserves %s", (path) => {
        const alias = obfuscatePostHogAssetUrl(`https://feridinha.com${path}`)

        expect(new URL(alias).pathname).toStartWith(`${POSTHOG_ASSET_PROXY_PATH}/`)
        expect(alias).not.toContain(path.split("/").at(-1)!.split("?")[0])
        expect(decodeAlias(alias)).toBe(path)
    })
})

describe("PostHog ingestion proxy", () => {
    test("preserves trailing slashes used by ingestion endpoints", () => {
        expect(nextConfig.skipTrailingSlashRedirect).toBe(true)
    })
})
