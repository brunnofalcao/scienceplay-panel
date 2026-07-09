import type { MetadataRoute } from "next";

// Painel interno: bloqueia TODOS os crawlers. Sem sitemap público.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
