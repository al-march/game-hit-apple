import { Scene } from './Scene.ts';
import { GameState } from './GameScene.ts';
import { KnifeEntity } from '@entities';
import { Assets } from '@assets';

export class UIScene extends Phaser.Scene implements Scene {
  score = 0;
  fps = 0;

  knifeLimit = 5;
  knifeLimitGroup!: Phaser.GameObjects.Group;

  fpsText!: Phaser.GameObjects.Text;
  scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super({key: 'UIScene', active: true});
  }

  preload() {
    this.load.image(Assets.KNIFES.DEFAULT.name, Assets.KNIFES.DEFAULT.path);
  }

  create() {
    this.knifeLimitGroup = this.add.group();
    this.renderKnifes();

    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
      fontSize: 40
    });

    this.fpsText = this.add.text(this.sys.canvas.width - 200, 20, `fps: ${this.fps.toFixed(3)}`, {
      fontSize: 40
    });

    this.initListeners();

    setInterval(() => {
      this.fpsText.text = `fps: ${this.fps}`;
    }, 100);
  }

  update(_: number, delta: number) {
    this.fps = 1000 / delta;
    this.scoreText.text = 'Score: ' + this.score;

    this.knifeLimitGroup
      .getChildren()
      .forEach((knife, i) => {
        if (isKnife(knife)) {
          if (i >= this.knifeLimit) {
            knife.setActive(false).setVisible(false);
          } else {
            knife.setActive(true).setVisible(true);
          }
        }
      });
  }

  private renderKnifes() {
    const createKnife = (i: number) => {
      const width = 100;
      const height = this.sys.canvas.height;
      const knife = new KnifeEntity(this, 50 + width, height - ((70 * i) + 50))
        .setRotation(1.6)
        .setSize(width, 20)
        .setScale(1);

      const fx = knife.preFX?.addGlow();

      this.tweens.add({
        targets: fx,
        outerStrength: 2,
        yoyo: true,
        loop: -1,
        ease: 'sine.inout'
      });

      this.knifeLimitGroup.add(knife);
    };

    for (let i = 0; i <= this.knifeLimit; i++) {
      createKnife(i);
    }
  }

  private initListeners() {
    // @ts-ignore
    this.registry.events.on('changedata', (_: any, key: GameState, data: any) => {
      switch (key) {
        case GameState.SCORE:
          this.score = data;
          break;
        case GameState.KNIFES:
          this.knifeLimit = data;
          break;
      }
    });
  }
}

function isKnife(obj: unknown): obj is KnifeEntity {
  return obj instanceof KnifeEntity;
}
