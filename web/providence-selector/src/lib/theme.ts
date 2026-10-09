export type Theme = 'light' | 'dark';

export const THEME_KEY = 'sdd-theme';

/** Stored choice wins; otherwise follow the system preference. */
export function resolveInitialTheme(saved: string | null, prefersDark: boolean): Theme {
  if (saved) return saved === 'dark' ? 'dark' : 'light';
  return prefersDark ? 'dark' : 'light';
}

/** Flips the theme, persists it and returns the new value. */
export function toggleTheme(doc: Document, storage: Pick<Storage, 'setItem'>): Theme {
  const next: Theme = doc.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  storage.setItem(THEME_KEY, next);
  doc.documentElement.dataset.theme = next;
  return next;
}
