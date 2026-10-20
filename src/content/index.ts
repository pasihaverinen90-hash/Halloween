import type { ContentError } from './format';
import { parseHirsipuu } from './hirsipuu';

/** Every content file in content/ and how it is checked before publishing. Later phases add more. */
export interface ContentFile {
  /** File name in content/. */
  file: string;
  /** Finnish title for reports. */
  title: string;
  /** Problems found (empty = the file is fine). */
  check(text: string): ContentError[];
  /** Short Finnish description of a valid file, e.g. "5 sanaa". */
  describe(text: string): string;
}

export const CONTENT_FILES: readonly ContentFile[] = [
  {
    file: 'hirsipuu.txt',
    title: 'Hirsipuun sanat',
    check: (text) => {
      const result = parseHirsipuu(text);
      return result.ok ? [] : result.errors;
    },
    describe: (text) => {
      const result = parseHirsipuu(text);
      return result.ok ? `${result.words.length} sanaa` : '';
    },
  },
];
