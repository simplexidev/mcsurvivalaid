
export const QuestConstants = Object.freeze({
  defaultDailyQuestCount: 5,
  defaultWeeklyQuestCount: 7,
  ticksPerSecond: 20,
  ticksPerMinute: 20 * 60,
  ticksPerHour: 20 * 60 * 60,
  ticksPerDay: 20 * 60 * 60 * 24,
});

export enum QuestPeriod {
  Daily = "daily",
  Weekly = "weekly",
}

export enum QuestStatus {
  Active = "active",
  Completed = "completed",
  RewardPending = "reward_pending",
  RewardClaimed = "reward_claimed",
  Expired = "expired",
  Failed = "failed",
}

export enum QuestObjectiveType {
  BreakBlock = "break_block",
  PlaceBlock = "place_block",
  KillEntity = "kill_entity",
  CollectItem = "collect_item",
  CraftItem = "craft_item",
  TravelDistance = "travel_distance",
  EnterDimension = "enter_dimension",
  GainExperience = "gain_experience",
  Custom = "custom",
}

export enum QuestRewardType {
  Item = "item",
  Experience = "experience",
  Command = "command",
  Custom = "custom",
}

export enum QuestRewardClaimStatus {
  Pending = "pending",
  Claimed = "claimed",
  Expired = "expired",
}

export interface QuestDefinition {
  readonly id: string;
  readonly period: QuestPeriod;
  readonly title: string;
  readonly description: string;

  readonly weight: number;

  readonly tags: readonly string[];

  readonly tasks: readonly QuestTaskDefinition[];
  readonly rewards: readonly QuestRewardDefinition[];

  readonly requirements?: readonly QuestRequirementDefinition[];

  readonly difficulty?: QuestDifficulty;

  readonly repeatPolicy?: QuestRepeatPolicy;
}

export enum QuestDifficulty {
  Easy = "easy",
  Normal = "normal",
  Hard = "hard",
  VeryHard = "very_hard",
}

export interface QuestRepeatPolicy {
  readonly cooldownPeriods?: number;

  readonly repeatable?: boolean;
}

export interface QuestTaskDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;

  readonly objectiveType: QuestObjectiveType | string;
  readonly target: QuestObjectiveTarget;
  readonly requiredAmount: number;

  readonly optional?: boolean;

  readonly displayOrder?: number;
}

export interface QuestObjectiveTarget {
  readonly typeIds?: readonly string[];

  readonly families?: readonly string[];

  readonly tags?: readonly string[];

  readonly dimensions?: readonly string[];

  readonly payload?: unknown;
}

export interface QuestRequirementDefinition {
  readonly type: string;
  readonly payload: unknown;
}

export interface QuestRewardDefinition {
  readonly id: string;
  readonly type: QuestRewardType | string;
  readonly payload: unknown;
  readonly displayName?: string;
  readonly description?: string;
}

export interface ItemQuestRewardPayload {
  readonly typeId: string;
  readonly amount: number;
}

export interface ExperienceQuestRewardPayload {
  readonly amount: number;
}

export interface CommandQuestRewardPayload {
  readonly command: string;
}

export interface QuestAssignment {
  readonly assignmentId: string;
  readonly questId: string;
  readonly period: QuestPeriod;
  readonly playerId: string;

  readonly assignedAtTick: number;
  readonly periodKey: string;

  readonly status: QuestStatus;
  readonly taskProgress: readonly QuestTaskProgress[];

  readonly completedAtTick?: number;
  readonly rewardClaimId?: string;
}

export interface QuestTaskProgress {
  readonly taskId: string;
  readonly currentAmount: number;
  readonly requiredAmount: number;
  readonly completed: boolean;
}

export interface PlayerQuestState {
  readonly playerId: string;

  readonly dailyPeriodKey: string;
  readonly weeklyPeriodKey: string;

  readonly dailyAssignments: readonly QuestAssignment[];
  readonly weeklyAssignments: readonly QuestAssignment[];

  readonly completedQuestIds: readonly string[];

  readonly completedAssignmentIds: readonly string[];

  readonly pendingRewardClaimIds: readonly string[];

  readonly version: number;
}

export interface PendingQuestRewardClaim {
  readonly claimId: string;
  readonly playerId: string;

  readonly sourceQuestId: string;
  readonly sourceAssignmentId: string;
  readonly sourcePeriod: QuestPeriod;

  readonly title: string;
  readonly rewards: readonly QuestRewardDefinition[];

  readonly status: QuestRewardClaimStatus;
  readonly createdAtTick: number;
  readonly claimedAtTick?: number;
}

export interface QuestEvent {
  readonly type: QuestObjectiveType | string;
  readonly player: Player;

  readonly amount: number;

  readonly targetTypeId?: string;

  readonly location?: LocationRef;

  readonly metadata?: Record<string, unknown>;
}

export interface QuestProgressApplyResult {
  readonly changed: boolean;
  readonly completedAssignments: readonly QuestAssignment[];
  readonly createdRewardClaims: readonly PendingQuestRewardClaim[];
}

export interface QuestGuidebookView {
  readonly daily: QuestPeriodView;
  readonly weekly: QuestPeriodView;
  readonly pendingRewards: readonly PendingQuestRewardClaimView[];
}

export interface QuestPeriodView {
  readonly period: QuestPeriod;
  readonly title: string;
  readonly periodKey: string;
  readonly resetsInText: string;
  readonly quests: readonly QuestAssignmentView[];
}

export interface QuestAssignmentView {
  readonly assignmentId: string;
  readonly questId: string;
  readonly title: string;
  readonly description: string;
  readonly status: QuestStatus;
  readonly tags: readonly string[];
  readonly difficulty?: QuestDifficulty;
  readonly tasks: readonly QuestTaskProgressView[];
  readonly rewardSummary: readonly string[];
  readonly completed: boolean;
  readonly rewardPending: boolean;
}

export interface QuestTaskProgressView {
  readonly taskId: string;
  readonly title: string;
  readonly description: string;
  readonly currentAmount: number;
  readonly requiredAmount: number;
  readonly completed: boolean;
  readonly progressText: string;
}

