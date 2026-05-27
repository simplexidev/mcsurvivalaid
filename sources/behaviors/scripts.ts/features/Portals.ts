import { Block, Dimension, Player, Vector3, world, system } from "@minecraft/server";
import { ActionFormButton, BlockLocationRef, FormService, JsonStore, KeyBuilder, LocationJson, LocationRef, PlayerRef, PlayerRefJson, SDResult, SDError } from "../core";


export enum PortalColor {
  White = "white",
  LightGray = "light_gray",
  Gray = "gray",
  Black = "black",
  Brown = "brown",
  Red = "red",
  Orange = "orange",
  Yellow = "yellow",
  Lime = "lime",
  Green = "green",
  Cyan = "cyan",
  LightBlue = "light_blue",
  Blue = "blue",
  Purple = "purple",
  Magenta = "magenta",
  Pink = "pink",
}

export enum PortalFacing {
  North = "north",
  South = "south",
  East = "east",
  West = "west",
}

export enum PortalStatus {
  Active = "active",
  Disabled = "disabled",
  MissingFrame = "missing_frame",
  MissingSurface = "missing_surface",
}

export enum PortalConnectionMode {
  OwnerOnly = "owner_only",
  OwnerAndColor = "owner_and_color",
}

export enum PortalActivationResult {
  Used = "used",
  Canceled = "canceled",
  NoSourcePortal = "no_source_portal",
  NoDestinationPortal = "no_destination_portal",
  Cooldown = "cooldown",
}

export class PortalConstants {
  public static readonly moduleId = "portals";

  public static readonly stateVersion = 1;

  public static readonly defaultCooldownTicks = 20;

  public static readonly defaultConnectionMode = PortalConnectionMode.OwnerOnly;

  public static readonly concreteTypeIds: Readonly<
    Record<PortalColor, string>
  > = Object.freeze({
    [PortalColor.White]: "minecraft:white_concrete",
    [PortalColor.LightGray]: "minecraft:light_gray_concrete",
    [PortalColor.Gray]: "minecraft:gray_concrete",
    [PortalColor.Black]: "minecraft:black_concrete",
    [PortalColor.Brown]: "minecraft:brown_concrete",
    [PortalColor.Red]: "minecraft:red_concrete",
    [PortalColor.Orange]: "minecraft:orange_concrete",
    [PortalColor.Yellow]: "minecraft:yellow_concrete",
    [PortalColor.Lime]: "minecraft:lime_concrete",
    [PortalColor.Green]: "minecraft:green_concrete",
    [PortalColor.Cyan]: "minecraft:cyan_concrete",
    [PortalColor.LightBlue]: "minecraft:light_blue_concrete",
    [PortalColor.Blue]: "minecraft:blue_concrete",
    [PortalColor.Purple]: "minecraft:purple_concrete",
    [PortalColor.Magenta]: "minecraft:magenta_concrete",
    [PortalColor.Pink]: "minecraft:pink_concrete",
  });
}

export interface PortalJson {
  readonly id: string;
  readonly owner: PlayerRefJson;
  readonly name: string;
  readonly color: PortalColor;
  readonly facing: PortalFacing;
  readonly anchor: LocationJson;
  readonly frameBlocks: readonly LocationJson[];
  readonly openingBlocks: readonly LocationJson[];
  readonly surfaceBlocks: readonly LocationJson[];
  readonly triggerBlocks: readonly LocationJson[];
  readonly exitLocation: LocationJson;
  readonly status: PortalStatus;
  readonly createdAtTick: number;
  readonly updatedAtTick: number;
  readonly version: number;
}

export interface PlayerPortalState {
  readonly playerId: string;
  readonly portals: readonly PortalJson[];
  readonly version: number;
}

export interface PortalCreateRequest {
  readonly owner: Player;
  readonly name: string;
  readonly anchor: BlockLocationRef;
  readonly facing: PortalFacing;
}

export interface PortalRenameRequest {
  readonly owner: Player;
  readonly portalId: string;
  readonly name: string;
}

export interface PortalRemoveRequest {
  readonly owner: Player;
  readonly portalId: string;
  readonly removeSurfaceBlocks?: boolean;
}

export interface PortalTeleportRequest {
  readonly player: Player;
  readonly sourcePortal: PortalRef;
  readonly destinationPortal: PortalRef;
}

export interface PortalActivationContext {
  readonly player: Player;
  readonly location: BlockLocationRef;
}

export interface PortalActivationResponse {
  readonly result: PortalActivationResult;
  readonly sourcePortal?: PortalRef;
  readonly destinationPortal?: PortalRef;
}

export interface PortalSurfacePlacement {
  readonly openingBlocks: readonly BlockLocationRef[];
  readonly surfaceBlocks: readonly BlockLocationRef[];
  readonly triggerBlocks: readonly BlockLocationRef[];
  readonly exitLocation: LocationRef;
}

export interface PortalFrameBlockMismatch {
  readonly location: LocationJson;
  readonly actualTypeId?: string;
  readonly expectedTypeIds: readonly string[];
}

export interface PortalFrameScanResult {
  readonly isValid: boolean;
  readonly color?: PortalColor;
  readonly frameBlocks: readonly BlockLocationRef[];
  readonly openingBlocks: readonly BlockLocationRef[];
  readonly missingBlocks: readonly BlockLocationRef[];
  readonly mismatchedBlocks: readonly PortalFrameBlockMismatch[];
}

export interface PortalListOptions {
  readonly includeDisabled?: boolean;
  readonly excludePortalId?: string;
  readonly color?: PortalColor;
  readonly connectionMode?: PortalConnectionMode;
}

export class PortalRef {
  public constructor(
    public readonly id: string,
    public readonly owner: PlayerRef,
    public readonly name: string,
    public readonly color: PortalColor,
    public readonly facing: PortalFacing,
    public readonly anchor: BlockLocationRef,
    public readonly frameBlocks: readonly BlockLocationRef[],
    public readonly openingBlocks: readonly BlockLocationRef[],
    public readonly surfaceBlocks: readonly BlockLocationRef[],
    public readonly triggerBlocks: readonly BlockLocationRef[],
    public readonly exitLocation: LocationRef,
    public readonly status: PortalStatus,
    public readonly createdAtTick: number,
    public readonly updatedAtTick: number,
    public readonly version: number = PortalConstants.stateVersion,
  ) {}

