import { Player, world } from "@minecraft/server";
import { SDError, SDResult } from "./Common";



export interface PlayerRefJson {
  readonly id: string;

  readonly name?: string;
}

export class PlayerRef {
  public constructor(
    public readonly id: string,
    public readonly lastKnownName?: string,
  ) {}

  public static fromPlayer(player: Player): PlayerRef {
    return new PlayerRef(player.id, player.name);
  }

  public static fromJson(json: PlayerRefJson): PlayerRef {
    return new PlayerRef(json.id, json.name);
  }

  public toJson(): PlayerRefJson {
    return {
      id: this.id,
      name: this.lastKnownName,
    };
  }

  public resolveOnlinePlayer(): SDResult<Player> {
    const player = world
      .getAllPlayers()
      .find((candidate: Player) => candidate.id === this.id);

    if (player === undefined) {
      return SDResult.fail(
        new SDError(
          "player.not_online",
          "Player is not currently online.",
          this.toJson(),
        ),
      );
    }

    return SDResult.ok(player);
  }

  public equals(other: PlayerRef): boolean {
    return this.id === other.id;
  }
}

export class PlayerService {
  public getOnlinePlayers(): readonly Player[] {
    return world.getAllPlayers();
  }

  public getPlayerById(playerId: string): SDResult<Player> {
    const player = world
      .getAllPlayers()
      .find((candidate: Player) => candidate.id === playerId);

    return player === undefined
      ? SDResult.fail(
          new SDError("player.not_online", "Player is not online.", {
            playerId,
          }),
        )
      : SDResult.ok(player);
  }

  public getRef(player: Player): PlayerRef {
    return PlayerRef.fromPlayer(player);
  }
}