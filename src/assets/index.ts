import knife from './knifes/knife.png';
import circle from './circles/circle-target.png';
import apple from './targets/frame-apple.png';

export const Assets = {
  KNIFES: {
    DEFAULT: {
      name: 'default_knife',
      path: knife
    },
  },
  CIRCLES: {
    DEFAULT: {
      name: 'default_circle',
      path: circle
    }
  },
  TARGETS: {
    DEFAULT: {
      name: 'default_target',
      path: apple
    }
  },
  FONTS: {
    desyrel: {
      key: 'desyrel',
      png: 'public/fonts/Atari Sunset.png',
      xml: 'public/fonts/atari-sunset.xml'
    }
  }
};
