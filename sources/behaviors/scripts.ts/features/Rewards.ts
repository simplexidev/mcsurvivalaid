import { ItemStack, Player } from "@minecraft/server";
import { SDError, SDResult } from "../core";


export enum RewardType {
  Item = "item",

  Experience = "experience",

  Command = "command",

  Function = "function",

  Custom = "custom",
}

export interface RewardDefinition {
  readonly id: string;

  readonly type: RewardType | string;

  readonly displayName?: string;

  readonly payload: unknown;
}

export interface ItemRewardPayload {
  readonly typeId: string;

  readonly amount: number;
}

export interface ExperienceRewardPayload {
  readonly amount: number;
}

export interface CommandRewardPayload {
  readonly command: string;
}

export interface RewardGrantRequest {
  readonly player: Player;

  readonly sourceModuleId: string;

  readonly sourceId: string;

  readonly rewards: readonly RewardDefinition[];
}

export interface RewardGrantResult {
  readonly granted: readonly RewardDefinition[];

  readonly failed: readonly RewardFailure[];
}

export interface RewardFailure {
  readonly reward: RewardDefinition;

  readonly error: SDError;
}

export interface RewardHandler<TPayload = unknown> {
  readonly type: RewardType | string;

  grant(
    player: Player,
    reward: RewardDefinition & { readonly payload: TPayload },
  ): SDResult<void>;
}

export interface RewardService {
  registerHandler(handler: RewardHandler): SDResult<void>;

  grant(request: RewardGrantRequest): SDResult<RewardGrantResult>;
}

export class DefaultRewardService implements RewardService {
  private readonly handlers = new Map<string, RewardHandler>();

  public registerHandler(handler: RewardHandler): SDResult<void> {
    if (this.handlers.has(handler.type)) {
      return SDResult.fail(
        new SDError(
          "reward.handler_duplicate",
          "Reward handler is already registered.",
          {
            type: handler.type,
          },
        ),
      );
    }

    this.handlers.set(handler.type, handler);
    return SDResult.ok(undefined);
  }

  public grant(request: RewardGrantRequest): SDResult<RewardGrantResult> {
    const granted: RewardDefinition[] = [];
    const failed: RewardFailure[] = [];

    for (const reward of request.rewards) {
      const handler = this.handlers.get(reward.type);

      if (handler === undefined) {
        failed.push({
          reward,
          error: new SDError(
            "reward.handler_not_found",
            "No reward handler registered.",
            {
              type: reward.type,
            },
          ),
        });

        continue;
      }

      const result = handler.grant(request.player, reward);

      if (result.succeeded) {
        granted.push(reward);
      } else {
        failed.push({
          reward,
          error: result.error ?? SDError.fromMessage("Reward failed."),
        });
      }
    }

    return SDResult.ok({ granted, failed });
  }
}

export class ItemRewardHandler implements RewardHandler<ItemRewardPayload> {
  public readonly type = RewardType.Item;

  public grant(
    player: Player,
    reward: RewardDefinition & { readonly payload: ItemRewardPayload },
  ): SDResult<void> {
    try {
      const inventory = player.getComponent("minecraft:inventory")?.container;

      if (inventory === undefined) {
        return SDResult.fail(
          new SDError(
            "reward.inventory_missing",
            "Player inventory was not available.",
            {
              playerId: player.id,
            },
          ),
        );
      }

      const item = new ItemStack(reward.payload.typeId, reward.payload.amount);
      inventory.addItem(item);

      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("reward.item_failed", error, reward),
      );
    }
  }
}

export class CommandRewardHandler implements RewardHandler<CommandRewardPayload> {
  public readonly type = RewardType.Command;

  public grant(
    player: Player,
    reward: RewardDefinition & { readonly payload: CommandRewardPayload },
  ): SDResult<void> {
    try {
      const command = reward.payload.command.replace(/\{player\}/g, player.name);
      player.dimension.runCommand(command);
      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("reward.command_failed", error, reward),
      );
    }
  }
}