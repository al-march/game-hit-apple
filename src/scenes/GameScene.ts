import { Assets } from '@assets';
import { Constants } from '@constants';
import { Scene } from './Scene.ts';
import { CircleEntity, KnifeEntity } from '@entities';
import { TargetEntity } from '../entities/target/TargetEntity.ts';

const initKnifeLimit = 5;

export const GameState = {
  SCORE: 'score',
  KNIFES: 'knifes',
};

export class GameScene extends Phaser.Scene implements Scene {
  canThrow = true;
  validHit = true;
  knifeLimit = initKnifeLimit;

  knifeGroup!: Phaser.GameObjects.Group;
  circle!: Phaser.GameObjects.Sprite;
  knife!: KnifeEntity;
  target!: TargetEntity;

  score = 0;
  isCircleDestroying = false;
  isKnifeRicocheting = false;

  get isAllowToThrew() {
    return this.canThrow && !this.isCircleDestroying && !this.isKnifeRicocheting;
  }

  constructor() {
    super({key: 'PlayGame', active: true});
  }

  preload() {
    this.load.spritesheet(Assets.CIRCLES.DEFAULT.name, Assets.CIRCLES.DEFAULT.path, {
      frameWidth: 500,
      frameHeight: 500
    });
    this.load.spritesheet(Assets.TARGETS.DEFAULT.name, Assets.TARGETS.DEFAULT.path, {
      frameWidth: 70,
      frameHeight: 96
    });
    this.load.image(Assets.KNIFES.DEFAULT.name, Assets.KNIFES.DEFAULT.path);
  }

  create() {
    this.canThrow = true;
    this.isCircleDestroying = false;

    this.knife = this.initKnife();
    this.knifeGroup = this.add.group();
    this.knifeLimit = initKnifeLimit;

    this.circle = this.initCircle();
    this.target = this.initTarget();
    // Слой с колесом будет спереди
    this.circle.depth = 1;
    this.input.on('pointerdown', this.throwKnife);

    const spaceBar = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceBar.on('down', this.throwKnife);

    this.emitScore(this.score);
    this.emitKnifeLimit(this.knifeLimit);
  }

  update(_: number, offset: number) {
    const rotation = Constants.SPEED.ROTATION * (offset * 0.25);
    this.circle.angle += rotation;

    if (!this.isCircleDestroying) {
      this.knifeGroup
        .getChildren()
        .forEach(knife => {
          if (isSprite(knife)) {
            knife.angle += rotation;
            const radians = Phaser.Math.DegToRad(knife.angle + 90);
            // тригонометрия, чтобы заставить нож вращаться вокруг центра мишени
            knife.x = this.circle.x + ((this.circle.width - 140) / 2) * Math.cos(radians);
            knife.y = this.circle.y + ((this.circle.width - 140) / 2) * Math.sin(radians);
          }
        });

      if (!this.target.isHit) {
        this.target.angle += rotation;
        const radians = Phaser.Math.DegToRad(this.target.angle - 90);
        this.target.x = this.circle.x + ((this.circle.width - 100) / 2) * Math.cos(radians);
        this.target.y = this.circle.y + ((this.circle.width - 100) / 2) * Math.sin(radians);
      }
    }
  }

  throwKnife = () => {
    if (this.isAllowToThrew) {
      this.canThrow = false;

      this.tweens.add({
        targets: [this.knife],
        y: this.circle.y + this.circle.width / 2,
        duration: Constants.SPEED.THROW,
        onComplete: () => {
          this.validHit = this.checkIsValidThrew();
          const isHitToAnTarget = this.checkIsTargetHit();

          if (this.validHit) {
            if (isHitToAnTarget) {
              this.destroyTarget();
              this.destroyCircle();

              this.putTheKnifeAcrossTheCircle();
              this.emitScore(this.score + 4);
              return;
            }

            if (this.knifeLimit <= 0) {
              this.destroyCircle();
              this.putTheKnifeAcrossTheCircle();
            } else {
              this.threwTheKnife();
              this.emitScore(this.score + 1);
            }
          } else {
            this.ricochetTheKnife();
          }
          this.canThrow = true;
        }
      });
    }
  };

