import { EntityDieAfterEvent, ItemStack, Player, system, world } from "@minecraft/server";

import { SDError, FormService, JsonStore, KeyBuilder, LocationRef, Logger, SDResult } from "../core";

import { AchievementGuidebookView, AchievementSystem } from "./Achievements";

import { QuestGuidebookView, QuestSystem } from "./Quests";

import { WorldEventGuidebookView, WorldEventSystem } from "./WorldEvents";

/* ============================================================
 * SimplexiDev's MAP - Guidebook API
 * ============================================================
 *
 * The Guidebook is the central player-facing UI item for:
 * - Achievements
 * - Daily/weekly quests
 * - World events
 * - Portal teleportation
 * - Respawn teleport
 * - Last death teleport
 * - In-game documentation
 * - Add-on settings
 * - Starter item recovery
 * - Developer tools
 */

/* ============================================================
 * Constants
 * ============================================================
 */

export const GuidebookConstants = Object.freeze({
  moduleId: "guidebook",
  displayName: "Guidebook",
  defaultItemTypeId: "simplexidev:guidebook",
  stateVersion: 1,
});

/* ============================================================
 * Shared Enums
 * ============================================================
 */

export enum GuidebookMenuId {
  Main = "main",
  Achievements = "achievements",
  Quests = "quests",
  WorldEvents = "world_events",
  Portals = "portals",
  Utilities = "utilities",
  Documentation = "documentation",
  Settings = "settings",
  GameplaySettings = "gameplay_settings",
  Recovery = "recovery",
  DeveloperTools = "developer_tools",
}

export enum GuidebookActionId {
  OpenAchievements = "open_achievements",
  OpenQuests = "open_quests",
  OpenWorldEvents = "open_world_events",
  OpenPortals = "open_portals",
  OpenUtilities = "open_utilities",
  OpenDocumentation = "open_documentation",
  OpenSettings = "open_settings",
  OpenGameplaySettings = "open_gameplay_settings",
  OpenRecovery = "open_recovery",
  OpenDeveloperTools = "open_developer_tools",

  TeleportToRespawn = "teleport_to_respawn",
  TeleportToLastDeath = "teleport_to_last_death",

  RecoverGuidebook = "recover_guidebook",

  Back = "back",
  Close = "close",
}

export enum GuidebookSettingValueType {
  Boolean = "boolean",
  Number = "number",
  String = "string",
  Choice = "choice",
}

export enum GuidebookSettingScope {
  Global = "global",
  Player = "player",
}

export enum GuidebookDeveloperToolKind {
  Action = "action",
  Toggle = "toggle",
  Page = "page",
}

/* ============================================================
 * Integration Interfaces
 * ============================================================
 */

export interface PortalGuidebookService {
  getPortalListView(player: Player): SDResult<PortalListGuidebookView>;
  teleportToPortal(player: Player, portalId: string): SDResult<void>;
}

export interface PortalListGuidebookView {
  readonly portals: readonly PortalGuidebookEntryView[];
}

export interface PortalGuidebookEntryView {
  readonly portalId: string;
  readonly name: string;
  readonly dimensionId: string;
  readonly statusText: string;
  readonly isAvailable: boolean;
}

export interface RespawnTeleportService {
  teleportToRespawn(player: Player): SDResult<void>;
}

export interface LastDeathService {
  recordDeath(player: Player, location: LocationRef): SDResult<void>;
  getLastDeathLocation(player: Player): SDResult<LocationRef | undefined>;
  teleportToLastDeath(player: Player): SDResult<void>;
}

export interface StarterItemRecoveryService {
  recoverGuidebook(player: Player): SDResult<StarterItemRecoveryResult>;
}

export interface StarterItemRecoveryResult {
  readonly recovered: boolean;
  readonly message: string;
}

export interface GuidebookDocumentationService {
  getRootPage(): SDResult<GuidebookDocumentationPage>;
  getPage(pageId: string): SDResult<GuidebookDocumentationPage>;
  getPages(): SDResult<readonly GuidebookDocumentationPage[]>;
}

export interface GuidebookSettingsService {
  registerSetting(setting: GuidebookSettingDefinition): SDResult<void>;
  registerSettings(settings: readonly GuidebookSettingDefinition[]): SDResult<void>;
  getSettings(player: Player): SDResult<readonly GuidebookSettingView[]>;
  setValue(player: Player, settingId: string, value: unknown): SDResult<void>;
  resetValue(player: Player, settingId: string): SDResult<void>;
}

export interface GuidebookDeveloperToolService {
  registerTool(tool: GuidebookDeveloperToolDefinition): SDResult<void>;
  registerTools(tools: readonly GuidebookDeveloperToolDefinition[]): SDResult<void>;
  getTools(player: Player): SDResult<readonly GuidebookDeveloperToolView[]>;
  execute(player: Player, toolId: string): SDResult<GuidebookDeveloperToolExecutionResult>;
}

/* ============================================================
 * Documentation Models
 * ============================================================
 */

export interface GuidebookDocumentationPage {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly category?: string;
  readonly displayOrder?: number;
  readonly childPageIds?: readonly string[];
}

/* ============================================================
 * Settings Models
 * ============================================================
 */

export interface GuidebookSettingDefinition {
  readonly id: string;
  readonly moduleId: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly valueType: GuidebookSettingValueType;
  readonly scope: GuidebookSettingScope;
  readonly defaultValue: unknown;
  readonly choices?: readonly GuidebookSettingChoice[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly displayOrder?: number;

  validate(value: unknown): SDResult<unknown>;
}

export interface GuidebookSettingChoice {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

export interface GuidebookSettingView {
  readonly id: string;
  readonly moduleId: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly valueType: GuidebookSettingValueType;
  readonly scope: GuidebookSettingScope;
  readonly value: unknown;
  readonly defaultValue: unknown;
  readonly choices?: readonly GuidebookSettingChoice[];
  readonly displayText: string;
}

/* ============================================================
 * Developer Tool Models
 * ============================================================
 */

export interface GuidebookDeveloperToolDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly kind: GuidebookDeveloperToolKind;
  readonly category?: string;
  readonly displayOrder?: number;

