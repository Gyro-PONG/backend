import Matter from 'matter-js';

import { Entity } from './Entity.js';
import { Position } from './Position.js';
import { Velocity } from './Velocity.js';
import {
  ACCELERATION_RATIO,
  BALL_INIT_VELOCITY,
  BALL_MAX_SPEED,
  BALL_SIZE,
  LABEL,
  SIZE,
} from '../constants/game.js';
import { IPosition } from '../types/position.js';
import { IVelocity } from '../types/velocity.js';

export interface IBall {
  position: IPosition;
  velocity: IVelocity;
}

export class Ball extends Entity {
  constructor() {
    super();

    const options = {
      frictionAir: 0,
      friction: 0,
      frictionStatic: 0,
      restitution: 1,
      mass: 0,
      inertia: Number.MAX_SAFE_INTEGER,
      label: LABEL.BALL,
    };

    this.body = Matter.Bodies.rectangle(
      SIZE.WIDTH / 2,
      SIZE.HEIGHT / 2,
      BALL_SIZE,
      BALL_SIZE,
      options,
    );

    this.setVelocity(
      new Velocity(BALL_INIT_VELOCITY.NEG_X, BALL_INIT_VELOCITY.NEG_Y),
    );
  }

  private setVelocity(velocity: Velocity) {
    Matter.Body.setVelocity(this.body, velocity.toJson());
    return this;
  }

  private invertVelocityX() {
    this.setVelocity(this.getVelocity().invertX());
  }

  public invertVelocityY() {
    return this.setVelocity(this.getVelocity().invertY());
  }

  public handleCollisionWithPaddle(pair: Matter.Pair) {
    if (!this.collisionVerification(pair)) {
      return this;
    }

    if (this.collisionTwoObjectsVerification(pair, LABEL.HOST_PADDLE)) {
      this.invertVelocityX();
      this.acceleration();
    }

    if (this.collisionTwoObjectsVerification(pair, LABEL.GUEST_PADDLE)) {
      this.invertVelocityX();
      this.acceleration();
    }

    return this;
  }

  public initX() {
    return SIZE.WIDTH / 2;
  }

  public initY() {
    return SIZE.HEIGHT / 2;
  }

  public resetPosition(direction: 'left' | 'right') {
    const initPosition = new Position(this.initX(), this.initY());
    Matter.Body.setPosition(this.body, initPosition.toJson());

    if (direction === 'left') {
      this.setVelocity(
        new Velocity(BALL_INIT_VELOCITY.NEG_X, BALL_INIT_VELOCITY.NEG_Y),
      );
    } else if (direction === 'right') {
      this.setVelocity(
        new Velocity(BALL_INIT_VELOCITY.POS_X, BALL_INIT_VELOCITY.POS_Y),
      );
    }
    return this;
  }

  public acceleration() {
    const currentSpeed = this.body.speed;

    if (currentSpeed < BALL_MAX_SPEED) {
      const { x, y } = this.body.velocity;

      this.setVelocity(
        new Velocity(x * ACCELERATION_RATIO, y * ACCELERATION_RATIO),
      );
    }
  }

  public toJson(): IBall {
    return {
      position: this.getPosition().toJson(),
      velocity: this.getVelocity().toJson(),
    };
  }
}
