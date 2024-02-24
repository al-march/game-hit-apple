import { Assets } from '@assets';
import { Constants } from '@constants';
import { Scene } from './Scene.ts';
import { CircleEntity, KnifeEntity } from '@entities';
import { TargetEntity } from '../entities/target/TargetEntity.ts';

const initialKnifeCount = 5;

export class GameScene extends Phaser.Scene implements Scene {
  canThrow = true;
  validHit = true;
  knifeCount = initialKnifeCount;


  knifeGroup!: Phaser.GameObjects.Group;
  knifeArsenal!: Phaser.GameObjects.Group;
  circle!: Phaser.GameObjects.Sprite;
  knife!: KnifeEntity;
  target!: TargetEntity;

  score = 0;
  scoreText!: Phaser.GameObjects.Text;
  isCircleDestroying = false;

  constructor() {
    super('PlayGame');
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
    this.knifeArsenal = this.add.group();
    this.knifeCount = initialKnifeCount;

    this.circle = this.initCircle();
    this.target = this.initTarget();
    this.renderKnifes();
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
        this.target.x = this.circle.x + ((this.circle.width - 200) / 2) * Math.cos(radians);
        this.target.y = this.circle.y + ((this.circle.width - 200) / 2) * Math.sin(radians);
      }
    }

    this.knifeArsenal
      .getChildren()
      .forEach((knife, i) => {
        if (i >= this.knifeCount) {
          knife.destroy();
        }
      });

    this.scoreText.text = 'Score: ' + this.score;
  }

  throwKnife = () => {
    if (this.canThrow && !this.isCircleDestroying) {
      this.canThrow = false;

      this.tweens.add({
        targets: [this.knife],
        y: this.circle.y + this.circle.width / 2,
        duration: Constants.SPEED.THROW,
        callbackScope: this,

        onComplete: () => {
          this.validHit = this.checkIsValidThrew();

          if (this.validHit) {
            const isHitToAnTarget = Math.abs(Phaser.Math.Angle.ShortestBetween(this.circle.angle, 180 - this.target.startAngle)) < Constants.MIN_ANGLE;

            if (isHitToAnTarget && !this.target.isHit) {
              this.destroyTarget();
              this.destroyCircle();

              console.log('should be tween');
              this.tweens.add({
                targets: [this.knife],
                y: -500,
                duration: Constants.SPEED.THROW,
                callbackScope: this,
              });
              return;
            }

            this.putTheKnife();
            this.score += 10;

            if (this.knifeCount < 0) {
              this.destroyCircle();
            }
          } else {
            this.ricochetTheKnife();
          }
        }
      });
    }
  };

  private destroyCircle() {
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
      ease: 'linear',
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
        duration: Constants.SPEED.THROW * 6,
        ease: 'linear',
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
    });
  }

  private putTheKnife() {
    const threwKnife = this.addKnife(this.knife.x, this.knife.y);
    this.knifeCount--;
    threwKnife.setThrewAngle(this.circle.angle);
    this.knife.y = this.getKnifeCoords().y;
    this.canThrow = true;
    return threwKnife;
  }

  private ricochetTheKnife() {
    this.tweens.add({
      targets: [this.knife],
      y: Constants.GAME.HEIGHT + this.knife.height,
      rotation: 5,
      duration: Constants.SPEED.THROW * 4,
      onComplete: () => {
        this.scene.start('PlayGame');
        this.score = 0;
      }
    });
  }

  private checkIsValidThrew() {
    const knifes = this.knifeGroup.getChildren();
    for (let i = 0; i < knifes.length; i++) {
      const knife = knifes[i];
      if (isKnife(knife) && typeof knife.threwAngle === 'number') {
        const angleOffset = Math.abs(Phaser.Math.Angle.ShortestBetween(this.circle.angle, knife.threwAngle));
        return angleOffset > Constants.MIN_ANGLE;
      }
    }
    return true;
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

  private renderKnifes() {
    const createKnife = (i: number) => {
      const width = 100;
      const height = this.sys.canvas.height;
      const knife = new KnifeEntity(this, 50 + width, height - ((70 * i) + 50))
        .setRotation(1.6)
        .setSize(width, 20)
        .setScale(0.35);

      const fx = knife.preFX?.addGlow();

      this.tweens.add({
        targets: fx,
        outerStrength: 10,
        yoyo: true,
        loop: -1,
        ease: 'sine.inout'
      });

      this.knifeArsenal.add(knife);
    };

    for (let i = 0; i < this.knifeCount; i++) {
      createKnife(i);
    }
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
