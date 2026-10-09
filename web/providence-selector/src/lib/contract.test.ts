import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ContractError, parseData, parseDocsIndex, parseSelection } from './contract';

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${name}`, import.meta.url), 'utf-8'));

function item(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'M001',
    title: 'T',
    description: 'D',
    category: 'c',
    mandatory: true,
    tags: [],
    depends_on: [],
    item_type: 'mandate',
    ...overrides,
  };
}

const data = (items: unknown, version: unknown = '1.0'): unknown => ({ version, items });

describe('parseData — accepted payloads', () => {
  it('accepts the deterministic fixture', () => {
    const parsed = parseData(fixture('data.json'));
    expect(parsed.version).toBe('1.0');
    expect(parsed.items).toHaveLength(5);
    expect(parsed.items[2]?.depends_on).toEqual(['M001', 'M002']);
  });

  it('accepts a real Providence payload from the pinned commit', () => {
    const parsed = parseData(
      JSON.parse(readFileSync(new URL('../../compat/providence-7bbfb67/data.json', import.meta.url), 'utf-8')),
    );
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  it('accepts an empty items list (Providence emits one when no governance exists)', () => {
    expect(parseData(data([])).items).toEqual([]);
  });

  it('defaults a missing item_type to "mandate", as the baseline UI did', () => {
    const { item_type: _omitted, ...withoutType } = item();
    expect(parseData(data([withoutType])).items[0]?.item_type).toBe('mandate');
  });

  it('ignores unknown fields', () => {
    expect(parseData({ ...(data([item({ extra: 1 })]) as object), future: true }).items).toHaveLength(1);
  });

  it.each(['1.0', '1.1', '1.12.3', '1'])('supports version %s', (version) => {
    expect(() => parseData(data([], version))).not.toThrow();
  });
});

describe('parseData — rejected payloads', () => {
  it.each([null, 'text', 42, [], undefined])('rejects a non-object payload %j', (raw) => {
    expect(() => parseData(raw)).toThrow(ContractError);
  });

  it.each([1, null, '2.0', '0.9', 'v1', ''])('rejects the unsupported version %j', (version) => {
    expect(() => parseData(data([], version))).toThrow(/version/);
  });

  it.each([undefined, null, {}, 'items'])('rejects items %j', (items) => {
    expect(() => parseData(data(items))).toThrow(/items/);
  });

  it.each([
    ['id', ''],
    ['id', 7],
    ['title', undefined],
    ['description', null],
    ['category', 3],
    ['mandatory', 'yes'],
    ['tags', 'a'],
    ['tags', [1]],
    ['depends_on', 'M001'],
    ['depends_on', [null]],
    ['item_type', 5],
  ])('rejects an item whose %s is %j', (field, value) => {
    expect(() => parseData(data([item({ [field]: value })]))).toThrow(new RegExp(`items\\[0\\]\\.${field}`));
  });

  it('rejects a non-object item', () => {
    expect(() => parseData(data(['M001']))).toThrow(/items\[0\]/);
  });

  it('rejects duplicate ids as structurally invalid', () => {
    expect(() => parseData(data([item(), item()]))).toThrow(/duplicate/);
  });

  it('does not judge dependency semantics: an unknown dependency id is accepted', () => {
    expect(parseData(data([item({ depends_on: ['G99'] })])).items[0]?.depends_on).toEqual(['G99']);
  });
});

it('rejects a payload without a version', () => {
  expect(() => parseData({ items: [] })).toThrow(/version/);
});

describe('parseDocsIndex', () => {
  it('returns the documents of a valid index', () => {
    expect(parseDocsIndex(fixture('docs.index.json'))).toEqual({
      documents: [{ id: 'M001', path: 'docs/m001.md', title: 'Clean Architecture' }],
    });
  });

  it.each([null, [], 'x', {}, { documents: 'no' }])('reports %j as unusable', (raw) => {
    expect(parseDocsIndex(raw)).toEqual({ documents: [], problem: expect.stringMatching(/docs\.index\.json/) });
  });
});

describe('parseSelection', () => {
  const known = new Set(['M001', 'M002']);
  const messages = {
    notObject: 'not object',
    version: 'version',
    format: 'format',
    ids: 'ids',
    unknown: (id: string) => `unknown ${id}`,
  };

  it('reads the selected ids of an exported selection', () => {
    expect(parseSelection(fixture('selection.json'), known, messages)).toEqual(['M002']);
  });

  it('falls back to resolved_ids when selected_ids is absent', () => {
    expect(parseSelection({ version: '1.0', resolved_ids: ['M001'] }, known, messages)).toEqual(['M001']);
  });

  it.each([
    [null, 'not object'],
    ['x', 'not object'],
    [{ selected_ids: [] }, 'version'],
    [{ version: 1, selected_ids: [] }, 'version'],
    [{ version: '1.0' }, 'format'],
    [{ version: '1.0', items: [] }, 'format'],
    [{ version: '1.0', selected_ids: [1] }, 'ids'],
    [{ version: '1.0', selected_ids: ['ZZZ'] }, 'unknown ZZZ'],
  ])('rejects %j with %j', (raw, message) => {
    expect(() => parseSelection(raw, known, messages)).toThrow(message);
  });
});
