import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AssetSpec } from '../src/games/types';
import { UI_ASSETS } from '../src/ui/assets';

/*
 * Generates ASSETS.md: every replaceable image with a ready-to-use prompt for
 * an image generator. Run `npm run kuvalista` after changing any AssetSpec.
 * The list depends only on the code (never on public/assets), so Pasi's
 * uploads never make it outdated.
 */

export interface AssetSection {
  title: string;
  specs: AssetSpec[];
}

/** Game ids in menu order, read from the text of src/games/registry.ts (it cannot be imported in Node). */
export function gameOrderFromRegistry(source: string): string[] {
  const match = /GAME_ORDER[^=]*=\s*\[([\s\S]*?)\]/.exec(source);
  if (!match) return [];
  const body = match[1].replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...body.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

function sizeText(spec: AssetSpec): string {
  return `${spec.width} × ${spec.height} px`;
}

function generatorPrompt(spec: AssetSpec): string {
  const parts = [spec.prompt.trim(), `Tyyli: ${spec.style.trim()}`];
  if (spec.frames) {
    const total = spec.width * spec.frames.count;
    parts.push(
      `Kuvassa on ${spec.frames.count} animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (${spec.frames.order}). Yksi ruutu on ${spec.width} × ${spec.height} pikseliä, koko kuva ${total} × ${spec.height} pikseliä.`,
    );
  } else {
    parts.push(`Koko ${spec.width} × ${spec.height} pikseliä.`);
  }
  parts.push(spec.transparent ? 'Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.' : 'Kuva täyttää koko alueen, ei läpinäkyvyyttä.');
  return parts.join(' ');
}

export function renderAssetsMarkdown(sections: readonly AssetSection[]): string {
  const out: string[] = [
    '# Kuvat',
    '',
    'Tämä luettelo tehdään automaattisesti pelin koodista (`npm run kuvalista`), joten älä muokkaa sitä käsin.',
    '',
    'Peli piirtää kaikki kuvat itse. Voit korvata minkä tahansa kuvan omalla kuvallasi:',
    '',
    '1. Tee kuva esimerkiksi kuvageneraattorilla. Jokaisen kuvan kohdalla on valmis kuvaus, jonka voit antaa generaattorille sellaisenaan.',
    '2. Nimeä tiedosto täsmälleen luettelon mukaan, esimerkiksi `hirsipuu-luuranko-1.png`. Myös .jpg- ja .webp-tiedostot käyvät, kunhan nimen alkuosa on sama.',
    '3. Avaa GitHubissa kansio [`public/assets/`](public/assets/), valitse **Add file → Upload files**, raahaa kuva sivulle ja paina **Commit changes**.',
    '4. Peli päivittyy muutamassa minuutissa. Jos kuva puuttuu tai ei aukea, peli käyttää koodilla piirrettyä kuvaa.',
    '',
    'Hyvä tietää:',
    '',
    '- Kuvan ei tarvitse olla täsmälleen ilmoitetun kokoinen. Isompi kuva on hyvä, kunhan mittasuhde on suunnilleen sama. Peli sovittaa kuvan paikalleen vääristämättä sitä.',
    '- **Läpinäkyvä tausta** tarkoittaa, että kuvassa on vain itse kohde ja kaikki muu on läpinäkyvää (PNG-tiedosto). Jos generaattori ei osaa tehdä läpinäkyvää taustaa, pyydä yksiväristä taustaa ja kerro siitä Claude Codelle. Taustan voi poistaa jälkikäteen.',
    '- Saman pelin kuvat kannattaa tehdä samalla tyylillä, esimerkiksi samassa keskustelussa generaattorin kanssa.',
    '',
  ];
  for (const section of sections) {
    out.push(`## ${section.title}`, '');
    for (const spec of section.specs) {
      out.push(`### \`${spec.file}\` – ${spec.title}`, '');
      out.push(`- **Koko:** ${sizeText(spec)}`);
      out.push(`- **Tausta:** ${spec.transparent ? 'läpinäkyvä' : 'ei läpinäkyvyyttä, kuva täyttää koko alueen'}`);
      out.push(`- **Tyyli:** ${spec.style}`);
      if (spec.frames) out.push(`- **Animaatio:** ${spec.frames.count} kuvaa vierekkäin vasemmalta oikealle: ${spec.frames.order}`);
      out.push('', '**Kuvaus generaattorille:**', '', `> ${generatorPrompt(spec)}`, '');
    }
  }
  return out.join('\n');
}

/** Sections: shared images first, then each game in menu order. */
export async function collectSections(root: string): Promise<AssetSection[]> {
  const sections: AssetSection[] = [{ title: 'Yleiset kuvat', specs: UI_ASSETS }];
  const order = gameOrderFromRegistry(readFileSync(resolve(root, 'src/games/registry.ts'), 'utf8'));
  for (const id of order) {
    const assetsFile = resolve(root, 'src/games', id, 'assets.ts');
    const metaFile = resolve(root, 'src/games', id, 'meta.ts');
    if (!existsSync(assetsFile) || !existsSync(metaFile)) {
      console.warn(`Pelillä ${id} ei ole vielä kuvaluetteloa (assets.ts / meta.ts).`);
      continue;
    }
    const assets = (await import(pathToFileURL(assetsFile).href)) as { PREVIEW: AssetSpec; ASSETS: AssetSpec[] };
    const meta = (await import(pathToFileURL(metaFile).href)) as { META: { name: string; genre: string } };
    sections.push({ title: `${meta.META.name} (${meta.META.genre.toLocaleLowerCase('fi-FI')})`, specs: [assets.PREVIEW, ...assets.ASSETS] });
  }
  return sections;
}

export async function buildAssetsMarkdown(root: string): Promise<string> {
  return renderAssetsMarkdown(await collectSections(root));
}

async function main(): Promise<void> {
  const root = resolve(import.meta.dirname, '..');
  const markdown = await buildAssetsMarkdown(root);
  writeFileSync(resolve(root, 'ASSETS.md'), markdown);
  console.log('ASSETS.md päivitetty.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main();
