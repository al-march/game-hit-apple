import Phaser from 'phaser';
import { GameScene } from '@scenes';
import './style.css';
import { Constants } from '@constants';

const config = {
  width: Constants.GAME.WIDTH,
  height: Constants.GAME.HEIGHT,
  backgroundColor: 0x444444,
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
};

window.onload = () => {
  new Phaser.Game(config);

  window.focus();
  resize();
  window.addEventListener('resize', resize, false);
};

function resize() {
  let canvas = document.querySelector('canvas');
  if (canvas) {
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = config.width / config.height;
    if (windowRatio < gameRatio) {
      canvas.style.width = windowWidth + 'px';
      canvas.style.height = (windowWidth / gameRatio) + 'px';
    } else {
      canvas.style.width = (windowHeight * gameRatio) + 'px';
      canvas.style.height = windowHeight + 'px';
    }
  }
}
