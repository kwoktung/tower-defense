import * as Phaser from 'phaser';
import { createGameConfig } from './game-config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { createServices } from './services/create-services';

const parent = document.getElementById('game');
if (!parent) throw new Error('Missing #game element');

const params = new URLSearchParams(location.search);

const game = new Phaser.Game(
  createGameConfig(parent, [
    new BootScene({
      services: createServices({ kind: 'local' }),
      levelId: params.get('level') ?? 'level-1',
      skinId: params.get('skin'),
      debug: params.has('debug'),
    }),
    GameScene,
    HudScene,
  ]),
);

declare global {
  interface Window {
    /** Dev builds only: the running game, for inspection from DevTools or an agent. */
    __GAME__?: Phaser.Game;
  }
}
if (import.meta.env.DEV) window.__GAME__ = game;
