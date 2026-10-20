import raw from '../../../content/ristikko.txt?raw';
import { parseRistikko, type RistikkoContent } from '../../content/ristikko';

let cached: RistikkoContent | null = null;

/**
 * The words and the crossword built from content/ristikko.txt (checked again
 * in CI before publishing). Building takes a moment, so it happens the first
 * time the crossword opens, not when the game starts.
 */
export function ristikkoContent(): RistikkoContent {
  cached ??= parseRistikko(raw);
  return cached;
}
