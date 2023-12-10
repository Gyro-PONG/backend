import { v4 as uuidv4 } from 'uuid';

export class Game {
  private _id: string;
  private hostId: string;
  private guestId: string;
  private level: string;
  private targetScore: number;
  private isStarted: boolean;

  constructor(hostId: string, level: string, targetScore: number) {
    this._id = `game_${uuidv4()}`;
    this.hostId = hostId;
    this.guestId = '';
    this.level = level;
    this.targetScore = targetScore;
    this.isStarted = false;
  }

  public setGuestId(guestId: string) {
    this.guestId = guestId;
  }

  public setStarted(isStarted: boolean) {
    this.isStarted = isStarted;
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
}
