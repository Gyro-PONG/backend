import Matter from 'matter-js';
import { Server } from 'socket.io';

import { Ball } from './Ball.js';
import { GameState } from './GameState.js';
import { Paddle } from './Paddle.js';
import { BALL_SIZE, LABEL, SIZE, UPDATE_INTERVAL } from '../constants/game.js';
import { EVENT } from '../constants/socket.js';

export class GameEngine {
  private engine!: Matter.Engine;
  private world!: Matter.World;
  private ball!: Ball;
  private level: string;
  private hostScore: number;
  private guestScore: number;
  private targetScore: number;
  private lastUpdatedTime: number;
  private paddles: Paddle[];
  private io: Server;
  private socketRoom: string;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    io: Server,
    socketRoom: string,
    level: string,
    targetScore: number,
  ) {
    this.level = level;
    this.hostScore = 0;
    this.guestScore = 0;
    this.targetScore = targetScore;
    this.lastUpdatedTime = 0;
    this.paddles = [];
    this.io = io;
    this.socketRoom = socketRoom;
    this.setEngine();
  }

  private initBall() {
    this.ball = new Ball();
    this.ball.addToWorld(this.world);
  }

  private setCollisionEvent() {
    Matter.Events.on(this.engine, 'beforeUpdate', () => {
      // 상단, 하단 벽과 충돌할 때
      if (
        this.ball.getPosition().y + BALL_SIZE / 2 >= SIZE.HEIGHT ||
        this.ball.getPosition().y - BALL_SIZE / 2 <= 0
      ) {
        this.ball.invertVelocityY();
        this.io.to(this.socketRoom).emit(EVENT.SEND_SFX, 'wall');
      }

      // 좌측 벽과 충돌할 때
      if (this.ball.getPosition().x - BALL_SIZE / 2 <= 0) {
        this.ball.resetPosition('left');
        this.guestScore += 1;
        this.io.to(this.socketRoom).emit(EVENT.SEND_SFX, 'extinction');
        this.io.to(this.socketRoom).emit(EVENT.SEND_VIBRATION, 'gs');

        if (this.guestScore === this.targetScore) {
          this.stopLoop();
          this.io.to(this.socketRoom).emit(EVENT.FINISH_GAME, {
            winner: 'guest',
            gameId: this.socketRoom,
          });
        }
      }

      // 우측 벽과 충돌할 때
      if (this.ball.getPosition().x + BALL_SIZE / 2 >= SIZE.WIDTH) {
        this.ball.resetPosition('right');
        this.hostScore += 1;
        this.io.to(this.socketRoom).emit(EVENT.SEND_SFX, 'extinction');
        this.io.to(this.socketRoom).emit(EVENT.SEND_VIBRATION, 'hs');

        if (this.hostScore === this.targetScore) {
          this.stopLoop();
          this.io.to(this.socketRoom).emit(EVENT.FINISH_GAME, {
            winner: 'host',
            gameId: this.socketRoom,
          });
        }
      }
    });

    // paddle에 충돌할 때
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        this.ball.handleCollisionWithPaddle(pairs[i]);

        if (
          this.ball.collisionTwoObjectsVerification(pairs[i], LABEL.HOST_PADDLE)
        ) {
          this.io.to(this.socketRoom).emit(EVENT.SEND_VIBRATION, 'hp');
        }

        if (
          this.ball.collisionTwoObjectsVerification(
            pairs[i],
            LABEL.GUEST_PADDLE,
          )
        ) {
          this.io.to(this.socketRoom).emit(EVENT.SEND_VIBRATION, 'gp');
        }
      }
      this.io.to(this.socketRoom).emit(EVENT.SEND_SFX, 'paddle');
    });
  }

  private setEngine() {
    this.engine = Matter.Engine.create();
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;
    this.world = this.engine.world;
    this.initBall();
    this.setCollisionEvent();
  }

  private getCurrentTime() {
    return Date.now();
  }

  private updateLastUpdatedTime() {
    this.lastUpdatedTime = this.getCurrentTime();
    return this;
  }

  private correctBeta(beta: number) {
    if (this.level === 'easy') {
      return beta * SIZE.HEIGHT * 0.8 + SIZE.HEIGHT * 0.1;
    } else {
      return beta * SIZE.HEIGHT * 0.875 + SIZE.HEIGHT * 0.0625;
    }
  }

  public checkAllPlayersJoined() {
    if (this.paddles.length === 2) {
      return true;
    } else {
      return false;
    }
  }

  public addPaddles(type: 'host' | 'guest') {
    const newPaddle = new Paddle(type, this.level);

    newPaddle.addToWorld(this.world);
    this.paddles.push(newPaddle);
  }

  public paddleMove(type: 'host' | 'guest', beta: number) {
    this.paddles
      .find((paddle) => paddle.getType() === type)
      ?.move(this.correctBeta(beta));
  }

  public update() {
    Matter.Engine.update(this.engine, UPDATE_INTERVAL);
    this.updateLastUpdatedTime();
    return this;
  }

  public getGameState() {
    return new GameState(
      this.ball,
      this.paddles,
      this.hostScore,
      this.guestScore,
      this.lastUpdatedTime,
    );
  }

  public startLoop() {
    this.intervalId = setInterval(() => {
      this.io
        .to(this.socketRoom)
        .emit(EVENT.SEND_GAME_DATA, this.update().getGameState());
    }, UPDATE_INTERVAL);

    return this.intervalId;
  }

  public stopLoop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }
}
