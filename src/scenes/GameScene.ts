import { Assets } from '@assets';
import { Constants } from '@constants';
import { Scene } from './Scene.ts';
import { BlackKnife } from '@entities';

export class GameScene extends Phaser.Scene implements Scene {
    private canThrow = true;
    private knifeGroup!: Phaser.GameObjects.Group;
    private circle!: Phaser.GameObjects.Sprite;
    private knife!: BlackKnife;

    constructor() {
        super('PlayGame');
    }

    preload() {
        this.load.image(Assets.CIRCLES.BLACK.name, Assets.CIRCLES.BLACK.path);
        this.load.image(Assets.KNIFES.BLACK.name, Assets.KNIFES.BLACK.path);
    }

    create() {
        this.knifeGroup = this.add.group();
        this.knife = this.initKnife();
        this.circle = this.initCircle();
        // Слой с колесом будет спереди
        this.circle.depth = 1;
        this.input.on('pointerdown', this.throwKnife);
    }

    update() {
        this.circle.angle += Constants.SPEED.ROTATION;
        this.knifeGroup
            .getChildren()
            .forEach(knife => {
                if (isSprite(knife)) {
                    knife.angle += Constants.SPEED.ROTATION;
                    const radians = Phaser.Math.DegToRad(knife.angle + 90);

                    // тригонометрия, чтобы заставить нож вращаться вокруг центра мишени
                    knife.x = this.circle.x + (this.circle.width / 2) * Math.cos(radians);
                    knife.y = this.circle.y + (this.circle.width / 2) * Math.sin(radians);
                }
            });
    }

    throwKnife = () => {
        if (this.canThrow) {
            this.canThrow = false;

            this.tweens.add({
                targets: [this.knife],
                y: this.circle.y + this.circle.width / 2,
                duration: Constants.SPEED.THROW,
                onComplete: () => {
                    this.canThrow = true;
                    this.addKnife(this.knife.x, this.knife.y);
                    this.knife.y = this.getKnifeCoords().y;
                }
            });
        }
    };

    private addKnife(x: number, y: number) {
        const knife = new BlackKnife(this, x, y, Assets.KNIFES.BLACK.name);
        this.knifeGroup.add(knife);
    }

    private initKnife() {
        const {x, y} = this.getKnifeCoords();
        return new BlackKnife(this, x, y, Assets.KNIFES.BLACK.name);
    }

    private getKnifeCoords() {
        const config = this.scene.scene.game.config;
        const {width, height} = config;

        return {
            x: toInt(width) / 2,
            y: toInt(height) / 5 * 4.4,
        };
    }

    private initCircle() {
        const config = this.scene.scene.game.config;
        const {width} = config;
        return this.add.sprite(toInt(width) / 2, 400, Assets.CIRCLES.BLACK.name);
    }
}

function toInt(input: string | number) {
    if (typeof input === 'number') {
        return input;
    } else {
        return parseInt(input);
    }
}

function isSprite(obj: unknown): obj is Phaser.GameObjects.Sprite {
    return obj instanceof Phaser.GameObjects.Sprite;
}
