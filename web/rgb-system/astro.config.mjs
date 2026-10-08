import { defineConfig } from "astro/config";
import { resolveDeployment } from "./src/config/deployment.ts";

// Deployment values come from the environment (ILLUSIONIST_SITE, ILLUSIONIST_BASE).
// With neither set the build is neutral: base "/" and no absolute site.
const { site, base } = resolveDeployment(process.env);
console.info(`[illusionist] deployment site=${site ?? "(none)"} base=${base}`);

export default defineConfig({
  site,
  base,
  output: "static",
  i18n: {
    defaultLocale: "pt-br",
    locales: ["pt-br", "en"],
    routing: { prefixDefaultLocale: true },
  },
});
