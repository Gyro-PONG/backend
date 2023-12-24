import Matter from 'matter-js';

import { Entity } from './Entity.js';
import { Position } from './Position.js';
import {
  LABEL,
  PADDLE_LOCATION_X,
  PADDLE_SIZE,
  SIZE,
} from '../constants/game.js';
import { IPosition } from '../types/position.js';
import { IVelocity } from '../types/velocity.js';

export interface IPaddle {
  position: IPosition;
  velocity: IVelocity;
}

export class Paddle extends Entity {
  private type: 'host' | 'guest';

  constructor(type: 'host' | 'guest', level: string) {
    super();

    const options = {
      frictionAir: 0,
      friction: 0,
      frictionStatic: 0,
      restitution: 0,
      inertia: Number.MAX_SAFE_INTEGER,
      mass: Number.MAX_SAFE_INTEGER,
      isStatic: true,
      label: type === 'host' ? LABEL.HOST_PADDLE : LABEL.GUEST_PADDLE,
    };

    this.body = Matter.Bodies.rectangle(
      type === 'host' ? PADDLE_LOCATION_X.HOST : PADDLE_LOCATION_X.GUEST,
      SIZE.HEIGHT / 2,
      PADDLE_SIZE.WIDTH,
      level === 'easy'
        ? PADDLE_SIZE.EASY_MODE_HEIGHT
        : PADDLE_SIZE.HARD_MODE_HEIGHT,
      options,
    );
    this.type = type;
  }

  public getType() {
    return this.type;
  }

  public move(beta: number) {
    const position = new Position(this.getPosition().x, beta);
    Matter.Body.setPosition(this.body, position.toJson());
  }

  public toJson() {
    return {
      position: this.getPosition().toJson(),
      velocity: this.getVelocity().toJson(),
    };
  }
}
