
export const AchievementConstants = Object.freeze({
  version: 1,
  ticksPerSecond: 20,
});

export enum AchievementStatus {
  Available = "available",
  InProgress = "in_progress",
  Completed = "completed",
  RewardPending = "reward_pending",
  RewardClaimed = "reward_claimed",
}

export enum AchievementRewardMode {
  PerMilestone = "per_milestone",

  FinalOnly = "final_only",

  None = "none",
}

export enum AchievementVisibility {
  Visible = "visible",

  ProgressivelyRevealed = "progressively_revealed",
}

export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;

  readonly category: string;
  readonly tags: readonly string[];

  readonly visibility: AchievementVisibility;

  readonly milestones: readonly AchievementMilestoneDefinition[];

  readonly requirements?: readonly AchievementRequirementDefinition[];

  readonly rewardMode: AchievementRewardMode;

  readonly displayOrder?: number;
}

export interface AchievementMilestoneDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;

  readonly task: QuestTaskDefinition;

  readonly rewards?: readonly QuestRewardDefinition[];

  readonly displayOrder?: number;
}

export interface AchievementRequirementDefinition {
  readonly type: string;
  readonly payload?: unknown;
}

export interface AchievementProgress {
  readonly achievementId: string;
  readonly status: AchievementStatus;

  readonly milestoneProgress: readonly AchievementMilestoneProgress[];

  readonly completedMilestoneIds: readonly string[];

  readonly rewardClaimIds: readonly string[];

  readonly startedAtTick?: number;
  readonly completedAtTick?: number;
  readonly lastProgressAtTick?: number;
}

export interface AchievementMilestoneProgress {
  readonly milestoneId: string;
  readonly taskProgress: QuestTaskProgress;
  readonly status: AchievementStatus;

  readonly completedAtTick?: number;
  readonly rewardClaimId?: string;
}

export interface PlayerAchievementState {
  readonly playerId: string;
  readonly achievements: readonly AchievementProgress[];
  readonly pendingRewardClaimIds: readonly string[];
  readonly version: number;
}

export interface PendingAchievementRewardClaim {
  readonly claimId: string;
  readonly playerId: string;

  readonly achievementId: string;
  readonly milestoneId?: string;

  readonly title: string;
  readonly rewards: readonly QuestRewardDefinition[];

  readonly status: QuestRewardClaimStatus;
  readonly createdAtTick: number;
  readonly claimedAtTick?: number;
}

export interface AchievementProgressApplyResult {
  readonly changed: boolean;
  readonly completedAchievements: readonly AchievementProgress[];
  readonly completedMilestones: readonly AchievementMilestoneProgress[];
  readonly createdRewardClaims: readonly PendingAchievementRewardClaim[];
}

export interface AchievementCompletionResult {
  readonly achievement: AchievementProgress;
  readonly completedMilestones: readonly AchievementMilestoneProgress[];
  readonly rewardClaims: readonly PendingAchievementRewardClaim[];
}

export interface AchievementGuidebookView {
  readonly categories: readonly AchievementCategoryView[];
  readonly pendingRewards: readonly AchievementRewardClaimView[];
  readonly totalAchievements: number;
  readonly completedAchievements: number;
  readonly totalMilestones: number;
  readonly completedMilestones: number;
}

export interface AchievementCategoryView {
  readonly category: string;
  readonly title: string;
  readonly achievements: readonly AchievementView[];
  readonly totalAchievements: number;
  readonly completedAchievements: number;
}

export interface AchievementView {
  readonly achievementId: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly status: AchievementStatus;

  readonly milestones: readonly AchievementMilestoneView[];

  readonly completedMilestones: number;
  readonly totalMilestones: number;
  readonly progressText: string;

  readonly rewardSummary: readonly string[];
}

export interface AchievementMilestoneView {
  readonly milestoneId: string;
  readonly title: string;
  readonly description: string;
  readonly status: AchievementStatus;

  readonly currentAmount: number;
  readonly requiredAmount: number;
  readonly completed: boolean;
  readonly progressText: string;

  readonly rewardSummary: readonly string[];
}

export interface AchievementRewardClaimView {
  readonly claimId: string;
  readonly achievementId: string;
  readonly milestoneId?: string;
  readonly title: string;
  readonly rewardSummary: readonly string[];
  readonly status: QuestRewardClaimStatus;
}

export interface AchievementClock {
  getCurrentTick(): number;
}

export class MinecraftAchievementClock implements AchievementClock {
  public getCurrentTick(): number {
    return Number(world.getAbsoluteTime?.() ?? 0);
  }
}

export interface AchievementIdGenerator {
  createRewardClaimId(
    playerId: string,
    achievementId: string,
    milestoneId?: string,
  ): string;
}

export class DefaultAchievementIdGenerator implements AchievementIdGenerator {
  public createRewardClaimId(
    playerId: string,
    achievementId: string,
    milestoneId?: string,
  ): string {
    return `${this.clean(playerId)}:achievement_reward:${this.clean(achievementId)}:${this.clean(
      milestoneId ?? "achievement",
    )}:${this.randomSuffix()}`;
  }

