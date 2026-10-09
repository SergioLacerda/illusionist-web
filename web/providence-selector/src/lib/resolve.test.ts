import { describe, expect, it } from 'vitest';
import type { SelectorItem } from './contract';
import { filterItems, resolveSelection, type ResolveMessages } from './resolve';

const messages: ResolveMessages = {
  unknown: (id) => `unknown ${id}`,
  missingDep: (a, b) => `${a} missing ${b}`,
  requires: (a, b) => `${a} requires ${b}`,
};

function make(id: string, dependsOn: string[] = [], extra: Partial<SelectorItem> = {}): SelectorItem {
  return {
    id,
    title: `Title ${id}`,
    description: `Description of ${id}`,
    category: 'general',
    mandatory: true,
    tags: [],
    depends_on: dependsOn,
    item_type: 'mandate',
    ...extra,
  };
}

describe('resolveSelection', () => {
  it('returns the selection sorted, without warnings, when nothing is missing', () => {
    const items = [make('B'), make('A')];
    expect(resolveSelection(items, new Set(['B', 'A']), messages)).toEqual({
      warnings: [],
      resolved: ['A', 'B'],
    });
  });

  it('adds single and transitive dependencies and warns for each addition', () => {
    const items = [make('A', ['B']), make('B', ['C']), make('C')];
    expect(resolveSelection(items, new Set(['A']), messages)).toEqual({
      warnings: ['A requires B', 'B requires C'],
      resolved: ['A', 'B', 'C'],
    });
  });

  it('handles multiple dependencies in declaration order', () => {
    const items = [make('A', ['C', 'B']), make('B'), make('C')];
    expect(resolveSelection(items, new Set(['A']), messages).warnings).toEqual(['A requires C', 'A requires B']);
  });

  it('does not warn about a dependency that is already selected', () => {
    const items = [make('A', ['B']), make('B')];
    expect(resolveSelection(items, new Set(['A', 'B']), messages).warnings).toEqual([]);
  });

  it('warns about a selected id that is not an item', () => {
    expect(resolveSelection([make('A')], new Set(['ZZZ']), messages)).toEqual({
      warnings: ['unknown ZZZ'],
      resolved: ['ZZZ'],
    });
  });

  it('warns about a dependency that is not an item and does not add it', () => {
    expect(resolveSelection([make('A', ['G99'])], new Set(['A']), messages)).toEqual({
      warnings: ['A missing G99'],
      resolved: ['A'],
    });
  });

  it('terminates on a dependency cycle', () => {
    const items = [make('A', ['B']), make('B', ['A'])];
    expect(resolveSelection(items, new Set(['A']), messages).resolved).toEqual(['A', 'B']);
  });
});

describe('filterItems', () => {
  const items = [
    make('M001', [], { title: 'Clean Architecture', category: 'architecture' }),
    make('G01', [], { title: 'Docs', description: 'Record decisions', category: 'documentation' }),
  ];

  it('returns everything for an empty term and no category', () => {
    expect(filterItems(items, '', [])).toHaveLength(2);
  });

  it('matches the term against id, title and description, ignoring case', () => {
    expect(filterItems(items, 'clean', []).map((i) => i.id)).toEqual(['M001']);
    expect(filterItems(items, 'G01', []).map((i) => i.id)).toEqual(['G01']);
    expect(filterItems(items, 'DECISIONS', []).map((i) => i.id)).toEqual(['G01']);
  });

  it('keeps only the selected categories', () => {
    expect(filterItems(items, '', ['documentation']).map((i) => i.id)).toEqual(['G01']);
    expect(filterItems(items, '', ['documentation', 'architecture'])).toHaveLength(2);
  });

  it('combines term and category', () => {
    expect(filterItems(items, 'clean', ['documentation'])).toEqual([]);
  });
});
