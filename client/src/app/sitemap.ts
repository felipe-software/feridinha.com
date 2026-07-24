import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

const pagePairs = [
    ["/", "/en"],
    ["/faq", "/en/faq"],
    ["/tutorial", "/en/tutorial"],
    ["/termos-de-servico.html", "/termos-de-servico-en.html"],
] as const

export default function sitemap(): MetadataRoute.Sitemap {
    return pagePairs.flatMap(([ptPath, enPath]) => {
        const languages = {
            "pt-BR": new URL(ptPath, SITE_URL).toString(),
            en: new URL(enPath, SITE_URL).toString(),
            "x-default": new URL(ptPath, SITE_URL).toString(),
        }

        return [ptPath, enPath].map((pathname) => ({
            url: new URL(pathname, SITE_URL).toString(),
            alternates: {
                languages,
            },
        }))
    })
}
