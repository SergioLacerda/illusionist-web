// Persisted preference keys and cross-island events. The values are kept exactly as
// shipped so that preferences already stored in visitors' browsers keep working.
export const STORAGE_KEYS = {
  pageLang: 'strategist_lang',
  consoleLang: 'strategist_console_lang',
  consoleFeature: 'strategist_console_feature',
  consoleTab: 'strategist_console_tab',
} as const;

export const EVENTS = {
  lang: 'strategist:lang',
  feature: 'strategist:feature',
  tab: 'strategist:tab',
} as const;
