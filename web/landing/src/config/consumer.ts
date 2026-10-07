// Consumer-specific links for the landing. These values belong to the product the
// landing presents (currently Strategist), not to the ILUSIONISTA toolchain.
// Deployment values (site, base) live in astro.config.mjs.
const repoUrl = 'https://github.com/SergioLacerda/strategist-skill';
const goModulePath = 'github.com/SergioLacerda/strategist-skill/cmd/strategist@latest';

export const consumer = {
  repoUrl,
  quickstartUrl: `${repoUrl}/blob/main/QUICKSTART.md`,
  licenseUrl: `${repoUrl}/blob/main/LICENSE`,
  releasesUrl: `${repoUrl}/releases`,
  goModulePath,
  goInstallCommand: `go install ${goModulePath}`,
  installScriptUrl: 'https://raw.githubusercontent.com/SergioLacerda/strategist-skill/main/scripts/install.sh',
} as const;

/** Placeholder used inside i18n dictionaries that live in inline page scripts. */
export const RELEASES_PLACEHOLDER = '__RELEASES_URL__';

export function withConsumerUrls<T>(dictionary: T): T {
  return JSON.parse(JSON.stringify(dictionary).split(RELEASES_PLACEHOLDER).join(consumer.releasesUrl)) as T;
}