  public static fromJson(json: PortalJson): PortalRef {
    return new PortalRef(
      json.id,
      PlayerRef.fromJson(json.owner),
      json.name,
      json.color,
      json.facing,
      PortalLocationCodec.blockFromJson(json.anchor),
      json.frameBlocks.map((location) =>
        PortalLocationCodec.blockFromJson(location),
      ),
      json.openingBlocks.map((location) =>
        PortalLocationCodec.blockFromJson(location),
      ),
      json.surfaceBlocks.map((location) =>
        PortalLocationCodec.blockFromJson(location),
      ),
      json.triggerBlocks.map((location) =>
        PortalLocationCodec.blockFromJson(location),
      ),
      LocationRef.fromJson(json.exitLocation),
      json.status,
      json.createdAtTick,
      json.updatedAtTick,
      json.version,
    );
  }

  public toJson(): PortalJson {
    return {
      id: this.id,
      owner: this.owner.toJson(),
      name: this.name,
      color: this.color,
      facing: this.facing,
      anchor: this.anchor.toJson(),
      frameBlocks: this.frameBlocks.map((location) => location.toJson()),
      openingBlocks: this.openingBlocks.map((location) => location.toJson()),
      surfaceBlocks: this.surfaceBlocks.map((location) => location.toJson()),
      triggerBlocks: this.triggerBlocks.map((location) => location.toJson()),
      exitLocation: this.exitLocation.toJson(),
      status: this.status,
      createdAtTick: this.createdAtTick,
      updatedAtTick: this.updatedAtTick,
      version: this.version,
    };
  }

  public isOwnedBy(player: Player): boolean {
    return this.owner.id === player.id;
  }

  public withName(name: string, tick: number): PortalRef {
    return new PortalRef(
      this.id,
      this.owner,
      name,
      this.color,
      this.facing,
      this.anchor,
      this.frameBlocks,
      this.openingBlocks,
      this.surfaceBlocks,
      this.triggerBlocks,
      this.exitLocation,
      this.status,
      this.createdAtTick,
      tick,
      this.version,
    );
  }

  public withStatus(status: PortalStatus, tick: number): PortalRef {
    return new PortalRef(
      this.id,
      this.owner,
      this.name,
      this.color,
      this.facing,
      this.anchor,
      this.frameBlocks,
      this.openingBlocks,
      this.surfaceBlocks,
      this.triggerBlocks,
      this.exitLocation,
      status,
      this.createdAtTick,
      tick,
      this.version,
    );
  }
}

export class PortalLocationCodec {
  public static blockFromJson(json: LocationJson): BlockLocationRef {
    return new BlockLocationRef(
      json.dimensionId,
      Math.floor(json.x),
      Math.floor(json.y),
      Math.floor(json.z),
    );
  }

  public static blockFromVector(
    dimensionId: string,
    vector: Vector3,
  ): BlockLocationRef {
    return new BlockLocationRef(
      dimensionId,
      Math.floor(vector.x),
      Math.floor(vector.y),
      Math.floor(vector.z),
    );
  }

  public static playerBlockLocation(player: Player): BlockLocationRef {
    return PortalLocationCodec.blockFromVector(
      player.dimension.id,
      player.location,
    );
  }
}

export interface PortalClock {
  getTick(): number;
}

export class MinecraftPortalClock implements PortalClock {
  public getTick(): number {
    return Number(world.getAbsoluteTime?.() ?? system.currentTick ?? 0);
  }
}

export interface PortalIdGenerator {
  createPortalId(
    owner: PlayerRef,
    name: string,
    anchor: BlockLocationRef,
  ): string;
}

export class DefaultPortalIdGenerator implements PortalIdGenerator {
  public createPortalId(
    owner: PlayerRef,
    name: string,
    anchor: BlockLocationRef,
  ): string {
    const safeName = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_\-]+/g, "_");
    const safeDimension = anchor.dimensionId.replace(/[^a-z0-9_\-:.]+/g, "_");

    return `${owner.id}:${safeName}:${safeDimension}:${anchor.x}:${anchor.y}:${anchor.z}`;
  }
}

export interface PortalNameValidator {
  validate(name: string): SDResult<string>;
}

export class DefaultPortalNameValidator implements PortalNameValidator {
  public constructor(
    private readonly minLength: number = 1,
    private readonly maxLength: number = 40,
  ) {}

  public validate(name: string): SDResult<string> {
    const normalized = name.trim();

    if (normalized.length < this.minLength) {
      return SDResult.fail(
        new SDError("portal.name_too_short", "Portal name is too short.", {
          minLength: this.minLength,
        }),
      );
    }

    if (normalized.length > this.maxLength) {
      return SDResult.fail(
        new SDError("portal.name_too_long", "Portal name is too long.", {
          maxLength: this.maxLength,
        }),
      );
    }

    return SDResult.ok(normalized);
  }
}

export interface PortalGeometry {
  getFrameBlocks(
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): readonly BlockLocationRef[];

  getOpeningBlocks(
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): readonly BlockLocationRef[];

  getSurfacePlacement(
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): PortalSurfacePlacement;

  containsTriggerBlock(portal: PortalRef, location: BlockLocationRef): boolean;
}

export class NetherStyleConcretePortalGeometry implements PortalGeometry {
  public getFrameBlocks(
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): readonly BlockLocationRef[] {
    const blocks: BlockLocationRef[] = [];

    for (let width = 0; width < 3; width++) {
      for (let height = 0; height < 4; height++) {
        const isOpening = width === 1 && (height === 1 || height === 2);

        if (!isOpening) {
          blocks.push(this.offsetInPlane(anchor, facing, width, height, 0));
        }
      }
    }

    return blocks;
  }

  public getOpeningBlocks(
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): readonly BlockLocationRef[] {
    return [
      this.offsetInPlane(anchor, facing, 1, 1, 0),
      this.offsetInPlane(anchor, facing, 1, 2, 0),
    ];
  }

  public getSurfacePlacement(
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): PortalSurfacePlacement {
    const openingBlocks = this.getOpeningBlocks(anchor, facing);
    const exitBase = this.offsetInPlane(anchor, facing, 1, 1, -1);

    return {
      openingBlocks,
      surfaceBlocks: openingBlocks,
      triggerBlocks: openingBlocks,
      exitLocation: new LocationRef(
        exitBase.dimensionId,
        exitBase.x + 0.5,
        exitBase.y,
        exitBase.z + 0.5,
      ),
    };
  }

