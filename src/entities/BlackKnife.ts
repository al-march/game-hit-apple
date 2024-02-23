import { Entity } from './Entity.ts';
import { Assets } from '@assets';

export class BlackKnife extends Entity {
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string
    ) {
        super(scene, x, y, texture, Assets.KNIFES.BLACK.name);
        this.scene = scene;
        this.scene.add.existing(this);
        this.setScale(0.5)
    }

    update() {
        console.log('update!');
    }
}
