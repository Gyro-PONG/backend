import Matter from 'matter-js';

import { Position } from './Position.js';
import { Velocity } from './Velocity.js';

export class Entity {
  protected body!: Matter.Body;

  private checkPairLabel(label: string) {
    return this.body.label === label;
  }

  protected collisionVerification({ bodyA, bodyB }: Matter.Pair) {
    return this.checkPairLabel(bodyA.label) || this.checkPairLabel(bodyB.label);
  }

  public collisionTwoObjectsVerification(
    { bodyA, bodyB }: Matter.Pair,
    label: string,
  ) {
    const bodyACollision =
      bodyA.label === label && this.checkPairLabel(bodyB.label);
    const bodyBCollision =
      bodyB.label === label && this.checkPairLabel(bodyA.label);
    return bodyACollision || bodyBCollision;
  }

  public addToWorld(world: Matter.World) {
    Matter.World.add(world, this.body);
  }

  public getPosition() {
    return new Position(this.body.position.x, this.body.position.y);
  }

  public getVelocity() {
    return new Velocity(this.body.velocity.x, this.body.velocity.y);
  }
}