  public containsTriggerBlock(
    portal: PortalRef,
    location: BlockLocationRef,
  ): boolean {
    return portal.triggerBlocks.some((trigger) =>
      PortalBlockMath.sameBlock(trigger, location),
    );
  }

  private offsetInPlane(
    anchor: BlockLocationRef,
    facing: PortalFacing,
    widthOffset: number,
    heightOffset: number,
    depthOffset: number,
  ): BlockLocationRef {
    const right = this.getRightVector(facing);
    const forward = this.getForwardVector(facing);

    return new BlockLocationRef(
      anchor.dimensionId,
      anchor.x + right.x * widthOffset + forward.x * depthOffset,
      anchor.y + heightOffset,
      anchor.z + right.z * widthOffset + forward.z * depthOffset,
    );
  }

  private getRightVector(facing: PortalFacing): {
    readonly x: number;
    readonly z: number;
  } {
    switch (facing) {
      case PortalFacing.North:
        return { x: 1, z: 0 };

      case PortalFacing.South:
        return { x: -1, z: 0 };

      case PortalFacing.East:
        return { x: 0, z: 1 };

      case PortalFacing.West:
        return { x: 0, z: -1 };
    }
  }

  private getForwardVector(facing: PortalFacing): {
    readonly x: number;
    readonly z: number;
  } {
    switch (facing) {
      case PortalFacing.North:
        return { x: 0, z: -1 };

      case PortalFacing.South:
        return { x: 0, z: 1 };

      case PortalFacing.East:
        return { x: 1, z: 0 };

      case PortalFacing.West:
        return { x: -1, z: 0 };
    }
  }
}

export class PortalBlockMath {
  public static sameBlock(left: LocationRef, right: LocationRef): boolean {
    return (
      left.dimensionId === right.dimensionId &&
      Math.floor(left.x) === Math.floor(right.x) &&
      Math.floor(left.y) === Math.floor(right.y) &&
      Math.floor(left.z) === Math.floor(right.z)
    );
  }
}

export interface PortalFrameScanner {
  scan(
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): SDResult<PortalFrameScanResult>;
}

export class ConcretePortalFrameScanner implements PortalFrameScanner {
  public constructor(private readonly geometry: PortalGeometry) {}

  public scan(
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): SDResult<PortalFrameScanResult> {
    const dimensionResult = anchor.getDimension();

    if (dimensionResult.isFailure) {
      return SDResult.fail(dimensionResult.error!);
    }

    const dimension = dimensionResult.getValueOrThrow();
    const frameBlocks = this.geometry.getFrameBlocks(anchor, facing);
    const openingBlocks = this.geometry.getOpeningBlocks(anchor, facing);
    const missingBlocks: BlockLocationRef[] = [];
    const mismatchedBlocks: PortalFrameBlockMismatch[] = [];
    let detectedColor: PortalColor | undefined;

    for (const frameBlockLocation of frameBlocks) {
      const block = dimension.getBlock(frameBlockLocation.toVector3());

      if (block === undefined) {
        missingBlocks.push(frameBlockLocation);
        continue;
      }

      const color = this.getConcreteColor(block.typeId);

      if (color === undefined) {
        mismatchedBlocks.push({
          location: frameBlockLocation.toJson(),
          actualTypeId: block.typeId,
          expectedTypeIds: Object.values(PortalConstants.concreteTypeIds),
        });

        continue;
      }

      if (detectedColor === undefined) {
        detectedColor = color;
        continue;
      }

      if (detectedColor !== color) {
        mismatchedBlocks.push({
          location: frameBlockLocation.toJson(),
          actualTypeId: block.typeId,
          expectedTypeIds: [PortalConstants.concreteTypeIds[detectedColor]],
        });
      }
    }

    return SDResult.ok({
      isValid:
        detectedColor !== undefined &&
        missingBlocks.length === 0 &&
        mismatchedBlocks.length === 0,
      color: detectedColor,
      frameBlocks,
      openingBlocks,
      missingBlocks,
      mismatchedBlocks,
    });
  }

  private getConcreteColor(typeId: string): PortalColor | undefined {
    for (const [color, concreteTypeId] of Object.entries(
      PortalConstants.concreteTypeIds,
    )) {
      if (typeId === concreteTypeId) {
        return color as PortalColor;
      }
    }

    return undefined;
  }
}

export interface PortalSurfaceProjector {
  createSurface(portal: PortalRef): SDResult<void>;

  removeSurface(portal: PortalRef): SDResult<void>;

  validateSurface(portal: PortalRef): SDResult<boolean>;
}

export class NoOpPortalSurfaceProjector implements PortalSurfaceProjector {
  public createSurface(_portal: PortalRef): SDResult<void> {
    return SDResult.ok(undefined);
  }

  public removeSurface(_portal: PortalRef): SDResult<void> {
    return SDResult.ok(undefined);
  }

  public validateSurface(_portal: PortalRef): SDResult<boolean> {
    return SDResult.ok(true);
  }
}

export interface PortalSurfaceTypeResolver {
  getSurfaceTypeId(color: PortalColor): string;
}

export class ConcreteColorPortalSurfaceTypeResolver implements PortalSurfaceTypeResolver {
  public constructor(private readonly namespace: string = "simplexidev") {}

  public getSurfaceTypeId(color: PortalColor): string {
    return `${this.namespace}:${color}_portal_surface`;
  }
}

export class BlockPortalSurfaceProjector implements PortalSurfaceProjector {
  public constructor(
    private readonly typeResolver: PortalSurfaceTypeResolver,
  ) {}

