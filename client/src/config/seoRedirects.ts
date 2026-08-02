export const SEO_REDIRECTS = [
    { source: "/links", destination: "/faq", permanent: true },
    { source: "/en/links", destination: "/en/faq", permanent: true },
    { source: "/es/links", destination: "/es/faq", permanent: true },
    { source: "/chatterino", destination: "/tutorial", permanent: true },
    { source: "/en/chatterino", destination: "/en/tutorial", permanent: true },
    { source: "/es/chatterino", destination: "/es/tutorial", permanent: true },
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
    {
        source: "/es/termos-de-servico",
        destination: "/termos-de-servico-es.html",
        permanent: true,
    },
] as const
