import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
    reactStrictMode: true,
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
    redirects: async () => [
        {
            source: "/termos-de-servico.html",
            destination: "/termos-de-servico",
            permanent: true,
        },
    ],
}

const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
