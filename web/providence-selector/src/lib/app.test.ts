// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { boot, type AppEnv, type FetchLike } from './app';
import { APP_MARKUP } from './markup';

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(path.resolve(process.cwd(), 'fixtures', name), 'utf-8'));

type Reply = { status: number; body?: unknown; badJson?: boolean } | 'network-error';

interface Options {
  data?: Reply;
  docs?: Reply;
  search?: string;
  stored?: string;
  readText?: AppEnv['readText'];
}

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function makeFetch(replies: Record<string, Reply>): FetchLike {
  return async (url) => {
    const reply = replies[url] ?? { status: 404 };
    if (reply === 'network-error') throw new Error('network down');
    return {
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      json: async () => {
        if (reply.badJson) throw new SyntaxError('Unexpected token');
        return reply.body;
      },
    };
  };
}

async function start(options: Options = {}) {
  document.body.innerHTML = APP_MARKUP;
  const storage = new MemoryStorage();
  if (options.stored !== undefined) storage.setItem('sdd-selector', options.stored);
  const saveFile = vi.fn();
  const env: AppEnv = {
    doc: document,
    storage,
    fetchFn: makeFetch({
      'data.json': options.data ?? { status: 200, body: fixture('data.json') },
      'docs.index.json': options.docs ?? { status: 404 },
    }),
    search: options.search ?? '',
    saveFile,
    readText: options.readText ?? (async () => ''),
  };
  await boot(env);
  return { env, storage, saveFile };
}

const $ = <T extends HTMLElement>(selector: string): T => document.querySelector(selector) as T;
const text = (selector: string): string => $(selector).textContent ?? '';
const cardIds = (): string[] => [...document.querySelectorAll<HTMLInputElement>('#items input')].map((n) => n.dataset.item ?? '');

function check(id: string, checked = true): void {
  const box = $<HTMLInputElement>(`input[data-item="${id}"]`);
  box.checked = checked;
  box.dispatchEvent(new Event('change', { bubbles: true }));
}

