import type { Dimension, Player } from "@minecraft/server";

export enum ClassId {
  Adventurer = "adventurer",
  Warrior = "warrior",
  Miner = "miner",
  Mage = "mage",
}

export enum MinecraftComponentId {
  Riding = "minecraft:riding",
  Inventory = "minecraft:inventory",
}

export enum StorageKey {
  PlayerStatePrefix = "survival_aid:survival_aid:player:",
  WorldState = "survival_aid:survival_aid:world",
}

export type CooldownKey = "respawnTeleportReadyTick" | "deathTeleportReadyTick";
export type QuestCategory = "travel" | "blocksBroken" | "blocksPlaced" | "combat";
export type TravelMetricKey =
  | "horizontal_distance"
  | "swim_distance"
  | "jump_count"
  | "fall_distance"
  | "boat_distance"
  | "glide_distance";
export type BlockMetricKey = "ground" | "ore" | "fauna" | "decorative";
export type CombatMetricKey =
  | "hostile_mobs_killed"
  | "non_hostile_mobs_killed"
  | "damage_taken"
  | "damage_dealt"
  | "gear_crafted"
  | "gear_smelted"
  | "gear_broken";

export interface RewardDefinition {
  itemId: string;
  amount: number;
}
export interface PendingQuestReward {
  token: string;
  rewards: RewardDefinition[];
}

export interface ItemRequest {
  claimed: boolean;
  itemId: string;
  quantity: number;
  readyAtTick: number;
  requestedAtTick?: number;
  notifiedReady?: boolean;
  etaTicks?: number;
}
export interface SavedTeleportPoint {
  dimension: string | Dimension;
  x: number;
  y: number;
  z: number;
  tick?: number;
  day?: number;
}

export interface ActionFormResult {
  canceled: boolean;
  selection?: number;
  formValues?: (boolean | number | string)[];
}
export interface ModalFormResult {
  canceled: boolean;
  formValues?: (boolean | number | string)[];
  selection?: number;
}
export interface SafeFormError {
  error?: string;
}

export interface QuestProgressMap {
  travel: Partial<Record<TravelMetricKey, number>>;
  blocksBroken: Partial<Record<BlockMetricKey, number>>;
  blocksPlaced: Partial<Record<BlockMetricKey, number>>;
  combat: Partial<Record<CombatMetricKey, number>>;
}

export interface PlayerState {
  stateVersion: number;
  hasSeenInitialPrompt: boolean;
  enabled: boolean;
  classTrack: {
    currentClass: ClassId | null;
    completedClasses: ClassId[];
    classTrackStartDay: number;
    lastDeathDay: number;
    claimedClassRewardDays: number[];
    pendingClassRewardDays: number[];
    partialClassRewards: Record<string, RewardDefinition[]>;
    nextClassChangePromptDay: number;
    tier5ClaimedCurrent: boolean;
  };
  deaths: { lastDeathLocation: SavedTeleportPoint | null; respawnLocation: SavedTeleportPoint | null };
  chest: {
    placed: boolean;
    location: { dimension: string; x: number; y: number; z: number; ownerId?: string; ownerToken?: string } | null;
  };
  requests: { active: ItemRequest[] };
  quests: QuestProgressMap & { claimedQuestRewards: string[]; pendingQuestRewards: PendingQuestReward[] };
  cooldowns: Record<CooldownKey, number>;
  settings: {
    showHud: boolean;
    showDaysSurvived: boolean;
    showDaysUntilReward: boolean;
    showRewardReady: boolean;
    chestChangesTexture: boolean;
    allowTeleportToDeath: boolean;
    allowTeleportToRespawn: boolean;
    teleportCooldownSeconds: number;
  };
}

export type TeleportResult = { ok: true } | { ok: false; reason: string };
export type RewardGrantResult = { ok: true; remaining: [] } | { ok: false; remaining: RewardDefinition[] };
export type PlayerUpdater = (state: PlayerState) => PlayerState | undefined;
export type PlayerRef = Pick<Player, "id" | "sendMessage">;

export type QuestMetricKey<C extends QuestCategory> = C extends "travel"
  ? TravelMetricKey
  : C extends "combat"
    ? CombatMetricKey
    : BlockMetricKey;
