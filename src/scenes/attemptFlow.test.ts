import { describe, expect, it } from 'vitest';
import { createResultsDb } from '../core/db';
import { planAttempts } from './attemptFlow';

describe('planAttempts', () => {
  const db = createResultsDb(null, 'k');
  const p = db.createPlayer('Aino');

  it('starts an action game at attempt 1/3 with no best score', () => {
    expect(planAttempts('action', undefined)).toMatchObject({ total: 3, done: 0, next: 1, best: null, finished: false });
  });

  it('continues after recorded attempts and keeps the best one', () => {
    db.recordAttempt(p.id, 'lento', 400, 3);
    expect(planAttempts('action', db.getRecord(p.id, 'lento'))).toMatchObject({ done: 1, next: 2, best: 400, finished: false });
    db.recordAttempt(p.id, 'lento', 250, 3);
    expect(planAttempts('action', db.getRecord(p.id, 'lento'))).toMatchObject({ done: 2, next: 3, best: 400 });
    db.recordAttempt(p.id, 'lento', 900, 3);
    expect(planAttempts('action', db.getRecord(p.id, 'lento'))).toMatchObject({ done: 3, best: 900, finished: true });
  });

  it('plays a puzzle as one round and notices an interrupted round', () => {
    expect(planAttempts('puzzle', undefined)).toMatchObject({ total: 1, next: 1, resumes: false });
    db.saveCheckpoint(p.id, 'hirsipuu', { index: 2 });
    expect(planAttempts('puzzle', db.getRecord(p.id, 'hirsipuu'))).toMatchObject({ finished: false, resumes: true });
    db.recordAttempt(p.id, 'hirsipuu', 650, 1);
    expect(planAttempts('puzzle', db.getRecord(p.id, 'hirsipuu'))).toMatchObject({ finished: true, best: 650, resumes: false });
  });

  it('treats a manual score as finished', () => {
    db.setManualScore(p.id, 'muu', 500);
    expect(planAttempts('action', db.getRecord(p.id, 'muu'))).toMatchObject({ finished: true, best: 500 });
  });
});
