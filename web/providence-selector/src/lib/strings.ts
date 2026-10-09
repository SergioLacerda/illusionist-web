export type Lang = 'en' | 'pt';

export interface Strings {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  export: string;
  import: string;
  clear: string;
  selected: (count: number) => string;
  depends: (ids: string) => string;
  mandatory: string;
  optional: string;
  imported: (count: number) => string;
  cleared: string;
  errReadFile: string;
  errImportJson: string;
  errImportFormat: string;
  errImportObject: string;
  errImportVersion: string;
  errImportIds: string;
  errUnknownId: (id: string) => string;
  errDataLoad: (detail: string) => string;
  errDataInvalid: (detail: string) => string;
  warnUnknown: (id: string) => string;
  warnMissingDep: (item: string, dependency: string) => string;
  warnRequires: (item: string, dependency: string) => string;
}

// Texts below the "new" markers do not exist in the baseline Selector; they
// cover the contract checks added at the presentation boundary.
export const STRINGS: Record<Lang, Strings> = {
  en: {
    title: 'SDD Selector',
    subtitle: 'Select governed items and export a JSON artifact.',
    searchPlaceholder: 'Search items',
    export: 'Export JSON',
    import: 'Import JSON',
    clear: 'Clear',
    selected: (n) => `${n} selected`,
    depends: (ids) => `Depends: ${ids}`,
    mandatory: 'mandatory',
    optional: 'optional',
    imported: (n) => `Imported ${n} selected item(s).`,
    cleared: 'Selection cleared.',
    errReadFile: 'Failed to read selection file.',
    errImportJson: 'Failed to import selection JSON.',
    errImportFormat: "Invalid file: import a selection file exported via 'Export JSON', not data.json.",
    errImportObject: 'Selection payload must be an object.',
    errImportVersion: 'Selection payload version must be a string.',
    errImportIds: 'Selection ids must be strings.',
    errUnknownId: (id) => `Unknown selector ID: ${id}`,
    errDataLoad: (detail) =>
      `Failed to load data.json: ${detail}. Serve the selector over HTTP (e.g. python -m http.server) instead of opening it as a file://.`,
    // new
    errDataInvalid: (detail) => `Cannot use data.json: ${detail}.`,
    warnUnknown: (id) => `Unknown selected item: ${id}`,
    warnMissingDep: (a, b) => `${a} references missing dependency ${b}`,
    warnRequires: (a, b) => `${a} requires ${b}`,
  },
  pt: {
    title: 'SDD Selector',
    subtitle: 'Selecione itens governados e exporte um artefato JSON.',
    searchPlaceholder: 'Buscar itens',
    export: 'Exportar JSON',
    import: 'Importar JSON',
    clear: 'Limpar',
    selected: (n) => `${n} selecionado(s)`,
    depends: (ids) => `Depende de: ${ids}`,
    mandatory: 'obrigatório',
    optional: 'opcional',
    imported: (n) => `${n} item(s) importado(s).`,
    cleared: 'Seleção limpa.',
    errReadFile: 'Falha ao ler o arquivo.',
    errImportJson: 'Falha ao importar JSON de seleção.',
    errImportFormat:
      "Arquivo inválido: importe um arquivo de seleção exportado pelo botão 'Exportar JSON', não o data.json.",
    errImportObject: 'O arquivo de seleção deve ser um objeto.',
    errImportVersion: 'A versão do arquivo de seleção deve ser um texto.',
    errImportIds: 'Os ids da seleção devem ser textos.',
    errUnknownId: (id) => `ID desconhecido: ${id}`,
    errDataLoad: (detail) =>
      `Failed to load data.json: ${detail}. Serve the selector over HTTP (e.g. python -m http.server) instead of opening it as a file://.`,
    // new
    errDataInvalid: (detail) => `Não foi possível usar o data.json: ${detail}.`,
    warnUnknown: (id) => `Item selecionado desconhecido: ${id}`,
    warnMissingDep: (a, b) => `${a} referencia dependência ausente ${b}`,
    warnRequires: (a, b) => `${a} requer ${b}`,
  },
};

export function langFromSearch(search: string): Lang {
  return new URLSearchParams(search).get('lang') === 'pt' ? 'pt' : 'en';
}
