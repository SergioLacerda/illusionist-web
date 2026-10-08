// Deployment values are build-time inputs, not part of the shipped surface.
// With nothing set the build is neutral: it is meant to be served from the
// root of a static host and carries no absolute site URL.

export interface Deployment {
  /** Absolute origin (and optional path) of the deployment, or undefined. */
  site: string | undefined;
  /** Base path the surface is served under: "/" or "/segment[/segment]". */
  base: string;
}

type Env = Record<string, string | undefined>;

export function resolveDeployment(env: Env): Deployment {
  return { site: resolveSite(env.ILLUSIONIST_SITE), base: resolveBase(env.ILLUSIONIST_BASE) };
}

function resolveSite(raw: string | undefined): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`ILLUSIONIST_SITE must be an absolute http(s) URL, got "${value}"`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`ILLUSIONIST_SITE must be an absolute http(s) URL, got "${value}"`);
  }
  return value;
}

function resolveBase(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return '/';
  if (value.includes('://') || value.includes('//')) {
    throw new Error(`ILLUSIONIST_BASE must be a path such as "/docs", got "${value}"`);
  }
  const trimmed = value.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return '/';
  const segments = trimmed.split('/');
  if (!segments.every((segment) => /^[A-Za-z0-9._~-]+$/.test(segment))) {
    // Also catches a POSIX shell rewriting "/x" into "C:/Program Files/Git/x".
    throw new Error(`ILLUSIONIST_BASE must be a path such as "/docs", got "${value}"`);
  }
  return `/${segments.join('/')}`;
}
