import { describe, expect, test } from "bun:test"
import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { metadata as albumMetadata } from "@/app/[locale]/album/layout"
import { metadata as createReviewMetadata } from "@/app/[locale]/create-review/layout"
import { metadata as dashboardMetadata } from "@/app/[locale]/dashboard/layout"
import { metadata as deleteMetadata } from "@/app/[locale]/delete/layout"
import { metadata as muralMetadata } from "@/app/[locale]/mural/layout"
import { SEO_REDIRECTS } from "@/config/seoRedirects"
import { getLocaleSwitchHref } from "@/i18n/switchLocale"
import {
    buildPageMetadata,
    getTermsUrl,
    NO_INDEX_ROBOTS,
    type PublicSeoPage,
    type SeoLocale,
} from "@/lib/seo"

const expectedPages: Array<{
    page: PublicSeoPage
    locale: SeoLocale
    title: string
    description: string
    canonical: string
}> = [
    {
        page: "home",
        locale: "pt-BR",
        title: "Feridinha - Upload de arquivo grátis",
        description: "Faça upload de arquivos grátis, rápido e seguro no Feridinha.",
        canonical: "https://feridinha.com/",
    },
    {
        page: "home",
        locale: "en",
        title: "Feridinha - Free File Upload",
        description: "Upload files for free with Feridinha — a fast and secure file upload service.",
        canonical: "https://feridinha.com/en",
    },
    {
        page: "faq",
        locale: "pt-BR",
        title: "Dúvidas sobre Upload de Arquivos | Feridinha",
        description: "Respostas sobre uploads, exclusão de arquivos, privacidade e funcionamento do Feridinha.",
        canonical: "https://feridinha.com/faq",
    },
    {
        page: "faq",
        locale: "en",
        title: "File Upload FAQ | Feridinha",
        description: "Answers about file uploads, deletion, privacy and how Feridinha works.",
        canonical: "https://feridinha.com/en/faq",
    },
    {
        page: "devlogs",
        locale: "pt-BR",
        title: "Devlogs | Feridinha",
        description: "Acompanhe as novidades e notas de desenvolvimento do Feridinha.",
        canonical: "https://feridinha.com/devlogs",
    },
    {
        page: "devlogs",
        locale: "en",
        title: "Devlogs | Feridinha",
        description: "Follow Feridinha updates and development notes.",
        canonical: "https://feridinha.com/en/devlogs",
    },
    {
        page: "tutorial",
        locale: "pt-BR",
        title: "Upload com Chatterino e ShareX | Feridinha",
        description: "Aprenda a configurar uploads no Chatterino, ShareX, DankChat e outros aplicativos.",
        canonical: "https://feridinha.com/tutorial",
    },
    {
        page: "tutorial",
        locale: "en",
        title: "File Upload Setup for Chatterino and ShareX | Feridinha",
        description: "Learn how to configure file uploads for Chatterino, ShareX, DankChat and other apps.",
        canonical: "https://feridinha.com/en/tutorial",
    },
]

describe("public SEO metadata", () => {
    for (const expected of expectedPages) {
        test(`${expected.locale} ${expected.page} has localized indexable metadata`, () => {
            const metadata = buildPageMetadata(expected.page, expected.locale)
            const openGraph = metadata.openGraph as {
                url: string
                locale: string
                alternateLocale: string[]
                images: Array<{ url: string; width: number; height: number }>
            }

            expect(metadata.title).toBe(expected.title)
            expect(metadata.description).toBe(expected.description)
            expect(metadata.alternates?.canonical).toBe(expected.canonical)
            expect(metadata.alternates?.languages).toEqual({
                "pt-BR": `https://feridinha.com${expected.page === "home" ? "/" : `/${expected.page}`}`,
                en: `https://feridinha.com/en${expected.page === "home" ? "" : `/${expected.page}`}`,
                "x-default": `https://feridinha.com${expected.page === "home" ? "/" : `/${expected.page}`}`,
            })
            expect(metadata.robots).toMatchObject({
                index: true,
                follow: true,
            })
            expect(openGraph.url).toBe(expected.canonical)
            expect(openGraph.locale).toBe(expected.locale === "pt-BR" ? "pt_BR" : "en_US")
            expect(openGraph.alternateLocale).toEqual([
                expected.locale === "pt-BR" ? "en_US" : "pt_BR",
            ])
            expect(openGraph.images[0]).toMatchObject({
                url: "/banner.png",
                width: 620,
                height: 349,
            })
        })
    }
})

