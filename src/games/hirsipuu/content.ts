import raw from '../../../content/hirsipuu.txt?raw';
import { parseHirsipuu } from '../../content/hirsipuu';

/** The hangman words from content/hirsipuu.txt (checked again in CI before publishing). */
export const HIRSIPUU_CONTENT = parseHirsipuu(raw);