  private clean(value: string): string {
    return value.replace(/[^a-zA-Z0-9_\-:.]/g, "_");
  }

  private randomSuffix(): string {
    return Math.floor(Math.random() * 1_000_000_000).toString(36);
  }
}

export interface PlayerAchievementStore {
  getState(playerId: string): SDResult<PlayerAchievementState>;
  setState(state: PlayerAchievementState): SDResult<void>;
  deleteState(playerId: string): SDResult<void>;
}

export class JsonPlayerAchievementStore implements PlayerAchievementStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder,
  ) {}

  public getState(playerId: string): SDResult<PlayerAchievementState> {
    return this.jsonStore.getJson<PlayerAchievementState>(
      this.keys.player(playerId, "achievements", "state"),
      {
        playerId,
        achievements: [],
        pendingRewardClaimIds: [],
        version: AchievementConstants.version,
      },
    );
  }

  public setState(state: PlayerAchievementState): SDResult<void> {
    return this.jsonStore.setJson(
      this.keys.player(state.playerId, "achievements", "state"),
      state,
    );
  }

  public deleteState(playerId: string): SDResult<void> {
    return this.jsonStore.remove(
      this.keys.player(playerId, "achievements", "state"),
    );
  }
}

export interface PendingAchievementRewardClaimStore {
  getClaims(
    playerId: string,
  ): SDResult<readonly PendingAchievementRewardClaim[]>;
  setClaims(
    playerId: string,
    claims: readonly PendingAchievementRewardClaim[],
  ): SDResult<void>;
  addClaim(claim: PendingAchievementRewardClaim): SDResult<void>;
  updateClaim(claim: PendingAchievementRewardClaim): SDResult<void>;
  getClaim(
    playerId: string,
    claimId: string,
  ): SDResult<PendingAchievementRewardClaim | undefined>;
}

export class JsonPendingAchievementRewardClaimStore implements PendingAchievementRewardClaimStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder,
  ) {}

  public getClaims(
    playerId: string,
  ): SDResult<readonly PendingAchievementRewardClaim[]> {
    return this.jsonStore.getJson<readonly PendingAchievementRewardClaim[]>(
      this.keys.player(playerId, "achievements", "pending_rewards"),
      [],
    );
  }

  public setClaims(
    playerId: string,
    claims: readonly PendingAchievementRewardClaim[],
  ): SDResult<void> {
    return this.jsonStore.setJson(
      this.keys.player(playerId, "achievements", "pending_rewards"),
      claims,
    );
  }

  public addClaim(claim: PendingAchievementRewardClaim): SDResult<void> {
    const claimsResult = this.getClaims(claim.playerId);

    if (claimsResult.isFailure) {
      return SDResult.fail(claimsResult.error!);
    }

    const claims = claimsResult.getValueOrThrow();

    if (claims.some((existing) => existing.claimId === claim.claimId)) {
      return SDResult.fail(
        new SDError(
          "achievement_reward.duplicate",
          "Achievement reward claim already exists.",
          {
            claimId: claim.claimId,
          },
        ),
      );
    }

    return this.setClaims(claim.playerId, [...claims, claim]);
  }

  public updateClaim(claim: PendingAchievementRewardClaim): SDResult<void> {
    const claimsResult = this.getClaims(claim.playerId);

    if (claimsResult.isFailure) {
      return SDResult.fail(claimsResult.error!);
    }

    const claims = claimsResult.getValueOrThrow();
    const index = claims.findIndex(
      (existing) => existing.claimId === claim.claimId,
    );

    if (index < 0) {
      return SDResult.fail(
        new SDError(
          "achievement_reward.not_found",
          "Achievement reward claim not found.",
          {
            claimId: claim.claimId,
          },
        ),
      );
    }

    const updated = [...claims];
    updated[index] = claim;

    return this.setClaims(claim.playerId, updated);
  }

  public getClaim(
    playerId: string,
    claimId: string,
  ): SDResult<PendingAchievementRewardClaim | undefined> {
    const claimsResult = this.getClaims(playerId);

    if (claimsResult.isFailure) {
      return SDResult.fail(claimsResult.error!);
    }

    return SDResult.ok(
      claimsResult.getValueOrThrow().find((claim) => claim.claimId === claimId),
    );
  }
}

export class AchievementDefinitionRegistry {
  private readonly definitions = new Map<string, AchievementDefinition>();

  public register(definition: AchievementDefinition): SDResult<void> {
    const validation = this.validate(definition);

    if (validation.isFailure) {
      return validation;
    }

    if (this.definitions.has(definition.id)) {
      return SDResult.fail(
        new SDError(
          "achievement_definition.duplicate",
          "Achievement already registered.",
          {
            achievementId: definition.id,
          },
        ),
      );
    }

    this.definitions.set(definition.id, definition);
    return SDResult.ok(undefined);
  }