  public createSurface(portal: PortalRef): SDResult<void> {
    const dimensionResult = portal.anchor.getDimension();

    if (dimensionResult.isFailure) {
      return SDResult.fail(dimensionResult.error!);
    }

    const dimension = dimensionResult.getValueOrThrow();
    const typeId = this.typeResolver.getSurfaceTypeId(portal.color);

    try {
      for (const blockLocation of portal.surfaceBlocks) {
        dimension.setBlockType(blockLocation.toVector3(), typeId);
      }

      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception(
          "portal.surface_create_failed",
          error,
          portal.toJson(),
        ),
      );
    }
  }

  public removeSurface(portal: PortalRef): SDResult<void> {
    const dimensionResult = portal.anchor.getDimension();

    if (dimensionResult.isFailure) {
      return SDResult.fail(dimensionResult.error!);
    }

    const dimension = dimensionResult.getValueOrThrow();

    try {
      for (const blockLocation of portal.surfaceBlocks) {
        const block = dimension.getBlock(blockLocation.toVector3());

        if (
          block !== undefined &&
          block.typeId === this.typeResolver.getSurfaceTypeId(portal.color)
        ) {
          dimension.setBlockType(blockLocation.toVector3(), "minecraft:air");
        }
      }

      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception(
          "portal.surface_remove_failed",
          error,
          portal.toJson(),
        ),
      );
    }
  }

  public validateSurface(portal: PortalRef): SDResult<boolean> {
    const dimensionResult = portal.anchor.getDimension();

    if (dimensionResult.isFailure) {
      return SDResult.fail(dimensionResult.error!);
    }

    const dimension = dimensionResult.getValueOrThrow();
    const expectedTypeId = this.typeResolver.getSurfaceTypeId(portal.color);

    for (const blockLocation of portal.surfaceBlocks) {
      const block = dimension.getBlock(blockLocation.toVector3());

      if (block === undefined || block.typeId !== expectedTypeId) {
        return SDResult.ok(false);
      }
    }

    return SDResult.ok(true);
  }
}

export interface PortalStore {
  getState(ownerPlayerId: string): SDResult<PlayerPortalState>;

  setState(state: PlayerPortalState): SDResult<void>;

  getPortals(ownerPlayerId: string): SDResult<readonly PortalRef[]>;

  getPortal(ownerPlayerId: string, portalId: string): SDResult<PortalRef>;

  addPortal(portal: PortalRef): SDResult<void>;

  updatePortal(portal: PortalRef): SDResult<void>;

  removePortal(ownerPlayerId: string, portalId: string): SDResult<void>;

  getAllKnownPortals(): SDResult<readonly PortalRef[]>;
}

export class JsonPortalStore implements PortalStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder,
  ) {}

  public getState(ownerPlayerId: string): SDResult<PlayerPortalState> {
    return this.jsonStore.getJson<PlayerPortalState>(
      this.getPlayerPortalStateKey(ownerPlayerId),
      {
        playerId: ownerPlayerId,
        portals: [],
        version: PortalConstants.stateVersion,
      },
    );
  }

  public setState(state: PlayerPortalState): SDResult<void> {
    return this.jsonStore.setJson(
      this.getPlayerPortalStateKey(state.playerId),
      state,
    );
  }

  public getPortals(ownerPlayerId: string): SDResult<readonly PortalRef[]> {
    return this.getState(ownerPlayerId).map((state) =>
      state.portals.map((portal) => PortalRef.fromJson(portal)),
    );
  }

  public getPortal(
    ownerPlayerId: string,
    portalId: string,
  ): SDResult<PortalRef> {
    const portalsResult = this.getPortals(ownerPlayerId);

    if (portalsResult.isFailure) {
      return SDResult.fail(portalsResult.error!);
    }

    const portal = portalsResult
      .getValueOrThrow()
      .find((candidate) => candidate.id === portalId);

    return portal === undefined
      ? SDResult.fail(
          new SDError("portal.not_found", "Portal was not found.", {
            ownerPlayerId,
            portalId,
          }),
        )
      : SDResult.ok(portal);
  }

  public addPortal(portal: PortalRef): SDResult<void> {
    const stateResult = this.getState(portal.owner.id);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    if (state.portals.some((existing) => existing.id === portal.id)) {
      return SDResult.fail(
        new SDError("portal.duplicate", "Portal already exists.", {
          portalId: portal.id,
        }),
      );
    }

    if (
      state.portals.some(
        (existing) => existing.name.toLowerCase() === portal.name.toLowerCase(),
      )
    ) {
      return SDResult.fail(
        new SDError("portal.duplicate_name", "Portal name already exists.", {
          ownerPlayerId: portal.owner.id,
          name: portal.name,
        }),
      );
    }

    return this.setState({
      ...state,
      portals: [...state.portals, portal.toJson()],
    });
  }

  public updatePortal(portal: PortalRef): SDResult<void> {
    const stateResult = this.getState(portal.owner.id);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();
    const index = state.portals.findIndex(
      (existing) => existing.id === portal.id,
    );

    if (index < 0) {
      return SDResult.fail(
        new SDError("portal.not_found", "Portal was not found.", {
          ownerPlayerId: portal.owner.id,
          portalId: portal.id,
        }),
      );
    }

    const updated = [...state.portals];
    updated[index] = portal.toJson();

    return this.setState({
      ...state,
      portals: updated,
    });
  }

  public removePortal(ownerPlayerId: string, portalId: string): SDResult<void> {
    const stateResult = this.getState(ownerPlayerId);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    return this.setState({
      ...state,
      portals: state.portals.filter((portal) => portal.id !== portalId),
    });
  }

  public getAllKnownPortals(): SDResult<readonly PortalRef[]> {
    return SDResult.fail(
      new SDError(
        "portal.global_scan_not_supported",
        "Global portal scan is not supported by this store. Use PortalIndexStore for runtime trigger lookup.",
      ),
    );
  }

  private getPlayerPortalStateKey(ownerPlayerId: string): string {
    return this.keys.player(ownerPlayerId, "portals", "state");
  }
}

export interface PortalIndexState {
  readonly portals: readonly PortalJson[];
  readonly version: number;
}

export interface PortalIndexStore {
  getIndexedPortals(): SDResult<readonly PortalRef[]>;

  addOrUpdate(portal: PortalRef): SDResult<void>;

  remove(portalId: string): SDResult<void>;

  rebuild(portals: readonly PortalRef[]): SDResult<void>;
}

export class JsonPortalIndexStore implements PortalIndexStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder,
  ) {}

  public getIndexedPortals(): SDResult<readonly PortalRef[]> {
    return this.getState().map((state) =>
      state.portals.map((portal) => PortalRef.fromJson(portal)),
    );
  }

  public addOrUpdate(portal: PortalRef): SDResult<void> {
    const stateResult = this.getState();

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();
    const existing = state.portals.filter(
      (candidate) => candidate.id !== portal.id,
    );

    return this.setState({
      ...state,
      portals: [...existing, portal.toJson()],
    });
  }

  public remove(portalId: string): SDResult<void> {
    const stateResult = this.getState();

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    return this.setState({
      ...state,
      portals: state.portals.filter((portal) => portal.id !== portalId),
    });
  }

  public rebuild(portals: readonly PortalRef[]): SDResult<void> {
    return this.setState({
      portals: portals.map((portal) => portal.toJson()),
      version: PortalConstants.stateVersion,
    });
  }

  private getState(): SDResult<PortalIndexState> {
    return this.jsonStore.getJson<PortalIndexState>(
      this.keys.world("portals", "index"),
      {
        portals: [],
        version: PortalConstants.stateVersion,
      },
    );
  }

  private setState(state: PortalIndexState): SDResult<void> {
    return this.jsonStore.setJson(this.keys.world("portals", "index"), state);
  }
}

