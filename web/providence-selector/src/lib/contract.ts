/**
 * Presentation-boundary contract of the Selector.
 *
 * Providence owns governed data and semantic validation. This module only
 * checks the structure the UI needs to render (see
 * docs/contracts/providence-selector-data-v1.md); it never judges whether
 * dependencies are semantically valid or repairs governed data.
 */

export class ContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContractError';
  }
}

export interface SelectorItem {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  tags: string[];
  depends_on: string[];
  item_type: string;
}

export interface SelectorData {
  version: string;
  generated_at?: string;
  items: SelectorItem[];
}

export interface DocsIndex {
  documents: unknown[];
  /** Set when the index was present but unusable. Never fatal. */
  problem?: string;
}

/** Data versions the surface understands: major 1 ("1", "1.0", "1.12.3"). */
const SUPPORTED_VERSION = /^1(\.\d+)*$/;

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function parseItem(raw: unknown, index: number): SelectorItem {
  const at = `items[${index}]`;
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ContractError(`${at} must be an object`);
  }
  const entry = raw as Record<string, unknown>;
  const text = (field: string, allowEmpty: boolean): string => {
    const value = entry[field];
    if (typeof value !== 'string' || (!allowEmpty && value === '')) {
      throw new ContractError(`${at}.${field} must be ${allowEmpty ? 'a string' : 'a non-empty string'}`);
    }
    return value;
  };
  const list = (field: string): string[] => {
    const value = entry[field];
    if (!isStringList(value)) throw new ContractError(`${at}.${field} must be a list of strings`);
    return [...value];
  };
  if (typeof entry.mandatory !== 'boolean') throw new ContractError(`${at}.mandatory must be true or false`);
  const itemType = entry.item_type === undefined ? 'mandate' : entry.item_type;
  if (typeof itemType !== 'string') throw new ContractError(`${at}.item_type must be a string`);
  return {
    id: text('id', false),
    title: text('title', true),
    description: text('description', true),
    category: text('category', true),
    mandatory: entry.mandatory,
    tags: list('tags'),
    depends_on: list('depends_on'),
    item_type: itemType,
  };
}

/** Validates the structure of `data.json` and returns it typed. */
export function parseData(raw: unknown): SelectorData {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ContractError('data.json must be an object');
  }
  const payload = raw as Record<string, unknown>;
  if (typeof payload.version !== 'string' || !SUPPORTED_VERSION.test(payload.version)) {
    throw new ContractError(
      `unsupported data.json version ${JSON.stringify(payload.version)}; this Selector supports major version 1`,
    );
  }
  if (!Array.isArray(payload.items)) {
    throw new ContractError('data.json items must be a list');
  }
  const items = payload.items.map(parseItem);
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new ContractError(`data.json contains a duplicate item id: ${item.id}`);
    seen.add(item.id);
  }
  const data: SelectorData = { version: payload.version, items };
  if (typeof payload.generated_at === 'string') data.generated_at = payload.generated_at;
  return data;
}

/** `docs.index.json` is optional enrichment: any problem is reported, never thrown. */
export function parseDocsIndex(raw: unknown): DocsIndex {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const documents = (raw as Record<string, unknown>).documents;
    if (Array.isArray(documents)) return { documents };
  }
  return { documents: [], problem: 'docs.index.json is present but has no "documents" list; it was ignored' };
}

export interface SelectionMessages {
  notObject: string;
  version: string;
  format: string;
  ids: string;
  unknown: (id: string) => string;
}

/**
 * Reads an exported `selector-selection.json`. Unknown or invalid payloads
 * raise a ContractError with a user-facing message and change nothing.
 */
export function parseSelection(raw: unknown, known: ReadonlySet<string>, messages: SelectionMessages): string[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ContractError(messages.notObject);
  }
  const payload = raw as Record<string, unknown>;
  if (typeof payload.version !== 'string') throw new ContractError(messages.version);
  const ids = Array.isArray(payload.selected_ids) ? payload.selected_ids : payload.resolved_ids;
  if (!Array.isArray(ids)) throw new ContractError(messages.format);
  const selected: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string') throw new ContractError(messages.ids);
    if (!known.has(id)) throw new ContractError(messages.unknown(id));
    selected.push(id);
  }
  return selected;
}