  public registerMany(
    definitions: readonly AchievementDefinition[],
  ): SDResult<void> {
    for (const definition of definitions) {
      const result = this.register(definition);

      if (result.isFailure) {
        return result;
      }
    }

    return SDResult.ok(undefined);
  }

  public get(id: string): SDResult<AchievementDefinition> {
    const definition = this.definitions.get(id);

    if (definition === undefined) {
      return SDResult.fail(
        new SDError(
          "achievement_definition.not_found",
          "Achievement definition not found.",
          {
            achievementId: id,
          },
        ),
      );
    }

    return SDResult.ok(definition);
  }

  public getAll(): readonly AchievementDefinition[] {
    return [...this.definitions.values()].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
  }

  public getByCategory(category: string): readonly AchievementDefinition[] {
    return this.getAll().filter(
      (definition) => definition.category === category,
    );
  }

  public getCategories(): readonly string[] {
    return [...new Set(this.getAll().map((definition) => definition.category))];
  }

  private validate(definition: AchievementDefinition): SDResult<void> {
    if (definition.id.trim().length === 0) {
      return SDResult.fail("Achievement id is required.");
    }

    if (definition.title.trim().length === 0) {
      return SDResult.fail("Achievement title is required.");
    }

    if (definition.category.trim().length === 0) {
      return SDResult.fail("Achievement category is required.");
    }

    if (definition.milestones.length === 0) {
      return SDResult.fail(
        new SDError(
          "achievement_definition.no_milestones",
          "Achievement must have at least one milestone.",
          {
            achievementId: definition.id,
          },
        ),
      );
    }

    const milestoneIds = new Set<string>();

    for (const milestone of definition.milestones) {
      if (milestone.id.trim().length === 0) {
        return SDResult.fail(
          new SDError(
            "achievement_definition.invalid_milestone",
            "Achievement milestone id is required.",
            {
              achievementId: definition.id,
            },
          ),
        );
      }

      if (milestoneIds.has(milestone.id)) {
        return SDResult.fail(
          new SDError(
            "achievement_definition.duplicate_milestone",
            "Achievement milestone id is duplicated.",
            {
              achievementId: definition.id,
              milestoneId: milestone.id,
            },
          ),
        );
      }

      if (milestone.task.requiredAmount <= 0) {
        return SDResult.fail(
          new SDError(
            "achievement_definition.invalid_required_amount",
            "Achievement milestone required amount must be greater than zero.",
            {
              achievementId: definition.id,
              milestoneId: milestone.id,
              requiredAmount: milestone.task.requiredAmount,
            },
          ),
        );
      }

      milestoneIds.add(milestone.id);
    }

    return SDResult.ok(undefined);
  }
}

export interface AchievementRequirementHandler {
  readonly type: string;

  isEligible(
    player: Player,
    state: PlayerAchievementState,
    definition: AchievementDefinition,
    requirement: AchievementRequirementDefinition,
  ): SDResult<boolean>;
}

export class AchievementRequirementRegistry {
  private readonly handlers = new Map<string, AchievementRequirementHandler>();

  public register(handler: AchievementRequirementHandler): SDResult<void> {
    if (this.handlers.has(handler.type)) {
      return SDResult.fail(
        new SDError(
          "achievement_requirement.duplicate_handler",
          "Achievement requirement handler already exists.",
          {
            type: handler.type,
          },
        ),
      );
    }

    this.handlers.set(handler.type, handler);
    return SDResult.ok(undefined);
  }

  public isEligible(
    player: Player,
    state: PlayerAchievementState,
    definition: AchievementDefinition,
  ): SDResult<boolean> {
    for (const requirement of definition.requirements ?? []) {
      const handler = this.handlers.get(requirement.type);

      if (handler === undefined) {
        return SDResult.fail(
          new SDError(
            "achievement_requirement.handler_not_found",
            "Achievement requirement handler was not found.",
            {
              achievementId: definition.id,
              requirementType: requirement.type,
            },
          ),
        );
      }

      const result = handler.isEligible(player, state, definition, requirement);

      if (result.isFailure) {
        return result;
      }

      if (!result.getValueOrThrow()) {
        return SDResult.ok(false);
      }
    }

    return SDResult.ok(true);
  }
}

export class AchievementProgressFactory {
  public createProgress(
    definition: AchievementDefinition,
  ): AchievementProgress {
    return {
      achievementId: definition.id,
      status: AchievementStatus.Available,
      milestoneProgress: definition.milestones.map((milestone) => ({
        milestoneId: milestone.id,
        status: AchievementStatus.Available,
        taskProgress: {
          taskId: milestone.task.id,
          currentAmount: 0,
          requiredAmount: milestone.task.requiredAmount,
          completed: false,
        },
      })),
      completedMilestoneIds: [],
      rewardClaimIds: [],
    };
  }