export interface PortalRegistry {
  create(request: PortalCreateRequest): SDResult<PortalCreateResult>;

  rename(request: PortalRenameRequest): SDResult<PortalRef>;

  remove(request: PortalRemoveRequest): SDResult<void>;

  getOwnerPortals(
    ownerPlayerId: string,
    options?: PortalListOptions,
  ): SDResult<readonly PortalRef[]>;

  getPortal(ownerPlayerId: string, portalId: string): SDResult<PortalRef>;

  refreshPortal(portal: PortalRef): SDResult<PortalRef>;

  findPortalAt(location: BlockLocationRef): SDResult<PortalRef | undefined>;

  findUsableDestinations(
    sourcePortal: PortalRef,
    mode?: PortalConnectionMode,
  ): SDResult<readonly PortalRef[]>;
}

export interface PortalCreateResult {
  readonly portal: PortalRef;
  readonly frameScan: PortalFrameScanResult;
}

export class DefaultPortalRegistry implements PortalRegistry {
  public constructor(
    private readonly store: PortalStore,
    private readonly index: PortalIndexStore,
    private readonly scanner: PortalFrameScanner,
    private readonly geometry: PortalGeometry,
    private readonly surfaceProjector: PortalSurfaceProjector,
    private readonly idGenerator: PortalIdGenerator,
    private readonly nameValidator: PortalNameValidator,
    private readonly clock: PortalClock,
  ) {}

  public create(request: PortalCreateRequest): SDResult<PortalCreateResult> {
    const nameResult = this.nameValidator.validate(request.name);

    if (nameResult.isFailure) {
      return SDResult.fail(nameResult.error!);
    }

    const scanResult = this.scanner.scan(request.anchor, request.facing);

    if (scanResult.isFailure) {
      return SDResult.fail(scanResult.error!);
    }

    const scan = scanResult.getValueOrThrow();

    if (!scan.isValid || scan.color === undefined) {
      return SDResult.fail(
        new SDError("portal.invalid_frame", "Portal frame is not valid.", scan),
      );
    }

    const owner = PlayerRef.fromPlayer(request.owner);
    const name = nameResult.getValueOrThrow();
    const tick = this.clock.getTick();
    const placement = this.geometry.getSurfacePlacement(
      request.anchor,
      request.facing,
    );
    const id = this.idGenerator.createPortalId(owner, name, request.anchor);

    const portal = new PortalRef(
      id,
      owner,
      name,
      scan.color,
      request.facing,
      request.anchor,
      scan.frameBlocks,
      scan.openingBlocks,
      placement.surfaceBlocks,
      placement.triggerBlocks,
      placement.exitLocation,
      PortalStatus.Active,
      tick,
      tick,
      PortalConstants.stateVersion,
    );

    const createSurfaceResult = this.surfaceProjector.createSurface(portal);

    if (createSurfaceResult.isFailure) {
      return SDResult.fail(createSurfaceResult.error!);
    }

    const addResult = this.store.addPortal(portal);

    if (addResult.isFailure) {
      return SDResult.fail(addResult.error!);
    }

    const indexResult = this.index.addOrUpdate(portal);

    if (indexResult.isFailure) {
      return SDResult.fail(indexResult.error!);
    }

    return SDResult.ok({
      portal,
      frameScan: scan,
    });
  }

  public rename(request: PortalRenameRequest): SDResult<PortalRef> {
    const nameResult = this.nameValidator.validate(request.name);

    if (nameResult.isFailure) {
      return SDResult.fail(nameResult.error!);
    }

    const portalResult = this.store.getPortal(
      request.owner.id,
      request.portalId,
    );

    if (portalResult.isFailure) {
      return SDResult.fail(portalResult.error!);
    }

    const portal = portalResult.getValueOrThrow();

    if (!portal.isOwnedBy(request.owner)) {
      return SDResult.fail(
        new SDError(
          "portal.not_owner",
          "Only the portal owner can rename this portal.",
          {
            portalId: request.portalId,
            playerId: request.owner.id,
          },
        ),
      );
    }

    const updated = portal.withName(
      nameResult.getValueOrThrow(),
      this.clock.getTick(),
    );
    const updateResult = this.store.updatePortal(updated);

    if (updateResult.isFailure) {
      return SDResult.fail(updateResult.error!);
    }

    const indexResult = this.index.addOrUpdate(updated);

    if (indexResult.isFailure) {
      return SDResult.fail(indexResult.error!);
    }

    return SDResult.ok(updated);
  }

  public remove(request: PortalRemoveRequest): SDResult<void> {
    const portalResult = this.store.getPortal(
      request.owner.id,
      request.portalId,
    );

    if (portalResult.isFailure) {
      return SDResult.fail(portalResult.error!);
    }

    const portal = portalResult.getValueOrThrow();

    if (!portal.isOwnedBy(request.owner)) {
      return SDResult.fail(
        new SDError(
          "portal.not_owner",
          "Only the portal owner can remove this portal.",
          {
            portalId: request.portalId,
            playerId: request.owner.id,
          },
        ),
      );
    }

    if (request.removeSurfaceBlocks === true) {
      const removeSurfaceResult = this.surfaceProjector.removeSurface(portal);

      if (removeSurfaceResult.isFailure) {
        return SDResult.fail(removeSurfaceResult.error!);
      }
    }

    const removeResult = this.store.removePortal(
      request.owner.id,
      request.portalId,
    );

    if (removeResult.isFailure) {
      return SDResult.fail(removeResult.error!);
    }

    return this.index.remove(request.portalId);
  }

