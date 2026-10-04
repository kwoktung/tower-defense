import * as Phaser from 'phaser';
import { createGameConfig } from './game-config';

const parent = document.getElementById('game');
if (!parent) throw new Error('Missing #game element');

new Phaser.Game(createGameConfig(parent, []));
