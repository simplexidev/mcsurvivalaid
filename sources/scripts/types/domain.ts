export enum ClassId {
  Adventurer = "adventurer",
  Warrior = "warrior",
  Miner = "miner",
  Mage = "mage"
}

export enum StorageKey {
  PlayerStatePrefix = "survival_aid:survival_aid:player:",
  WorldState = "survival_aid:survival_aid:world"
}

export interface RewardDefinition {
  itemId: string;
  amount: number;
}

export interface ClassTrackState {
  currentClass: ClassId | null;
  completedClasses: ClassId[];
  classTrackStartDay: number;
  lastDeathDay: number;
  claimedClassRewardDays: number[];
  pendingClassRewardDays: number[];
  partialClassRewards: Record<string, RewardDefinition[]>;
  nextClassChangePromptDay: number;
  tier5ClaimedCurrent: boolean;
}

export interface PlayerSettingsState {
  showHud: boolean;
  showDaysSurvived: boolean;
  showDaysUntilReward: boolean;
  showRewardReady: boolean;
  chestChangesTexture: boolean;
  allowTeleportToDeath: boolean;
  allowTeleportToRespawn: boolean;
  teleportCooldownSeconds: number;
}

export interface PlayerState {
  stateVersion: number;
  hasSeenInitialPrompt: boolean;
  enabled: boolean;
  classTrack: ClassTrackState;
  deaths: { lastDeathLocation: any; respawnLocation: any };
  chest: { placed: boolean; location: any };
  requests: { active: Array<{ claimed: boolean; readyAtTick: number; notifiedReady?: boolean; quantity: number; itemId: string; requestedAtTick?: number; etaTicks?: number }> };
  quests: {
    travel: Record<string, any>;
    blocksBroken: Record<string, any>;
    blocksPlaced: Record<string, any>;
    combat: Record<string, any>;
    claimedQuestRewards: string[];
    pendingQuestRewards: Array<{ token: string; rewards: RewardDefinition[] }>;
  };
  cooldowns: { respawnTeleportReadyTick: number; deathTeleportReadyTick: number };
  settings: PlayerSettingsState;
}

export type RewardGrantResult =
  | { ok: true; remaining: [] }
  | { ok: false; remaining: RewardDefinition[] };
