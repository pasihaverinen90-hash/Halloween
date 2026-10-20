import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ContentError } from '../src/content/format';
import { CONTENT_FILES } from '../src/content/index';

/*
 * Checks every content file before publishing (run in GitHub Actions).
 * Errors are printed in Finnish, shown as annotations on the file, and
 * summarised on the run's Summary page. Exit code 1 stops the publish, so the
 * previous working version of the game stays online.
 */

export interface FileReport {
  file: string;
  title: string;
  ok: boolean;
  /** For a valid file, e.g. "5 sanaa". */
  description: string;
  errors: ContentError[];
}

export function checkAllContent(readFile: (file: string) => string): FileReport[] {
  return CONTENT_FILES.map((entry) => {
    let text: string;
    try {
      text = readFile(entry.file);
    } catch {
      return {
        file: entry.file,
        title: entry.title,
        ok: false,
        description: '',
        errors: [{ line: null, message: `Tiedostoa content/${entry.file} ei löytynyt tai sitä ei voitu lukea.` }],
      };
    }
    const errors = entry.check(text);
    return { file: entry.file, title: entry.title, ok: errors.length === 0, description: errors.length === 0 ? entry.describe(text) : '', errors };
  });
}

function escapeData(text: string): string {
  return text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

/** GitHub Actions annotations: the errors show up on the file in the run view. */
export function annotations(reports: readonly FileReport[]): string[] {
  return reports.flatMap((report) =>
    report.errors.map((error) => {
      const line = error.line === null ? '' : `,line=${error.line}`;
      return `::error file=content/${report.file}${line},title=Sisältövirhe::${escapeData(error.message)}`;
    }),
  );
}

/** Markdown for the run's Summary page. */
export function summaryMarkdown(reports: readonly FileReport[]): string {
  const failed = reports.filter((report) => !report.ok);
  if (failed.length === 0) {
    const lines = reports.map((report) => `- ${report.title} (\`content/${report.file}\`): ${report.description}`);
    return ['## ✅ Sisältötiedostot ovat kunnossa', '', ...lines, ''].join('\n');
  }
  const parts = [
    '## ❌ Sisältötiedostossa on virhe',
    '',
    'Julkaisu pysäytettiin. Peli näyttää edelleen edellistä toimivaa versiota, joten pelaajille ei näy mitään rikkinäistä.',
    '',
    'Korjaa alla mainitut kohdat GitHubin selaineditorissa (avaa tiedosto ja paina kynän kuvaa). Kun tallennat korjauksen, julkaisu yritetään automaattisesti uudelleen.',
    '',
  ];
  for (const report of failed) {
    parts.push(`### ${report.title} – \`content/${report.file}\``, '');
    for (const error of report.errors) parts.push(`- ${error.message}`);
    parts.push('');
  }
  return parts.join('\n');
}

function main(): void {
  const root = resolve(import.meta.dirname, '..');
  const reports = checkAllContent((file) => readFileSync(resolve(root, 'content', file), 'utf8'));
  for (const report of reports) {
    if (report.ok) console.log(`✓ content/${report.file}: ${report.description}`);
    else {
      console.log(`✗ content/${report.file}: ${report.errors.length} virhettä`);
      for (const error of report.errors) console.log(`    ${error.message}`);
    }
  }
  for (const line of annotations(reports)) console.log(line);
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) appendFileSync(summaryFile, `${summaryMarkdown(reports)}\n`);
  const ok = reports.every((report) => report.ok);
  console.log(ok ? 'Sisältötiedostot ovat kunnossa.' : 'Sisältötiedostoissa on virheitä. Julkaisu pysäytetään.');
  process.exitCode = ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
