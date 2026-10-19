import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashPassword, sha256Hex, verifyPassword } from './password';

describe('sha256Hex', () => {
  it('matches known test vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('matches Node crypto for multi-block and non-ASCII input', () => {
    for (const text of ['a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(1000), 'Hämähäkki ÅÄÖ €']) {
      expect(sha256Hex(text)).toBe(createHash('sha256').update(text, 'utf8').digest('hex'));
    }
  });
});

describe('password', () => {
  it('iterates salted hashes like the reference implementation', () => {
    let digest = createHash('sha256').update('suolaSalasana', 'utf8').digest();
    for (let i = 1; i < 5; i++) digest = createHash('sha256').update(Buffer.concat([digest, Buffer.from('suola')])).digest();
    expect(hashPassword('Salasana', 'suola', 5)).toBe(digest.toString('hex'));
  });

  it("accepts only Pasi's exact password", () => {
    expect(verifyPassword('Pasi1234')).toBe(true);
    expect(verifyPassword('pasi1234')).toBe(false);
    expect(verifyPassword('Pasi1234 ')).toBe(false);
    expect(verifyPassword('')).toBe(false);
  });
});
