import { boot, type FetchLike } from './app';
import { langFromSearch } from './strings';
import { toggleTheme } from './theme';

interface HeaderApi {
  mount: (options: {
    nav: string;
    root: string;
    theme: boolean;
    lang: string;
    onLangChange: (code: string) => void;
    onThemeToggle: () => void;
  }) => void;
}

/** The part of `window` the page needs, so it can be replaced in tests. */
export interface PageWindow {
  document: Document;
  location: { search: string; href: string };
  localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  fetch: FetchLike;
  /** Provided by `site-header.js`, the shared Providence header. */
  SDDSiteHeader?: HeaderApi | undefined;
}

export function readFileText(file: File): Promise<string> {
  return file.text();
}

function saveFile(doc: Document, name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = doc.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** Wires the shared header and boots the Selector on the real page. */
export function startPage(win: PageWindow): Promise<void> {
  win.SDDSiteHeader?.mount({
    nav: 'landing',
    root: '../',
    theme: true,
    lang: langFromSearch(win.location.search),
    onLangChange: (code) => {
      const url = new URL(win.location.href);
      url.searchParams.set('lang', code);
      win.location.href = url.toString();
    },
    onThemeToggle: () => {
      toggleTheme(win.document, win.localStorage);
    },
  });
  return boot({
    doc: win.document,
    storage: win.localStorage,
    fetchFn: (url) => win.fetch(url),
    search: win.location.search,
    saveFile: (name, text) => saveFile(win.document, name, text),
    readText: readFileText,
  });
}
