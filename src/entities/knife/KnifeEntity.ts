import { Entity } from '../Entity.ts';
import { Assets } from '@assets';

export class KnifeEntity extends Entity {
  threwAngle?: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    super(scene, x, y, Assets.KNIFES.DEFAULT.name);
    this.scene = scene;
    this.scene.add.existing(this);
    this.setScale(2);
  }

  setThrewAngle(angle: number) {
    this.threwAngle = angle;
  }
}