  public syncProgressWithDefinition(
    existing: AchievementProgress,
    definition: AchievementDefinition,
  ): AchievementProgress {
    const existingByMilestoneId = new Map(
      existing.milestoneProgress.map((progress) => [
        progress.milestoneId,
        progress,
      ]),
    );

    const syncedMilestones = definition.milestones.map((milestone) => {
      const existingMilestone = existingByMilestoneId.get(milestone.id);

      if (existingMilestone !== undefined) {
        return {
          ...existingMilestone,
          taskProgress: {
            ...existingMilestone.taskProgress,
            requiredAmount: milestone.task.requiredAmount,
          },
        };
      }

      return {
        milestoneId: milestone.id,
        status: AchievementStatus.Available,
        taskProgress: {
          taskId: milestone.task.id,
          currentAmount: 0,
          requiredAmount: milestone.task.requiredAmount,
          completed: false,
        },
      } satisfies AchievementMilestoneProgress;
    });

    const allRequiredMilestonesCompleted = syncedMilestones.every(
      (progress) => progress.taskProgress.completed,
    );

    return {
      ...existing,
      status: allRequiredMilestonesCompleted
        ? existing.status === AchievementStatus.RewardClaimed
          ? AchievementStatus.RewardClaimed
          : AchievementStatus.Completed
        : existing.status === AchievementStatus.Available &&
            this.hasAnyProgress(syncedMilestones)
          ? AchievementStatus.InProgress
          : existing.status,
      milestoneProgress: syncedMilestones,
      completedMilestoneIds: syncedMilestones
        .filter((progress) => progress.taskProgress.completed)
        .map((progress) => progress.milestoneId),
    };
  }

  private hasAnyProgress(
    milestones: readonly AchievementMilestoneProgress[],
  ): boolean {
    return milestones.some(
      (progress) => progress.taskProgress.currentAmount > 0,
    );
  }
}

export interface AchievementStateService {
  ensurePlayerState(player: Player): SDResult<PlayerAchievementState>;
  getState(playerId: string): SDResult<PlayerAchievementState>;
  saveState(state: PlayerAchievementState): SDResult<void>;
}

export class DefaultAchievementStateService implements AchievementStateService {
  public constructor(
    private readonly definitions: AchievementDefinitionRegistry,
    private readonly store: PlayerAchievementStore,
    private readonly factory: AchievementProgressFactory,
  ) {}

  public ensurePlayerState(player: Player): SDResult<PlayerAchievementState> {
    const stateResult = this.store.getState(player.id);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    const existingById = new Map(
      state.achievements.map((progress) => [progress.achievementId, progress]),
    );

    let changed = false;

    const syncedAchievements: AchievementProgress[] = [];

    for (const definition of this.definitions.getAll()) {
      const existing = existingById.get(definition.id);

      if (existing === undefined) {
        syncedAchievements.push(this.factory.createProgress(definition));
        changed = true;
        continue;
      }

      const synced = this.factory.syncProgressWithDefinition(
        existing,
        definition,
      );

      if (synced !== existing) {
        changed = true;
      }

      syncedAchievements.push(synced);
    }

    const syncedState: PlayerAchievementState = {
      ...state,
      achievements: syncedAchievements,
      version: AchievementConstants.version,
    };

    if (!changed) {
      return SDResult.ok(syncedState);
    }

    const saveResult = this.store.setState(syncedState);

    if (saveResult.isFailure) {
      return SDResult.fail(saveResult.error!);
    }

    return SDResult.ok(syncedState);
  }

  public getState(playerId: string): SDResult<PlayerAchievementState> {
    return this.store.getState(playerId);
  }

  public saveState(state: PlayerAchievementState): SDResult<void> {
    return this.store.setState(state);
  }
}

export interface AchievementRewardClaimService {
  createClaimsForMilestone(
    player: Player,
    definition: AchievementDefinition,
    milestone: AchievementMilestoneDefinition,
    progress: AchievementProgress,
  ): SDResult<readonly PendingAchievementRewardClaim[]>;

  getPendingClaims(
    player: Player,
  ): SDResult<readonly PendingAchievementRewardClaim[]>;

  markClaimed(
    playerId: string,
    claimId: string,
  ): SDResult<PendingAchievementRewardClaim>;
}

export class DefaultAchievementRewardClaimService implements AchievementRewardClaimService {
  public constructor(
    private readonly store: PendingAchievementRewardClaimStore,
    private readonly idGenerator: AchievementIdGenerator,
    private readonly clock: AchievementClock,
  ) {}

  public createClaimsForMilestone(
    player: Player,
    definition: AchievementDefinition,
    milestone: AchievementMilestoneDefinition,
    _progress: AchievementProgress,
  ): SDResult<readonly PendingAchievementRewardClaim[]> {
    const rewards = this.getRewardsForMilestone(definition, milestone);

    if (rewards.length === 0) {
      return SDResult.ok([]);
    }

    const claim: PendingAchievementRewardClaim = {
      claimId: this.idGenerator.createRewardClaimId(
        player.id,
        definition.id,
        milestone.id,
      ),
      playerId: player.id,
      achievementId: definition.id,
      milestoneId: milestone.id,
      title: milestone.title,
      rewards,
      status: QuestRewardClaimStatus.Pending,
      createdAtTick: this.clock.getCurrentTick(),
    };

    const addResult = this.store.addClaim(claim);

    if (addResult.isFailure) {
      return SDResult.fail(addResult.error!);
    }

    return SDResult.ok([claim]);
  }

