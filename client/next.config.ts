import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { POSTHOG_PROXY_PATH } from "./src/config/posthog"

const nextConfig: NextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: true,
    },
    compiler: {
        styledComponents: true,
    },

    images: {
        unoptimized: true,
        remotePatterns: [
            { hostname: "c.feridinha.com" },
            { hostname: "f.feridinha.com" },
            { hostname: "feridinha.com" },
        ],
    },
    experimental: {
        viewTransition: true,
    },
    async rewrites() {
        return {
            afterFiles: [
                {
                    source: `${POSTHOG_PROXY_PATH}/static/:path*`,
                    destination: "https://us-assets.i.posthog.com/static/:path*",
                },
                {
                    source: `${POSTHOG_PROXY_PATH}/array/:path*`,
                    destination: "https://us-assets.i.posthog.com/array/:path*",
                },
            ],
            fallback: [
                {
                    source: `${POSTHOG_PROXY_PATH}/:path*`,
                    destination: "https://us.i.posthog.com/:path*",
                },
            ],
        }
    },
    skipTrailingSlashRedirect: true,
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
