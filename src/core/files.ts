import { backupFileName, resultsCsv, serializeBackup } from './backup';
import type { SaveData } from './types';

/*
 * Browser-only file helpers: downloads and the file chooser. Nothing here
 * touches window or document at import time.
 */

export const JSON_MIME = 'application/json;charset=utf-8';
export const CSV_MIME = 'text/csv;charset=utf-8';
/** accept value for choosing a backup file with pickTextFile. */
export const BACKUP_FILE_ACCEPT = '.json,application/json';

/** Backups are a few kilobytes. Of a bigger file only the start is read, so it fails to parse instead of freezing the page. */
export const MAX_TEXT_FILE_BYTES = 5 * 1024 * 1024;

/** Keep the download URL alive for a while; revoking it at once can cancel the download in some browsers. */
const REVOKE_DELAY_MS = 10_000;

/** After the file dialog has closed, wait this long for the chosen file before treating it as cancelled. */
const FOCUS_GRACE_MS = 1000;

export interface PickedTextFile {
  name: string;
  text: string;
}

export interface PickTextFileOptions {
  /** Aborting resolves the pick with null (e.g. Esc pressed while waiting for the dialog). */
  signal?: AbortSignal;
}

/**
 * Save text as a file through the browser's download. Returns false if the
 * browser refused. Note: a download blocked by the browser's "multiple
 * downloads" setting cannot be detected and still returns true.
 */
export function downloadTextFile(fileName: string, text: string, mimeType: string): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return false;
  }
  let url: string | null = null;
  let link: HTMLAnchorElement | null = null;
  try {
    url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    return true;
  } catch (error) {
    console.warn('Tiedoston lataaminen epäonnistui:', error);
    return false;
  } finally {
    link?.remove();
    if (url !== null) {
      const created = url;
      setTimeout(() => revokeQuietly(created), REVOKE_DELAY_MS);
    }
  }
}

function revokeQuietly(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Nothing to clean up then.
  }
}

/** Download a JSON backup of all results: 'halloween-varmuuskopio-<date>-klo-<time>.json'. */
export function downloadBackupFile(data: SaveData, now: Date = new Date()): boolean {
  return downloadTextFile(backupFileName(now, 'varmuuskopio', 'json'), serializeBackup(data), JSON_MIME);
}

/** Download the results table for a spreadsheet program: 'halloween-tulokset-<date>-klo-<time>.csv'. */
export function downloadResultsCsv(
  data: SaveData,
  games: ReadonlyArray<{ id: string; name: string }>,
  now: Date = new Date(),
): boolean {
  return downloadTextFile(backupFileName(now, 'tulokset', 'csv'), resultsCsv(data, games), CSV_MIME);
}

function createFileInput(accept: string): HTMLInputElement | null {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.tabIndex = -1;
    // Off-screen rather than display:none, which some browsers refuse to open.
    input.style.cssText = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;';
    return input;
  } catch {
    return null;
  }
}

/** Read a file as UTF-8 text (at most MAX_TEXT_FILE_BYTES). */
function readText(file: Blob): Promise<string> {
  const blob = file.size > MAX_TEXT_FILE_BYTES ? file.slice(0, MAX_TEXT_FILE_BYTES) : file;
  if (typeof blob.text === 'function') return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Tiedoston lukeminen epäonnistui.'));
    reader.readAsText(blob, 'utf-8');
  });
}

/**
 * Open the browser's file chooser and read the chosen file as text. Call it
 * right after a key press: browsers open the chooser only in response to the
 * user. Resolves null when cancelled (the input's 'cancel' event, or the
 * window gets focus back and no file arrives within about a second), when the
 * chooser cannot be opened or the file cannot be read, and when
 * options.signal aborts. Never rejects.
 */
export function pickTextFile(accept: string, options: PickTextFileOptions = {}): Promise<PickedTextFile | null> {
  return new Promise((resolve) => {
    const { signal } = options;
    if (typeof document === 'undefined' || typeof window === 'undefined' || signal?.aborted) {
      resolve(null);
      return;
    }
    const created = createFileInput(accept);
    if (!created) {
      resolve(null);
      return;
    }
    const input: HTMLInputElement = created;

    let settled = false;
    let reading = false;
    /** The window lost focus after click(): the dialog really opened. */
    let dialogOpened = false;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;

    function finish(result: PickedTextFile | null): void {
      if (settled) return;
      settled = true;
      if (graceTimer !== undefined) clearTimeout(graceTimer);
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      signal?.removeEventListener('abort', onAbort);
      input.remove();
      resolve(result);
    }

    function onChange(): void {
      if (settled || reading) return;
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      reading = true;
      if (graceTimer !== undefined) clearTimeout(graceTimer);
      readText(file).then(
        (text) => finish({ name: file.name, text: text.replace(/^﻿/, '') }),
        (error: unknown) => {
          console.warn('Tiedoston lukeminen epäonnistui:', error);
          finish(null);
        },
      );
    }

    function onCancel(): void {
      if (!reading) finish(null);
    }

    function onAbort(): void {
      finish(null);
    }

    function onBlur(): void {
      dialogOpened = true;
    }

    // Fallback for browsers without the 'cancel' event: the dialog closed but no file came.
    function onFocus(): void {
      if (!dialogOpened || reading || settled) return;
      if (graceTimer !== undefined) clearTimeout(graceTimer);
      graceTimer = setTimeout(() => {
        graceTimer = undefined;
        if (input.files && input.files.length > 0) onChange();
        else finish(null);
      }, FOCUS_GRACE_MS);
    }

    input.addEventListener('change', onChange);
    input.addEventListener('cancel', onCancel);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    signal?.addEventListener('abort', onAbort);
    try {
      document.body.appendChild(input);
      input.click();
    } catch (error) {
      console.warn('Tiedoston valintaikkunaa ei voitu avata:', error);
      finish(null);
    }
  });
}
