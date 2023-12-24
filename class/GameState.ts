import { Ball, IBall } from './Ball.js';
import { IPaddle, Paddle } from './Paddle.js';

export class GameState {
  private ball: IBall;
  private paddles: IPaddle[];
  private hostScore: number;
  private guestScore: number;
  private lastUpdatedTime: number;

  constructor(
    ball: Ball,
    paddles: Paddle[],
    hostScore: number,
    guestScore: number,
    lastUpdatedTime: number,
  ) {
    this.ball = ball.toJson();
    this.paddles = paddles.map((paddle) => paddle.toJson());
    this.hostScore = hostScore;
    this.guestScore = guestScore;
    this.lastUpdatedTime = lastUpdatedTime;
  }
}
