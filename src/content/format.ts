/*
 * The content file format ("korttimuoto"), made for editing in GitHub's web
 * editor: cards separated by blank lines, one "avain: arvo" per line, lines
 * starting with # are comments. No quotes, no indentation rules.
 *
 *   # Kommentti
 *   sana: Lepakko
 *   vihje: Nukkuu pää alaspäin
 *
 *   sana: Noidan pata
 *   vihje: Siinä porisee taikajuoma
 */

export interface ContentField {
  value: string;
  /** 1-based line number in the file. */
  line: number;
}

export interface ContentCard {
  /** Line where the card starts. */
  line: number;
  /** Fields by lower-case key. */
  fields: Map<string, ContentField>;
}

/** A problem found in a content file. The message is Finnish and tells how to fix it. */
export interface ContentError {
  line: number | null;
  message: string;
}

const KEY_PATTERN = /^[\p{L}]+$/u;

export function parseCards(text: string): { cards: ContentCard[]; errors: ContentError[] } {
  const cards: ContentCard[] = [];
  const errors: ContentError[] = [];
  const lines = text.replace(/^﻿/, '').split(/\r\n|\r|\n/);
  let card: ContentCard | null = null;

  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.trim();
    if (line === '') {
      card = null;
      return;
    }
    if (line.startsWith('#')) return;

    const colon = line.indexOf(':');
    if (colon < 0) {
      errors.push({
        line: lineNo,
        message: `Rivi ${lineNo}: kaksoispiste puuttuu. Kirjoita rivi muodossa "avain: teksti", esimerkiksi "vihje: Nukkuu pää alaspäin".`,
      });
      return;
    }
    const key = line.slice(0, colon).trim().toLocaleLowerCase('fi-FI');
    const value = line.slice(colon + 1).trim().replace(/\s+/g, ' ');
    if (key === '') {
      errors.push({ line: lineNo, message: `Rivi ${lineNo}: rivin alusta puuttuu sana ennen kaksoispistettä, esimerkiksi "sana:" tai "vihje:".` });
      return;
    }
    if (!KEY_PATTERN.test(key)) {
      errors.push({
        line: lineNo,
        message: `Rivi ${lineNo}: "${line.slice(0, colon).trim()}" ei kelpaa kohdan nimeksi. Rivin pitää alkaa yhdellä sanalla ja kaksoispisteellä, esimerkiksi "sana:".`,
      });
      return;
    }
    if (value === '') {
      errors.push({ line: lineNo, message: `Rivi ${lineNo}: kohdan "${key}" teksti puuttuu. Kirjoita teksti kaksoispisteen jälkeen.` });
      return;
    }
    if (card === null) {
      card = { line: lineNo, fields: new Map() };
      cards.push(card);
    }
    const current: ContentCard = card;
    if (current.fields.has(key)) {
      errors.push({
        line: lineNo,
        message: `Rivi ${lineNo}: kohta "${key}" on samassa kortissa kahdesti. Jätä korttien väliin yksi tyhjä rivi.`,
      });
      return;
    }
    current.fields.set(key, { value, line: lineNo });
  });

  return { cards, errors };
}

/** List Finnish key names for messages: '"sana" ja "vihje"'. */
export function listKeys(keys: readonly string[]): string {
  const quoted = keys.map((key) => `"${key}"`);
  return quoted.length <= 1 ? (quoted[0] ?? '') : `${quoted.slice(0, -1).join(', ')} ja ${quoted[quoted.length - 1]}`;
}
