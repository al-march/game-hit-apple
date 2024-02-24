import { Entity } from '../Entity.ts';
import { Assets } from '@assets';

export class CircleEntity extends Entity {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    super(scene, x, y, Assets.CIRCLES.DEFAULT.name);
    this.scene = scene;
    this.scene.add.existing(this);
    this.displayWidth = 330;
    this.displayHeight = 330;
  }
}