  execute(player: Player, context: GuidebookDeveloperToolContext): SDResult<GuidebookDeveloperToolExecutionResult>;
}

export interface GuidebookDeveloperToolContext {
  readonly guidebook: GuidebookSystem;
  readonly logger?: Logger;
}

export interface GuidebookDeveloperToolView {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly kind: GuidebookDeveloperToolKind;
  readonly category?: string;
}

export interface GuidebookDeveloperToolExecutionResult {
  readonly succeeded: boolean;
  readonly message: string;
  readonly details?: unknown;
}

/* ============================================================
 * Guidebook State Models
 * ============================================================
 */

export interface PlayerGuidebookState {
  readonly playerId: string;
  readonly lastOpenedAtTick?: number;
  readonly guidebookRecoveredCount: number;
  readonly lastGuidebookRecoveryAtTick?: number;
  readonly version: number;
}

export interface GuidebookOpenContext {
  readonly player: Player;
  readonly source: GuidebookOpenSource;
}

export enum GuidebookOpenSource {
  ItemUse = "item_use",
  Command = "command",
  DeveloperTool = "developer_tool",
  Script = "script",
}

/* ============================================================
 * Guidebook Stores
 * ============================================================
 */

export interface PlayerGuidebookStore {
  getState(playerId: string): SDResult<PlayerGuidebookState>;
  setState(state: PlayerGuidebookState): SDResult<void>;
}

export class JsonPlayerGuidebookStore implements PlayerGuidebookStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder
  ) {}

  public getState(playerId: string): SDResult<PlayerGuidebookState> {
    return this.jsonStore.getJson<PlayerGuidebookState>(this.keys.player(playerId, "guidebook", "state"), {
      playerId,
      guidebookRecoveredCount: 0,
      version: GuidebookConstants.stateVersion,
    });
  }

  public setState(state: PlayerGuidebookState): SDResult<void> {
    return this.jsonStore.setJson(this.keys.player(state.playerId, "guidebook", "state"), state);
  }
}

export interface LastDeathStore {
  getLastDeathLocation(playerId: string): SDResult<LocationRef | undefined>;
  setLastDeathLocation(playerId: string, location: LocationRef): SDResult<void>;
  clearLastDeathLocation(playerId: string): SDResult<void>;
}

export class JsonLastDeathStore implements LastDeathStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder
  ) {}

  public getLastDeathLocation(playerId: string): SDResult<LocationRef | undefined> {
    const result = this.jsonStore.getJson<ReturnType<LocationRef["toJson"]> | undefined>(
      this.keys.player(playerId, "guidebook", "last_death"),
      undefined
    );

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const value = result.value;

    return SDResult.ok(value === undefined ? undefined : LocationRef.fromJson(value));
  }

  public setLastDeathLocation(playerId: string, location: LocationRef): SDResult<void> {
    return this.jsonStore.setJson(this.keys.player(playerId, "guidebook", "last_death"), location.toJson());
  }

  public clearLastDeathLocation(playerId: string): SDResult<void> {
    return this.jsonStore.remove(this.keys.player(playerId, "guidebook", "last_death"));
  }
}

/* ============================================================
 * Last Death Service
 * ============================================================
 */

export class DefaultLastDeathService implements LastDeathService {
  public constructor(
    private readonly store: LastDeathStore,
    private readonly logger?: Logger
  ) {}

  public recordDeath(player: Player, location: LocationRef): SDResult<void> {
    const result = this.store.setLastDeathLocation(player.id, location);

    if (result.succeeded) {
      this.logger?.info("last_death", "Recorded player death location.", {
        playerId: player.id,
        dimensionId: location.dimensionId,
        x: location.x,
        y: location.y,
        z: location.z,
      });
    }

    return result;
  }

  public getLastDeathLocation(player: Player): SDResult<LocationRef | undefined> {
    return this.store.getLastDeathLocation(player.id);
  }

  public teleportToLastDeath(player: Player): SDResult<void> {
    const locationResult = this.getLastDeathLocation(player);

    if (locationResult.isFailure) {
      return SDResult.fail(locationResult.error!);
    }

    const location = locationResult.value;

    if (location === undefined) {
      return SDResult.fail(
        new SDError("guidebook.last_death_missing", "No last death location has been recorded.", {
          playerId: player.id,
        })
      );
    }

    const dimensionResult = location.getDimension();

    if (dimensionResult.isFailure) {
      return SDResult.fail(dimensionResult.error!);
    }

    try {
      player.teleport(location.toVector3(), {
        dimension: dimensionResult.getValueOrThrow(),
      });

      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("guidebook.teleport_last_death_failed", error, {
          playerId: player.id,
          location: location.toJson(),
        })
      );
    }
  }
}

/* ============================================================
 * Respawn Teleport Service
 * ============================================================
 */

export interface RespawnLocationProvider {
  getRespawnLocation(player: Player): SDResult<LocationRef | undefined>;
}

export class DefaultRespawnTeleportService implements RespawnTeleportService {
  public constructor(
    private readonly provider: RespawnLocationProvider,
    private readonly logger?: Logger
  ) {}

  public teleportToRespawn(player: Player): SDResult<void> {
    const locationResult = this.provider.getRespawnLocation(player);

    if (locationResult.isFailure) {
      return SDResult.fail(locationResult.error!);
    }

    const location = locationResult.value;

    if (location === undefined) {
      return SDResult.fail(
        new SDError("guidebook.respawn_location_missing", "No respawn location is available.", {
          playerId: player.id,
        })
      );
    }

    const dimensionResult = location.getDimension();

    if (dimensionResult.isFailure) {
      return SDResult.fail(dimensionResult.error!);
    }

    try {
      player.teleport(location.toVector3(), {
        dimension: dimensionResult.getValueOrThrow(),
      });

      this.logger?.info("respawn_teleport", "Teleported player to respawn.", {
        playerId: player.id,
      });

      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("guidebook.teleport_respawn_failed", error, {
          playerId: player.id,
          location: location.toJson(),
        })
      );
    }
  }
}

/* ============================================================
 * Starter Item Recovery
 * ============================================================
 */

export interface GuidebookItemOptions {
  readonly itemTypeId: string;
  readonly displayName?: string;
}

export class DefaultStarterItemRecoveryService implements StarterItemRecoveryService {
  public constructor(
    private readonly itemOptions: GuidebookItemOptions,
    private readonly logger?: Logger
  ) {}

