import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { resolveDeployment } from './src/config/deployment.ts';

// Deployment values come from the environment (ILLUSIONIST_SITE, ILLUSIONIST_BASE).
// With neither set the build is neutral: base "/" and no absolute site.
// The Providence release sets https://sergiolacerda.github.io and /providence.
// The surface is built in isolation into its own dist/; /docs/ and /selector/
// stay free for the consumer's composition.
const { site, base } = resolveDeployment(process.env);
console.info(`[illusionist] deployment site=${site ?? '(none)'} base=${base}`);

export default defineConfig({
  integrations: [react()],
  output: 'static',
  site,
  base,
});
