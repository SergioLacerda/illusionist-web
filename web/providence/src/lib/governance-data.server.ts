/**
 * Governance statistics shown on the pages.
 *
 * The baseline read the product governance metadata file from the repository root at
 * build time, found by walking up to a `.git` entry. Inside ILUSIONISTA that
 * would pick up another product's governance data (or nothing in CI), so the
 * values are an explicit input pinned in `src/data/governance-snapshot.json`
 * (source and ref are recorded in the file). Refreshing it is a manual,
 * recorded act. No file system access and no dependency on the repository the
 * build runs in.
 */
import snapshot from '../data/governance-snapshot.json';
import {
  PLACEHOLDER_GOVERNANCE_STATS,
  type GovernanceStats,
} from './governance-stats';

function shortenFingerprint(fingerprint: string): string {
  if (fingerprint.length <= 12) return fingerprint;
  return `${fingerprint.slice(0, 4)}…${fingerprint.slice(-4)}`;
}

/**
 * Validates a snapshot and turns it into stats. Falls back to placeholder
 * stats (with a build warning) when it is missing or invalid, so fake data is
 * never shown as real.
 */
export function statsFromSnapshot(raw: unknown): GovernanceStats {
  try {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('governance snapshot is not an object');
    }
    const data = raw as {
      mandates_count?: unknown;
      guidelines_count?: unknown;
      fingerprints?: { combined?: unknown };
    };
    const fingerprint = data.fingerprints?.combined;
    if (
      typeof data.mandates_count !== 'number' ||
      typeof data.guidelines_count !== 'number' ||
      typeof fingerprint !== 'string' ||
      fingerprint === ''
    ) {
      throw new Error('governance snapshot is missing required fields');
    }
    return {
      mandatesCount: data.mandates_count,
      guidelinesCount: data.guidelines_count,
      fingerprintShort: shortenFingerprint(fingerprint),
      available: true,
    };
  } catch (err) {
    console.warn(
      `[governance-data] governance snapshot is not usable (${(err as Error).message}). ` +
        'Falling back to placeholder stats.',
    );
    return PLACEHOLDER_GOVERNANCE_STATS;
  }
}

/** Loads the pinned Providence governance stats. */
export function loadGovernanceStats(): GovernanceStats {
  return statsFromSnapshot(snapshot);
}
