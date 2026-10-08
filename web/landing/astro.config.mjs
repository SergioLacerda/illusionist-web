import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { resolveDeployment } from './src/config/deployment.ts';

// Deployment values come from the environment (ILLUSIONIST_SITE, ILLUSIONIST_BASE).
// With neither set the build is neutral: base "/" and no absolute site.
const { site, base } = resolveDeployment(process.env);
console.info(`[illusionist] deployment site=${site ?? '(none)'} base=${base}`);

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [react()],
  build: {
    assets: '_assets',
  },
});
