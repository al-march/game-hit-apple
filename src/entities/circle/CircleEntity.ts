import { Entity } from '../Entity.ts';
import { Assets } from '@assets';

export class BlackCircle extends Entity {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    super(scene, x, y, Assets.CIRCLES.DEFAULT.name);
    this.scene = scene;
    this.scene.add.existing(this);
    this.setScale(0.6);
  }
}
