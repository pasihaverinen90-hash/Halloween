import raw1 from '../../../content/ristikko-1.txt?raw';
import raw2 from '../../../content/ristikko-2.txt?raw';
import raw3 from '../../../content/ristikko-3.txt?raw';
import { parseRistikko, type RistikkoContent } from '../../content/ristikko';

/** Pasi 25.10.: three crosswords; freeplay draws one of them every time. */
export const RISTIKKO_FILES = ['ristikko-1.txt', 'ristikko-2.txt', 'ristikko-3.txt'] as const;
const RAW = [raw1, raw2, raw3];

const cached = new Map<number, RistikkoContent>();

/**
 * The words and the crossword built from content/ristikko-<n>.txt (n = 1…3,
 * checked again in CI before publishing). Building takes a moment, so it
 * happens when a crossword opens, not when the game starts.
 */
export function ristikkoContent(version = 1): RistikkoContent {
  const index = Math.min(RAW.length, Math.max(1, version)) - 1;
  let content = cached.get(index);
  if (!content) {
    content = parseRistikko(RAW[index]);
    cached.set(index, content);
  }
  return content;
}

/** A crossword version (1…3) drawn at random. */
export function drawRistikkoVersion(random: () => number = Math.random): number {
  return 1 + Math.floor(random() * RAW.length);
}