export interface PendingQuestRewardClaimView {
  readonly claimId: string;
  readonly title: string;
  readonly sourceQuestId: string;
  readonly rewardSummary: readonly string[];
  readonly status: QuestRewardClaimStatus;
}

export interface QuestClock {
  getCurrentTick(): number;
  getDailyPeriodKey(): string;
  getWeeklyPeriodKey(): string;
  getDailyResetText(): string;
  getWeeklyResetText(): string;
}

export class RealDateQuestClock implements QuestClock {
  public getCurrentTick(): number {
    return Number(world.getAbsoluteTime?.() ?? 0);
  }

  public getDailyPeriodKey(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  public getWeeklyPeriodKey(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const week = this.getUtcWeekNumber(now);

    return `${year}-W${String(week).padStart(2, "0")}`;
  }

  public getDailyResetText(): string {
    return "Resets daily";
  }

  public getWeeklyResetText(): string {
    return "Resets weekly";
  }

  private getUtcWeekNumber(date: Date): number {
    const target = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const dayNumber = target.getUTCDay() || 7;

    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);

    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));

    return Math.ceil(
      ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
  }
}

export interface QuestIdGenerator {
  createAssignmentId(
    playerId: string,
    questId: string,
    periodKey: string,
  ): string;
  createRewardClaimId(playerId: string, assignmentId: string): string;
}

export class DefaultQuestIdGenerator implements QuestIdGenerator {
  public createAssignmentId(
    playerId: string,
    questId: string,
    periodKey: string,
  ): string {
    return `${this.clean(playerId)}:${this.clean(periodKey)}:${this.clean(questId)}:${this.randomSuffix()}`;
  }

  public createRewardClaimId(playerId: string, assignmentId: string): string {
    return `${this.clean(playerId)}:reward:${this.clean(assignmentId)}:${this.randomSuffix()}`;
  }

  private clean(value: string): string {
    return value.replace(/[^a-zA-Z0-9_\-:.]/g, "_");
  }

  private randomSuffix(): string {
    return Math.floor(Math.random() * 1_000_000_000).toString(36);
  }
}

export interface PlayerQuestStore {
  getState(playerId: string): SDResult<PlayerQuestState | undefined>;
  setState(state: PlayerQuestState): SDResult<void>;
  deleteState(playerId: string): SDResult<void>;
}

export class JsonPlayerQuestStore implements PlayerQuestStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder,
  ) {}

  public getState(playerId: string): SDResult<PlayerQuestState | undefined> {
    return this.jsonStore.getJson<PlayerQuestState | undefined>(
      this.keys.player(playerId, "quests", "state"),
      undefined,
    );
  }

  public setState(state: PlayerQuestState): SDResult<void> {
    return this.jsonStore.setJson(
      this.keys.player(state.playerId, "quests", "state"),
      state,
    );
  }

  public deleteState(playerId: string): SDResult<void> {
    return this.jsonStore.remove(this.keys.player(playerId, "quests", "state"));
  }
}

export interface PendingQuestRewardClaimStore {
  getClaims(playerId: string): SDResult<readonly PendingQuestRewardClaim[]>;
  setClaims(
    playerId: string,
    claims: readonly PendingQuestRewardClaim[],
  ): SDResult<void>;
  addClaim(claim: PendingQuestRewardClaim): SDResult<void>;
  updateClaim(claim: PendingQuestRewardClaim): SDResult<void>;
  getClaim(
    playerId: string,
    claimId: string,
  ): SDResult<PendingQuestRewardClaim | undefined>;
}

export class JsonPendingQuestRewardClaimStore implements PendingQuestRewardClaimStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder,
  ) {}

  public getClaims(
    playerId: string,
  ): SDResult<readonly PendingQuestRewardClaim[]> {
    return this.jsonStore.getJson<readonly PendingQuestRewardClaim[]>(
      this.keys.player(playerId, "quests", "pending_rewards"),
      [],
    );
  }

  public setClaims(
    playerId: string,
    claims: readonly PendingQuestRewardClaim[],
  ): SDResult<void> {
    return this.jsonStore.setJson(
      this.keys.player(playerId, "quests", "pending_rewards"),
      claims,
    );
  }

  public addClaim(claim: PendingQuestRewardClaim): SDResult<void> {
    const claimsResult = this.getClaims(claim.playerId);

    if (claimsResult.isFailure) {
      return SDResult.fail(claimsResult.error!);
    }

    const claims = claimsResult.getValueOrThrow();

    if (claims.some((existing) => existing.claimId === claim.claimId)) {
      return SDResult.fail(
        new SDError(
          "quest_reward_claim.duplicate",
          "Reward claim already exists.",
          {
            claimId: claim.claimId,
          },
        ),
      );
    }

    return this.setClaims(claim.playerId, [...claims, claim]);
  }

  public updateClaim(claim: PendingQuestRewardClaim): SDResult<void> {
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
          "quest_reward_claim.not_found",
          "Reward claim was not found.",
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
  ): SDResult<PendingQuestRewardClaim | undefined> {
    const claimsResult = this.getClaims(playerId);

    if (claimsResult.isFailure) {
      return SDResult.fail(claimsResult.error!);
    }

    return SDResult.ok(
      claimsResult.getValueOrThrow().find((claim) => claim.claimId === claimId),
    );
  }
}

export class QuestDefinitionRegistry {
  private readonly definitions = new Map<string, QuestDefinition>();

  public register(definition: QuestDefinition): SDResult<void> {
    const validation = this.validateDefinition(definition);

    if (validation.isFailure) {
      return validation;
    }

    if (this.definitions.has(definition.id)) {
      return SDResult.fail(
        new SDError(
          "quest_definition.duplicate",
          "Quest definition already registered.",
          {
            questId: definition.id,
          },
        ),
      );
    }

    this.definitions.set(definition.id, definition);
    return SDResult.ok(undefined);
  }

  public registerMany(definitions: readonly QuestDefinition[]): SDResult<void> {
    for (const definition of definitions) {
      const result = this.register(definition);

      if (result.isFailure) {
        return result;
      }
    }

    return SDResult.ok(undefined);
  }

