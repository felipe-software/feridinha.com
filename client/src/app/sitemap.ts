import type { MetadataRoute } from "next"
import { IS_MURAL_AVAILABLE } from "@/config/features"

const SITE_URL = "https://feridinha.com"
const publicPathnames = ["/", "/tutorial", "/faq", "/termos-de-servico"]

export default function sitemap(): MetadataRoute.Sitemap {
    const pathnames = IS_MURAL_AVAILABLE ? [...publicPathnames, "/mural"] : publicPathnames

    return pathnames.map((pathname) => ({
        url: `${SITE_URL}${pathname === "/" ? "" : pathname}`,
        alternates: {
            languages: {
                "pt-BR": `${SITE_URL}${pathname === "/" ? "" : pathname}`,
                en: `${SITE_URL}/en${pathname === "/" ? "" : pathname}`,
                "x-default": `${SITE_URL}${pathname === "/" ? "" : pathname}`,
            },
        },
    }))
}
