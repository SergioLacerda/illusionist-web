// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_MARKUP } from './markup';
import { startPage, type PageWindow } from './page';

type MountOptions = {
  nav: string;
  root: string;
  theme: boolean;
  lang: string;
  onLangChange: (code: string) => void;
  onThemeToggle: () => void;
};

function fakeWindow(overrides: Partial<PageWindow> = {}): PageWindow & { mounted: MountOptions[] } {
  const mounted: MountOptions[] = [];
  const storage: Record<string, string> = {};
  return {
    document,
    location: { search: '?lang=pt', href: 'https://example.org/providence/selector/?lang=pt' },
    localStorage: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => void (storage[key] = value),
      removeItem: (key: string) => void delete storage[key],
    },
    fetch: async (url: string) => ({
      ok: url === 'data.json',
      status: url === 'data.json' ? 200 : 404,
      json: async () => ({ version: '1.0', items: [] }),
    }),
    SDDSiteHeader: { mount: (options: MountOptions) => void mounted.push(options) },
    mounted,
    ...overrides,
  } as unknown as PageWindow & { mounted: MountOptions[] };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
});

describe('startPage', () => {
  it('mounts the shared header for the language and relative root of the page', async () => {
    document.body.innerHTML = APP_MARKUP;
    const win = fakeWindow();
    await startPage(win);
    expect(win.mounted).toHaveLength(1);
    expect(win.mounted[0]).toMatchObject({ nav: 'landing', root: '../', theme: true, lang: 'pt' });
  });

  it('reloads with the chosen language when the header asks for it', async () => {
    document.body.innerHTML = APP_MARKUP;
    const win = fakeWindow();
    await startPage(win);
    win.mounted[0]?.onLangChange('en');
    expect(win.location.href).toBe('https://example.org/providence/selector/?lang=en');
  });

  it('toggles and stores the theme when the header asks for it', async () => {
    document.body.innerHTML = APP_MARKUP;
    document.documentElement.dataset.theme = 'light';
    const win = fakeWindow();
    await startPage(win);
    win.mounted[0]?.onThemeToggle();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(win.localStorage.getItem('sdd-theme')).toBe('dark');
  });

  it('still boots the Selector when the shared header script is not present', async () => {
    document.body.innerHTML = APP_MARKUP;
    const win = fakeWindow({ SDDSiteHeader: undefined });
    await startPage(win);
    expect(document.getElementById('summary')?.textContent).toBe('0 selecionado(s)');
  });

  it('downloads the exported selection through a temporary link', async () => {
    document.body.innerHTML = APP_MARKUP;
    const created = vi.fn(() => 'blob:x');
    const revoked = vi.fn();
    Object.assign(URL, { createObjectURL: created, revokeObjectURL: revoked });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await startPage(fakeWindow());
    document.getElementById('export')?.click();
    expect(created).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revoked).toHaveBeenCalledWith('blob:x');
    click.mockRestore();
  });

  it('reads an imported selection file as text', async () => {
    document.body.innerHTML = APP_MARKUP;
    const { readFileText } = await import('./page');
    expect(await readFileText(new File(['{"a":1}'], 'a.json'))).toBe('{"a":1}');
  });
});
