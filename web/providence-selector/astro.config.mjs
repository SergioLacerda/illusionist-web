import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { resolveDeployment } from './src/config/deployment.ts';

// Deployment values come from the environment (ILLUSIONIST_SITE, ILLUSIONIST_BASE).
// With neither set the build is neutral: base "/" and no absolute site.
// The Providence Selector release sets https://sergiolacerda.github.io and /providence/selector.
const { site, base } = resolveDeployment(process.env);
console.info(`[illusionist] deployment site=${site ?? '(none)'} base=${base}`);

// Development only: serve the local fixtures where the consumer would put the
// governed data. They are never copied into the build output.
const fixtureFiles = { '/data.json': 'data.json', '/docs.index.json': 'docs.index.json' };
const serveFixtures = {
  name: 'serve-selector-fixtures',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      const pathname = (request.url ?? '').split('?')[0] ?? '';
      const stripped = base === '/' ? pathname : pathname.replace(base, '');
      const name = fixtureFiles[stripped];
      if (!name) return next();
      response.setHeader('content-type', 'application/json');
      response.end(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
    });
  },
};

export default defineConfig({
  output: 'static',
  site,
  base,
  vite: { plugins: [serveFixtures] },
});