  public getOwnerPortals(
    ownerPlayerId: string,
    options: PortalListOptions = {},
  ): SDResult<readonly PortalRef[]> {
    const portalsResult = this.store.getPortals(ownerPlayerId);

    if (portalsResult.isFailure) {
      return SDResult.fail(portalsResult.error!);
    }

    const portals = portalsResult.getValueOrThrow().filter((portal) => {
      if (
        options.includeDisabled !== true &&
        portal.status !== PortalStatus.Active
      ) {
        return false;
      }

      if (
        options.excludePortalId !== undefined &&
        portal.id === options.excludePortalId
      ) {
        return false;
      }

      if (options.color !== undefined && portal.color !== options.color) {
        return false;
      }

      return true;
    });

    return SDResult.ok(portals);
  }

  public getPortal(
    ownerPlayerId: string,
    portalId: string,
  ): SDResult<PortalRef> {
    return this.store.getPortal(ownerPlayerId, portalId);
  }

  public refreshPortal(portal: PortalRef): SDResult<PortalRef> {
    const scanResult = this.scanner.scan(portal.anchor, portal.facing);

    if (scanResult.isFailure) {
      return SDResult.fail(scanResult.error!);
    }

    const scan = scanResult.getValueOrThrow();

    if (!scan.isValid || scan.color !== portal.color) {
      const updated = portal.withStatus(
        PortalStatus.MissingFrame,
        this.clock.getTick(),
      );
      const updateResult = this.store.updatePortal(updated);

      if (updateResult.isFailure) {
        return SDResult.fail(updateResult.error!);
      }

      this.index.addOrUpdate(updated);
      return SDResult.ok(updated);
    }

    const surfaceResult = this.surfaceProjector.validateSurface(portal);

    if (surfaceResult.isFailure) {
      return SDResult.fail(surfaceResult.error!);
    }

    if (!surfaceResult.getValueOrThrow()) {
      const updated = portal.withStatus(
        PortalStatus.MissingSurface,
        this.clock.getTick(),
      );
      const updateResult = this.store.updatePortal(updated);

      if (updateResult.isFailure) {
        return SDResult.fail(updateResult.error!);
      }

      this.index.addOrUpdate(updated);
      return SDResult.ok(updated);
    }

    if (portal.status !== PortalStatus.Active) {
      const updated = portal.withStatus(
        PortalStatus.Active,
        this.clock.getTick(),
      );
      const updateResult = this.store.updatePortal(updated);

      if (updateResult.isFailure) {
        return SDResult.fail(updateResult.error!);
      }

      this.index.addOrUpdate(updated);
      return SDResult.ok(updated);
    }

    return SDResult.ok(portal);
  }

  public findPortalAt(
    location: BlockLocationRef,
  ): SDResult<PortalRef | undefined> {
    const portalsResult = this.index.getIndexedPortals();

    if (portalsResult.isFailure) {
      return SDResult.fail(portalsResult.error!);
    }

    const portal = portalsResult
      .getValueOrThrow()
      .find((candidate) =>
        this.geometry.containsTriggerBlock(candidate, location),
      );

    return SDResult.ok(portal);
  }

  public findUsableDestinations(
    sourcePortal: PortalRef,
    mode: PortalConnectionMode = PortalConstants.defaultConnectionMode,
  ): SDResult<readonly PortalRef[]> {
    const options: PortalListOptions = {
      excludePortalId: sourcePortal.id,
      includeDisabled: false,
      color:
        mode === PortalConnectionMode.OwnerAndColor
          ? sourcePortal.color
          : undefined,
    };

    return this.getOwnerPortals(sourcePortal.owner.id, options);
  }
}

export interface PortalTeleportService {
  teleport(request: PortalTeleportRequest): SDResult<void>;
}

export class DefaultPortalTeleportService implements PortalTeleportService {
  public teleport(request: PortalTeleportRequest): SDResult<void> {
    if (request.destinationPortal.status !== PortalStatus.Active) {
      return SDResult.fail(
        new SDError(
          "portal.destination_inactive",
          "Destination portal is not active.",
          {
            portalId: request.destinationPortal.id,
            status: request.destinationPortal.status,
          },
        ),
      );
    }

    const dimensionResult =
      request.destinationPortal.exitLocation.getDimension();

    if (dimensionResult.isFailure) {
      return SDResult.fail(dimensionResult.error!);
    }

    try {
      request.player.teleport(
        request.destinationPortal.exitLocation.toVector3(),
        {
          dimension: dimensionResult.getValueOrThrow(),
        },
      );

      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("portal.teleport_failed", error, {
          playerId: request.player.id,
          sourcePortalId: request.sourcePortal.id,
          destinationPortalId: request.destinationPortal.id,
        }),
      );
    }
  }
}

export interface PortalSelectionUi {
  chooseDestination(
    player: Player,
    sourcePortal: PortalRef,
    destinations: readonly PortalRef[],
  ): Promise<SDResult<PortalRef | undefined>>;

  promptPortalName(
    player: Player,
    defaultName?: string,
  ): Promise<SDResult<string | undefined>>;
}

export class FormPortalSelectionUi implements PortalSelectionUi {
  public constructor(private readonly forms: FormService) {}

  public async chooseDestination(
    player: Player,
    sourcePortal: PortalRef,
    destinations: readonly PortalRef[],
  ): Promise<SDResult<PortalRef | undefined>> {
    const buttons: ActionFormButton<PortalRef>[] = destinations.map(
      (portal) => ({
        text: this.getPortalButtonText(portal),
        value: portal,
      }),
    );

    const selectionResult = await this.forms.showActionMenu<PortalRef>(player, {
      title: "Portal Network",
      body: `Choose a destination from ${sourcePortal.owner.lastKnownName ?? "this player's"} portal network.`,
      buttons,
    });

    if (selectionResult.isFailure) {
      return SDResult.fail(selectionResult.error!);
    }

    const selection = selectionResult.getValueOrDefault(undefined);

    return SDResult.ok(selection?.value);
  }

  public async promptPortalName(
    player: Player,
    defaultName?: string,
  ): Promise<SDResult<string | undefined>> {
    return this.forms.promptText(player, {
      title: "Name Portal",
      label: "Portal name",
      placeholder: "Home Base",
      defaultValue: defaultName,
      submitButtonText: "Save",
    });
  }

  private getPortalButtonText(portal: PortalRef): string {
    return `${portal.name} (${portal.color})`;
  }
}

export interface PortalCooldownService {
  canUse(player: Player): boolean;

  markUsed(player: Player): void;
}

