import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { annotations, checkAllContent, summaryMarkdown } from './tarkista-sisalto';

describe('content check', () => {
  it('passes with the real content files', () => {
    const reports = checkAllContent((file) => readFileSync(`content/${file}`, 'utf8'));
    expect(reports.every((r) => r.ok)).toBe(true);
    expect(summaryMarkdown(reports)).toMatch(/✅ Sisältötiedostot ovat kunnossa/);
    expect(annotations(reports)).toEqual([]);
  });

  it('stops the publish with Finnish annotations and summary for a broken file', () => {
    const broken = readFileSync('content/hirsipuu.txt', 'utf8').replace('vihje: Siivekäs', 'vihje Siivekäs');
    const reports = checkAllContent(() => broken);
    expect(reports[0].ok).toBe(false);
    const lines = annotations(reports);
    expect(lines.some((line) => /^::error file=content\/hirsipuu.txt,line=\d+,title=Sisältövirhe::Rivi \d+: kaksoispiste puuttuu/.test(line))).toBe(true);
    const summary = summaryMarkdown(reports);
    expect(summary).toMatch(/Julkaisu pysäytettiin/);
    expect(summary).toMatch(/edellistä toimivaa versiota/);
  });

  it('reports a missing file', () => {
    const reports = checkAllContent(() => {
      throw new Error('ENOENT');
    });
    expect(reports[0].errors[0].message).toMatch(/ei löytynyt/);
  });
});
