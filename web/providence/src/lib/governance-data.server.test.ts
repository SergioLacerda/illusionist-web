import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { loadGovernanceStats, statsFromSnapshot } from './governance-data.server';

// Adapted from the baseline test (documented in the migration report): the
// loader no longer reads `.providence/metadata.json` from the repository
// root. It reads a pinned snapshot committed inside this surface, so there is
// no file system access left to mock.

describe('statsFromSnapshot — valid snapshot', () => {
  it('returns real stats when the snapshot is valid', () => {
    expect(
      statsFromSnapshot({
        mandates_count: 16,
        guidelines_count: 23,
        fingerprints: { combined: 'f95a3c901a84b222' },
      }),
    ).toEqual({
      mandatesCount: 16,
      guidelinesCount: 23,
      fingerprintShort: 'f95a…b222',
      available: true,
    });
  });
});

describe('statsFromSnapshot — fallback path', () => {
  const PLACEHOLDER = {
    mandatesCount: 0,
    guidelinesCount: 0,
    fingerprintShort: '—',
    available: false,
  };

  it('falls back when the snapshot is not an object', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(statsFromSnapshot(null)).toEqual(PLACEHOLDER);
    expect(statsFromSnapshot('{not valid json')).toEqual(PLACEHOLDER);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('falls back when a required field is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stats = statsFromSnapshot({
      mandates_count: 16,
      // guidelines_count missing
      fingerprints: { combined: 'f95a3c901a84b222' },
    });
    expect(stats.available).toBe(false);
    warn.mockRestore();
  });

  it('falls back when the fingerprint is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stats = statsFromSnapshot({
      mandates_count: 16,
      guidelines_count: 23,
      fingerprints: {},
    });
    expect(stats.available).toBe(false);
    warn.mockRestore();
  });
});

describe('loadGovernanceStats — pinned snapshot', () => {
  it('returns the Providence values pinned in the surface', () => {
    expect(loadGovernanceStats()).toEqual({
      mandatesCount: 16,
      guidelinesCount: 23,
      fingerprintShort: '3c92…9611',
      available: true,
    });
  });

  it('does not depend on the repository the build runs in', () => {
    const source = readFileSync(
      new URL('./governance-data.server.ts', import.meta.url),
      'utf-8',
    );
    expect(source).not.toMatch(/node:fs|node:path|node:url/);
    expect(source).not.toContain('.providence');
    expect(source).not.toContain('SDD_REPO_ROOT');
  });
});

describe('statsFromSnapshot — fingerprint shortening', () => {
  it('keeps a short fingerprint as is', () => {
    expect(
      statsFromSnapshot({
        mandates_count: 1,
        guidelines_count: 2,
        fingerprints: { combined: 'abc123' },
      }).fingerprintShort,
    ).toBe('abc123');
  });
});