  public get(id: string): SDResult<QuestDefinition> {
    const definition = this.definitions.get(id);

    if (definition === undefined) {
      return SDResult.fail(
        new SDError(
          "quest_definition.not_found",
          "Quest definition was not found.",
          { id },
        ),
      );
    }

    return SDResult.ok(definition);
  }

  public getAll(): readonly QuestDefinition[] {
    return [...this.definitions.values()];
  }

  public getByPeriod(period: QuestPeriod): readonly QuestDefinition[] {
    return this.getAll().filter((definition) => definition.period === period);
  }

  public getByTag(tag: string): readonly QuestDefinition[] {
    return this.getAll().filter((definition) => definition.tags.includes(tag));
  }

  private validateDefinition(definition: QuestDefinition): SDResult<void> {
    if (definition.id.trim().length === 0) {
      return SDResult.fail("Quest definition id is required.");
    }

    if (definition.title.trim().length === 0) {
      return SDResult.fail("Quest title is required.");
    }

    if (definition.weight <= 0) {
      return SDResult.fail(
        new SDError(
          "quest_definition.invalid_weight",
          "Quest weight must be greater than zero.",
          {
            questId: definition.id,
            weight: definition.weight,
          },
        ),
      );
    }

    if (definition.tasks.length === 0) {
      return SDResult.fail(
        new SDError(
          "quest_definition.no_tasks",
          "Quest must have at least one task.",
          {
            questId: definition.id,
          },
        ),
      );
    }

    if (definition.rewards.length === 0) {
      return SDResult.fail(
        new SDError(
          "quest_definition.no_rewards",
          "Quest must have at least one reward.",
          {
            questId: definition.id,
          },
        ),
      );
    }

    return SDResult.ok(undefined);
  }
}

export interface QuestRequirementHandler {
  readonly type: string;
  isEligible(
    player: Player,
    state: PlayerQuestState,
    requirement: QuestRequirementDefinition,
  ): SDResult<boolean>;
}

export class QuestRequirementRegistry {
  private readonly handlers = new Map<string, QuestRequirementHandler>();