  public recoverGuidebook(player: Player): SDResult<StarterItemRecoveryResult> {
    const inventory = player.getComponent("minecraft:inventory")?.container;

    if (inventory === undefined) {
      return SDResult.fail(
        new SDError("guidebook.inventory_missing", "Player inventory is unavailable.", {
          playerId: player.id,
        })
      );
    }

    if (this.hasGuidebook(player)) {
      return SDResult.ok({
        recovered: false,
        message: "You already have the Guidebook.",
      });
    }

    try {
      const item = new ItemStack(this.itemOptions.itemTypeId, 1);

      if (this.itemOptions.displayName !== undefined) {
        item.nameTag = this.itemOptions.displayName;
      }

      inventory.addItem(item);

      this.logger?.info("recovery", "Recovered Guidebook for player.", {
        playerId: player.id,
        itemTypeId: this.itemOptions.itemTypeId,
      });

      return SDResult.ok({
        recovered: true,
        message: "Guidebook recovered.",
      });
    } catch (error) {
      return SDResult.fail(
        SDError.exception("guidebook.recovery_failed", error, {
          playerId: player.id,
          itemTypeId: this.itemOptions.itemTypeId,
        })
      );
    }
  }

  private hasGuidebook(player: Player): boolean {
    const inventory = player.getComponent("minecraft:inventory")?.container;

    if (inventory === undefined) {
      return false;
    }

    for (let slot = 0; slot < inventory.size; slot++) {
      const item = inventory.getItem(slot);

      if (item?.typeId === this.itemOptions.itemTypeId) {
        return true;
      }
    }

    return false;
  }
}

/* ============================================================
 * Documentation Service
 * ============================================================
 */

export class DefaultGuidebookDocumentationService implements GuidebookDocumentationService {
  private readonly pages = new Map<string, GuidebookDocumentationPage>();

  public registerPage(page: GuidebookDocumentationPage): SDResult<void> {
    if (this.pages.has(page.id)) {
      return SDResult.fail(
        new SDError("guidebook.documentation.duplicate_page", "Documentation page already exists.", {
          pageId: page.id,
        })
      );
    }

    this.pages.set(page.id, page);
    return SDResult.ok(undefined);
  }

  public registerPages(pages: readonly GuidebookDocumentationPage[]): SDResult<void> {
    for (const page of pages) {
      const result = this.registerPage(page);

      if (result.isFailure) {
        return result;
      }
    }

    return SDResult.ok(undefined);
  }

  public getRootPage(): SDResult<GuidebookDocumentationPage> {
    return this.getPage("root");
  }

  public getPage(pageId: string): SDResult<GuidebookDocumentationPage> {
    const page = this.pages.get(pageId);

    if (page === undefined) {
      return SDResult.fail(
        new SDError("guidebook.documentation.page_not_found", "Documentation page not found.", {
          pageId,
        })
      );
    }

    return SDResult.ok(page);
  }

  public getPages(): SDResult<readonly GuidebookDocumentationPage[]> {
    return SDResult.ok([...this.pages.values()].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
  }
}

/* ============================================================
 * Settings Service
 * ============================================================
 */

export class DefaultGuidebookSettingsService implements GuidebookSettingsService {
  private readonly settings = new Map<string, GuidebookSettingDefinition>();

  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder
  ) {}

  public registerSetting(setting: GuidebookSettingDefinition): SDResult<void> {
    if (this.settings.has(setting.id)) {
      return SDResult.fail(
        new SDError("guidebook.settings.duplicate", "Setting already registered.", {
          settingId: setting.id,
        })
      );
    }

    this.settings.set(setting.id, setting);
    return SDResult.ok(undefined);
  }

  public registerSettings(settings: readonly GuidebookSettingDefinition[]): SDResult<void> {
    for (const setting of settings) {
      const result = this.registerSetting(setting);

      if (result.isFailure) {
        return result;
      }
    }

    return SDResult.ok(undefined);
  }

  public getSettings(player: Player): SDResult<readonly GuidebookSettingView[]> {
    const views: GuidebookSettingView[] = [];

    for (const setting of this.settings.values()) {
      const valueResult = this.getRawValue(player, setting);

      if (valueResult.isFailure) {
        return SDResult.fail(valueResult.error!);
      }

      const value = valueResult.value ?? setting.defaultValue;

      views.push({
        id: setting.id,
        moduleId: setting.moduleId,
        category: setting.category,
        title: setting.title,
        description: setting.description,
        valueType: setting.valueType,
        scope: setting.scope,
        value,
        defaultValue: setting.defaultValue,
        choices: setting.choices,
        displayText: this.formatSettingValue(setting, value),
      });
    }

    return SDResult.ok(
      views.sort((a, b) => {
        const left = this.settings.get(a.id)?.displayOrder ?? 0;
        const right = this.settings.get(b.id)?.displayOrder ?? 0;
        return left - right;
      })
    );
  }

  public setValue(player: Player, settingId: string, value: unknown): SDResult<void> {
    const setting = this.settings.get(settingId);

    if (setting === undefined) {
      return SDResult.fail(
        new SDError("guidebook.settings.not_found", "Setting not found.", {
          settingId,
        })
      );
    }

    const validationResult = setting.validate(value);

    if (validationResult.isFailure) {
      return SDResult.fail(validationResult.error!);
    }

    return this.jsonStore.setJson(this.getStorageKey(player, setting), validationResult.getValueOrThrow());
  }

  public resetValue(player: Player, settingId: string): SDResult<void> {
    const setting = this.settings.get(settingId);

    if (setting === undefined) {
      return SDResult.fail(
        new SDError("guidebook.settings.not_found", "Setting not found.", {
          settingId,
        })
      );
    }

    return this.jsonStore.remove(this.getStorageKey(player, setting));
  }

  private getRawValue(player: Player, setting: GuidebookSettingDefinition): SDResult<unknown> {
    return this.jsonStore.getJson<unknown>(this.getStorageKey(player, setting), setting.defaultValue);
  }