  public getPendingClaims(
    player: Player,
  ): SDResult<readonly PendingAchievementRewardClaim[]> {
    const claimsResult = this.store.getClaims(player.id);

    if (claimsResult.isFailure) {
      return SDResult.fail(claimsResult.error!);
    }

    return SDResult.ok(
      claimsResult
        .getValueOrThrow()
        .filter((claim) => claim.status === QuestRewardClaimStatus.Pending),
    );
  }

  public markClaimed(
    playerId: string,
    claimId: string,
  ): SDResult<PendingAchievementRewardClaim> {
    const claimResult = this.store.getClaim(playerId, claimId);

    if (claimResult.isFailure) {
      return SDResult.fail(claimResult.error!);
    }

    const claim = claimResult.value;

    if (claim === undefined) {
      return SDResult.fail(
        new SDError(
          "achievement_reward.not_found",
          "Achievement reward claim was not found.",
          {
            playerId,
            claimId,
          },
        ),
      );
    }

    const updated: PendingAchievementRewardClaim = {
      ...claim,
      status: QuestRewardClaimStatus.Claimed,
      claimedAtTick: this.clock.getCurrentTick(),
    };

    const updateResult = this.store.updateClaim(updated);

    if (updateResult.isFailure) {
      return SDResult.fail(updateResult.error!);
    }

    return SDResult.ok(updated);
  }

  private getRewardsForMilestone(
    definition: AchievementDefinition,
    milestone: AchievementMilestoneDefinition,
  ): readonly QuestRewardDefinition[] {
    switch (definition.rewardMode) {
      case AchievementRewardMode.None:
        return [];

      case AchievementRewardMode.FinalOnly: {
        const ordered = [...definition.milestones].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
        );

        const finalMilestone = ordered[ordered.length - 1];

        return finalMilestone.id === milestone.id
          ? (milestone.rewards ?? [])
          : [];
      }

      case AchievementRewardMode.PerMilestone:
      default:
        return milestone.rewards ?? [];
    }
  }
}

export interface AchievementProgressService {
  applyEvent(event: QuestEvent): SDResult<AchievementProgressApplyResult>;
}

export class DefaultAchievementProgressService implements AchievementProgressService {
  public constructor(
    private readonly definitions: AchievementDefinitionRegistry,
    private readonly requirements: AchievementRequirementRegistry,
    private readonly objectives: QuestObjectiveHandlerRegistry,
    private readonly state: AchievementStateService,
    private readonly rewards: AchievementRewardClaimService,
    private readonly clock: AchievementClock,
    private readonly logger?: Logger,
  ) {}

