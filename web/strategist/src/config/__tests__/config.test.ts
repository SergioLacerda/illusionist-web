import { describe, expect, it } from 'vitest';
import { consumer, withConsumerUrls, RELEASES_PLACEHOLDER } from '../consumer';
import { EVENTS, STORAGE_KEYS } from '../storage';

describe('consumer config', () => {
  it('keeps the published Strategist links unchanged', () => {
    expect(consumer.repoUrl).toBe('https://github.com/SergioLacerda/strategist-skill');
    expect(consumer.quickstartUrl).toBe('https://github.com/SergioLacerda/strategist-skill/blob/main/QUICKSTART.md');
    expect(consumer.licenseUrl).toBe('https://github.com/SergioLacerda/strategist-skill/blob/main/LICENSE');
    expect(consumer.releasesUrl).toBe('https://github.com/SergioLacerda/strategist-skill/releases');
    expect(consumer.goInstallCommand).toBe('go install github.com/SergioLacerda/strategist-skill/cmd/strategist@latest');
    expect(consumer.installScriptUrl).toBe('https://raw.githubusercontent.com/SergioLacerda/strategist-skill/main/scripts/install.sh');
  });

  it('replaces the releases placeholder in nested dictionaries', () => {
    const dict = { pt: { a: `<a href="${RELEASES_PLACEHOLDER}">x</a>` }, en: { a: `y ${RELEASES_PLACEHOLDER}` } };
    const out = withConsumerUrls(dict);
    expect(out.pt.a).toBe(`<a href="${consumer.releasesUrl}">x</a>`);
    expect(out.en.a).toBe(`y ${consumer.releasesUrl}`);
  });
});

describe('storage config', () => {
  it('keeps persisted keys and events byte-identical to what visitors already have stored', () => {
    expect(STORAGE_KEYS).toEqual({
      pageLang: 'strategist_lang',
      consoleLang: 'strategist_console_lang',
      consoleFeature: 'strategist_console_feature',
      consoleTab: 'strategist_console_tab',
    });
    expect(EVENTS).toEqual({ lang: 'strategist:lang', feature: 'strategist:feature', tab: 'strategist:tab' });
  });
});
