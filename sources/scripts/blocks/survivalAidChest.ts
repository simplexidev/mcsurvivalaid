import {
  ItemStack,
  Dimension,
  world,
  system,
  Block,
  Player,
  StartupEvent,
  WorldLoadAfterEvent,
  BlockCustomComponent,
  BlockComponentPlayerPlaceBeforeEvent,
  CustomComponentParameters,
  BlockComponentOnPlaceEvent,
  BlockComponentPlayerBreakEvent,
  BlockComponentPlayerInteractEvent,
  BlockComponentBlockBreakEvent,
  Entity,
} from "@minecraft/server";
import { ADDON } from "../constants.js";
import { claimPendingRewards, hasPendingRewards } from "../rewards/rewardService.js";
import { MinecraftComponentId, Position, Location } from "../types/domain.js";

export class SurvivalChestState {
  public isPlaced: boolean;
  public position: Position | null;
  public ownerId: string | null;
  public ownerToken: string | null;
  public hasPendingRewards: boolean;
  public pendingRewards: ItemStack[] | null;

  public constructor(
    isPlaced: boolean = false,
    position: Position = Position.newDefault(),
    ownerId: string | null = "",
    ownerToken: string | null = "",
    hasPendingRewards: boolean = false,
    pendingRewards: ItemStack[] | null = null
  ) {
    this.isPlaced = isPlaced;
    this.position = position;
    this.ownerId = ownerId;
    this.ownerToken = ownerToken;
    this.hasPendingRewards = hasPendingRewards;
    this.pendingRewards = pendingRewards;
  }

  private static getPlayerDataKey(player): string {
    return `"simplexidev:survival_aid:player:"${player.id}":survival_chest"`;
  }

  public toJson(): string {
    return JSON.stringify({
      isPlaced: this.isPlaced,
      position: this.position,
      ownerId: this.ownerId,
      ownerToken: this.ownerToken,
      hasPendingRewards: this.hasPendingRewards,
      pendingRewards: this.pendingRewards,
    });
  }

  public persistPlayerData(player): void {
    world.setDynamicProperty(SurvivalChestState.getPlayerDataKey(player), this.toJson());
  }

  public updateState(player): void {}

  public static fromJson(json: string): SurvivalChestState {
    const data = JSON.parse(json);

    return new SurvivalChestState(
      Boolean(data.isPlaced ?? false),
      new Position(data.location.dimension ?? "", data.location ?? Location.newDefault()),
      String(data.ownerId ?? ""),
      String(data.ownerToken ?? ""),
      Boolean(data.hasPendingRewards ?? false),
      Array<ItemStack>(data.pendingRewards)
    );
  }

  public static createDefault(): SurvivalChestState {
    return new SurvivalChestState(false, Position.newDefault(), "", "", false, null);
  }
}

export class SurvivalChest implements BlockCustomComponent {
  constructor(
    public state: SurvivalChestState = null,
    public registered: boolean = false
  ) {
    this.state = state ?? SurvivalChestState.createDefault();
    this.registered = registered ?? false;
  }

  //TODO: Need to update state before trying to use the old values.
  //TODO: I don't think i have to do anything else here, as this is essentially meant to be validation prior to the block being placed.
  public readonly beforeOnPlayerPlace? = (
    event: BlockComponentPlayerPlaceBeforeEvent,
    params: CustomComponentParameters
  ): void => {
    const player = event.player;
    const block = event.block;
    if (player == null) return;
    if (this.state.isPlaced && this.state.position.location !== block.location) {
      player.sendMessage("Your Survival Chest is being moved to here.");
      const oldBlock = this.state.position.dimension.getBlock(this.state.position.location);
      if (oldBlock !== null || !oldBlock.isAir) {
        oldBlock.setType("minecraft:air");
      }
    }
  };

  //TODO: Need to update state before trying to use the old values.
  public readonly onPlayerInteract = (
    event: BlockComponentPlayerInteractEvent,
    params: CustomComponentParameters
  ): void => {
    const { block, player } = event;
    if (player == null) return;
    const b = block.location;
    if (block.location === this.state.position.location) claimPendingRewards(player);
  };

  public readonly onBreak? = (event: BlockComponentBlockBreakEvent, params: CustomComponentParameters): void => {
    const { block, entitySource } = event;
    const player = this.tryGetPlayer(entitySource);
    this.handleBreak(block, player);
  };

  public readonly onPlayerBreak? = (event: BlockComponentPlayerBreakEvent, params: CustomComponentParameters): void => {
    const { block, player } = event;
    this.handleBreak(block, player);
  };

  //TODO: Need to update state before trying to use the old values.
  private handleBreak(block: Block, player: Player): void {
    if (!player) return;
    if (!this.state.position) return;
    if (block.location !== this.state.position.location) return;
    this.state.isPlaced = false;
    this.state.position = null;
    this.state.persistPlayerData(player);
  }

  private tryGetPlayer(entity: Entity | null): Player | null {
    if (entity == null || entity.typeId !== "minecraft:player") return null;
    return entity as Player;
  }

  private static getComponentKey(): string {
    return "survival_aid:survival_chest_component";
  }

  private static getBlockName(): string {
    return "survival_aid:survival_chest";
  }

  public registerComponent(event: StartupEvent) {
    event.blockComponentRegistry.registerCustomComponent(SurvivalChest.getComponentKey(), new SurvivalChest());
  }
}
