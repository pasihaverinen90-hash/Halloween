import type { ContentError } from './format';
import { parseArvoitukset } from './arvoitukset';
import { parseHirsipuu } from './hirsipuu';
import { parseRistikko } from './ristikko';

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
  {
    file: 'kuva-arvoitukset.txt',
    title: 'Kuva-arvoitukset',
    check: (text) => {
      const result = parseArvoitukset(text);
      return result.ok ? [] : result.errors;
    },
    describe: (text) => {
      const result = parseArvoitukset(text);
      return result.ok ? `${result.riddles.length} arvoitusta` : '';
    },
  },
  {
    file: 'ristikko-1.txt',
    title: 'Ristikon sanat, versio 1',
    check: (text) => {
      const result = parseRistikko(text);
      return result.ok ? [] : result.errors;
    },
    describe: (text) => {
      const result = parseRistikko(text);
      return result.ok ? `${result.words.length} sanaa, ristikko ${result.layout.cols} × ${result.layout.rows} ruutua` : '';
    },
  },
  {
    file: 'ristikko-2.txt',
    title: 'Ristikon sanat, versio 2',
    check: (text) => {
      const result = parseRistikko(text);
      return result.ok ? [] : result.errors;
    },
    describe: (text) => {
      const result = parseRistikko(text);
      return result.ok ? `${result.words.length} sanaa, ristikko ${result.layout.cols} × ${result.layout.rows} ruutua` : '';
    },
  },
  {
    file: 'ristikko-3.txt',
    title: 'Ristikon sanat, versio 3',
    check: (text) => {
      const result = parseRistikko(text);
      return result.ok ? [] : result.errors;
    },
    describe: (text) => {
      const result = parseRistikko(text);
      return result.ok ? `${result.words.length} sanaa, ristikko ${result.layout.cols} × ${result.layout.rows} ruutua` : '';
    },
  },
];
