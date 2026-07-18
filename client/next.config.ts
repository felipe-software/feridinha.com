import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

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
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