function type(term: string): void {
  const input = $<HTMLInputElement>('#search');
  input.value = term;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('rendering', () => {
  it('renders one card per item and the category filters sorted', async () => {
    await start();
    expect(cardIds()).toEqual(['M001', 'M002', 'M003', 'G01', 'G02']);
    expect([...document.querySelectorAll('#filters button')].map((b) => b.textContent)).toEqual([
      'architecture',
      'code_quality',
      'documentation',
      'governance',
      'performance',
    ]);
    expect(text('#summary')).toBe('0 selected');
  });

  it('shows type, category, mandatory or optional and dependencies on a card', async () => {
    await start();
    const card = $('article[data-item-type="mandate"]:nth-child(3)');
    const pills = [...card.querySelectorAll('.pill')].map((p) => p.textContent);
    expect(pills).toEqual(['mandate', 'performance', 'optional', 'Depends: M001, M002']);
    const first = [...document.querySelectorAll('article')][0]!;
    expect([...first.querySelectorAll('.pill')].map((p) => p.textContent)).toEqual([
      'mandate',
      'architecture',
      'mandatory',
    ]);
  });

  it('marks guidelines with their own type', async () => {
    await start();
    expect(document.querySelectorAll('article[data-item-type="guideline"]')).toHaveLength(2);
  });

  it('uses the Portuguese strings when the query asks for them', async () => {
    await start({ search: '?lang=pt' });
    expect(text('.hero p')).toBe('Selecione itens governados e exporte um artefato JSON.');
    expect($('#export').textContent).toBe('Exportar JSON');
    expect(text('#summary')).toBe('0 selecionado(s)');
    expect($<HTMLInputElement>('#search').placeholder).toBe('Buscar itens');
  });

  it('falls back to English for any other language', async () => {
    await start({ search: '?lang=fr' });
    expect($('#export').textContent).toBe('Export JSON');
  });
});

describe('search and filters', () => {
  it('filters by text', async () => {
    await start();
    type('telemetry');
    expect(cardIds()).toEqual(['M003']);
    type('');
    expect(cardIds()).toHaveLength(5);
  });

  it('filters by category and toggles the filter off', async () => {
    await start();
    const button = $<HTMLButtonElement>('#filters button[data-filter="documentation"]');
    button.click();
    expect(cardIds()).toEqual(['G01']);
    expect(button.classList.contains('active')).toBe(true);
    button.click();
    expect(cardIds()).toHaveLength(5);
  });
});

describe('selection, dependencies and persistence', () => {
  it('adds the dependencies of a selected item, warns, and persists only what the user selected', async () => {
    const { storage } = await start();
    check('M003');
    expect(text('#summary')).toBe('3 selected');
    const warnings = [...document.querySelectorAll('#warnings div')].map((d) => d.textContent);
    expect(warnings).toEqual(['M003 requires M001', 'M003 requires M002']);
    expect($('#warnings').classList.contains('hidden')).toBe(false);
    expect(JSON.parse(storage.getItem('sdd-selector') ?? 'null')).toEqual(['M003']);
  });

  it('hides the warnings and updates the count when the item is unchecked', async () => {
    await start();
    check('M002');
    check('M002', false);
    expect(text('#summary')).toBe('0 selected');
    expect($('#warnings').classList.contains('hidden')).toBe(true);
  });

  it('restores a stored selection', async () => {
    await start({ stored: JSON.stringify(['G01', 7]) });
    expect($<HTMLInputElement>('input[data-item="G01"]').checked).toBe(true);
    expect(text('#summary')).toBe('1 selected');
  });

  it('drops a corrupted stored selection', async () => {
    const { storage } = await start({ stored: '{broken' });
    expect(storage.getItem('sdd-selector')).toBeNull();
    expect(text('#summary')).toBe('0 selected');
  });

  it('warns about a stored id that is no longer an item', async () => {
    await start({ stored: JSON.stringify(['GONE']) });
    expect(text('#warnings')).toBe('Unknown selected item: GONE');
  });

  it('clears the selection and says so', async () => {
    const { storage } = await start();
    check('M001');
    $('#clear').click();
    expect(text('#summary')).toBe('0 selected');
    expect(text('#status')).toBe('Selection cleared.');
    expect(JSON.parse(storage.getItem('sdd-selector') ?? 'null')).toEqual([]);
    expect($<HTMLInputElement>('input[data-item="M001"]').checked).toBe(false);
  });
});

describe('export and import', () => {
  it('exports the selected and resolved ids as selector-selection.json', async () => {
    const { saveFile } = await start();
    check('M002');
    $('#export').click();
    expect(saveFile).toHaveBeenCalledOnce();
    const [name, content] = saveFile.mock.calls[0] as [string, string];
    expect(name).toBe('selector-selection.json');
    expect(JSON.parse(content)).toEqual({ version: '1.0', selected_ids: ['M002'], resolved_ids: ['M001', 'M002'] });
  });

  async function importing(content: string) {
    const started = await start({ readText: async () => content });
    const input = $<HTMLInputElement>('#import-file');
    Object.defineProperty(input, 'files', { value: [new File([content], 'selection.json')], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect($('#status').classList.contains('hidden')).toBe(false));
    return started;
  }

  it('opens the file picker from the Import button', async () => {
    await start();
    const click = vi.spyOn($<HTMLInputElement>('#import-file'), 'click');
    $('#import').click();
    expect(click).toHaveBeenCalledOnce();
  });

  it('imports a compatible selection', async () => {
    await importing(JSON.stringify(fixture('selection.json')));
    expect(text('#status')).toBe('Imported 1 selected item(s).');
    expect($('#status').dataset.kind).toBe('success');
    expect($<HTMLInputElement>('input[data-item="M002"]').checked).toBe(true);
    expect(text('#summary')).toBe('2 selected');
  });

  it('keeps the current selection when the import names an unknown id', async () => {
    const { storage } = await start({ readText: async () => JSON.stringify({ version: '1.0', selected_ids: ['ZZZ'] }) });
    check('G01');
    const input = $<HTMLInputElement>('#import-file');
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.json')], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(text('#status')).toBe('Unknown selector ID: ZZZ'));
    expect($('#status').dataset.kind).toBe('error');
    expect($<HTMLInputElement>('input[data-item="G01"]').checked).toBe(true);
    expect(JSON.parse(storage.getItem('sdd-selector') ?? 'null')).toEqual(['G01']);
  });

  it('explains that data.json is not a selection file', async () => {
    await importing(JSON.stringify(fixture('data.json')));
    expect(text('#status')).toMatch(/not data\.json/);
  });

  it('reports invalid JSON', async () => {
    await importing('{nope');
    expect($('#status').dataset.kind).toBe('error');
    expect(text('#status')).not.toBe('');
  });

  it('reports a file that cannot be read', async () => {
    await start({
      readText: async () => {
        throw new Error('disk');
      },
    });
    const input = $<HTMLInputElement>('#import-file');
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.json')], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(text('#status')).toBe('Failed to read selection file.'));
  });

  it('ignores a change event without a file', async () => {
    await start();
    const input = $<HTMLInputElement>('#import-file');
    Object.defineProperty(input, 'files', { value: [], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect($('#status').classList.contains('hidden')).toBe(true);
  });
});

describe('data.json at the presentation boundary', () => {
  it.each<[string, Reply]>([
    ['is missing', { status: 404 }],
    ['fails with a server error', { status: 500 }],
    ['cannot be fetched', 'network-error'],
  ])('reports a clear load error when data.json %s', async (_name, data) => {
    await start({ data });
    expect($('#status').dataset.kind).toBe('error');
    expect(text('#status')).toMatch(/^Failed to load data\.json: /);
    expect(text('#status')).toMatch(/Serve the selector over HTTP/);
    expect(cardIds()).toEqual([]);
  });

  it('reports malformed JSON as a load error', async () => {
    await start({ data: { status: 200, badJson: true } });
    expect(text('#status')).toMatch(/^Failed to load data\.json: /);
  });

  it.each<[string, unknown, RegExp]>([
    ['an unsupported version', { version: '2.0', items: [] }, /unsupported data\.json version/],
    ['a missing items list', { version: '1.0' }, /items must be a list/],
    ['a malformed item', { version: '1.0', items: [{ id: 'X' }] }, /items\[0\]/],
  ])('refuses data.json with %s without rendering anything', async (_name, body, pattern) => {
    await start({ data: { status: 200, body } });
    expect($('#status').dataset.kind).toBe('error');
    expect(text('#status')).toMatch(/^Cannot use data\.json: /);
    expect(text('#status')).toMatch(pattern);
    expect(cardIds()).toEqual([]);
  });

  it('reports the same problem in Portuguese', async () => {
    await start({ search: '?lang=pt', data: { status: 200, body: { version: '2.0', items: [] } } });
    expect(text('#status')).toMatch(/^Não foi possível usar o data\.json: /);
  });
});

describe('docs.index.json is optional', () => {
  it.each<[string, Reply]>([
    ['absent', { status: 404 }],
    ['failing', { status: 500 }],
    ['unreachable', 'network-error'],
  ])('boots normally when it is %s', async (_name, docs) => {
    await start({ docs });
    expect(cardIds()).toHaveLength(5);
    expect($('#status').classList.contains('hidden')).toBe(true);
  });

  it('boots normally with a valid index', async () => {
    await start({ docs: { status: 200, body: fixture('docs.index.json') } });
    expect(cardIds()).toHaveLength(5);
    expect($('#status').classList.contains('hidden')).toBe(true);
  });

  it.each<[string, Reply]>([
    ['unusable content', { status: 200, body: { nope: true } }],
    ['malformed JSON', { status: 200, badJson: true }],
  ])('boots and says so when the index has %s', async (_name, docs) => {
    await start({ docs });
    expect(cardIds()).toHaveLength(5);
    expect($('#status').dataset.kind).toBe('warning');
    expect(text('#status')).toMatch(/docs\.index\.json/);
  });
});
