import { ContractError, parseData, parseDocsIndex, parseSelection, type SelectorItem } from './contract';
import { filterItems, resolveSelection, type ResolveMessages } from './resolve';
import { langFromSearch, STRINGS, type Strings } from './strings';

export interface FetchedResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type FetchLike = (url: string) => Promise<FetchedResponse>;

export interface AppEnv {
  doc: Document;
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  fetchFn: FetchLike;
  /** `location.search`, used for `?lang=pt`. */
  search: string;
  saveFile: (name: string, text: string) => void;
  readText: (file: File) => Promise<string>;
}

type StatusKind = 'info' | 'success' | 'error' | 'warning';

const SELECTION_KEY = 'sdd-selector';
const EXPORT_VERSION = '1.0';

function element<T extends HTMLElement>(doc: Document, id: string): T {
  const node = doc.getElementById(id);
  if (!node) throw new Error(`Selector markup is missing #${id}`);
  return node as T;
}

/**
 * Boots the Selector: loads `data.json` (required) and `docs.index.json`
 * (optional enrichment), restores the stored selection and wires the UI.
 * Presentation only; Providence remains the authority on governed data.
 */
export async function boot(env: AppEnv): Promise<void> {
  const { doc, storage } = env;
  const T: Strings = STRINGS[langFromSearch(env.search)];
  const messages: ResolveMessages = { unknown: T.warnUnknown, missingDep: T.warnMissingDep, requires: T.warnRequires };

  let items: SelectorItem[] = [];
  const selected = new Set<string>();
  const categories = new Set<string>();

  const searchBox = element<HTMLInputElement>(doc, 'search');
  const statusNode = element(doc, 'status');
  const warningsNode = element(doc, 'warnings');
  const summaryNode = element(doc, 'summary');
  const itemsNode = element(doc, 'items');
  const filtersNode = element(doc, 'filters');
  const importFile = element<HTMLInputElement>(doc, 'import-file');

  const resolution = () => resolveSelection(items, selected, messages);

  function showStatus(message: string, kind: StatusKind = 'info'): void {
    if (message === '') {
      statusNode.classList.add('hidden');
      statusNode.textContent = '';
      statusNode.dataset.kind = '';
      return;
    }
    statusNode.classList.remove('hidden');
    statusNode.dataset.kind = kind;
    statusNode.textContent = message;
  }

  function updateWarnings(): void {
    const { warnings } = resolution();
    if (warnings.length === 0) {
      warningsNode.classList.add('hidden');
      warningsNode.textContent = '';
      return;
    }
    warningsNode.classList.remove('hidden');
    warningsNode.replaceChildren(
      ...warnings.map((warning) => {
        const div = doc.createElement('div');
        div.textContent = warning;
        return div;
      }),
    );
  }

  function updateSummary(): void {
    summaryNode.textContent = T.selected(resolution().resolved.length);
  }

  function persistSelection(): void {
    storage.setItem(SELECTION_KEY, JSON.stringify([...selected]));
  }

  function refresh(): void {
    updateWarnings();
    updateSummary();
  }

  function toggleSelection(itemId: string, checked: boolean): void {
    if (checked) selected.add(itemId);
    else selected.delete(itemId);
    persistSelection();
    refresh();
  }

  function activeCategories(): string[] {
    return [...doc.querySelectorAll<HTMLElement>('[data-filter].active')].map((node) => node.dataset.filter ?? '');
  }

  function pill(className: string, content: string): HTMLSpanElement {
    const node = doc.createElement('span');
    node.className = className;
    node.textContent = content;
    return node;
  }

  function buildItemCard(item: SelectorItem): HTMLElement {
    const article = doc.createElement('article');
    article.className = 'card';
    article.dataset.itemType = item.item_type;

    const label = doc.createElement('label');
    const checkbox = doc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.item = item.id;
    checkbox.checked = selected.has(item.id);
    checkbox.addEventListener('change', () => toggleSelection(item.id, checkbox.checked));
    label.append(checkbox, ` ${item.id}`);

    const title = doc.createElement('h2');
    title.textContent = item.title;
    const description = doc.createElement('p');
    description.textContent = item.description;

    const meta = doc.createElement('div');
    meta.className = 'meta';
    meta.append(
      pill(`pill pill--type pill--${item.item_type}`, item.item_type),
      pill('pill', item.category),
      pill('pill', item.mandatory ? T.mandatory : T.optional),
    );
    if (item.depends_on.length > 0) meta.append(pill('pill', T.depends(item.depends_on.join(', '))));

    article.append(label, title, description, meta);
    return article;
  }

  function renderItems(): void {
    itemsNode.replaceChildren(...filterItems(items, searchBox.value, activeCategories()).map(buildItemCard));
  }

  function renderFilters(): void {
    filtersNode.replaceChildren(
      ...[...categories].sort().map((name) => {
        const button = doc.createElement('button');
        button.type = 'button';
        button.dataset.filter = name;
        button.textContent = name;
        button.addEventListener('click', () => {
          button.classList.toggle('active');
          renderItems();
        });
        return button;
      }),
    );
  }

  function restoreSelection(): void {
    const stored = storage.getItem(SELECTION_KEY);
    if (stored === null) return;
    try {
      for (const itemId of JSON.parse(stored) as unknown[]) {
        if (typeof itemId === 'string') selected.add(itemId);
      }
    } catch {
      storage.removeItem(SELECTION_KEY);
    }
  }

  function downloadSelection(): void {
    const payload = {
      version: EXPORT_VERSION,
      selected_ids: [...selected].sort(),
      resolved_ids: resolution().resolved,
    };
    env.saveFile('selector-selection.json', JSON.stringify(payload, null, 2));
  }

  function importSelection(content: string): void {
    const byId = new Set(items.map((item) => item.id));
    // Parse and validate first: a rejected file never changes the selection.
    const ids = parseSelection(JSON.parse(content), byId, {
      notObject: T.errImportObject,
      version: T.errImportVersion,
      format: T.errImportFormat,
      ids: T.errImportIds,
      unknown: T.errUnknownId,
    });
    selected.clear();
    for (const id of ids) selected.add(id);
    persistSelection();
    renderItems();
    refresh();
  }

  function importSelectionFile(file: File): void {
    env
      .readText(file)
      .then(
        (content) => {
          try {
            importSelection(content);
            showStatus(T.imported(selected.size), 'success');
          } catch (error) {
            const known = error instanceof ContractError;
            showStatus(known ? error.message : T.errImportJson, 'error');
          }
        },
        () => showStatus(T.errReadFile, 'error'),
      );
  }

  function clearSelection(): void {
    selected.clear();
    persistSelection();
    renderItems();
    refresh();
    showStatus(T.cleared, 'info');
  }

  async function loadDocsIndex(): Promise<void> {
    let raw: unknown;
    try {
      const response = await env.fetchFn('docs.index.json');
      if (!response.ok) return; // not available: optional, silent
      raw = await response.json();
    } catch (error) {
      // Unreachable is the same as absent; only a body that is present but
      // cannot be parsed is worth telling the user about.
      if (error instanceof SyntaxError) {
        showStatus(parseDocsIndex(undefined).problem ?? '', 'warning');
      }
      return;
    }
    const index = parseDocsIndex(raw);
    if (index.problem) showStatus(index.problem, 'warning');
  }

  doc.title = T.title;
  const heading = doc.querySelector('.hero h1');
  const subtitle = doc.querySelector('.hero p');
  if (heading) heading.textContent = T.title;
  if (subtitle) subtitle.textContent = T.subtitle;
  searchBox.placeholder = T.searchPlaceholder;
  element(doc, 'export').textContent = T.export;
  element(doc, 'import').textContent = T.import;
  element(doc, 'clear').textContent = T.clear;

  let raw: unknown;
  try {
    const response = await env.fetchFn('data.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    raw = await response.json();
  } catch (error) {
    showStatus(T.errDataLoad((error as Error).message), 'error');
    return;
  }
  try {
    items = parseData(raw).items;
  } catch (error) {
    showStatus(T.errDataInvalid((error as Error).message), 'error');
    return;
  }
  for (const item of items) categories.add(item.category);

  await loadDocsIndex();

  restoreSelection();
  renderFilters();
  renderItems();
  refresh();
  searchBox.addEventListener('input', renderItems);
  element(doc, 'export').addEventListener('click', downloadSelection);
  element(doc, 'import').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', () => {
    const [file] = importFile.files ?? [];
    if (!file) return;
    importSelectionFile(file);
    importFile.value = '';
  });
  element(doc, 'clear').addEventListener('click', clearSelection);
}