  public applyEvent(
    event: QuestEvent,
  ): SDResult<AchievementProgressApplyResult> {
    const stateResult = this.state.ensurePlayerState(event.player);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const playerState = stateResult.getValueOrThrow();

    let changed = false;

    const completedAchievements: AchievementProgress[] = [];
    const completedMilestones: AchievementMilestoneProgress[] = [];
    const createdRewardClaims: PendingAchievementRewardClaim[] = [];

    const updatedAchievements: AchievementProgress[] = [];

    for (const achievement of playerState.achievements) {
      if (
        achievement.status === AchievementStatus.Completed ||
        achievement.status === AchievementStatus.RewardPending ||
        achievement.status === AchievementStatus.RewardClaimed
      ) {
        updatedAchievements.push(achievement);
        continue;
      }

      const definitionResult = this.definitions.get(achievement.achievementId);

      if (definitionResult.isFailure) {
        return SDResult.fail(definitionResult.error!);
      }

      const definition = definitionResult.getValueOrThrow();

      const eligibleResult = this.requirements.isEligible(
        event.player,
        playerState,
        definition,
      );

      if (eligibleResult.isFailure) {
        return SDResult.fail(eligibleResult.error!);
      }

      if (!eligibleResult.getValueOrThrow()) {
        updatedAchievements.push(achievement);
        continue;
      }

      const updateResult = this.applyEventToAchievement(
        event,
        achievement,
        definition,
      );

      if (updateResult.isFailure) {
        return SDResult.fail(updateResult.error!);
      }

      const update = updateResult.getValueOrThrow();
      let updatedAchievement = update.achievement;

      if (update.changed) {
        changed = true;
        completedMilestones.push(...update.completedMilestones);

        for (const completedMilestone of update.completedMilestones) {
          const milestoneDefinition = definition.milestones.find(
            (milestone) => milestone.id === completedMilestone.milestoneId,
          );

          if (milestoneDefinition === undefined) {
            return SDResult.fail(
              new SDError(
                "achievement_progress.milestone_definition_missing",
                "Milestone definition missing.",
                {
                  achievementId: definition.id,
                  milestoneId: completedMilestone.milestoneId,
                },
              ),
            );
          }

          const rewardResult = this.rewards.createClaimsForMilestone(
            event.player,
            definition,
            milestoneDefinition,
            updatedAchievement,
          );

          if (rewardResult.isFailure) {
            return SDResult.fail(rewardResult.error!);
          }

          const claims = rewardResult.getValueOrThrow();

          if (claims.length > 0) {
            createdRewardClaims.push(...claims);

            updatedAchievement = this.attachRewardClaimsToAchievement(
              updatedAchievement,
              completedMilestone.milestoneId,
              claims.map((claim) => claim.claimId),
            );
          }
        }
      }

      if (this.isAchievementComplete(updatedAchievement, definition)) {
        updatedAchievement = {
          ...updatedAchievement,
          status:
            updatedAchievement.rewardClaimIds.length > 0
              ? AchievementStatus.RewardPending
              : AchievementStatus.Completed,
          completedAtTick: this.clock.getCurrentTick(),
        };

        completedAchievements.push(updatedAchievement);
        changed = true;

        this.logger?.info("achievements", "Achievement completed.", {
          playerId: event.player.id,
          achievementId: definition.id,
        });
      }

      updatedAchievements.push(updatedAchievement);
    }

    if (!changed) {
      return SDResult.ok({
        changed: false,
        completedAchievements: [],
        completedMilestones: [],
        createdRewardClaims: [],
      });
    }

    const updatedState: PlayerAchievementState = {
      ...playerState,
      achievements: updatedAchievements,
      pendingRewardClaimIds: [
        ...playerState.pendingRewardClaimIds,
        ...createdRewardClaims.map((claim) => claim.claimId),
      ],
      version: AchievementConstants.version,
    };

    const saveResult = this.state.saveState(updatedState);

    if (saveResult.isFailure) {
      return SDResult.fail(saveResult.error!);
    }

    return SDResult.ok({
      changed: true,
      completedAchievements,
      completedMilestones,
      createdRewardClaims,
    });
  }

  private applyEventToAchievement(
    event: QuestEvent,
    achievement: AchievementProgress,
    definition: AchievementDefinition,
  ): SDResult<{
    readonly changed: boolean;
    readonly achievement: AchievementProgress;
    readonly completedMilestones: readonly AchievementMilestoneProgress[];
  }> {
    let changed = false;
    const completedMilestones: AchievementMilestoneProgress[] = [];

    const updatedMilestones: AchievementMilestoneProgress[] = [];

    for (const milestoneProgress of achievement.milestoneProgress) {
      if (milestoneProgress.taskProgress.completed) {
        updatedMilestones.push(milestoneProgress);
        continue;
      }

      const milestone = definition.milestones.find(
        (candidate) => candidate.id === milestoneProgress.milestoneId,
      );

      if (milestone === undefined) {
        return SDResult.fail(
          new SDError(
            "achievement_progress.milestone_missing",
            "Achievement milestone definition was not found.",
            {
              achievementId: definition.id,
              milestoneId: milestoneProgress.milestoneId,
            },
          ),
        );
      }

      const handlerResult = this.objectives.get(milestone.task.objectiveType);

      if (handlerResult.isFailure) {
        return SDResult.fail(handlerResult.error!);
      }

      const handler = handlerResult.getValueOrThrow();

      if (!handler.canHandle(event, milestone.task)) {
        updatedMilestones.push(milestoneProgress);
        continue;
      }

      const amount = handler.getProgressAmount(event, milestone.task);

      if (amount <= 0) {
        updatedMilestones.push(milestoneProgress);
        continue;
      }

      const nextAmount = Math.min(
        milestoneProgress.taskProgress.requiredAmount,
        milestoneProgress.taskProgress.currentAmount + amount,
      );

      const completed =
        nextAmount >= milestoneProgress.taskProgress.requiredAmount;

      const updatedMilestone: AchievementMilestoneProgress = {
        ...milestoneProgress,
        status: completed
          ? AchievementStatus.Completed
          : AchievementStatus.InProgress,
        completedAtTick: completed
          ? this.clock.getCurrentTick()
          : milestoneProgress.completedAtTick,
        taskProgress: {
          ...milestoneProgress.taskProgress,
          currentAmount: nextAmount,
          completed,
        },
      };

      updatedMilestones.push(updatedMilestone);

      if (completed) {
        completedMilestones.push(updatedMilestone);

        this.logger?.info("achievements", "Achievement milestone completed.", {
          playerId: event.player.id,
          achievementId: definition.id,
          milestoneId: milestone.id,
        });
      }

      changed = true;
    }

    if (!changed) {
      return SDResult.ok({
        changed: false,
        achievement,
        completedMilestones: [],
      });
    }

    const completedMilestoneIds = updatedMilestones
      .filter((milestone) => milestone.taskProgress.completed)
      .map((milestone) => milestone.milestoneId);

    const updatedAchievement: AchievementProgress = {
      ...achievement,
      status: AchievementStatus.InProgress,
      startedAtTick: achievement.startedAtTick ?? this.clock.getCurrentTick(),
      lastProgressAtTick: this.clock.getCurrentTick(),
      milestoneProgress: updatedMilestones,
      completedMilestoneIds,
    };

    return SDResult.ok({
      changed: true,
      achievement: updatedAchievement,
      completedMilestones,
    });
  }

