import Phaser from 'phaser';
import { getDb } from '../core/db';
import { isPlayerDone, recordScore } from '../core/scores';
import { session } from '../core/session';
import { sfx } from '../core/sfx';
import type { AttemptEnd } from '../core/types';
import { GAME_IDS, getGame } from '../games/registry';
import type { GameContext, GameDefinition, GameSceneData } from '../games/types';
import { onKeys } from '../ui/input';
import { H, W } from '../ui/screen';
import { COLORS } from '../ui/theme';
import { showToast } from '../ui/toast';
import { attemptCount, planAttempts } from './attemptFlow';
import { SCENES, type AttemptIntroData, type AttemptResultData, type GameHostData, type PauseData } from './keys';
import { switchTo } from './nav';

type HostState = 'idle' | 'intro' | 'playing' | 'paused' | 'result';

/**
 * Runs one game for the current player: "Yritys n/3" screens, the game scene,
 * saving every attempt, result screens and pause (Esc). The game itself only
 * plays one attempt and calls ctx.finish(score).
 */
export class GameHostScene extends Phaser.Scene {
  private def!: GameDefinition;
  private gameId = '';
  private playerId = '';
  private state: HostState = 'idle';
  private attempt = 1;
  private total = 1;
  /** Identifies the running attempt, so a late finish() of an old attempt is ignored. */
  private token = 0;

  private readonly guardUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
    event.returnValue = '';
  };

  private readonly autoPause = (): void => {
    // Only when this scene runs (not when correction mode's password prompt has paused everything).
    if (this.state === 'playing' && this.sys.isActive()) this.pause();
  };

  constructor() {
    super(SCENES.GameHost);
  }

  init(data: GameHostData): void {
    this.gameId = data?.gameId ?? '';
    this.state = 'idle';
    this.attempt = 1;
    this.total = 1;
  }

  create(): void {
    const db = getDb();
    const player = session.playerId ? db.getPlayer(session.playerId) : undefined;
    const def = getGame(this.gameId);
    if (!player) {
      switchTo(this, SCENES.Start);
      return;
    }
    if (!def) {
      switchTo(this, SCENES.Menu);
      return;
    }
    this.def = def;
    this.playerId = player.id;
    this.add.rectangle(W / 2, H / 2, W, H, COLORS.night);

    // Pause keys only. Returning false leaves the key to the game and the overlays.
    onKeys(this, {
      Escape: () => {
        if (this.state === 'playing') this.pause();
        else if (this.state === 'paused') this.resume();
        else return false;
        return true;
      },
      Enter: () => {
        if (this.state !== 'paused') return false;
        this.resume();
        return true;
      },
    });
    this.game.events.on(Phaser.Core.Events.BLUR, this.autoPause);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.autoPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.token += 1;
      this.state = 'idle';
      window.removeEventListener('beforeunload', this.guardUnload);
      this.game.events.off(Phaser.Core.Events.BLUR, this.autoPause);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.autoPause);
    });

    this.nextAttempt();
  }

  getTestState(): unknown {
    return { gameId: this.gameId, state: this.state, attempt: this.attempt, total: this.total };
  }

  private nextAttempt(): void {
    const record = getDb().getRecord(this.playerId, this.def.id);
    const plan = planAttempts(this.def.kind, record, attemptCount(this.def));
    this.total = plan.total;
    if (plan.finished) {
      this.leave();
      return;
    }
    this.attempt = plan.next;
    if (this.def.kind === 'action') {
      this.state = 'intro';
      const data: AttemptIntroData = {
        gameName: this.def.name,
        attempt: this.attempt,
        total: this.total,
        best: plan.best,
        note: this.def.attemptNote?.(record?.carry ?? null) ?? null,
        onStart: () => this.startAttempt(),
      };
      this.scene.launch(SCENES.AttemptIntro, data);
    } else {
      this.startAttempt();
    }
  }

  private startAttempt(): void {
    const db = getDb();
    const record = db.getRecord(this.playerId, this.def.id);
    const token = ++this.token;
    const ctx: GameContext = {
      finish: (score, end) => this.finishAttempt(token, score, end),
      carry: record?.carry ?? null,
      checkpoint: {
        initial: record?.checkpoint ?? null,
        save: (state) => {
          if (token !== this.token || (this.state !== 'playing' && this.state !== 'paused')) return;
          try {
            db.saveCheckpoint(this.playerId, this.def.id, state);
          } catch (error) {
            console.error('Välitallennus epäonnistui:', error);
          }
        },
      },
      sfx,
    };
    this.state = 'playing';
    window.addEventListener('beforeunload', this.guardUnload);
    const data: GameSceneData = { ctx };
    this.scene.launch(this.def.sceneKey, data);
  }

  private finishAttempt(token: number, score: number, end?: AttemptEnd): void {
    if (token !== this.token || (this.state !== 'playing' && this.state !== 'paused')) return;
    this.state = 'result';
    window.removeEventListener('beforeunload', this.guardUnload);
    this.scene.stop(SCENES.Pause);
    this.scene.stop(this.def.sceneKey);

    let record;
    try {
      record = getDb().recordAttempt(this.playerId, this.def.id, score, this.total, end);
    } catch (error) {
      console.error('Tuloksen tallennus epäonnistui:', error);
      showToast(this, error instanceof Error ? error.message : 'Tuloksen tallennus epäonnistui.', 'error');
      this.time.delayedCall(2500, () => this.leave());
      return;
    }
    const finished = record.finished;
    const data: AttemptResultData = {
      gameName: this.def.name,
      kind: this.def.kind,
      attempt: this.attempt,
      total: this.total,
      score: record.attempts[record.attempts.length - 1] ?? 0,
      best: recordScore(record) ?? 0,
      isFinal: finished,
      onContinue: () => (finished ? this.leave() : this.nextAttempt()),
    };
    this.scene.launch(SCENES.AttemptResult, data);
  }

  private pause(): void {
    this.state = 'paused';
    this.scene.pause(this.def.sceneKey);
    const data: PauseData = { gameName: this.def.name };
    this.scene.launch(SCENES.Pause, data);
    sfx.play('pause');
  }

  private resume(): void {
    this.state = 'playing';
    this.scene.stop(SCENES.Pause);
    this.scene.resume(this.def.sceneKey);
    sfx.play('unpause');
  }

  private leave(): void {
    const player = getDb().getPlayer(this.playerId);
    switchTo(this, player && isPlayerDone(player, GAME_IDS) ? SCENES.Thanks : SCENES.Menu);
  }
}
