import raw from '../../../content/kuva-arvoitukset.txt?raw';
import { parseArvoitukset } from '../../content/arvoitukset';

/** The riddles from content/kuva-arvoitukset.txt (checked again in CI before publishing). */
export const ARVOITUKSET_CONTENT = parseArvoitukset(raw);