  private isAchievementComplete(
    progress: AchievementProgress,
    definition: AchievementDefinition,
  ): boolean {
    return definition.milestones.every((milestone) =>
      progress.completedMilestoneIds.includes(milestone.id),
    );
  }

  private attachRewardClaimsToAchievement(
    achievement: AchievementProgress,
    milestoneId: string,
    claimIds: readonly string[],
  ): AchievementProgress {
    const updatedMilestones = achievement.milestoneProgress.map((milestone) => {
      if (milestone.milestoneId !== milestoneId) {
        return milestone;
      }

      return {
        ...milestone,
        status: AchievementStatus.RewardPending,
        rewardClaimId: claimIds[0],
      };
    });

    return {
      ...achievement,
      milestoneProgress: updatedMilestones,
      rewardClaimIds: [...achievement.rewardClaimIds, ...claimIds],
    };
  }
}

export interface AchievementGuidebookService {
  createView(player: Player): SDResult<AchievementGuidebookView>;
}

export class DefaultAchievementGuidebookService implements AchievementGuidebookService {
  public constructor(
    private readonly definitions: AchievementDefinitionRegistry,
    private readonly state: AchievementStateService,
    private readonly rewardClaims: AchievementRewardClaimService,
  ) {}

  public createView(player: Player): SDResult<AchievementGuidebookView> {
    const stateResult = this.state.ensurePlayerState(player);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const pendingClaimsResult = this.rewardClaims.getPendingClaims(player);

    if (pendingClaimsResult.isFailure) {
      return SDResult.fail(pendingClaimsResult.error!);
    }

    const playerState = stateResult.getValueOrThrow();
    const categories = this.definitions.getCategories();

    const categoryViews = categories.map((category) =>
      this.createCategoryView(category, playerState),
    );

    const allAchievementViews = categoryViews.flatMap(
      (category) => category.achievements,
    );

    const totalMilestones = allAchievementViews.reduce(
      (sum, achievement) => sum + achievement.totalMilestones,
      0,
    );

    const completedMilestones = allAchievementViews.reduce(
      (sum, achievement) => sum + achievement.completedMilestones,
      0,
    );

    return SDResult.ok({
      categories: categoryViews,
      pendingRewards: pendingClaimsResult
        .getValueOrThrow()
        .map((claim) => this.createRewardClaimView(claim)),
      totalAchievements: allAchievementViews.length,
      completedAchievements: allAchievementViews.filter(
        (achievement) =>
          achievement.status === AchievementStatus.Completed ||
          achievement.status === AchievementStatus.RewardPending ||
          achievement.status === AchievementStatus.RewardClaimed,
      ).length,
      totalMilestones,
      completedMilestones,
    });
  }

  private createCategoryView(
    category: string,
    state: PlayerAchievementState,
  ): AchievementCategoryView {
    const definitions = this.definitions.getByCategory(category);

    const achievements = definitions.map((definition) => {
      const progress = state.achievements.find(
        (candidate) => candidate.achievementId === definition.id,
      );

      return this.createAchievementView(definition, progress);
    });

    return {
      category,
      title: this.formatCategoryTitle(category),
      achievements,
      totalAchievements: achievements.length,
      completedAchievements: achievements.filter(
        (achievement) =>
          achievement.status === AchievementStatus.Completed ||
          achievement.status === AchievementStatus.RewardPending ||
          achievement.status === AchievementStatus.RewardClaimed,
      ).length,
    };
  }

  private createAchievementView(
    definition: AchievementDefinition,
    progress: AchievementProgress | undefined,
  ): AchievementView {
    const milestoneViews = definition.milestones
      .slice()
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((milestone) => {
        const milestoneProgress = progress?.milestoneProgress.find(
          (candidate) => candidate.milestoneId === milestone.id,
        );

        return this.createMilestoneView(milestone, milestoneProgress);
      });

    const completedMilestones = milestoneViews.filter(
      (milestone) => milestone.completed,
    ).length;

    return {
      achievementId: definition.id,
      title: definition.title,
      description: definition.description,
      category: definition.category,
      tags: definition.tags,
      status: progress?.status ?? AchievementStatus.Available,
      milestones: milestoneViews,
      completedMilestones,
      totalMilestones: milestoneViews.length,
      progressText: `${completedMilestones}/${milestoneViews.length}`,
      rewardSummary: definition.milestones.flatMap((milestone) =>
        (milestone.rewards ?? []).map((reward) => this.summarizeReward(reward)),
      ),
    };
  }