  private getStorageKey(player: Player, setting: GuidebookSettingDefinition): string {
    if (setting.scope === GuidebookSettingScope.Global) {
      return this.keys.world("guidebook", "settings", setting.moduleId, setting.id);
    }

    return this.keys.player(player.id, "guidebook", "settings", setting.moduleId, setting.id);
  }

  private formatSettingValue(setting: GuidebookSettingDefinition, value: unknown): string {
    if (setting.valueType === GuidebookSettingValueType.Boolean) {
      return Boolean(value) ? "Enabled" : "Disabled";
    }

    if (setting.valueType === GuidebookSettingValueType.Choice) {
      const choice = setting.choices?.find((candidate) => candidate.value === String(value));
      return choice?.label ?? String(value);
    }

    return String(value);
  }
}

/* ============================================================
 * Built-in Setting Definitions
 * ============================================================
 */

export class BooleanGuidebookSetting implements GuidebookSettingDefinition {
  public readonly valueType = GuidebookSettingValueType.Boolean;

  public constructor(
    public readonly id: string,
    public readonly moduleId: string,
    public readonly category: string,
    public readonly title: string,
    public readonly description: string,
    public readonly scope: GuidebookSettingScope,
    public readonly defaultValue: boolean,
    public readonly displayOrder?: number
  ) {}

  public validate(value: unknown): SDResult<unknown> {
    return SDResult.ok(Boolean(value));
  }
}

export class NumberGuidebookSetting implements GuidebookSettingDefinition {
  public readonly valueType = GuidebookSettingValueType.Number;

  public constructor(
    public readonly id: string,
    public readonly moduleId: string,
    public readonly category: string,
    public readonly title: string,
    public readonly description: string,
    public readonly scope: GuidebookSettingScope,
    public readonly defaultValue: number,
    public readonly minimum?: number,
    public readonly maximum?: number,
    public readonly displayOrder?: number
  ) {}

  public validate(value: unknown): SDResult<unknown> {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return SDResult.fail(
        new SDError("guidebook.settings.invalid_number", "Setting value must be a number.", {
          settingId: this.id,
          value,
        })
      );
    }

    if (this.minimum !== undefined && parsed < this.minimum) {
      return SDResult.fail(
        new SDError("guidebook.settings.number_too_small", "Setting value is too small.", {
          settingId: this.id,
          minimum: this.minimum,
          value: parsed,
        })
      );
    }

    if (this.maximum !== undefined && parsed > this.maximum) {
      return SDResult.fail(
        new SDError("guidebook.settings.number_too_large", "Setting value is too large.", {
          settingId: this.id,
          maximum: this.maximum,
          value: parsed,
        })
      );
    }

    return SDResult.ok(parsed);
  }
}

export class ChoiceGuidebookSetting implements GuidebookSettingDefinition {
  public readonly valueType = GuidebookSettingValueType.Choice;

  public constructor(
    public readonly id: string,
    public readonly moduleId: string,
    public readonly category: string,
    public readonly title: string,
    public readonly description: string,
    public readonly scope: GuidebookSettingScope,
    public readonly defaultValue: string,
    public readonly choices: readonly GuidebookSettingChoice[],
    public readonly displayOrder?: number
  ) {}

  public validate(value: unknown): SDResult<unknown> {
    const raw = String(value);

    if (!this.choices.some((choice) => choice.value === raw)) {
      return SDResult.fail(
        new SDError("guidebook.settings.invalid_choice", "Setting value is not a valid choice.", {
          settingId: this.id,
          value,
        })
      );
    }

    return SDResult.ok(raw);
  }
}

export class BuiltInGuidebookSettings {
  public static createDefaults(): readonly GuidebookSettingDefinition[] {
    return [
      new BooleanGuidebookSetting(
        "quests.enabled",
        "quests",
        "Quests",
        "Enable Quests",
        "Allows daily and weekly quests to be assigned and progressed.",
        GuidebookSettingScope.Global,
        true,
        10
      ),

      new BooleanGuidebookSetting(
        "quests.progress_messages",
        "quests",
        "Quests",
        "Quest Progress Messages",
        "Shows chat messages when quest progress changes.",
        GuidebookSettingScope.Player,
        true,
        20
      ),

      new BooleanGuidebookSetting(
        "world_events.enabled",
        "world_events",
        "World Events",
        "Enable World Events",
        "Allows random world events to spawn.",
        GuidebookSettingScope.Global,
        true,
        30
      ),

      new NumberGuidebookSetting(
        "world_events.player_cooldown_minutes",
        "world_events",
        "World Events",
        "World Event Cooldown",
        "Minimum minutes before a player can trigger another world event.",
        GuidebookSettingScope.Global,
        60,
        5,
        240,
        40
      ),

      new BooleanGuidebookSetting(
        "achievements.enabled",
        "achievements",
        "Achievements",
        "Enable Achievements",
        "Allows lifetime achievements to progress.",
        GuidebookSettingScope.Global,
        true,
        50
      ),

      new BooleanGuidebookSetting(
        "portals.enabled",
        "portals",
        "Portals",
        "Enable Portals",
        "Allows player-built portals to function.",
        GuidebookSettingScope.Global,
        true,
        60
      ),

      new NumberGuidebookSetting(
        "portals.max_per_player",
        "portals",
        "Portals",
        "Max Portals Per Player",
        "Maximum number of named portals each player can own.",
        GuidebookSettingScope.Global,
        25,
        1,
        250,
        70
      ),

      new BooleanGuidebookSetting(
        "teleport.respawn_enabled",
        "guidebook",
        "Teleportation",
        "Respawn Teleport",
        "Allows players to teleport to their respawn location from the Guidebook.",
        GuidebookSettingScope.Global,
        true,
        80
      ),

      new BooleanGuidebookSetting(
        "teleport.last_death_enabled",
        "guidebook",
        "Teleportation",
        "Last Death Teleport",
        "Allows players to teleport to their last recorded death location.",
        GuidebookSettingScope.Global,
        true,
        90
      ),

      new BooleanGuidebookSetting(
        "developer_tools.enabled",
        "guidebook",
        "Developer Tools",
        "Enable Developer Tools",
        "Shows developer tools in the Guidebook settings menu.",
        GuidebookSettingScope.Global,
        false,
        100
      ),
    ];
  }
}

/* ============================================================
 * Developer Tool Service
 * ============================================================
 */

