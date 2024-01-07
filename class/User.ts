import { v4 as uuidv4 } from 'uuid';

export class User {
  private _id: string;
  private userId: string;
  private controllerId: string;
  private leftAngle: number;
  private rightAngle: number;

  constructor(userId: string, controllerId: string) {
    this._id = `user_${uuidv4()}`;
    this.userId = userId;
    this.controllerId = controllerId;
    this.leftAngle = 0;
    this.rightAngle = 0;
  }

  public setControllerId(controllerId: string) {
    this.controllerId = controllerId;
  }

  public getId() {
    return this._id;
  }

  public getUserId() {
    return this.userId;
  }

  public getControllerId() {
    return this.controllerId;
  }

  public setLeftAngle(leftAngle: number) {
    this.leftAngle = leftAngle;
  }

  public setRightAngle(rightAngle: number) {
    this.rightAngle = rightAngle;
  }

  public getLeftAngle() {
    return this.leftAngle;
  }

  public getRightAngle() {
    return this.rightAngle;
  }

  public reset() {
    this.controllerId = '';
    this.leftAngle = 0;
    this.rightAngle = 0;
  }
}
