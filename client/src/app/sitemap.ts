import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

const localizedPages = [
    ["/", "/en", "/es"],
    ["/faq", "/en/faq", "/es/faq"],
    ["/tutorial", "/en/tutorial", "/es/tutorial"],
    ["/termos-de-servico.html", "/termos-de-servico-en.html", "/termos-de-servico-es.html"],
] as const

export default function sitemap(): MetadataRoute.Sitemap {
    return localizedPages.flatMap(([ptPath, enPath, esPath]) => {
        const languages = {
            "pt-BR": new URL(ptPath, SITE_URL).toString(),
            en: new URL(enPath, SITE_URL).toString(),
            es: new URL(esPath, SITE_URL).toString(),
            "x-default": new URL(ptPath, SITE_URL).toString(),
        }

        return [ptPath, enPath, esPath].map((pathname) => ({
            url: new URL(pathname, SITE_URL).toString(),
            alternates: {
                languages,
            },
        }))
    })
}