export class TickPortalCooldownService implements PortalCooldownService {
  private readonly nextUseTickByPlayerId = new Map<string, number>();

  public constructor(
    private readonly clock: PortalClock,
    private readonly cooldownTicks: number = PortalConstants.defaultCooldownTicks,
  ) {}

  public canUse(player: Player): boolean {
    return (
      this.clock.getTick() >= (this.nextUseTickByPlayerId.get(player.id) ?? 0)
    );
  }

  public markUsed(player: Player): void {
    this.nextUseTickByPlayerId.set(
      player.id,
      this.clock.getTick() + this.cooldownTicks,
    );
  }
}

export interface PortalActivationService {
  activate(
    context: PortalActivationContext,
  ): Promise<SDResult<PortalActivationResponse>>;
}

export class DefaultPortalActivationService implements PortalActivationService {
  public constructor(
    private readonly registry: PortalRegistry,
    private readonly selectionUi: PortalSelectionUi,
    private readonly teleportService: PortalTeleportService,
    private readonly cooldowns: PortalCooldownService,
    private readonly connectionMode: PortalConnectionMode = PortalConstants.defaultConnectionMode,
  ) {}

  public async activate(
    context: PortalActivationContext,
  ): Promise<SDResult<PortalActivationResponse>> {
    if (!this.cooldowns.canUse(context.player)) {
      return SDResult.ok({
        result: PortalActivationResult.Cooldown,
      });
    }

    const sourcePortalResult = this.registry.findPortalAt(context.location);

    if (sourcePortalResult.isFailure) {
      return SDResult.fail(sourcePortalResult.error!);
    }

    const sourcePortal = sourcePortalResult.getValueOrThrow();

    if (
      sourcePortal === undefined ||
      sourcePortal.status !== PortalStatus.Active
    ) {
      return SDResult.ok({
        result: PortalActivationResult.NoSourcePortal,
      });
    }

    const refreshedSourceResult = this.registry.refreshPortal(sourcePortal);

    if (refreshedSourceResult.isFailure) {
      return SDResult.fail(refreshedSourceResult.error!);
    }

    const refreshedSource = refreshedSourceResult.getValueOrThrow();

    if (refreshedSource.status !== PortalStatus.Active) {
      return SDResult.ok({
        result: PortalActivationResult.NoSourcePortal,
        sourcePortal: refreshedSource,
      });
    }

    const destinationsResult = this.registry.findUsableDestinations(
      refreshedSource,
      this.connectionMode,
    );

    if (destinationsResult.isFailure) {
      return SDResult.fail(destinationsResult.error!);
    }

    const destinations = destinationsResult.getValueOrThrow();

    if (destinations.length === 0) {
      return SDResult.ok({
        result: PortalActivationResult.NoDestinationPortal,
        sourcePortal: refreshedSource,
      });
    }

    const destinationResult = await this.selectionUi.chooseDestination(
      context.player,
      refreshedSource,
      destinations,
    );

    if (destinationResult.isFailure) {
      return SDResult.fail(destinationResult.error!);
    }

    const destination = destinationResult.getValueOrDefault(undefined);

    if (destination === undefined) {
      return SDResult.ok({
        result: PortalActivationResult.Canceled,
        sourcePortal: refreshedSource,
        canceled: true,
      } as PortalActivationResponse);
    }

    const refreshedDestinationResult = this.registry.refreshPortal(destination);

    if (refreshedDestinationResult.isFailure) {
      return SDResult.fail(refreshedDestinationResult.error!);
    }

    const refreshedDestination = refreshedDestinationResult.getValueOrThrow();

    const teleportResult = this.teleportService.teleport({
      player: context.player,
      sourcePortal: refreshedSource,
      destinationPortal: refreshedDestination,
    });

    if (teleportResult.isFailure) {
      return SDResult.fail(teleportResult.error!);
    }

    this.cooldowns.markUsed(context.player);

    return SDResult.ok({
      result: PortalActivationResult.Used,
      sourcePortal: refreshedSource,
      destinationPortal: refreshedDestination,
    });
  }
}

export interface PortalRuntimeService {
  tick(): void;

  start(intervalTicks?: number): void;

  stop(): void;
}

export class PollingPortalRuntimeService implements PortalRuntimeService {
  private runId: number | undefined;

  public constructor(private readonly activation: PortalActivationService) {}

  public tick(): void {
    for (const player of world.getAllPlayers()) {
      const location = PortalLocationCodec.playerBlockLocation(player);

      this.activation.activate({
        player,
        location,
      });
    }
  }

  public start(intervalTicks: number = 5): void {
    if (this.runId !== undefined) {
      return;
    }

    this.runId = system.runInterval(() => this.tick(), intervalTicks);
  }

  public stop(): void {
    if (this.runId === undefined) {
      return;
    }

    system.clearRun(this.runId);
    this.runId = undefined;
  }
}

export interface PortalService {
  createPortal(request: PortalCreateRequest): SDResult<PortalCreateResult>;

  createPortalWithPrompt(
    owner: Player,
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): Promise<SDResult<PortalCreateResult | undefined>>;

  renamePortal(request: PortalRenameRequest): SDResult<PortalRef>;

  removePortal(request: PortalRemoveRequest): SDResult<void>;

  getPortal(ownerPlayerId: string, portalId: string): SDResult<PortalRef>;

  getPortals(
    ownerPlayerId: string,
    options?: PortalListOptions,
  ): SDResult<readonly PortalRef[]>;

  activateAtPlayerLocation(
    player: Player,
  ): Promise<SDResult<PortalActivationResponse>>;

  activateAt(
    context: PortalActivationContext,
  ): Promise<SDResult<PortalActivationResponse>>;

  startRuntime(intervalTicks?: number): void;

  stopRuntime(): void;
}

export class DefaultPortalService implements PortalService {
  public constructor(
    private readonly registry: PortalRegistry,
    private readonly selectionUi: PortalSelectionUi,
    private readonly activation: PortalActivationService,
    private readonly runtime: PortalRuntimeService,
  ) {}

  public createPortal(
    request: PortalCreateRequest,
  ): SDResult<PortalCreateResult> {
    return this.registry.create(request);
  }