export class DefaultGuidebookDeveloperToolService implements GuidebookDeveloperToolService {
  private readonly tools = new Map<string, GuidebookDeveloperToolDefinition>();

  public constructor(private readonly contextFactory: () => GuidebookDeveloperToolContext) {}

  public registerTool(tool: GuidebookDeveloperToolDefinition): SDResult<void> {
    if (this.tools.has(tool.id)) {
      return SDResult.fail(
        new SDError("guidebook.developer_tools.duplicate", "Developer tool already registered.", {
          toolId: tool.id,
        })
      );
    }

    this.tools.set(tool.id, tool);
    return SDResult.ok(undefined);
  }

  public registerTools(tools: readonly GuidebookDeveloperToolDefinition[]): SDResult<void> {
    for (const tool of tools) {
      const result = this.registerTool(tool);

      if (result.isFailure) {
        return result;
      }
    }

    return SDResult.ok(undefined);
  }

  public getTools(_player: Player): SDResult<readonly GuidebookDeveloperToolView[]> {
    return SDResult.ok(
      [...this.tools.values()]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((tool) => ({
          id: tool.id,
          title: tool.title,
          description: tool.description,
          kind: tool.kind,
          category: tool.category,
        }))
    );
  }

  public execute(player: Player, toolId: string): SDResult<GuidebookDeveloperToolExecutionResult> {
    const tool = this.tools.get(toolId);

    if (tool === undefined) {
      return SDResult.fail(
        new SDError("guidebook.developer_tools.not_found", "Developer tool not found.", {
          toolId,
        })
      );
    }

    return tool.execute(player, this.contextFactory());
  }
}

/* ============================================================
 * Built-in Developer Tools
 * ============================================================
 */

export class BuiltInGuidebookDeveloperTools {
  public static createDefaults(): readonly GuidebookDeveloperToolDefinition[] {
    return [
      {
        id: "quests.ensure_player_quests",
        title: "Ensure Player Quests",
        description: "Forces current daily and weekly quest assignment for this player.",
        kind: GuidebookDeveloperToolKind.Action,
        category: "Quests",
        displayOrder: 10,
        execute(player, context) {
          const result = context.guidebook.integrations.quests?.ensurePlayerQuests(player);

          if (result === undefined) {
            return SDResult.ok({
              succeeded: false,
              message: "Quest system is not registered.",
            });
          }

          if (result.isFailure) {
            return SDResult.fail(result.error!);
          }

          return SDResult.ok({
            succeeded: true,
            message: "Player quests ensured.",
          });
        },
      },

      {
        id: "guidebook.recover",
        title: "Recover Guidebook",
        description: "Gives this player the Guidebook item if missing.",
        kind: GuidebookDeveloperToolKind.Action,
        category: "Guidebook",
        displayOrder: 20,
        execute(player, context) {
          const result = context.guidebook.services.recovery.recoverGuidebook(player);

          if (result.isFailure) {
            return SDResult.fail(result.error!);
          }

          return SDResult.ok({
            succeeded: result.getValueOrThrow().recovered,
            message: result.getValueOrThrow().message,
          });
        },
      },

      {
        id: "guidebook.show_last_death",
        title: "Show Last Death",
        description: "Displays whether a last death location is stored.",
        kind: GuidebookDeveloperToolKind.Action,
        category: "Guidebook",
        displayOrder: 30,
        execute(player, context) {
          const result = context.guidebook.services.lastDeath.getLastDeathLocation(player);

          if (result.isFailure) {
            return SDResult.fail(result.error!);
          }

          const location = result.value;

          if (location === undefined) {
            return SDResult.ok({
              succeeded: true,
              message: "No last death location is stored.",
            });
          }

          return SDResult.ok({
            succeeded: true,
            message: `Last death: ${location.dimensionId} ${Math.floor(location.x)}, ${Math.floor(location.y)}, ${Math.floor(location.z)}`,
          });
        },
      },
    ];
  }
}

/* ============================================================
 * Guidebook Integrations
 * ============================================================
 */

export interface GuidebookIntegrations {
  readonly achievements?: AchievementSystem;
  readonly quests?: QuestSystem;
  readonly worldEvents?: WorldEventSystem;
  readonly portals?: PortalGuidebookService;
}

/* ============================================================
 * Guidebook Services Container
 * ============================================================
 */

export interface GuidebookServices {
  readonly store: PlayerGuidebookStore;
  readonly documentation: GuidebookDocumentationService;
  readonly settings: GuidebookSettingsService;
  readonly developerTools: GuidebookDeveloperToolService;
  readonly recovery: StarterItemRecoveryService;
  readonly respawnTeleport: RespawnTeleportService;
  readonly lastDeath: LastDeathService;
}

/* ============================================================
 * Guidebook System
 * ============================================================
 */

export interface GuidebookSystemOptions {
  readonly itemTypeId: string;
  readonly itemDisplayName?: string;
  readonly enableDeveloperToolsByDefault?: boolean;
}

export class GuidebookSystem {
  public constructor(
    public readonly services: GuidebookServices,
    public readonly integrations: GuidebookIntegrations,
    private readonly forms: FormService,
    private readonly logger?: Logger
  ) {}

  public async open(context: GuidebookOpenContext): Promise<SDResult<void>> {
    const stateResult = this.services.store.getState(context.player.id);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    const saveResult = this.services.store.setState({
      ...state,
      lastOpenedAtTick: Number(world.getAbsoluteTime?.() ?? 0),
    });

    if (saveResult.isFailure) {
      return SDResult.fail(saveResult.error!);
    }

    this.logger?.info("guidebook", "Opening Guidebook.", {
      playerId: context.player.id,
      source: context.source,
    });

    return this.openMainMenu(context.player);
  }

