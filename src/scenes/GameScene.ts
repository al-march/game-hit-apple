import { Assets } from '@assets';
import { Constants } from '@constants';
import { Scene } from './Scene.ts';
import { CircleEntity, KnifeEntity } from '@entities';
import { TargetEntity } from '../entities/target/TargetEntity.ts';

export class GameScene extends Phaser.Scene implements Scene {
  canThrow = true;
  validHit = true;


  knifeGroup!: Phaser.GameObjects.Group;
  circle!: Phaser.GameObjects.Sprite;
  knife!: KnifeEntity;
  target!: TargetEntity;

  score = 0;
  scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super('PlayGame');
  }

  preload() {
    this.load.image(Assets.CIRCLES.DEFAULT.name, Assets.CIRCLES.DEFAULT.path);
    this.load.image(Assets.KNIFES.DEFAULT.name, Assets.KNIFES.DEFAULT.path);
    this.load.spritesheet(Assets.TARGETS.DEFAULT.name, Assets.TARGETS.DEFAULT.path, {
      frameWidth: 70,
      frameHeight: 96
    });
  }

  create() {
    this.canThrow = true;
    this.knifeGroup = this.add.group();
    this.knife = this.initKnife();
    this.circle = this.initCircle();
    this.target = this.initTarget();
    // Слой с колесом будет спереди
    this.circle.depth = 1;
    this.input.on('pointerdown', this.throwKnife);

    // Score text
    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
        fontSize: 40
      }
    );

    const spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceBar.on('down', this.throwKnife);
  }

  update(_: number, offset: number) {
    const rotation = Constants.SPEED.ROTATION * (offset * 0.25);
    this.circle.angle += rotation;
    this.knifeGroup
      .getChildren()
      .forEach(knife => {
        if (isSprite(knife)) {
          knife.angle += rotation;
          const radians = Phaser.Math.DegToRad(knife.angle + 90);

          // тригонометрия, чтобы заставить нож вращаться вокруг центра мишени
          knife.x = this.circle.x + ((this.circle.width) / 2) * Math.cos(radians);
          knife.y = this.circle.y + ((this.circle.width) / 2) * Math.sin(radians);
        }
      });

    if (!this.target.isHit) {
      this.target.angle += rotation;
      const radians = Phaser.Math.DegToRad(this.target.angle - 90);
      this.target.x = this.circle.x + ((this.circle.width - 200) / 2) * Math.cos(radians);
      this.target.y = this.circle.y + ((this.circle.width - 200) / 2) * Math.sin(radians);
    }

    this.scoreText.text = 'Score: ' + this.score;
  }

  throwKnife = () => {
    if (this.canThrow) {
      this.canThrow = false;

      this.tweens.add({
        targets: [this.knife],
        y: this.circle.y + this.circle.width / 2,
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
                this.score = 0;
                break;
              }
            }
          }

          if (this.validHit) {
            const isHitToAnTarget = Math.abs(Phaser.Math.Angle.ShortestBetween(this.circle.angle, 180 - this.target.startAngle)) < Constants.MIN_ANGLE;
            if (isHitToAnTarget && !this.target.isHit) {
              this.target.setIsHit(true);
              this.target.destroy();

              const slice = this.add.sprite(this.target.x, this.target.y, Assets.TARGETS.DEFAULT.name, 1);
              const slice2 = this.add.sprite(this.target.x, this.target.y, Assets.TARGETS.DEFAULT.name, 2);

              this.score += 25;

              slice
                .setAngle(this.target.angle)
                .setOrigin(0.5, 1);

              const y = Constants.GAME.HEIGHT + this.target.height;
              const x = Phaser.Math.Between(0, Constants.GAME.WIDTH);

              this.tweens.add({
                targets: [slice, slice2],
                angle: 45,
                duration: Constants.SPEED.THROW * 6,
                y,
                x,
                onComplete: () => {
                  this.scene.start('PlayGame');
                }
              });
            }

            const threwKnife = this.addKnife(this.knife.x, this.knife.y);
            threwKnife.setThrewAngle(this.circle.angle);
            this.knife.y = this.getKnifeCoords().y;
            this.canThrow = true;
            this.score += 10;
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
    const knife = new KnifeEntity(this, x, y);
    this.knifeGroup.add(knife);
    return knife;
  }

  private getKnifeCoords() {
    const config = this.scene.scene.game.config;
    const {width, height} = config;

    return {
      x: toInt(width) / 2,
      y: toInt(height) / 5 * 4.4,
    };
  }

  private initKnife() {
    const {x, y} = this.getKnifeCoords();
    return new KnifeEntity(this, x, y);
  }

  private initCircle() {
    const config = this.scene.scene.game.config;
    const {width} = config;
    const x = toInt(width) / 2;
    const y = 300;
    return new CircleEntity(this, x, y);
  }

  private initTarget() {
    const targetAngle = Phaser.Math.Between(0, 360);
    const radians = Phaser.Math.DegToRad(targetAngle - 90);

    const x = this.circle.x + (this.circle.width / 2) * Math.cos(radians);
    const y = this.circle.y + (this.circle.width / 2) * Math.sin(radians);

    return new TargetEntity(this, x - 20, y - 20)
      .setOrigin(0.5, 1)
      .setDepth(1)
      .setAngle(targetAngle)
      .setStartAngle(targetAngle);
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

function isKnife(obj: unknown): obj is KnifeEntity {
  return obj instanceof KnifeEntity;
}