  private createMilestoneView(
    definition: AchievementMilestoneDefinition,
    progress: AchievementMilestoneProgress | undefined,
  ): AchievementMilestoneView {
    const taskProgress = progress?.taskProgress;

    const currentAmount = taskProgress?.currentAmount ?? 0;
    const requiredAmount =
      taskProgress?.requiredAmount ?? definition.task.requiredAmount;
    const completed = taskProgress?.completed ?? false;

    return {
      milestoneId: definition.id,
      title: definition.title,
      description: definition.description,
      status: progress?.status ?? AchievementStatus.Available,
      currentAmount,
      requiredAmount,
      completed,
      progressText: `${currentAmount}/${requiredAmount}`,
      rewardSummary: (definition.rewards ?? []).map((reward) =>
        this.summarizeReward(reward),
      ),
    };
  }

  private createRewardClaimView(
    claim: PendingAchievementRewardClaim,
  ): AchievementRewardClaimView {
    return {
      claimId: claim.claimId,
      achievementId: claim.achievementId,
      milestoneId: claim.milestoneId,
      title: claim.title,
      rewardSummary: claim.rewards.map((reward) =>
        this.summarizeReward(reward),
      ),
      status: claim.status,
    };
  }

  private summarizeReward(reward: QuestRewardDefinition): string {
    if (reward.displayName !== undefined) {
      return reward.displayName;
    }

    return reward.id;
  }

  private formatCategoryTitle(category: string): string {
    return category
      .split(/[_\- ]+/g)
      .filter((part) => part.length > 0)
      .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
      .join(" ");
  }
}

export interface AchievementSystemServices {
  readonly definitions: AchievementDefinitionRegistry;
  readonly requirements: AchievementRequirementRegistry;
  readonly playerStore: PlayerAchievementStore;
  readonly rewardClaimStore: PendingAchievementRewardClaimStore;
  readonly state: AchievementStateService;
  readonly rewards: AchievementRewardClaimService;
  readonly progress: AchievementProgressService;
  readonly guidebook: AchievementGuidebookService;
  readonly clock: AchievementClock;
}

export class AchievementSystem {
  public constructor(public readonly services: AchievementSystemServices) {}

  public registerDefinition(definition: AchievementDefinition): SDResult<void> {
    return this.services.definitions.register(definition);
  }

  public registerDefinitions(
    definitions: readonly AchievementDefinition[],
  ): SDResult<void> {
    return this.services.definitions.registerMany(definitions);
  }

  public registerRequirementHandler(
    handler: AchievementRequirementHandler,
  ): SDResult<void> {
    return this.services.requirements.register(handler);
  }

  public ensurePlayerState(player: Player): SDResult<PlayerAchievementState> {
    return this.services.state.ensurePlayerState(player);
  }

  public applyEvent(
    event: QuestEvent,
  ): SDResult<AchievementProgressApplyResult> {
    return this.services.progress.applyEvent(event);
  }

  public getGuidebookView(player: Player): SDResult<AchievementGuidebookView> {
    return this.services.guidebook.createView(player);
  }

  public getPendingRewards(
    player: Player,
  ): SDResult<readonly PendingAchievementRewardClaim[]> {
    return this.services.rewards.getPendingClaims(player);
  }

  public markRewardClaimed(
    playerId: string,
    claimId: string,
  ): SDResult<PendingAchievementRewardClaim> {
    return this.services.rewards.markClaimed(playerId, claimId);
  }
}

export interface AchievementSystemOptions {}

export class AchievementSystemFactory {
  public static create(
    jsonStore: JsonStore,
    keys: KeyBuilder,
    objectives: QuestObjectiveHandlerRegistry,
    logger?: Logger,
    _options: AchievementSystemOptions = {},
  ): AchievementSystem {
    const clock = new MinecraftAchievementClock();
    const idGenerator = new DefaultAchievementIdGenerator();

    const definitions = new AchievementDefinitionRegistry();
    const requirements = new AchievementRequirementRegistry();

    const playerStore = new JsonPlayerAchievementStore(jsonStore, keys);
    const rewardClaimStore = new JsonPendingAchievementRewardClaimStore(
      jsonStore,
      keys,
    );

    const progressFactory = new AchievementProgressFactory();

    const state = new DefaultAchievementStateService(
      definitions,
      playerStore,
      progressFactory,
    );

    const rewards = new DefaultAchievementRewardClaimService(
      rewardClaimStore,
      idGenerator,
      clock,
    );

    const progress = new DefaultAchievementProgressService(
      definitions,
      requirements,
      objectives,
      state,
      rewards,
      clock,
      logger,
    );

    const guidebook = new DefaultAchievementGuidebookService(
      definitions,
      state,
      rewards,
    );

    return new AchievementSystem({
      definitions,
      requirements,
      playerStore,
      rewardClaimStore,
      state,
      rewards,
      progress,
      guidebook,
      clock,
    });
  }
}