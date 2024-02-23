import Phaser from 'phaser';
import { GameScene } from '@scenes';
import './style.css';

new Phaser.Game({
    width: 750,
    height: 1334,
    backgroundColor: 0x444444,
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
});
