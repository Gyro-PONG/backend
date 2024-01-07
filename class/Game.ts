import { v4 as uuidv4 } from 'uuid';

import { GameEngine } from './GameEngine';

export class Game {
  private _id: string;
  private hostId: string;
  private guestId!: string;
  private intervalId!: NodeJS.Timeout | null;
  private level: string;
  private targetScore: number;
  private isStarted: boolean;
  private engine!: GameEngine;

  constructor(hostId: string, level: string, targetScore: number) {
    this._id = `game_${uuidv4()}`;
    this.hostId = hostId;
    this.level = level;
    this.targetScore = targetScore;
    this.isStarted = false;
  }

  public setGuestId(guestId: string) {
    this.guestId = guestId;
  }

  public setIntervalId(intervalId: NodeJS.Timeout) {
    this.intervalId = intervalId;
  }

  public setStarted(isStarted: boolean) {
    this.isStarted = isStarted;
  }

  public setEngine(engine: GameEngine) {
    this.engine = engine;
  }

  public getId() {
    return this._id;
  }

  public getHostId() {
    return this.hostId;
  }

  public getGuestId() {
    return this.guestId;
  }

  public getIntervalId() {
    return this.intervalId;
  }

  public getLevel() {
    return this.level;
  }

  public getTargetScore() {
    return this.targetScore;
  }

  public getAvailable() {
    return !!this.hostId && !this.guestId;
  }

  public getIsStarted() {
    return this.isStarted;
  }

  public getEngine() {
    return this.engine;
  }
}
