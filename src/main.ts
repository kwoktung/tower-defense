import * as Phaser from 'phaser';
import { createGameConfig } from './game-config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { createServices } from './services/create-services';

const parent = document.getElementById('game');
if (!parent) throw new Error('Missing #game element');

const params = new URLSearchParams(location.search);

new Phaser.Game(
  createGameConfig(parent, [
    new BootScene({
      services: createServices({ kind: 'local' }),
      levelId: params.get('level') ?? 'level-1',
      skinId: params.get('skin'),
      debug: params.has('debug'),
    }),
    GameScene,
  ]),
);
