const WIDTH = 1280;
const HEIGHT = 800;

export const SIZE = {
  WIDTH,
  HEIGHT,
} as const;

export const FPS = 60;

export const UPDATE_INTERVAL = 1000 / FPS;

export const BALL_SIZE = WIDTH / 40;

export const BALL_INIT_VELOCITY = {
  NEG_X: -5,
  NEG_Y: -5,
  POS_X: 5,
  POS_Y: 5,
} as const;

export const BALL_MAX_SPEED = 13;

export const ACCELERATION_RATIO = 1.02;

export const PADDLE_LOCATION_X = {
  HOST: WIDTH / 16,
  GUEST: (WIDTH * 15) / 16,
} as const;

export const PADDLE_SIZE = {
  WIDTH: WIDTH / 40,
  EASY_MODE_HEIGHT: HEIGHT / 5,
  HARD_MODE_HEIGHT: HEIGHT / 8,
} as const;

export const LABEL = {
  TOP_WALL: 'top-wall',
  BOTTOM_WALL: 'bottom-wall',
  LEFT_WALL: 'left-wall',
  RIGHT_WALL: 'right-wall',
  BALL: 'ball',
  HOST_PADDLE: 'host-paddle',
  GUEST_PADDLE: 'guest-paddle',
} as const;