  public async openMainMenu(player: Player): Promise<SDResult<void>> {
    const result = await this.forms.showActionMenu(player, {
      title: "SimplexiDev's MAP",
      body: "Guidebook",
      buttons: [
        {
          text: "Achievements",
          value: GuidebookActionId.OpenAchievements,
        },
        {
          text: "Quests",
          value: GuidebookActionId.OpenQuests,
        },
        {
          text: "World Events",
          value: GuidebookActionId.OpenWorldEvents,
        },
        {
          text: "Portals",
          value: GuidebookActionId.OpenPortals,
        },
        {
          text: "Utilities",
          value: GuidebookActionId.OpenUtilities,
        },
        {
          text: "Documentation",
          value: GuidebookActionId.OpenDocumentation,
        },
        {
          text: "Settings",
          value: GuidebookActionId.OpenSettings,
        },
      ],
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const selection = result.value;

    if (selection === undefined) {
      return SDResult.ok(undefined);
    }

    return this.handleMainMenuAction(player, selection.value);
  }

  public async openAchievements(player: Player): Promise<SDResult<void>> {
    const system = this.integrations.achievements;

    if (system === undefined) {
      return this.showMessage(player, "Achievements", "Achievements are not available.");
    }

    const viewResult = system.getGuidebookView(player);

    if (viewResult.isFailure) {
      return SDResult.fail(viewResult.error!);
    }

    return this.openAchievementsView(player, viewResult.getValueOrThrow());
  }

  public async openQuests(player: Player): Promise<SDResult<void>> {
    const system = this.integrations.quests;

    if (system === undefined) {
      return this.showMessage(player, "Quests", "Quests are not available.");
    }

    const viewResult = system.getGuidebookView(player);

    if (viewResult.isFailure) {
      return SDResult.fail(viewResult.error!);
    }

    return this.openQuestView(player, viewResult.getValueOrThrow());
  }

  public async openWorldEvents(player: Player): Promise<SDResult<void>> {
    const system = this.integrations.worldEvents;

    if (system === undefined) {
      return this.showMessage(player, "World Events", "World events are not available.");
    }

    const viewResult = system.getGuidebookView(player);

    if (viewResult.isFailure) {
      return SDResult.fail(viewResult.error!);
    }

    return this.openWorldEventView(player, viewResult.getValueOrThrow());
  }

  public async openPortals(player: Player): Promise<SDResult<void>> {
    const portals = this.integrations.portals;

    if (portals === undefined) {
      return this.showMessage(player, "Portals", "Portals are not available.");
    }

    const viewResult = portals.getPortalListView(player);

    if (viewResult.isFailure) {
      return SDResult.fail(viewResult.error!);
    }

    const view = viewResult.getValueOrThrow();

    const result = await this.forms.showActionMenu(player, {
      title: "Portals",
      body: "Select a portal to teleport.",
      buttons: [
        ...view.portals.map((portal) => ({
          text: `${portal.name}\n${portal.statusText}`,
          value: portal.portalId,
        })),
        {
          text: "Back",
          value: GuidebookActionId.Back,
        },
      ],
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const selection = result.value;

    if (selection === undefined || selection.value === GuidebookActionId.Back) {
      return this.openMainMenu(player);
    }

    return portals.teleportToPortal(player, selection.value);
  }

  public async openUtilities(player: Player): Promise<SDResult<void>> {
    const result = await this.forms.showActionMenu(player, {
      title: "Utilities",
      body: "Useful player tools.",
      buttons: [
        {
          text: "Teleport to Respawn",
          value: GuidebookActionId.TeleportToRespawn,
        },
        {
          text: "Teleport to Last Death",
          value: GuidebookActionId.TeleportToLastDeath,
        },
        {
          text: "Back",
          value: GuidebookActionId.Back,
        },
      ],
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const selection = result.value;

    if (selection === undefined || selection.value === GuidebookActionId.Back) {
      return this.openMainMenu(player);
    }

    switch (selection.value) {
      case GuidebookActionId.TeleportToRespawn:
        return this.services.respawnTeleport.teleportToRespawn(player);

      case GuidebookActionId.TeleportToLastDeath:
        return this.services.lastDeath.teleportToLastDeath(player);

      default:
        return SDResult.ok(undefined);
    }
  }

  public async openDocumentation(player: Player): Promise<SDResult<void>> {
    const pagesResult = this.services.documentation.getPages();

    if (pagesResult.isFailure) {
      return SDResult.fail(pagesResult.error!);
    }

    const pages = pagesResult.getValueOrThrow();

    const result = await this.forms.showActionMenu(player, {
      title: "Documentation",
      body: "Select a topic.",
      buttons: [
        ...pages.map((page) => ({
          text: page.title,
          value: page.id,
        })),
        {
          text: "Back",
          value: GuidebookActionId.Back,
        },
      ],
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const selection = result.value;

    if (selection === undefined || selection.value === GuidebookActionId.Back) {
      return this.openMainMenu(player);
    }

    const pageResult = this.services.documentation.getPage(selection.value);

    if (pageResult.isFailure) {
      return SDResult.fail(pageResult.error!);
    }

    const page = pageResult.getValueOrThrow();

    return this.showMessage(player, page.title, page.body);
  }

  public async openSettings(player: Player): Promise<SDResult<void>> {
    const result = await this.forms.showActionMenu(player, {
      title: "Settings",
      body: "Configure SimplexiDev's MAP.",
      buttons: [
        {
          text: "Gameplay Settings",
          value: GuidebookActionId.OpenGameplaySettings,
        },
        {
          text: "Recover Starter Items",
          value: GuidebookActionId.OpenRecovery,
        },
        {
          text: "Developer Tools",
          value: GuidebookActionId.OpenDeveloperTools,
        },
        {
          text: "Back",
          value: GuidebookActionId.Back,
        },
      ],
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const selection = result.value;

    if (selection === undefined || selection.value === GuidebookActionId.Back) {
      return this.openMainMenu(player);
    }

    switch (selection.value) {
      case GuidebookActionId.OpenGameplaySettings:
        return this.openGameplaySettings(player);

      case GuidebookActionId.OpenRecovery:
        return this.openRecovery(player);

      case GuidebookActionId.OpenDeveloperTools:
        return this.openDeveloperTools(player);

      default:
        return SDResult.ok(undefined);
    }
  }

  public async openGameplaySettings(player: Player): Promise<SDResult<void>> {
    const settingsResult = this.services.settings.getSettings(player);

    if (settingsResult.isFailure) {
      return SDResult.fail(settingsResult.error!);
    }

    const settings = settingsResult.getValueOrThrow();

    const result = await this.forms.showActionMenu(player, {
      title: "Gameplay Settings",
      body: "Select a setting.",
      buttons: [
        ...settings.map((setting) => ({
          text: `${setting.title}\n${setting.displayText}`,
          value: setting.id,
        })),
        {
          text: "Back",
          value: GuidebookActionId.Back,
        },
      ],
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const selection = result.value;

    if (selection === undefined || selection.value === GuidebookActionId.Back) {
      return this.openSettings(player);
    }

    return this.openSettingEditor(player, selection.value);
  }

  public async openRecovery(player: Player): Promise<SDResult<void>> {
    const result = await this.forms.showActionMenu(player, {
      title: "Recover Starter Items",
      body: "Recover starter items that cannot be crafted.",
      buttons: [
        {
          text: "Recover Guidebook",
          value: GuidebookActionId.RecoverGuidebook,
        },
        {
          text: "Back",
          value: GuidebookActionId.Back,
        },
      ],
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const selection = result.value;

    if (selection === undefined || selection.value === GuidebookActionId.Back) {
      return this.openSettings(player);
    }

    const recoveryResult = this.services.recovery.recoverGuidebook(player);

    if (recoveryResult.isFailure) {
      return SDResult.fail(recoveryResult.error!);
    }

    const recovery = recoveryResult.getValueOrThrow();

    return this.showMessage(player, "Recovery", recovery.message);
  }

  public async openDeveloperTools(player: Player): Promise<SDResult<void>> {
    const toolsResult = this.services.developerTools.getTools(player);

    if (toolsResult.isFailure) {
      return SDResult.fail(toolsResult.error!);
    }

    const tools = toolsResult.getValueOrThrow();

    const result = await this.forms.showActionMenu(player, {
      title: "Developer Tools",
      body: "Testing and diagnostics tools.",
      buttons: [
        ...tools.map((tool) => ({
          text: `${tool.title}\n${tool.description}`,
          value: tool.id,
        })),
        {
          text: "Back",
          value: GuidebookActionId.Back,
        },
      ],
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    const selection = result.value;

    if (selection === undefined || selection.value === GuidebookActionId.Back) {
      return this.openSettings(player);
    }

    const executeResult = this.services.developerTools.execute(player, selection.value);

    if (executeResult.isFailure) {
      return SDResult.fail(executeResult.error!);
    }

    const execution = executeResult.getValueOrThrow();

    return this.showMessage(
      player,
      execution.succeeded ? "Developer Tool" : "Developer Tool Failed",
      execution.message
    );
  }

  private async handleMainMenuAction(player: Player, actionId: GuidebookActionId | string): Promise<SDResult<void>> {
    switch (actionId) {
      case GuidebookActionId.OpenAchievements:
        return this.openAchievements(player);

      case GuidebookActionId.OpenQuests:
        return this.openQuests(player);

      case GuidebookActionId.OpenWorldEvents:
        return this.openWorldEvents(player);

      case GuidebookActionId.OpenPortals:
        return this.openPortals(player);

      case GuidebookActionId.OpenUtilities:
        return this.openUtilities(player);

      case GuidebookActionId.OpenDocumentation:
        return this.openDocumentation(player);

      case GuidebookActionId.OpenSettings:
        return this.openSettings(player);

      default:
        return SDResult.ok(undefined);
    }
  }

  private async openAchievementsView(player: Player, view: AchievementGuidebookView): Promise<SDResult<void>> {
    const body = [
      `Completed: ${view.completedAchievements}/${view.totalAchievements}`,
      `Milestones: ${view.completedMilestones}/${view.totalMilestones}`,
      "",
      ...view.categories.map(
        (category) => `${category.title}: ${category.completedAchievements}/${category.totalAchievements}`
      ),
    ].join("\n");

    return this.showMessage(player, "Achievements", body);
  }

  private async openQuestView(player: Player, view: QuestGuidebookView): Promise<SDResult<void>> {
    const body = [
      "Daily Quests",
      ...view.daily.quests.map((quest) => `- ${quest.title}: ${quest.status}`),
      "",
      "Weekly Quests",
      ...view.weekly.quests.map((quest) => `- ${quest.title}: ${quest.status}`),
      "",
      `Pending Rewards: ${view.pendingRewards.length}`,
    ].join("\n");

    return this.showMessage(player, "Quests", body);
  }

  private async openWorldEventView(player: Player, view: WorldEventGuidebookView): Promise<SDResult<void>> {
    const body = [
      "Active World Events",
      ...view.activeEvents.map((event) => `- ${event.title}: ${event.timeRemainingText}`),
      "",
      "Recent World Events",
      ...view.recentEvents.slice(0, 5).map((event) => `- ${event.title}: ${event.resultText}`),
      "",
      `Pending Rewards: ${view.pendingRewards.length}`,
    ].join("\n");

    return this.showMessage(player, "World Events", body);
  }

  private async openSettingEditor(player: Player, settingId: string): Promise<SDResult<void>> {
    const settingsResult = this.services.settings.getSettings(player);

    if (settingsResult.isFailure) {
      return SDResult.fail(settingsResult.error!);
    }

    const setting = settingsResult.getValueOrThrow().find((candidate) => candidate.id === settingId);

    if (setting === undefined) {
      return SDResult.fail(
        new SDError("guidebook.settings.view_not_found", "Setting view not found.", {
          settingId,
        })
      );
    }

    if (setting.valueType === GuidebookSettingValueType.Boolean) {
      const nextValue = !Boolean(setting.value);
      const setResult = this.services.settings.setValue(player, setting.id, nextValue);

      if (setResult.isFailure) {
        return SDResult.fail(setResult.error!);
      }

      return this.openGameplaySettings(player);
    }

    if (setting.valueType === GuidebookSettingValueType.Choice && setting.choices !== undefined) {
      const result = await this.forms.showActionMenu(player, {
        title: setting.title,
        body: setting.description,
        buttons: [
          ...setting.choices.map((choice) => ({
            text: choice.label,
            value: choice.value,
          })),
          {
            text: "Back",
            value: GuidebookActionId.Back,
          },
        ],
      });

      if (result.isFailure) {
        return SDResult.fail(result.error!);
      }

      const selection = result.value;

      if (selection === undefined || selection.value === GuidebookActionId.Back) {
        return this.openGameplaySettings(player);
      }

      const setResult = this.services.settings.setValue(player, setting.id, selection.value);

      if (setResult.isFailure) {
        return SDResult.fail(setResult.error!);
      }

      return this.openGameplaySettings(player);
    }

    return this.showMessage(player, setting.title, `${setting.description}\n\nCurrent Value: ${setting.displayText}`);
  }

  private async showMessage(player: Player, title: string, body: string): Promise<SDResult<void>> {
    const result = await this.forms.confirm(player, {
      title,
      body,
      yesText: "Back",
      noText: "Close",
    });

    if (result.isFailure) {
      return SDResult.fail(result.error!);
    }

    if (result.value === true) {
      return this.openMainMenu(player);
    }

    return SDResult.ok(undefined);
  }
}

/* ============================================================
 * Guidebook Item Listener
 * ============================================================
 */

export interface GuidebookItemUseService {
  initialize(): SDResult<void>;
}

export class DefaultGuidebookItemUseService implements GuidebookItemUseService {
  private initialized = false;

  public constructor(
    private readonly guidebook: GuidebookSystem,
    private readonly itemTypeId: string,
    private readonly logger?: Logger
  ) {}

  public initialize(): SDResult<void> {
    if (this.initialized) {
      return SDResult.ok(undefined);
    }

    world.afterEvents.itemUse.subscribe((event) => {
      if (event.itemStack.typeId !== this.itemTypeId) {
        return;
      }

      system.run(() => {
        this.guidebook
          .open({
            player: event.source,
            source: GuidebookOpenSource.ItemUse,
          })
          .then((result) => {
            if (result.isFailure) {
              this.logger?.error("guidebook", "Failed to open Guidebook from item use.", {
                playerId: event.source.id,
                error: result.error,
              });
            }
          });
      });
    });

    this.initialized = true;

    return SDResult.ok(undefined);
  }
}

/* ============================================================
 * Death Listener
 * ============================================================
 */

export interface GuidebookDeathTrackingService {
  initialize(): SDResult<void>;
}

export class DefaultGuidebookDeathTrackingService implements GuidebookDeathTrackingService {
  private initialized = false;

  public constructor(
    private readonly lastDeath: LastDeathService,
    private readonly logger?: Logger
  ) {}

  public initialize(): SDResult<void> {
    if (this.initialized) {
      return SDResult.ok(undefined);
    }

    world.afterEvents.entityDie.subscribe((event) => {
      this.handleEntityDie(event);
    });

    this.initialized = true;

    return SDResult.ok(undefined);
  }

  private handleEntityDie(event: EntityDieAfterEvent): void {
    if (event.deadEntity.typeId !== "minecraft:player") {
      return;
    }

    const player = event.deadEntity as Player;

    const location = new LocationRef(player.dimension.id, player.location.x, player.location.y, player.location.z);

    const result = this.lastDeath.recordDeath(player, location);

    if (result.isFailure) {
      this.logger?.warn("last_death", "Failed to record death location.", {
        playerId: player.id,
        error: result.error,
      });
    }
  }
}

/* ============================================================
 * Factory
 * ============================================================
 */

export interface GuidebookSystemFactoryOptions {
  readonly itemTypeId?: string;
  readonly itemDisplayName?: string;
}

export interface GuidebookSystemFactoryDependencies {
  readonly jsonStore: JsonStore;
  readonly keys: KeyBuilder;
  readonly forms: FormService;
  readonly logger?: Logger;

  readonly achievements?: AchievementSystem;
  readonly quests?: QuestSystem;
  readonly worldEvents?: WorldEventSystem;
  readonly portals?: PortalGuidebookService;

  readonly respawnLocationProvider: RespawnLocationProvider;
}

export interface GuidebookSystemFactoryResult {
  readonly guidebook: GuidebookSystem;
  readonly itemUse: GuidebookItemUseService;
  readonly deathTracking: GuidebookDeathTrackingService;
}

export class GuidebookSystemFactory {
  public static create(
    dependencies: GuidebookSystemFactoryDependencies,
    options: GuidebookSystemFactoryOptions = {}
  ): GuidebookSystemFactoryResult {
    const itemTypeId = options.itemTypeId ?? GuidebookConstants.defaultItemTypeId;

    const store = new JsonPlayerGuidebookStore(dependencies.jsonStore, dependencies.keys);

    const documentation = new DefaultGuidebookDocumentationService();

    const settings = new DefaultGuidebookSettingsService(dependencies.jsonStore, dependencies.keys);

    settings.registerSettings(BuiltInGuidebookSettings.createDefaults());

    const lastDeathStore = new JsonLastDeathStore(dependencies.jsonStore, dependencies.keys);

    const lastDeath = new DefaultLastDeathService(lastDeathStore, dependencies.logger);

    const respawnTeleport = new DefaultRespawnTeleportService(
      dependencies.respawnLocationProvider,
      dependencies.logger
    );

    const recovery = new DefaultStarterItemRecoveryService(
      {
        itemTypeId,
        displayName: options.itemDisplayName ?? GuidebookConstants.displayName,
      },
      dependencies.logger
    );

    let guidebookRef: GuidebookSystem | undefined;

    const developerTools = new DefaultGuidebookDeveloperToolService(() => {
      if (guidebookRef === undefined) {
        throw new Error("Guidebook system has not been assigned yet.");
      }

      return {
        guidebook: guidebookRef,
        logger: dependencies.logger,
      };
    });

    const services: GuidebookServices = {
      store,
      documentation,
      settings,
      developerTools,
      recovery,
      respawnTeleport,
      lastDeath,
    };

    const integrations: GuidebookIntegrations = {
      achievements: dependencies.achievements,
      quests: dependencies.quests,
      worldEvents: dependencies.worldEvents,
      portals: dependencies.portals,
    };

    const guidebook = new GuidebookSystem(services, integrations, dependencies.forms, dependencies.logger);

    guidebookRef = guidebook;

    developerTools.registerTools(BuiltInGuidebookDeveloperTools.createDefaults());

    const itemUse = new DefaultGuidebookItemUseService(guidebook, itemTypeId, dependencies.logger);

    const deathTracking = new DefaultGuidebookDeathTrackingService(lastDeath, dependencies.logger);

    return {
      guidebook,
      itemUse,
      deathTracking,
    };
  }
}
