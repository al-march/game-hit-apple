import { Assets } from '@assets';
import { Constants } from '@constants';
import { Scene } from './Scene.ts';
import { BlackCircle, BlackKnife } from '@entities';

export class GameScene extends Phaser.Scene implements Scene {
    private canThrow = true;
    private validHit = true;
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

        const spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spaceBar.on('down', this.throwKnife);
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
                    knife.x = this.circle.x + ((this.circle.width - 120) / 2) * Math.cos(radians);
                    knife.y = this.circle.y + ((this.circle.width - 120) / 2) * Math.sin(radians);
                }
            });
    }

    throwKnife = () => {
        if (this.canThrow) {
            this.canThrow = false;

            this.tweens.add({
                targets: [this.knife],
                y: this.circle.y - 120 + this.circle.width / 2,
                duration: Constants.SPEED.THROW,
                callbackScope: this,

                onComplete: () => {
                    this.validHit = true;

                    const knifes = this.knifeGroup.getChildren();
                    for (let i = 0; i < knifes.length; i++) {
                        const knife = knifes[i];
                        if (isKnife(knife) && typeof knife.threwAngle === 'number') {
                            const angleOffset = Math.abs(Phaser.Math.Angle.ShortestBetween(this.circle.angle, knife.threwAngle));
                            if (angleOffset < Constants.MIN_ANGLE) {
                                this.validHit = false;
                                break;
                            }
                        }
                    }

                    if (this.validHit) {
                        const threwKnife = this.addKnife(this.knife.x, this.knife.y);
                        threwKnife.setThrewAngle(this.circle.angle);
                        this.knife.y = this.getKnifeCoords().y;
                        this.canThrow = true;
                    } else {
                        this.tweens.add({
                            targets: [this.knife],
                            y: Constants.GAME.HEIGHT + this.knife.height,
                            rotation: 5,
                            duration: Constants.SPEED.THROW * 4,
                            onComplete: () => {
                                this.scene.start('PlayGame');
                                this.canThrow = true;
                            }
                        });
                    }
                }
            });
        }
    };

    private addKnife(x: number, y: number) {
        const knife = new BlackKnife(this, x, y);
        this.knifeGroup.add(knife);
        return knife;
    }

    private initKnife() {
        const {x, y} = this.getKnifeCoords();
        return new BlackKnife(this, x, y);
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
        const x = toInt(width) / 2;
        const y = 300;
        return new BlackCircle(this, x, y);
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

function isKnife(obj: unknown): obj is BlackKnife {
    return obj instanceof BlackKnife;
}