  public async createPortalWithPrompt(
    owner: Player,
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): Promise<SDResult<PortalCreateResult | undefined>> {
    const nameResult = await this.selectionUi.promptPortalName(owner);

    if (nameResult.isFailure) {
      return SDResult.fail(nameResult.error!);
    }

    const name = nameResult.getValueOrDefault(undefined);

    if (name === undefined) {
      return SDResult.ok(undefined);
    }

    const createResult = this.registry.create({
      owner,
      name,
      anchor,
      facing,
    });

    if (createResult.isFailure) {
      return SDResult.fail(createResult.error!);
    }

    return SDResult.ok(createResult.getValueOrThrow());
  }

  public renamePortal(request: PortalRenameRequest): SDResult<PortalRef> {
    return this.registry.rename(request);
  }

  public removePortal(request: PortalRemoveRequest): SDResult<void> {
    return this.registry.remove(request);
  }

  public getPortal(
    ownerPlayerId: string,
    portalId: string,
  ): SDResult<PortalRef> {
    return this.registry.getPortal(ownerPlayerId, portalId);
  }

  public getPortals(
    ownerPlayerId: string,
    options?: PortalListOptions,
  ): SDResult<readonly PortalRef[]> {
    return this.registry.getOwnerPortals(ownerPlayerId, options);
  }

  public async activateAtPlayerLocation(
    player: Player,
  ): Promise<SDResult<PortalActivationResponse>> {
    return this.activateAt({
      player,
      location: PortalLocationCodec.playerBlockLocation(player),
    });
  }

  public async activateAt(
    context: PortalActivationContext,
  ): Promise<SDResult<PortalActivationResponse>> {
    return this.activation.activate(context);
  }

  public startRuntime(intervalTicks?: number): void {
    this.runtime.start(intervalTicks);
  }

  public stopRuntime(): void {
    this.runtime.stop();
  }
}

export interface PortalSystemOptions {
  readonly connectionMode?: PortalConnectionMode;
  readonly cooldownTicks?: number;
  readonly useRealSurfaceBlocks?: boolean;
  readonly portalSurfaceNamespace?: string;
}

export interface PortalSystemServices {
  readonly geometry: PortalGeometry;
  readonly scanner: PortalFrameScanner;
  readonly surfaceProjector: PortalSurfaceProjector;
  readonly idGenerator: PortalIdGenerator;
  readonly nameValidator: PortalNameValidator;
  readonly clock: PortalClock;
  readonly store: PortalStore;
  readonly index: PortalIndexStore;
  readonly registry: PortalRegistry;
  readonly selectionUi: PortalSelectionUi;
  readonly teleport: PortalTeleportService;
  readonly cooldowns: PortalCooldownService;
  readonly activation: PortalActivationService;
  readonly runtime: PortalRuntimeService;
  readonly portals: PortalService;
}

export class PortalSystem {
  public constructor(public readonly services: PortalSystemServices) {}

  public createPortal(
    request: PortalCreateRequest,
  ): SDResult<PortalCreateResult> {
    return this.services.portals.createPortal(request);
  }

  public createPortalWithPrompt(
    owner: Player,
    anchor: BlockLocationRef,
    facing: PortalFacing,
  ): Promise<SDResult<PortalCreateResult | undefined>> {
    return this.services.portals.createPortalWithPrompt(owner, anchor, facing);
  }

  public renamePortal(request: PortalRenameRequest): SDResult<PortalRef> {
    return this.services.portals.renamePortal(request);
  }

  public removePortal(request: PortalRemoveRequest): SDResult<void> {
    return this.services.portals.removePortal(request);
  }

  public getPortal(
    ownerPlayerId: string,
    portalId: string,
  ): SDResult<PortalRef> {
    return this.services.portals.getPortal(ownerPlayerId, portalId);
  }

  public getPortals(
    ownerPlayerId: string,
    options?: PortalListOptions,
  ): SDResult<readonly PortalRef[]> {
    return this.services.portals.getPortals(ownerPlayerId, options);
  }

  public activateAtPlayerLocation(
    player: Player,
  ): Promise<SDResult<PortalActivationResponse>> {
    return this.services.portals.activateAtPlayerLocation(player);
  }

  public activateAt(
    context: PortalActivationContext,
  ): Promise<SDResult<PortalActivationResponse>> {
    return this.services.portals.activateAt(context);
  }

  public startRuntime(intervalTicks?: number): void {
    this.services.portals.startRuntime(intervalTicks);
  }

  public stopRuntime(): void {
    this.services.portals.stopRuntime();
  }
}

export class PortalSystemFactory {
  public static create(
    jsonStore: JsonStore,
    keys: KeyBuilder,
    forms: FormService,
    options: PortalSystemOptions = {},
  ): PortalSystem {
    const geometry = new NetherStyleConcretePortalGeometry();

    const scanner = new ConcretePortalFrameScanner(geometry);

    const surfaceProjector =
      options.useRealSurfaceBlocks === true
        ? new BlockPortalSurfaceProjector(
            new ConcreteColorPortalSurfaceTypeResolver(
              options.portalSurfaceNamespace ?? "simplexidev",
            ),
          )
        : new NoOpPortalSurfaceProjector();

    const idGenerator = new DefaultPortalIdGenerator();
    const nameValidator = new DefaultPortalNameValidator();
    const clock = new MinecraftPortalClock();

    const store = new JsonPortalStore(
      jsonStore,
      keys.child(PortalConstants.moduleId),
    );
    const index = new JsonPortalIndexStore(
      jsonStore,
      keys.child(PortalConstants.moduleId),
    );

    const registry = new DefaultPortalRegistry(
      store,
      index,
      scanner,
      geometry,
      surfaceProjector,
      idGenerator,
      nameValidator,
      clock,
    );

    const selectionUi = new FormPortalSelectionUi(forms);
    const teleport = new DefaultPortalTeleportService();
    const cooldowns = new TickPortalCooldownService(
      clock,
      options.cooldownTicks ?? PortalConstants.defaultCooldownTicks,
    );

    const activation = new DefaultPortalActivationService(
      registry,
      selectionUi,
      teleport,
      cooldowns,
      options.connectionMode ?? PortalConstants.defaultConnectionMode,
    );

    const runtime = new PollingPortalRuntimeService(activation);

    const portals = new DefaultPortalService(
      registry,
      selectionUi,
      activation,
      runtime,
    );

    return new PortalSystem({
      geometry,
      scanner,
      surfaceProjector,
      idGenerator,
      nameValidator,
      clock,
      store,
      index,
      registry,
      selectionUi,
      teleport,
      cooldowns,
      activation,
      runtime,
      portals,
    });
  }
}