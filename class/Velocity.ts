import { IVelocity } from '../types/velocity.js';

export class Velocity implements IVelocity {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public invertX() {
    this.x = -this.x;
    return this;
  }

  public invertY() {
    this.y = -this.y;
    return this;
  }

  public toJson(): IVelocity {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
