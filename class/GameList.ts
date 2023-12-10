import { Game } from './Game';

export class GameList {
  private games: Game[];

  constructor() {
    this.games = [];
  }

  public add(game: Game) {
    this.games.push(game);
  }

  public getList() {
    return this.games.map((game) => ({
      gameId: game.getId(),
      targetScore: game.getTargetScore(),
      level: game.getLevel(),
      available: game.getAvailable(),
    }));
  }

  public removeById(id: string) {
    this.games = this.games.filter((game) => game.getId() !== id);
  }

  public removeByHostId(hostId: string) {
    this.games = this.games.filter((game) => game.getHostId() !== hostId);
  }

  public removeByGuestId(guestId: string) {
    this.games = this.games.filter((game) => game.getGuestId() !== guestId);
  }

  public findById(id: string) {
    return this.games.find((game) => game.getId() === id);
  }

  public findByHostId(hostId: string) {
    return this.games.find((game) => game.getHostId() === hostId);
  }

  public findByGuestId(guestId: string) {
    return this.games.find((game) => game.getGuestId() === guestId);
  }

  public findByUserId(userId: string) {
    const game = this.games.find(
      (game) => game.getHostId() === userId || game.getGuestId() === userId,
    );

    if (game) {
      return {
        game,
        isHost: game.getHostId() === userId,
      };
    }
  }
}