  private destroyCircle() {
    this.emitScore(this.score + 10);

    this.canThrow = false;
    this.isCircleDestroying = true;
    const y = (slice: Phaser.GameObjects.Sprite) => this.sys.canvas.height + slice.height;
    const x = () => Phaser.Math.Between(-200, Constants.GAME.WIDTH);

    this.canThrow = false;
    this.circle.destroy();

    this.knifeGroup
      .getChildren()
      .forEach(knife => {
        if (isKnife(knife)) {
          this.tweens.add({
            targets: [knife],
            angle: 45,
            duration: Constants.SPEED.THROW * 6,
            ease: 'linear',
            y: y(knife),
            x: x(),
          });
        }
      });

    this.tweens.add({
      targets: [this.target],
      angle: 45,
      duration: Constants.SPEED.THROW * 6,
      ease: 'expo.in',
      y: y(this.target),
      x: x(),
    });

    const slicesX = [
      Phaser.Math.Between(-200, Constants.GAME.WIDTH / 2),
      Phaser.Math.Between(900, Constants.GAME.WIDTH),
      Phaser.Math.Between(0, Constants.GAME.WIDTH / 3)
    ];

    for (let i = 1; i <= 3; i++) {
      const slice = this.add.sprite(
        this.circle.x,
        this.circle.y,
        Assets.CIRCLES.DEFAULT.name,
        i
      ).setDisplaySize(330, 330);


      this.tweens.add({
        targets: [slice],
        angle: 45,
        duration: Constants.SPEED.THROW * 5,
        y: y(slice),
        x: slicesX[i - 1],
        onComplete: () => {
          this.scene.start('PlayGame');
        }
      });
    }
  }

  private destroyTarget() {
    this.target.setIsHit(true);
    this.target.destroy();

    const slice = this.add.sprite(this.target.x, this.target.y, Assets.TARGETS.DEFAULT.name, 1);
    const slice2 = this.add.sprite(this.target.x, this.target.y, Assets.TARGETS.DEFAULT.name, 2);

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
    });
  }

  private threwTheKnife() {
    const threwKnife = this.addKnife(this.knife.x, this.knife.y);
    this.emitKnifeLimit(this.knifeLimit - 1);
    this.knife.y = this.getKnifeCoords().y;
    return threwKnife;
  }

  private putTheKnifeAcrossTheCircle() {
    this.knife.depth++;
    this.tweens.add({
      targets: [this.knife],
      y: -500,
      ease: 'quint.inout',
      duration: Constants.SPEED.THROW * 3,
      callbackScope: this,
      onComplete: () => this.knife.depth--
    });
  }

  private ricochetTheKnife() {
    this.isKnifeRicocheting = true;

    this.tweens.add({
      targets: [this.knife],
      y: Constants.GAME.HEIGHT + this.knife.height,
      rotation: 5,
      duration: Constants.SPEED.THROW * 4,
      onComplete: () => {
        this.scene.start('PlayGame');
        this.isKnifeRicocheting = false;
        this.emitScore(0);
      }
    });
  }

  private checkIsValidThrew() {
    return !this.physics.collide(this.knife, this.knifeGroup);
  }

  private checkIsTargetHit() {
    return this.physics.collide(this.knife, this.target);
  }

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

    return new TargetEntity(this, x, y)
      .setAngle(targetAngle);
  }

  /**
   * Should emit every time when score changes
   */
  private emitScore(score = this.score) {
    this.score = score;
    this.registry.set(GameState.SCORE, this.score);
  }

  /**
   * Should emit every time when knife's count changes
   */
  private emitKnifeLimit(count: number) {
    this.knifeLimit = count;
    this.registry.set(GameState.KNIFES, this.knifeLimit);
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
