import { User } from './User';

export class UserList {
  private users: User[];

  constructor() {
    this.users = [];
  }

  public add(user: User) {
    this.users.push(user);
  }

  public removeById(id: string) {
    this.users = this.users.filter((user) => user.getId() !== id);
  }

  public removeByUserId(userId: string) {
    this.users = this.users.filter((user) => user.getUserId() !== userId);
  }

  public removeByControllerId(controllerId: string) {
    this.users = this.users.filter(
      (user) => user.getControllerId() !== controllerId,
    );
  }

  public findById(id: string) {
    return this.users.find((user) => user.getId() === id);
  }

  public findByUserId(userId: string) {
    return this.users.find((user) => user.getUserId() === userId);
  }

  public findByControllerId(controllerId: string) {
    return this.users.find((user) => user.getControllerId() === controllerId);
  }

  public reset() {
    this.users = [];
  }
}
