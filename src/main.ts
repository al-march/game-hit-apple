import Phaser from 'phaser';
import { GameScene } from '@scenes';
import './style.css';
import { Constants } from '@constants';

const config = {
  transparent: true,
  scene: [GameScene],
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: Constants.GAME.WIDTH,
    height: Constants.GAME.HEIGHT,
  },
};

window.onload = () => {
  const startBtn = document.querySelector('.start-button')!;
  const startScreen = document.querySelector('.start')!;

  startBtn.addEventListener('click', () => {
    startGame();
    startScreen.remove();
  });

  window.focus();
  resize();
  window.addEventListener('resize', resize, false);
};

function startGame() {
  new Phaser.Game(config);
}

function resize() {
  let canvas = document.querySelector('canvas');
  if (canvas) {
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = Constants.GAME.WIDTH / Constants.GAME.HEIGHT;

    if (windowRatio < gameRatio) {
      canvas.style.width = windowWidth + 'px';
      canvas.style.height = (windowWidth / gameRatio) + 'px';
    } else {
      canvas.style.width = (windowHeight * gameRatio) + 'px';
      canvas.style.height = windowHeight + 'px';
    }
  }
}
