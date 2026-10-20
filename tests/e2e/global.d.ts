// Minimal typing of the test API the game exposes (see src/testHooks.ts and src/testGame.ts).
export {};

declare global {
  interface Window {
    __peli?: {
      game: unknown;
      activeScenes(): string[];
      sceneStates(): Record<string, any>;
      saved(): any;
      errors: string[];
      addTestActionGame(): void;
    };
    __peliTestScore?: number;
  }
}