describe("crawler policy and public URL inventory", () => {
    test("the safe policy used by private segments is noindex, nofollow", () => {
        expect(NO_INDEX_ROBOTS).toEqual({
            index: false,
            follow: false,
            googleBot: {
                index: false,
                follow: false,
            },
        })
        expect(albumMetadata.robots).toEqual(NO_INDEX_ROBOTS)
        expect(createReviewMetadata.robots).toEqual(NO_INDEX_ROBOTS)
        expect(dashboardMetadata.robots).toEqual(NO_INDEX_ROBOTS)
        expect(deleteMetadata.robots).toEqual(NO_INDEX_ROBOTS)
        expect(muralMetadata.robots).toEqual(NO_INDEX_ROBOTS)
    })

    test("sitemap contains only the ten intended public URLs", () => {
        expect(sitemap().map(({ url }) => url)).toEqual([
            "https://feridinha.com/",
            "https://feridinha.com/en",
            "https://feridinha.com/devlogs",
            "https://feridinha.com/en/devlogs",
            "https://feridinha.com/faq",
            "https://feridinha.com/en/faq",
            "https://feridinha.com/tutorial",
            "https://feridinha.com/en/tutorial",
            "https://feridinha.com/termos-de-servico.html",
            "https://feridinha.com/termos-de-servico-en.html",
        ])
    })

    test("robots permits crawling and announces the sitemap without blocking noindex pages", () => {
        expect(robots()).toEqual({
            rules: {
                userAgent: "*",
                allow: "/",
            },
            sitemap: "https://feridinha.com/sitemap.xml",
        })
    })
})

describe("SEO redirects and localized external documents", () => {
    test("all legacy aliases are permanent", () => {
        expect(SEO_REDIRECTS).toEqual([
            { source: "/links", destination: "/faq", permanent: true },
            { source: "/en/links", destination: "/en/faq", permanent: true },
            { source: "/chatterino", destination: "/tutorial", permanent: true },
            { source: "/en/chatterino", destination: "/en/tutorial", permanent: true },
            {
                source: "/termos-de-servico",
                destination: "/termos-de-servico.html",
                permanent: true,
            },
            {
                source: "/en/termos-de-servico",
                destination: "/termos-de-servico-en.html",
                permanent: true,
            },
        ])
    })

    test("terms links follow the current locale", () => {
        expect(getTermsUrl("pt-BR")).toBe("/termos-de-servico.html")
        expect(getTermsUrl("en")).toBe("/termos-de-servico-en.html")
    })

    test("locale switching preserves the entire query string", () => {
        expect(getLocaleSwitchHref("/tutorial", "?source=sharex&step=2")).toBe(
            "/tutorial?source=sharex&step=2",
        )
        expect(getLocaleSwitchHref("/faq", "")).toBe("/faq")
    })

    test("static terms pages declare localized canonical and hreflang metadata", async () => {
        const pt = await Bun.file("public/termos-de-servico.html").text()
        const en = await Bun.file("public/termos-de-servico-en.html").text()

        expect(pt).toContain('rel="canonical" href="https://feridinha.com/termos-de-servico.html"')
        expect(en).toContain('rel="canonical" href="https://feridinha.com/termos-de-servico-en.html"')
        expect(pt).toContain('hreflang="en" href="https://feridinha.com/termos-de-servico-en.html"')
        expect(en).toContain('hreflang="pt-BR" href="https://feridinha.com/termos-de-servico.html"')
        expect(pt).not.toContain("window.location.replace")
        expect(en).toContain('href="/en/faq"')
    })
})
