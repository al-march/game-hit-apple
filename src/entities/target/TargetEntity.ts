import { Entity } from '../Entity.ts';
import { Assets } from '@assets';

export class TargetEntity extends Entity {
  isHit = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    super(scene, x, y, Assets.TARGETS.DEFAULT.name);
    this.scene = scene;
    this.scene.add.existing(this);
    // this.setDisplaySize(80, 80);
  }

  setIsHit(isHit: boolean) {
    this.isHit = isHit;
  }
}
