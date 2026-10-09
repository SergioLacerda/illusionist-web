import type { SelectorItem } from './contract';

export interface ResolveMessages {
  unknown: (id: string) => string;
  missingDep: (item: string, dependency: string) => string;
  requires: (item: string, dependency: string) => string;
}

export interface Resolution {
  warnings: string[];
  resolved: string[];
}

/**
 * Presentation-level dependency resolution: adds the dependencies of the
 * selected items and says what was added. It does not decide whether the
 * dependencies are semantically valid; Providence owns that.
 */
export function resolveSelection(
  items: readonly SelectorItem[],
  selected: ReadonlySet<string>,
  messages: ResolveMessages,
): Resolution {
  const warnings: string[] = [];
  const resolved = new Set(selected);
  const byId = new Map(items.map((item) => [item.id, item]));
  const queue = [...selected];
  const visiting = new Set<string>();
  for (let itemId = queue.shift(); itemId !== undefined; itemId = queue.shift()) {
    if (visiting.has(itemId)) continue;
    visiting.add(itemId);
    const item = byId.get(itemId);
    if (!item) {
      warnings.push(messages.unknown(itemId));
      continue;
    }
    for (const dependency of item.depends_on) {
      if (!byId.has(dependency)) {
        warnings.push(messages.missingDep(item.id, dependency));
        continue;
      }
      if (!resolved.has(dependency)) {
        warnings.push(messages.requires(item.id, dependency));
        resolved.add(dependency);
        queue.push(dependency);
      }
    }
  }
  return { warnings, resolved: [...resolved].sort() };
}

export function filterItems(
  items: readonly SelectorItem[],
  term: string,
  categories: readonly string[],
): SelectorItem[] {
  const needle = term.toLowerCase();
  return items.filter((item) => {
    const text = `${item.id} ${item.title} ${item.description}`.toLowerCase();
    const matchesText = needle === '' || text.includes(needle);
    const matchesCategory = categories.length === 0 || categories.includes(item.category);
    return matchesText && matchesCategory;
  });
}
