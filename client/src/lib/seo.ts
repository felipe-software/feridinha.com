import type { Metadata } from "next"
import type { AppLocale } from "@/i18n/config"

export const SITE_URL = new URL("https://feridinha.com")
export const SOCIAL_IMAGE_PATH = "/banner.png"

export type SeoLocale = AppLocale
export type PublicSeoPage = "home" | "devlogs" | "faq" | "tutorial"

export type SeoPageConfig = {
    title: string
    description: string
    pathname: string
}

export const NO_INDEX_ROBOTS: Metadata["robots"] = {
    index: false,
    follow: false,
    googleBot: {
        index: false,
        follow: false,
    },
}

const PAGE_CONFIG: Record<SeoLocale, Record<PublicSeoPage, SeoPageConfig>> = {
    "pt-BR": {
        home: {
            title: "Feridinha - Upload de arquivo grátis",
            description: "Faça upload de arquivos grátis, rápido e seguro no Feridinha.",
            pathname: "/",
        },
        faq: {
            title: "Dúvidas sobre Upload de Arquivos | Feridinha",
            description: "Respostas sobre uploads, exclusão de arquivos, privacidade e funcionamento do Feridinha.",
            pathname: "/faq",
        },
        devlogs: {
            title: "Devlogs | Feridinha",
            description: "Acompanhe as novidades e notas de desenvolvimento do Feridinha.",
            pathname: "/devlogs",
        },
        tutorial: {
            title: "Upload com Chatterino e ShareX | Feridinha",
            description: "Aprenda a configurar uploads no Chatterino, ShareX, DankChat e outros aplicativos.",
            pathname: "/tutorial",
        },
    },
    en: {
        home: {
            title: "Feridinha - Free File Upload",
            description: "Upload files for free with Feridinha — a fast and secure file upload service.",
            pathname: "/en",
        },
        faq: {
            title: "File Upload FAQ | Feridinha",
            description: "Answers about file uploads, deletion, privacy and how Feridinha works.",
            pathname: "/en/faq",
        },
        devlogs: {
            title: "Devlogs | Feridinha",
            description: "Follow Feridinha updates and development notes.",
            pathname: "/en/devlogs",
        },
        tutorial: {
            title: "File Upload Setup for Chatterino and ShareX | Feridinha",
            description: "Learn how to configure file uploads for Chatterino, ShareX, DankChat and other apps.",
            pathname: "/en/tutorial",
        },
    },
}

const PAGE_PATHS: Record<PublicSeoPage, Record<SeoLocale, string>> = {
    home: { "pt-BR": "/", en: "/en" },
    devlogs: { "pt-BR": "/devlogs", en: "/en/devlogs" },
    faq: { "pt-BR": "/faq", en: "/en/faq" },
    tutorial: { "pt-BR": "/tutorial", en: "/en/tutorial" },
}

const absoluteUrl = (pathname: string) => new URL(pathname, SITE_URL).toString()

export const getTermsUrl = (locale: SeoLocale) =>
    locale === "en" ? "/termos-de-servico-en.html" : "/termos-de-servico.html"

export const buildPageMetadata = (page: PublicSeoPage, locale: SeoLocale): Metadata => {
    const config = PAGE_CONFIG[locale][page]
    const canonical = absoluteUrl(config.pathname)
    const ptUrl = absoluteUrl(PAGE_PATHS[page]["pt-BR"])
    const enUrl = absoluteUrl(PAGE_PATHS[page].en)
    const image = {
        url: SOCIAL_IMAGE_PATH,
        width: 620,
        height: 349,
        alt: locale === "pt-BR"
            ? "Feridinha — upload de arquivos grátis"
            : "Feridinha — free file upload",
    }

    return {
        title: config.title,
        description: config.description,
        alternates: {
            canonical,
            languages: {
                "pt-BR": ptUrl,
                en: enUrl,
                "x-default": ptUrl,
            },
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
        openGraph: {
            type: "website",
            url: canonical,
            siteName: "Feridinha",
            title: config.title,
            description: config.description,
            locale: locale === "pt-BR" ? "pt_BR" : "en_US",
            alternateLocale: locale === "pt-BR" ? ["en_US"] : ["pt_BR"],
            images: [image],
        },
        twitter: {
            card: "summary_large_image",
            title: config.title,
            description: config.description,
            images: [SOCIAL_IMAGE_PATH],
        },
    }
}

export const buildRootMetadata = (locale: SeoLocale): Metadata => {
    const description = PAGE_CONFIG[locale].home.description

    return {
        metadataBase: SITE_URL,
        title: "Feridinha",
        description,
        applicationName: "Feridinha",
        authors: [{ name: "Feridinha", url: SITE_URL }],
        creator: "Feridinha",
        publisher: "Feridinha",
        icons: {
            icon: "/favicon.png",
            apple: "/favicon.png",
        },
        manifest: "/site.webmanifest",
        robots: NO_INDEX_ROBOTS,
        openGraph: {
            type: "website",
            siteName: "Feridinha",
            title: "Feridinha",
            description,
            locale: locale === "pt-BR" ? "pt_BR" : "en_US",
            alternateLocale: locale === "pt-BR" ? ["en_US"] : ["pt_BR"],
            images: [
                {
                    url: SOCIAL_IMAGE_PATH,
                    width: 620,
                    height: 349,
                    alt: locale === "pt-BR"
                        ? "Feridinha — upload de arquivos grátis"
                        : "Feridinha — free file upload",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: "Feridinha",
            description,
            images: [SOCIAL_IMAGE_PATH],
        },
    }
}

export const buildSiteJsonLd = (locale: SeoLocale) => ({
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": absoluteUrl("/#website"),
            name: "Feridinha",
            url: absoluteUrl(locale === "en" ? "/en" : "/"),
            inLanguage: ["pt-BR", "en"],
            publisher: { "@id": absoluteUrl("/#organization") },
        },
        {
            "@type": "Organization",
            "@id": absoluteUrl("/#organization"),
            name: "Feridinha",
            url: absoluteUrl("/"),
            logo: {
                "@type": "ImageObject",
                url: absoluteUrl("/favicon.png"),
            },
        },
    ],
})

export const serializeJsonLd = (value: unknown) =>
    JSON.stringify(value).replace(/</g, "\\u003c")