  public register(handler: QuestRequirementHandler): SDResult<void> {
    if (this.handlers.has(handler.type)) {
      return SDResult.fail(
        new SDError(
          "quest_requirement.duplicate_handler",
          "Requirement handler already exists.",
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
    state: PlayerQuestState,
    definition: QuestDefinition,
  ): SDResult<boolean> {
    for (const requirement of definition.requirements ?? []) {
      const handler = this.handlers.get(requirement.type);

      if (handler === undefined) {
        return SDResult.fail(
          new SDError(
            "quest_requirement.missing_handler",
            "Missing requirement handler.",
            {
              questId: definition.id,
              requirementType: requirement.type,
            },
          ),
        );
      }

      const result = handler.isEligible(player, state, requirement);

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

export interface QuestSelectionContext {
  readonly player: Player;
  readonly period: QuestPeriod;
  readonly periodKey: string;
  readonly existingState: PlayerQuestState;
  readonly excludeQuestIds: readonly string[];
}

export interface QuestSelector {
  select(
    definitions: readonly QuestDefinition[],
    count: number,
    context: QuestSelectionContext,
  ): SDResult<readonly QuestDefinition[]>;
}

export class WeightedRandomQuestSelector implements QuestSelector {
  public select(
    definitions: readonly QuestDefinition[],
    count: number,
    context: QuestSelectionContext,
  ): SDResult<readonly QuestDefinition[]> {
    const excluded = new Set(context.excludeQuestIds);

    const pool = definitions.filter(
      (definition) => !excluded.has(definition.id),
    );

    if (pool.length < count) {
      return SDResult.fail(
        new SDError(
          "quest_selector.not_enough_quests",
          "Not enough eligible quests.",
          {
            requested: count,
            available: pool.length,
            period: context.period,
          },
        ),
      );
    }

    const selected: QuestDefinition[] = [];
    const remaining = [...pool];

    while (selected.length < count && remaining.length > 0) {
      const picked = this.pickOne(remaining);
      selected.push(picked);

      const index = remaining.findIndex(
        (definition) => definition.id === picked.id,
      );
      remaining.splice(index, 1);
    }

    return SDResult.ok(selected);
  }

  private pickOne(definitions: readonly QuestDefinition[]): QuestDefinition {
    const totalWeight = definitions.reduce(
      (sum, definition) => sum + definition.weight,
      0,
    );
    let roll = Math.random() * totalWeight;

    for (const definition of definitions) {
      roll -= definition.weight;

      if (roll <= 0) {
        return definition;
      }
    }

    return definitions[definitions.length - 1];
  }
}

export class TagBalancedQuestSelector implements QuestSelector {
  public constructor(
    private readonly fallback: QuestSelector = new WeightedRandomQuestSelector(),
  ) {}

  public select(
    definitions: readonly QuestDefinition[],
    count: number,
    context: QuestSelectionContext,
  ): SDResult<readonly QuestDefinition[]> {
    const firstPass = this.fallback.select(definitions, count, context);

    if (firstPass.isFailure) {
      return firstPass;
    }

    return firstPass;
  }
}

export class QuestAssignmentFactory {
  public constructor(
    private readonly idGenerator: QuestIdGenerator,
    private readonly clock: QuestClock,
  ) {}

  public createAssignments(
    player: Player,
    period: QuestPeriod,
    periodKey: string,
    definitions: readonly QuestDefinition[],
  ): readonly QuestAssignment[] {
    const tick = this.clock.getCurrentTick();

    return definitions.map((definition) => ({
      assignmentId: this.idGenerator.createAssignmentId(
        player.id,
        definition.id,
        periodKey,
      ),
      questId: definition.id,
      period,
      playerId: player.id,
      assignedAtTick: tick,
      periodKey,
      status: QuestStatus.Active,
      taskProgress: definition.tasks.map((task) => ({
        taskId: task.id,
        currentAmount: 0,
        requiredAmount: task.requiredAmount,
        completed: false,
      })),
    }));
  }
}

export class PlayerQuestStateFactory {
  public createNew(
    playerId: string,
    dailyPeriodKey: string,
    weeklyPeriodKey: string,
  ): PlayerQuestState {
    return {
      playerId,
      dailyPeriodKey,
      weeklyPeriodKey,
      dailyAssignments: [],
      weeklyAssignments: [],
      completedQuestIds: [],
      completedAssignmentIds: [],
      pendingRewardClaimIds: [],
      version: 1,
    };
  }
}

export interface QuestAssignmentOptions {
  readonly dailyQuestCount: number;
  readonly weeklyQuestCount: number;
  readonly excludeCompletedQuestIds?: boolean;
}

export class QuestAssignmentService {
  public constructor(
    private readonly definitions: QuestDefinitionRegistry,
    private readonly requirements: QuestRequirementRegistry,
    private readonly selector: QuestSelector,
    private readonly store: PlayerQuestStore,
    private readonly stateFactory: PlayerQuestStateFactory,
    private readonly assignmentFactory: QuestAssignmentFactory,
    private readonly clock: QuestClock,
    private readonly options: QuestAssignmentOptions,
    private readonly logger?: Logger,
  ) {}

  public ensureCurrentAssignments(player: Player): SDResult<PlayerQuestState> {
    const stateResult = this.getOrCreateState(player);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    let state = stateResult.getValueOrThrow();

    const currentDailyKey = this.clock.getDailyPeriodKey();
    const currentWeeklyKey = this.clock.getWeeklyPeriodKey();

    if (state.dailyPeriodKey !== currentDailyKey) {
      const result = this.rotatePeriod(
        player,
        state,
        QuestPeriod.Daily,
        currentDailyKey,
      );

      if (result.isFailure) {
        return SDResult.fail(result.error!);
      }

      state = result.getValueOrThrow();
    }

    if (state.weeklyPeriodKey !== currentWeeklyKey) {
      const result = this.rotatePeriod(
        player,
        state,
        QuestPeriod.Weekly,
        currentWeeklyKey,
      );

      if (result.isFailure) {
        return SDResult.fail(result.error!);
      }

      state = result.getValueOrThrow();
    }

    const saveResult = this.store.setState(state);

    if (saveResult.isFailure) {
      return SDResult.fail(saveResult.error!);
    }

    return SDResult.ok(state);
  }

  public getOrCreateState(player: Player): SDResult<PlayerQuestState> {
    const existingResult = this.store.getState(player.id);

    if (existingResult.isFailure) {
      return SDResult.fail(existingResult.error!);
    }

    const existing = existingResult.value;

    if (existing !== undefined) {
      return SDResult.ok(existing);
    }

    const state = this.stateFactory.createNew(
      player.id,
      this.clock.getDailyPeriodKey(),
      this.clock.getWeeklyPeriodKey(),
    );

    return SDResult.ok(state);
  }

  public rerollDaily(player: Player): SDResult<PlayerQuestState> {
    const stateResult = this.getOrCreateState(player);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    return this.rotatePeriod(
      player,
      stateResult.getValueOrThrow(),
      QuestPeriod.Daily,
      this.clock.getDailyPeriodKey(),
    );
  }

  public rerollWeekly(player: Player): SDResult<PlayerQuestState> {
    const stateResult = this.getOrCreateState(player);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    return this.rotatePeriod(
      player,
      stateResult.getValueOrThrow(),
      QuestPeriod.Weekly,
      this.clock.getWeeklyPeriodKey(),
    );
  }

  private rotatePeriod(
    player: Player,
    state: PlayerQuestState,
    period: QuestPeriod,
    periodKey: string,
  ): SDResult<PlayerQuestState> {
    const questCount =
      period === QuestPeriod.Daily
        ? this.options.dailyQuestCount
        : this.options.weeklyQuestCount;

    const eligibleResult = this.getEligibleDefinitions(player, state, period);

    if (eligibleResult.isFailure) {
      return SDResult.fail(eligibleResult.error!);
    }

    const excludeQuestIds =
      this.options.excludeCompletedQuestIds === true
        ? state.completedQuestIds
        : [];

    const selectionResult = this.selector.select(
      eligibleResult.getValueOrThrow(),
      questCount,
      {
        player,
        period,
        periodKey,
        existingState: state,
        excludeQuestIds,
      },
    );

    if (selectionResult.isFailure) {
      return SDResult.fail(selectionResult.error!);
    }

    const assignments = this.assignmentFactory.createAssignments(
      player,
      period,
      periodKey,
      selectionResult.getValueOrThrow(),
    );

    const expiredDaily =
      period === QuestPeriod.Daily
        ? this.expireActiveAssignments(state.dailyAssignments)
        : state.dailyAssignments;

    const expiredWeekly =
      period === QuestPeriod.Weekly
        ? this.expireActiveAssignments(state.weeklyAssignments)
        : state.weeklyAssignments;

    const updated: PlayerQuestState = {
      ...state,
      dailyPeriodKey:
        period === QuestPeriod.Daily ? periodKey : state.dailyPeriodKey,
      weeklyPeriodKey:
        period === QuestPeriod.Weekly ? periodKey : state.weeklyPeriodKey,
      dailyAssignments:
        period === QuestPeriod.Daily ? assignments : expiredDaily,
      weeklyAssignments:
        period === QuestPeriod.Weekly ? assignments : expiredWeekly,
    };

    this.logger?.info("quests", "Rotated quest period.", {
      playerId: player.id,
      period,
      periodKey,
      questCount: assignments.length,
    });

    const saveResult = this.store.setState(updated);

    if (saveResult.isFailure) {
      return SDResult.fail(saveResult.error!);
    }

    return SDResult.ok(updated);
  }

  private getEligibleDefinitions(
    player: Player,
    state: PlayerQuestState,
    period: QuestPeriod,
  ): SDResult<readonly QuestDefinition[]> {
    const all = this.definitions.getByPeriod(period);
    const eligible: QuestDefinition[] = [];

    for (const definition of all) {
      const requirementResult = this.requirements.isEligible(
        player,
        state,
        definition,
      );

      if (requirementResult.isFailure) {
        return SDResult.fail(requirementResult.error!);
      }

      if (requirementResult.getValueOrThrow()) {
        eligible.push(definition);
      }
    }

    return SDResult.ok(eligible);
  }

  private expireActiveAssignments(
    assignments: readonly QuestAssignment[],
  ): readonly QuestAssignment[] {
    return assignments.map((assignment) =>
      assignment.status === QuestStatus.Active
        ? {
            ...assignment,
            status: QuestStatus.Expired,
          }
        : assignment,
    );
  }
}

export interface QuestObjectiveHandler {
  readonly objectiveType: QuestObjectiveType | string;

  canHandle(event: QuestEvent, task: QuestTaskDefinition): boolean;

  getProgressAmount(event: QuestEvent, task: QuestTaskDefinition): number;
}

export class QuestObjectiveHandlerRegistry {
  private readonly handlers = new Map<string, QuestObjectiveHandler>();

  public register(handler: QuestObjectiveHandler): SDResult<void> {
    if (this.handlers.has(handler.objectiveType)) {
      return SDResult.fail(
        new SDError(
          "quest_objective.duplicate_handler",
          "Objective handler already registered.",
          {
            objectiveType: handler.objectiveType,
          },
        ),
      );
    }

    this.handlers.set(handler.objectiveType, handler);
    return SDResult.ok(undefined);
  }

  public get(objectiveType: string): SDResult<QuestObjectiveHandler> {
    const handler = this.handlers.get(objectiveType);

    if (handler === undefined) {
      return SDResult.fail(
        new SDError(
          "quest_objective.handler_not_found",
          "Objective handler was not found.",
          {
            objectiveType,
          },
        ),
      );
    }

    return SDResult.ok(handler);
  }
}

export abstract class TargetTypeQuestObjectiveHandler implements QuestObjectiveHandler {
  public abstract readonly objectiveType: QuestObjectiveType | string;

  public canHandle(event: QuestEvent, task: QuestTaskDefinition): boolean {
    if (event.type !== this.objectiveType) {
      return false;
    }

    if (task.objectiveType !== this.objectiveType) {
      return false;
    }

    if (task.target.dimensions !== undefined && event.location !== undefined) {
      if (!task.target.dimensions.includes(event.location.dimensionId)) {
        return false;
      }
    }

    if (task.target.typeIds === undefined || task.target.typeIds.length === 0) {
      return true;
    }

    if (event.targetTypeId === undefined) {
      return false;
    }

    return task.target.typeIds.includes(event.targetTypeId);
  }

  public getProgressAmount(
    event: QuestEvent,
    _task: QuestTaskDefinition,
  ): number {
    return Math.max(1, event.amount);
  }
}

export class BreakBlockObjectiveHandler extends TargetTypeQuestObjectiveHandler {
  public readonly objectiveType = QuestObjectiveType.BreakBlock;
}

export class PlaceBlockObjectiveHandler extends TargetTypeQuestObjectiveHandler {
  public readonly objectiveType = QuestObjectiveType.PlaceBlock;
}

export class KillEntityObjectiveHandler extends TargetTypeQuestObjectiveHandler {
  public readonly objectiveType = QuestObjectiveType.KillEntity;
}

export class CollectItemObjectiveHandler extends TargetTypeQuestObjectiveHandler {
  public readonly objectiveType = QuestObjectiveType.CollectItem;
}

export class CraftItemObjectiveHandler extends TargetTypeQuestObjectiveHandler {
  public readonly objectiveType = QuestObjectiveType.CraftItem;
}

export class GainExperienceObjectiveHandler implements QuestObjectiveHandler {
  public readonly objectiveType = QuestObjectiveType.GainExperience;

  public canHandle(event: QuestEvent, task: QuestTaskDefinition): boolean {
    return (
      event.type === this.objectiveType &&
      task.objectiveType === this.objectiveType
    );
  }

  public getProgressAmount(
    event: QuestEvent,
    _task: QuestTaskDefinition,
  ): number {
    return Math.max(1, event.amount);
  }
}

export class TravelDistanceObjectiveHandler implements QuestObjectiveHandler {
  public readonly objectiveType = QuestObjectiveType.TravelDistance;

  public canHandle(event: QuestEvent, task: QuestTaskDefinition): boolean {
    return (
      event.type === this.objectiveType &&
      task.objectiveType === this.objectiveType
    );
  }

  public getProgressAmount(
    event: QuestEvent,
    _task: QuestTaskDefinition,
  ): number {
    return Math.max(0, event.amount);
  }
}

export class EnterDimensionObjectiveHandler implements QuestObjectiveHandler {
  public readonly objectiveType = QuestObjectiveType.EnterDimension;

  public canHandle(event: QuestEvent, task: QuestTaskDefinition): boolean {
    if (
      event.type !== this.objectiveType ||
      task.objectiveType !== this.objectiveType
    ) {
      return false;
    }

    if (event.location === undefined) {
      return false;
    }

    if (
      task.target.dimensions === undefined ||
      task.target.dimensions.length === 0
    ) {
      return true;
    }

    return task.target.dimensions.includes(event.location.dimensionId);
  }

  public getProgressAmount(
    _event: QuestEvent,
    _task: QuestTaskDefinition,
  ): number {
    return 1;
  }
}

export class QuestRewardClaimService {
  public constructor(
    private readonly store: PendingQuestRewardClaimStore,
    private readonly idGenerator: QuestIdGenerator,
    private readonly clock: QuestClock,
  ) {}

  public createClaim(
    player: Player,
    assignment: QuestAssignment,
    definition: QuestDefinition,
  ): SDResult<PendingQuestRewardClaim> {
    const claim: PendingQuestRewardClaim = {
      claimId: this.idGenerator.createRewardClaimId(
        player.id,
        assignment.assignmentId,
      ),
      playerId: player.id,
      sourceQuestId: definition.id,
      sourceAssignmentId: assignment.assignmentId,
      sourcePeriod: definition.period,
      title: definition.title,
      rewards: definition.rewards,
      status: QuestRewardClaimStatus.Pending,
      createdAtTick: this.clock.getCurrentTick(),
    };

    const addResult = this.store.addClaim(claim);

    if (addResult.isFailure) {
      return SDResult.fail(addResult.error!);
    }

    return SDResult.ok(claim);
  }

  public getPendingClaims(
    player: Player,
  ): SDResult<readonly PendingQuestRewardClaim[]> {
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
  ): SDResult<PendingQuestRewardClaim> {
    const claimResult = this.store.getClaim(playerId, claimId);

    if (claimResult.isFailure) {
      return SDResult.fail(claimResult.error!);
    }

    const claim = claimResult.value;

    if (claim === undefined) {
      return SDResult.fail(
        new SDError(
          "quest_reward_claim.not_found",
          "Reward claim was not found.",
          {
            playerId,
            claimId,
          },
        ),
      );
    }

    const updated: PendingQuestRewardClaim = {
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
}

export class QuestProgressService {
  public constructor(
    private readonly definitions: QuestDefinitionRegistry,
    private readonly handlers: QuestObjectiveHandlerRegistry,
    private readonly questStore: PlayerQuestStore,
    private readonly rewardClaims: QuestRewardClaimService,
    private readonly logger?: Logger,
  ) {}

  public applyEvent(event: QuestEvent): SDResult<QuestProgressApplyResult> {
    const stateResult = this.questStore.getState(event.player.id);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.value;

    if (state === undefined) {
      return SDResult.ok({
        changed: false,
        completedAssignments: [],
        createdRewardClaims: [],
      });
    }

    const dailyResult = this.applyEventToAssignments(
      event,
      state.dailyAssignments,
    );
    const weeklyResult = this.applyEventToAssignments(
      event,
      state.weeklyAssignments,
    );

    if (dailyResult.isFailure) {
      return SDResult.fail(dailyResult.error!);
    }

    if (weeklyResult.isFailure) {
      return SDResult.fail(weeklyResult.error!);
    }

    const daily = dailyResult.getValueOrThrow();
    const weekly = weeklyResult.getValueOrThrow();

    const changed = daily.changed || weekly.changed;

    if (!changed) {
      return SDResult.ok({
        changed: false,
        completedAssignments: [],
        createdRewardClaims: [],
      });
    }

    const completedAssignments = [
      ...daily.completedAssignments,
      ...weekly.completedAssignments,
    ];
    const createdClaims = [
      ...daily.createdRewardClaims,
      ...weekly.createdRewardClaims,
    ];

    const updatedState: PlayerQuestState = {
      ...state,
      dailyAssignments: daily.assignments,
      weeklyAssignments: weekly.assignments,
      completedQuestIds: [
        ...state.completedQuestIds,
        ...completedAssignments.map((assignment) => assignment.questId),
      ],
      completedAssignmentIds: [
        ...state.completedAssignmentIds,
        ...completedAssignments.map((assignment) => assignment.assignmentId),
      ],
      pendingRewardClaimIds: [
        ...state.pendingRewardClaimIds,
        ...createdClaims.map((claim) => claim.claimId),
      ],
    };

    const saveResult = this.questStore.setState(updatedState);

    if (saveResult.isFailure) {
      return SDResult.fail(saveResult.error!);
    }

    return SDResult.ok({
      changed: true,
      completedAssignments,
      createdRewardClaims: createdClaims,
    });
  }

  private applyEventToAssignments(
    event: QuestEvent,
    assignments: readonly QuestAssignment[],
  ): SDResult<{
    readonly changed: boolean;
    readonly assignments: readonly QuestAssignment[];
    readonly completedAssignments: readonly QuestAssignment[];
    readonly createdRewardClaims: readonly PendingQuestRewardClaim[];
  }> {
    let changed = false;
    const completedAssignments: QuestAssignment[] = [];
    const createdRewardClaims: PendingQuestRewardClaim[] = [];

    const updatedAssignments: QuestAssignment[] = [];

    for (const assignment of assignments) {
      if (assignment.status !== QuestStatus.Active) {
        updatedAssignments.push(assignment);
        continue;
      }

      const definitionResult = this.definitions.get(assignment.questId);

      if (definitionResult.isFailure) {
        return SDResult.fail(definitionResult.error!);
      }

      const definition = definitionResult.getValueOrThrow();

      const updateResult = this.applyEventToAssignment(
        event,
        assignment,
        definition,
      );

      if (updateResult.isFailure) {
        return SDResult.fail(updateResult.error!);
      }

      let updatedAssignment = updateResult.getValueOrThrow();

      if (updatedAssignment !== assignment) {
        changed = true;
      }

      if (this.isAssignmentComplete(updatedAssignment, definition)) {
        const claimResult = this.rewardClaims.createClaim(
          event.player,
          updatedAssignment,
          definition,
        );

        if (claimResult.isFailure) {
          return SDResult.fail(claimResult.error!);
        }

        const claim = claimResult.getValueOrThrow();

        updatedAssignment = {
          ...updatedAssignment,
          status: QuestStatus.RewardPending,
          completedAtTick: Number(world.getAbsoluteTime?.() ?? 0),
          rewardClaimId: claim.claimId,
        };

        completedAssignments.push(updatedAssignment);
        createdRewardClaims.push(claim);
        changed = true;

        this.logger?.info("quests", "Quest completed.", {
          playerId: event.player.id,
          questId: definition.id,
          assignmentId: assignment.assignmentId,
          claimId: claim.claimId,
        });
      }

      updatedAssignments.push(updatedAssignment);
    }

    return SDResult.ok({
      changed,
      assignments: updatedAssignments,
      completedAssignments,
      createdRewardClaims,
    });
  }

  private applyEventToAssignment(
    event: QuestEvent,
    assignment: QuestAssignment,
    definition: QuestDefinition,
  ): SDResult<QuestAssignment> {
    let changed = false;

    const updatedProgress: QuestTaskProgress[] = [];

    for (const progress of assignment.taskProgress) {
      if (progress.completed) {
        updatedProgress.push(progress);
        continue;
      }

      const task = definition.tasks.find(
        (candidate) => candidate.id === progress.taskId,
      );

      if (task === undefined) {
        return SDResult.fail(
          new SDError(
            "quest_progress.task_definition_missing",
            "Task definition was missing.",
            {
              questId: definition.id,
              taskId: progress.taskId,
            },
          ),
        );
      }

      const handlerResult = this.handlers.get(task.objectiveType);

      if (handlerResult.isFailure) {
        return SDResult.fail(handlerResult.error!);
      }

      const handler = handlerResult.getValueOrThrow();

      if (!handler.canHandle(event, task)) {
        updatedProgress.push(progress);
        continue;
      }

      const amount = handler.getProgressAmount(event, task);

      if (amount <= 0) {
        updatedProgress.push(progress);
        continue;
      }

      const nextAmount = Math.min(
        progress.requiredAmount,
        progress.currentAmount + amount,
      );

      updatedProgress.push({
        ...progress,
        currentAmount: nextAmount,
        completed: nextAmount >= progress.requiredAmount,
      });

      changed = true;
    }

    if (!changed) {
      return SDResult.ok(assignment);
    }

    return SDResult.ok({
      ...assignment,
      taskProgress: updatedProgress,
    });
  }

  private isAssignmentComplete(
    assignment: QuestAssignment,
    definition: QuestDefinition,
  ): boolean {
    for (const task of definition.tasks) {
      if (task.optional === true) {
        continue;
      }

      const progress = assignment.taskProgress.find(
        (candidate) => candidate.taskId === task.id,
      );

      if (progress === undefined || !progress.completed) {
        return false;
      }
    }

    return true;
  }
}

export class QuestGuidebookService {
  public constructor(
    private readonly definitions: QuestDefinitionRegistry,
    private readonly assignments: QuestAssignmentService,
    private readonly rewardClaimService: QuestRewardClaimService,
    private readonly clock: QuestClock,
  ) {}

  public createView(player: Player): SDResult<QuestGuidebookView> {
    const stateResult = this.assignments.ensureCurrentAssignments(player);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    const pendingRewardsResult =
      this.rewardClaimService.getPendingClaims(player);

    if (pendingRewardsResult.isFailure) {
      return SDResult.fail(pendingRewardsResult.error!);
    }

    return SDResult.ok({
      daily: this.createPeriodView(
        QuestPeriod.Daily,
        "Daily Quests",
        state.dailyPeriodKey,
        this.clock.getDailyResetText(),
        state.dailyAssignments,
      ),
      weekly: this.createPeriodView(
        QuestPeriod.Weekly,
        "Weekly Quests",
        state.weeklyPeriodKey,
        this.clock.getWeeklyResetText(),
        state.weeklyAssignments,
      ),
      pendingRewards: pendingRewardsResult
        .getValueOrThrow()
        .map((claim) => this.createRewardClaimView(claim)),
    });
  }

  private createPeriodView(
    period: QuestPeriod,
    title: string,
    periodKey: string,
    resetsInText: string,
    assignments: readonly QuestAssignment[],
  ): QuestPeriodView {
    return {
      period,
      title,
      periodKey,
      resetsInText,
      quests: assignments.map((assignment) =>
        this.createAssignmentView(assignment),
      ),
    };
  }

  private createAssignmentView(
    assignment: QuestAssignment,
  ): QuestAssignmentView {
    const definitionResult = this.definitions.get(assignment.questId);

    if (definitionResult.isFailure) {
      return {
        assignmentId: assignment.assignmentId,
        questId: assignment.questId,
        title: "Unknown Quest",
        description: "This quest definition could not be found.",
        status: assignment.status,
        tags: [],
        tasks: [],
        rewardSummary: [],
        completed: false,
        rewardPending: false,
      };
    }

    const definition = definitionResult.getValueOrThrow();

    return {
      assignmentId: assignment.assignmentId,
      questId: definition.id,
      title: definition.title,
      description: definition.description,
      status: assignment.status,
      tags: definition.tags,
      difficulty: definition.difficulty,
      tasks: assignment.taskProgress.map((progress) =>
        this.createTaskProgressView(definition, progress),
      ),
      rewardSummary: definition.rewards.map((reward) =>
        this.summarizeReward(reward),
      ),
      completed:
        assignment.status === QuestStatus.Completed ||
        assignment.status === QuestStatus.RewardPending ||
        assignment.status === QuestStatus.RewardClaimed,
      rewardPending: assignment.status === QuestStatus.RewardPending,
    };
  }

  private createTaskProgressView(
    definition: QuestDefinition,
    progress: QuestTaskProgress,
  ): QuestTaskProgressView {
    const task = definition.tasks.find(
      (candidate) => candidate.id === progress.taskId,
    );

    if (task === undefined) {
      return {
        taskId: progress.taskId,
        title: "Unknown Task",
        description: "This task definition could not be found.",
        currentAmount: progress.currentAmount,
        requiredAmount: progress.requiredAmount,
        completed: progress.completed,
        progressText: `${progress.currentAmount}/${progress.requiredAmount}`,
      };
    }

    return {
      taskId: task.id,
      title: task.title,
      description: task.description,
      currentAmount: progress.currentAmount,
      requiredAmount: progress.requiredAmount,
      completed: progress.completed,
      progressText: `${progress.currentAmount}/${progress.requiredAmount}`,
    };
  }

  private createRewardClaimView(
    claim: PendingQuestRewardClaim,
  ): PendingQuestRewardClaimView {
    return {
      claimId: claim.claimId,
      title: claim.title,
      sourceQuestId: claim.sourceQuestId,
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

    if (reward.type === QuestRewardType.Item) {
      const payload = reward.payload as Partial<ItemQuestRewardPayload>;

      if (payload.typeId !== undefined) {
        return `${payload.amount ?? 1}x ${payload.typeId}`;
      }
    }

    if (reward.type === QuestRewardType.Experience) {
      const payload = reward.payload as Partial<ExperienceQuestRewardPayload>;
      return `${payload.amount ?? 0} XP`;
    }

    return reward.id;
  }
}

export interface QuestSystemServices {
  readonly definitions: QuestDefinitionRegistry;
  readonly requirements: QuestRequirementRegistry;
  readonly selector: QuestSelector;
  readonly questStore: PlayerQuestStore;
  readonly rewardClaimStore: PendingQuestRewardClaimStore;
  readonly rewardClaims: QuestRewardClaimService;
  readonly assignments: QuestAssignmentService;
  readonly objectives: QuestObjectiveHandlerRegistry;
  readonly progress: QuestProgressService;
  readonly guidebook: QuestGuidebookService;
  readonly clock: QuestClock;
}

export interface QuestSystemOptions {
  readonly dailyQuestCount?: number;
  readonly weeklyQuestCount?: number;
  readonly excludeCompletedQuestIds?: boolean;
}

export class QuestSystem {
  public constructor(public readonly services: QuestSystemServices) {}

  public initializeDefaultObjectiveHandlers(): SDResult<void> {
    const handlers: readonly QuestObjectiveHandler[] = [
      new BreakBlockObjectiveHandler(),
      new PlaceBlockObjectiveHandler(),
      new KillEntityObjectiveHandler(),
      new CollectItemObjectiveHandler(),
      new CraftItemObjectiveHandler(),
      new GainExperienceObjectiveHandler(),
      new TravelDistanceObjectiveHandler(),
      new EnterDimensionObjectiveHandler(),
    ];

    for (const handler of handlers) {
      const result = this.services.objectives.register(handler);

      if (result.isFailure) {
        return result;
      }
    }

    return SDResult.ok(undefined);
  }

  public registerQuest(definition: QuestDefinition): SDResult<void> {
    return this.services.definitions.register(definition);
  }

  public registerQuests(
    definitions: readonly QuestDefinition[],
  ): SDResult<void> {
    return this.services.definitions.registerMany(definitions);
  }

  public ensurePlayerQuests(player: Player): SDResult<PlayerQuestState> {
    return this.services.assignments.ensureCurrentAssignments(player);
  }

  public applyEvent(event: QuestEvent): SDResult<QuestProgressApplyResult> {
    return this.services.progress.applyEvent(event);
  }

  public getGuidebookView(player: Player): SDResult<QuestGuidebookView> {
    return this.services.guidebook.createView(player);
  }

  public getPendingRewards(
    player: Player,
  ): SDResult<readonly PendingQuestRewardClaim[]> {
    return this.services.rewardClaims.getPendingClaims(player);
  }

  public markRewardClaimed(
    playerId: string,
    claimId: string,
  ): SDResult<PendingQuestRewardClaim> {
    return this.services.rewardClaims.markClaimed(playerId, claimId);
  }
}

export class QuestSystemFactory {
  public static create(
    jsonStore: JsonStore,
    keys: KeyBuilder,
    logger?: Logger,
    options: QuestSystemOptions = {},
  ): QuestSystem {
    const clock = new RealDateQuestClock();
    const idGenerator = new DefaultQuestIdGenerator();

    const definitions = new QuestDefinitionRegistry();
    const requirements = new QuestRequirementRegistry();
    const selector = new WeightedRandomQuestSelector();

    const questStore = new JsonPlayerQuestStore(jsonStore, keys);
    const rewardClaimStore = new JsonPendingQuestRewardClaimStore(
      jsonStore,
      keys,
    );

    const stateFactory = new PlayerQuestStateFactory();
    const assignmentFactory = new QuestAssignmentFactory(idGenerator, clock);

    const rewardClaims = new QuestRewardClaimService(
      rewardClaimStore,
      idGenerator,
      clock,
    );

    const assignments = new QuestAssignmentService(
      definitions,
      requirements,
      selector,
      questStore,
      stateFactory,
      assignmentFactory,
      clock,
      {
        dailyQuestCount:
          options.dailyQuestCount ?? QuestConstants.defaultDailyQuestCount,
        weeklyQuestCount:
          options.weeklyQuestCount ?? QuestConstants.defaultWeeklyQuestCount,
        excludeCompletedQuestIds: options.excludeCompletedQuestIds ?? false,
      },
      logger,
    );

    const objectives = new QuestObjectiveHandlerRegistry();

    const progress = new QuestProgressService(
      definitions,
      objectives,
      questStore,
      rewardClaims,
      logger,
    );

    const guidebook = new QuestGuidebookService(
      definitions,
      assignments,
      rewardClaims,
      clock,
    );

    return new QuestSystem({
      definitions,
      requirements,
      selector,
      questStore,
      rewardClaimStore,
      rewardClaims,
      assignments,
      objectives,
      progress,
      guidebook,
      clock,
    });
  }
}

export class QuestEvents {
  public static blockBroken(
    player: Player,
    blockTypeId: string,
    location?: LocationRef,
  ): QuestEvent {
    return {
      type: QuestObjectiveType.BreakBlock,
      player,
      amount: 1,
      targetTypeId: blockTypeId,
      location,
    };
  }

  public static blockPlaced(
    player: Player,
    blockTypeId: string,
    location?: LocationRef,
  ): QuestEvent {
    return {
      type: QuestObjectiveType.PlaceBlock,
      player,
      amount: 1,
      targetTypeId: blockTypeId,
      location,
    };
  }

  public static entityKilled(
    player: Player,
    entityTypeId: string,
    location?: LocationRef,
  ): QuestEvent {
    return {
      type: QuestObjectiveType.KillEntity,
      player,
      amount: 1,
      targetTypeId: entityTypeId,
      location,
    };
  }

  public static itemCollected(
    player: Player,
    itemTypeId: string,
    amount: number,
  ): QuestEvent {
    return {
      type: QuestObjectiveType.CollectItem,
      player,
      amount,
      targetTypeId: itemTypeId,
    };
  }

  public static itemCrafted(
    player: Player,
    itemTypeId: string,
    amount: number,
  ): QuestEvent {
    return {
      type: QuestObjectiveType.CraftItem,
      player,
      amount,
      targetTypeId: itemTypeId,
    };
  }

  public static distanceTraveled(
    player: Player,
    blocks: number,
    location?: LocationRef,
  ): QuestEvent {
    return {
      type: QuestObjectiveType.TravelDistance,
      player,
      amount: blocks,
      location,
    };
  }

  public static experienceGained(player: Player, amount: number): QuestEvent {
    return {
      type: QuestObjectiveType.GainExperience,
      player,
      amount,
    };
  }

  public static dimensionEntered(
    player: Player,
    dimensionId: string,
    location?: LocationRef,
  ): QuestEvent {
    return {
      type: QuestObjectiveType.EnterDimension,
      player,
      amount: 1,
      location,
      metadata: {
        dimensionId,
      },
    };
  }
}