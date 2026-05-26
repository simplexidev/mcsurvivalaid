
export const WorldEventConstants = Object.freeze({
  ticksPerSecond: 20,
  ticksPerMinute: 20 * 60,
  ticksPerHour: 20 * 60 * 60,
  defaultPlayerTriggerCooldownTicks: 20 * 60 * 60,
  defaultTriggerCheckIntervalTicks: 20 * 10,
  defaultMaxActiveEvents: 3,
});

export enum WorldEventStatus {
  Pending = "pending",
  Active = "active",
  Completed = "completed",
  Failed = "failed",
  Expired = "expired",
  Cancelled = "cancelled",
}

export enum WorldEventTriggerType {
  NearStructure = "near_structure",
  NearVillage = "near_village",
  EnterBiome = "enter_biome",
  RandomNearPlayer = "random_near_player",
  Custom = "custom",
}

export enum WorldEventScenarioType {
  SpawnEntities = "spawn_entities",
  BossEncounter = "boss_encounter",
  HordeEncounter = "horde_encounter",
  DefendArea = "defend_area",
  Custom = "custom",
}

export enum WorldEventFailureType {
  TimeExpired = "time_expired",
  PlayerLeftArea = "player_left_area",
  ProtectedEntityKilled = "protected_entity_killed",
  ObjectiveFailed = "objective_failed",
  Custom = "custom",
}

export enum WorldEventRewardScope {
  Participants = "participants",
  TriggeringPlayer = "triggering_player",
  NearbyPlayers = "nearby_players",
  AllOnlinePlayers = "all_online_players",
}

export interface WorldEventDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;

  readonly weight: number;

  readonly tags: readonly string[];

  readonly trigger: WorldEventTriggerDefinition;
  readonly scenario: WorldEventScenarioDefinition;

  readonly objectives: readonly QuestTaskDefinition[];

  readonly rewards: readonly QuestRewardDefinition[];

  readonly maxDurationTicks: number;

  readonly radiusBlocks: number;

  readonly requirements?: readonly WorldEventRequirementDefinition[];

  readonly rewardScope?: WorldEventRewardScope;

  readonly playerTriggerCooldownTicks?: number;

  readonly maxSimultaneousInstances?: number;
}

export interface WorldEventTriggerDefinition {
  readonly type: WorldEventTriggerType | string;

  readonly chancePerCheck: number;

  readonly structureTypes?: readonly string[];
  readonly biomeTypes?: readonly string[];
  readonly dimensions?: readonly string[];

  readonly triggerRadiusBlocks?: number;

  readonly originSearchRadiusBlocks?: number;

  readonly minimumPlayersNearby?: number;

  readonly payload?: unknown;
}

export interface WorldEventScenarioDefinition {
  readonly type: WorldEventScenarioType | string;

  readonly spawnGroups?: readonly WorldEventSpawnGroupDefinition[];

  readonly announcement?: string;

  readonly failureConditions?: readonly WorldEventFailureConditionDefinition[];

  readonly payload?: unknown;
}

export interface WorldEventSpawnGroupDefinition {
  readonly entityTypeId: string;
  readonly count: number;

  readonly spawnRadiusMin: number;
  readonly spawnRadiusMax: number;

  readonly tags?: readonly string[];

  readonly nameTag?: string;

  readonly payload?: unknown;
}

export interface WorldEventFailureConditionDefinition {
  readonly type: WorldEventFailureType | string;
  readonly payload?: unknown;
}

export interface WorldEventRequirementDefinition {
  readonly type: string;
  readonly payload?: unknown;
}

export interface ActiveWorldEvent {
  readonly eventInstanceId: string;
  readonly definitionId: string;

  readonly status: WorldEventStatus;

  readonly triggeringPlayerId: string;
  readonly participantPlayerIds: readonly string[];

  readonly startedAtTick: number;
  readonly expiresAtTick: number;
  readonly completedAtTick?: number;
  readonly failedAtTick?: number;
  readonly cancelledAtTick?: number;

  readonly origin: LocationRef;
  readonly radiusBlocks: number;

  readonly taskProgress: readonly QuestTaskProgress[];

  readonly spawnedEntityIds: readonly string[];

  readonly rewardClaimIds: readonly string[];

  readonly failureReason?: WorldEventFailureReason;

  readonly metadata?: Record<string, unknown>;
}

export interface WorldEventFailureReason {
  readonly type: WorldEventFailureType | string;
  readonly message: string;
  readonly details?: unknown;
}

export interface WorldEventHistoryEntry {
  readonly eventInstanceId: string;
  readonly definitionId: string;
  readonly status: WorldEventStatus;

  readonly startedAtTick: number;
  readonly completedAtTick?: number;
  readonly failedAtTick?: number;
  readonly expiredAtTick?: number;
  readonly cancelledAtTick?: number;

  readonly triggeringPlayerId: string;
  readonly participantPlayerIds: readonly string[];

  readonly origin: LocationRef;
  readonly rewardClaimIds: readonly string[];

  readonly failureReason?: WorldEventFailureReason;
}

export interface WorldEventWorldState {
  readonly activeEvents: readonly ActiveWorldEvent[];
  readonly history: readonly WorldEventHistoryEntry[];
  readonly version: number;
}

export interface PlayerWorldEventState {
  readonly playerId: string;

  readonly lastTriggeredAtTick: number;

  readonly participatedEventIds: readonly string[];

  readonly pendingRewardClaimIds: readonly string[];

  readonly version: number;
}

export interface WorldEventTriggerContext {
  readonly player: Player;
  readonly tick: number;
  readonly location: LocationRef;

  readonly nearbyPlayerIds: readonly string[];
  readonly nearbyEntityIds: readonly string[];

  readonly structureType?: string;
  readonly biomeType?: string;

  readonly metadata?: Record<string, unknown>;
}

export interface WorldEventStartRequest {
  readonly definition: WorldEventDefinition;
  readonly triggeringPlayer: Player;
  readonly origin: LocationRef;
  readonly participantPlayerIds: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface WorldEventStartResult {
  readonly event: ActiveWorldEvent;
  readonly spawnedEntityIds: readonly string[];
}

export interface WorldEventCompletionResult {
  readonly event: ActiveWorldEvent;
  readonly rewardClaims: readonly PendingQuestRewardClaim[];
}

export interface WorldEventProgressApplyResult {
  readonly changed: boolean;
  readonly completedEvents: readonly ActiveWorldEvent[];
  readonly failedEvents: readonly ActiveWorldEvent[];
  readonly expiredEvents: readonly ActiveWorldEvent[];
  readonly createdRewardClaims: readonly PendingQuestRewardClaim[];
}

export interface WorldEventGuidebookView {
  readonly activeEvents: readonly ActiveWorldEventView[];
  readonly recentEvents: readonly WorldEventHistoryView[];
  readonly pendingRewards: readonly WorldEventRewardClaimView[];
}

export interface ActiveWorldEventView {
  readonly eventInstanceId: string;
  readonly definitionId: string;

  readonly title: string;
  readonly description: string;
  readonly status: WorldEventStatus;

  readonly tags: readonly string[];

  readonly startedAtTick: number;
  readonly expiresAtTick: number;
  readonly timeRemainingText: string;

  readonly participantCount: number;
  readonly radiusBlocks: number;

  readonly locationHint: string;

  readonly tasks: readonly WorldEventTaskProgressView[];
  readonly rewardSummary: readonly string[];
}

export interface WorldEventTaskProgressView {
  readonly taskId: string;
  readonly title: string;
  readonly description: string;

  readonly currentAmount: number;
  readonly requiredAmount: number;
  readonly completed: boolean;
  readonly progressText: string;
}

export interface WorldEventHistoryView {
  readonly eventInstanceId: string;
  readonly definitionId: string;

  readonly title: string;
  readonly description: string;
  readonly status: WorldEventStatus;

  readonly participantCount: number;
  readonly rewardClaimCount: number;

  readonly resultText: string;
}

export interface WorldEventRewardClaimView {
  readonly claimId: string;
  readonly eventInstanceId: string;
  readonly title: string;
  readonly rewardSummary: readonly string[];
}

export interface WorldEventIdGenerator {
  createEventInstanceId(definitionId: string, tick: number): string;
  createRewardClaimId(playerId: string, eventInstanceId: string): string;
}

export class DefaultWorldEventIdGenerator implements WorldEventIdGenerator {
  public createEventInstanceId(definitionId: string, tick: number): string {
    return `event:${this.clean(definitionId)}:${tick}:${this.randomSuffix()}`;
  }

  public createRewardClaimId(
    playerId: string,
    eventInstanceId: string,
  ): string {
    return `${this.clean(playerId)}:world_event_reward:${this.clean(eventInstanceId)}:${this.randomSuffix()}`;
  }

  private clean(value: string): string {
    return value.replace(/[^a-zA-Z0-9_\-:.]/g, "_");
  }

  private randomSuffix(): string {
    return Math.floor(Math.random() * 1_000_000_000).toString(36);
  }
}

export interface WorldEventClock {
  getCurrentTick(): number;
  formatTimeRemaining(currentTick: number, expiresAtTick: number): string;
}

export class MinecraftWorldEventClock implements WorldEventClock {
  public getCurrentTick(): number {
    return Number(world.getAbsoluteTime?.() ?? 0);
  }

  public formatTimeRemaining(
    currentTick: number,
    expiresAtTick: number,
  ): string {
    const remainingTicks = Math.max(0, expiresAtTick - currentTick);
    const totalSeconds = Math.floor(
      remainingTicks / WorldEventConstants.ticksPerSecond,
    );
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}m ${seconds}s`;
  }
}

export interface WorldEventStore {
  getState(): SDResult<WorldEventWorldState>;
  setState(state: WorldEventWorldState): SDResult<void>;

  getActiveEvents(): SDResult<readonly ActiveWorldEvent[]>;
  setActiveEvents(events: readonly ActiveWorldEvent[]): SDResult<void>;

  addActiveEvent(event: ActiveWorldEvent): SDResult<void>;
  updateActiveEvent(event: ActiveWorldEvent): SDResult<void>;
  removeActiveEvent(eventInstanceId: string): SDResult<void>;

  addHistoryEntry(entry: WorldEventHistoryEntry): SDResult<void>;
}

export class JsonWorldEventStore implements WorldEventStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder,
  ) {}

  public getState(): SDResult<WorldEventWorldState> {
    return this.jsonStore.getJson<WorldEventWorldState>(
      this.keys.world("world_events", "state"),
      {
        activeEvents: [],
        history: [],
        version: 1,
      },
    );
  }

  public setState(state: WorldEventWorldState): SDResult<void> {
    return this.jsonStore.setJson(
      this.keys.world("world_events", "state"),
      state,
    );
  }

  public getActiveEvents(): SDResult<readonly ActiveWorldEvent[]> {
    return this.getState().map((state) => state.activeEvents);
  }

  public setActiveEvents(events: readonly ActiveWorldEvent[]): SDResult<void> {
    const stateResult = this.getState();

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    return this.setState({
      ...stateResult.getValueOrThrow(),
      activeEvents: events,
    });
  }

  public addActiveEvent(event: ActiveWorldEvent): SDResult<void> {
    const stateResult = this.getState();

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    if (
      state.activeEvents.some(
        (existing) => existing.eventInstanceId === event.eventInstanceId,
      )
    ) {
      return SDResult.fail(
        new SDError(
          "world_event.duplicate_active_event",
          "Active world event already exists.",
          {
            eventInstanceId: event.eventInstanceId,
          },
        ),
      );
    }

    return this.setState({
      ...state,
      activeEvents: [...state.activeEvents, event],
    });
  }

  public updateActiveEvent(event: ActiveWorldEvent): SDResult<void> {
    const stateResult = this.getState();

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();
    const index = state.activeEvents.findIndex(
      (existing) => existing.eventInstanceId === event.eventInstanceId,
    );

    if (index < 0) {
      return SDResult.fail(
        new SDError(
          "world_event.active_event_not_found",
          "Active world event was not found.",
          {
            eventInstanceId: event.eventInstanceId,
          },
        ),
      );
    }

    const updated = [...state.activeEvents];
    updated[index] = event;

    return this.setState({
      ...state,
      activeEvents: updated,
    });
  }

  public removeActiveEvent(eventInstanceId: string): SDResult<void> {
    const stateResult = this.getState();

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    return this.setState({
      ...state,
      activeEvents: state.activeEvents.filter(
        (event) => event.eventInstanceId !== eventInstanceId,
      ),
    });
  }

  public addHistoryEntry(entry: WorldEventHistoryEntry): SDResult<void> {
    const stateResult = this.getState();

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    return this.setState({
      ...state,
      history: [entry, ...state.history],
    });
  }
}

export interface PlayerWorldEventStore {
  getState(playerId: string): SDResult<PlayerWorldEventState>;
  setState(state: PlayerWorldEventState): SDResult<void>;
}

export class JsonPlayerWorldEventStore implements PlayerWorldEventStore {
  public constructor(
    private readonly jsonStore: JsonStore,
    private readonly keys: KeyBuilder,
  ) {}

  public getState(playerId: string): SDResult<PlayerWorldEventState> {
    return this.jsonStore.getJson<PlayerWorldEventState>(
      this.keys.player(playerId, "world_events", "state"),
      {
        playerId,
        lastTriggeredAtTick:
          -WorldEventConstants.defaultPlayerTriggerCooldownTicks,
        participatedEventIds: [],
        pendingRewardClaimIds: [],
        version: 1,
      },
    );
  }

  public setState(state: PlayerWorldEventState): SDResult<void> {
    return this.jsonStore.setJson(
      this.keys.player(state.playerId, "world_events", "state"),
      state,
    );
  }
}

export class WorldEventDefinitionRegistry {
  private readonly definitions = new Map<string, WorldEventDefinition>();

  public register(definition: WorldEventDefinition): SDResult<void> {
    const validation = this.validate(definition);

    if (validation.isFailure) {
      return validation;
    }

    if (this.definitions.has(definition.id)) {
      return SDResult.fail(
        new SDError(
          "world_event_definition.duplicate",
          "World event definition already exists.",
          {
            id: definition.id,
          },
        ),
      );
    }

    this.definitions.set(definition.id, definition);
    return SDResult.ok(undefined);
  }

  public registerMany(
    definitions: readonly WorldEventDefinition[],
  ): SDResult<void> {
    for (const definition of definitions) {
      const result = this.register(definition);

      if (result.isFailure) {
        return result;
      }
    }

    return SDResult.ok(undefined);
  }

  public get(id: string): SDResult<WorldEventDefinition> {
    const definition = this.definitions.get(id);

    if (definition === undefined) {
      return SDResult.fail(
        new SDError(
          "world_event_definition.not_found",
          "World event definition was not found.",
          {
            id,
          },
        ),
      );
    }

    return SDResult.ok(definition);
  }

  public getAll(): readonly WorldEventDefinition[] {
    return [...this.definitions.values()];
  }

  public getByTag(tag: string): readonly WorldEventDefinition[] {
    return this.getAll().filter((definition) => definition.tags.includes(tag));
  }

  public getByTriggerType(
    triggerType: string,
  ): readonly WorldEventDefinition[] {
    return this.getAll().filter(
      (definition) => definition.trigger.type === triggerType,
    );
  }

  private validate(definition: WorldEventDefinition): SDResult<void> {
    if (definition.id.trim().length === 0) {
      return SDResult.fail("World event definition id is required.");
    }

    if (definition.title.trim().length === 0) {
      return SDResult.fail("World event title is required.");
    }

    if (definition.weight <= 0) {
      return SDResult.fail(
        new SDError(
          "world_event_definition.invalid_weight",
          "Weight must be greater than zero.",
          {
            id: definition.id,
            weight: definition.weight,
          },
        ),
      );
    }

    if (definition.objectives.length === 0) {
      return SDResult.fail(
        new SDError(
          "world_event_definition.no_objectives",
          "World event needs objectives.",
          {
            id: definition.id,
          },
        ),
      );
    }

    if (definition.maxDurationTicks <= 0) {
      return SDResult.fail(
        new SDError(
          "world_event_definition.invalid_duration",
          "World event max duration must be greater than zero.",
          {
            id: definition.id,
            maxDurationTicks: definition.maxDurationTicks,
          },
        ),
      );
    }

    if (definition.radiusBlocks <= 0) {
      return SDResult.fail(
        new SDError(
          "world_event_definition.invalid_radius",
          "Radius must be greater than zero.",
          {
            id: definition.id,
            radiusBlocks: definition.radiusBlocks,
          },
        ),
      );
    }

    return SDResult.ok(undefined);
  }
}

export interface WorldEventRequirementHandler {
  readonly type: string;

  isEligible(
    context: WorldEventTriggerContext,
    definition: WorldEventDefinition,
    requirement: WorldEventRequirementDefinition,
  ): SDResult<boolean>;
}

export class WorldEventRequirementRegistry {
  private readonly handlers = new Map<string, WorldEventRequirementHandler>();

  public register(handler: WorldEventRequirementHandler): SDResult<void> {
    if (this.handlers.has(handler.type)) {
      return SDResult.fail(
        new SDError(
          "world_event_requirement.duplicate_handler",
          "World event requirement handler already exists.",
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
    context: WorldEventTriggerContext,
    definition: WorldEventDefinition,
  ): SDResult<boolean> {
    for (const requirement of definition.requirements ?? []) {
      const handler = this.handlers.get(requirement.type);

      if (handler === undefined) {
        return SDResult.fail(
          new SDError(
            "world_event_requirement.handler_not_found",
            "World event requirement handler was not found.",
            {
              definitionId: definition.id,
              requirementType: requirement.type,
            },
          ),
        );
      }

      const result = handler.isEligible(context, definition, requirement);

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

export interface WorldEventTriggerHandler {
  readonly triggerType: WorldEventTriggerType | string;

  canTrigger(
    context: WorldEventTriggerContext,
    definition: WorldEventDefinition,
  ): SDResult<boolean>;

  chooseOrigin(
    context: WorldEventTriggerContext,
    definition: WorldEventDefinition,
  ): SDResult<LocationRef>;
}

export class WorldEventTriggerHandlerRegistry {
  private readonly handlers = new Map<string, WorldEventTriggerHandler>();

  public register(handler: WorldEventTriggerHandler): SDResult<void> {
    if (this.handlers.has(handler.triggerType)) {
      return SDResult.fail(
        new SDError(
          "world_event_trigger.duplicate_handler",
          "Trigger handler already exists.",
          {
            triggerType: handler.triggerType,
          },
        ),
      );
    }

    this.handlers.set(handler.triggerType, handler);
    return SDResult.ok(undefined);
  }

  public get(triggerType: string): SDResult<WorldEventTriggerHandler> {
    const handler = this.handlers.get(triggerType);

    if (handler === undefined) {
      return SDResult.fail(
        new SDError(
          "world_event_trigger.handler_not_found",
          "Trigger handler was not found.",
          {
            triggerType,
          },
        ),
      );
    }

    return SDResult.ok(handler);
  }
}

export interface WorldEventScenarioHandler {
  readonly scenarioType: WorldEventScenarioType | string;

  start(request: WorldEventStartRequest): SDResult<WorldEventStartResult>;

  cleanup?(event: ActiveWorldEvent): SDResult<void>;
}

export class WorldEventScenarioHandlerRegistry {
  private readonly handlers = new Map<string, WorldEventScenarioHandler>();

  public register(handler: WorldEventScenarioHandler): SDResult<void> {
    if (this.handlers.has(handler.scenarioType)) {
      return SDResult.fail(
        new SDError(
          "world_event_scenario.duplicate_handler",
          "Scenario handler already exists.",
          {
            scenarioType: handler.scenarioType,
          },
        ),
      );
    }

    this.handlers.set(handler.scenarioType, handler);
    return SDResult.ok(undefined);
  }

  public get(scenarioType: string): SDResult<WorldEventScenarioHandler> {
    const handler = this.handlers.get(scenarioType);

    if (handler === undefined) {
      return SDResult.fail(
        new SDError(
          "world_event_scenario.handler_not_found",
          "Scenario handler was not found.",
          {
            scenarioType,
          },
        ),
      );
    }

    return SDResult.ok(handler);
  }
}

export interface WorldEventFailureConditionHandler {
  readonly failureType: WorldEventFailureType | string;

  hasFailed(
    event: ActiveWorldEvent,
    definition: WorldEventDefinition,
    condition: WorldEventFailureConditionDefinition,
  ): SDResult<WorldEventFailureReason | undefined>;
}

export class WorldEventFailureConditionRegistry {
  private readonly handlers = new Map<
    string,
    WorldEventFailureConditionHandler
  >();

  public register(handler: WorldEventFailureConditionHandler): SDResult<void> {
    if (this.handlers.has(handler.failureType)) {
      return SDResult.fail(
        new SDError(
          "world_event_failure.duplicate_handler",
          "Failure condition handler already exists.",
          {
            failureType: handler.failureType,
          },
        ),
      );
    }

    this.handlers.set(handler.failureType, handler);
    return SDResult.ok(undefined);
  }

  public evaluate(
    event: ActiveWorldEvent,
    definition: WorldEventDefinition,
  ): SDResult<WorldEventFailureReason | undefined> {
    for (const condition of definition.scenario.failureConditions ?? []) {
      const handler = this.handlers.get(condition.type);

      if (handler === undefined) {
        return SDResult.fail(
          new SDError(
            "world_event_failure.handler_not_found",
            "Failure condition handler was not found.",
            {
              definitionId: definition.id,
              failureType: condition.type,
            },
          ),
        );
      }

      const result = handler.hasFailed(event, definition, condition);

      if (result.isFailure) {
        return result;
      }

      const reason = result.value;

      if (reason !== undefined) {
        return SDResult.ok(reason);
      }
    }

    return SDResult.ok(undefined);
  }
}

export interface WorldEventSelectionContext {
  readonly triggerContext: WorldEventTriggerContext;
  readonly activeEvents: readonly ActiveWorldEvent[];
  readonly playerState: PlayerWorldEventState;
  readonly excludedDefinitionIds: readonly string[];
}

export interface WorldEventSelector {
  select(
    definitions: readonly WorldEventDefinition[],
    context: WorldEventSelectionContext,
  ): SDResult<WorldEventDefinition | undefined>;
}

export class WeightedRandomWorldEventSelector implements WorldEventSelector {
  public select(
    definitions: readonly WorldEventDefinition[],
    context: WorldEventSelectionContext,
  ): SDResult<WorldEventDefinition | undefined> {
    const excluded = new Set(context.excludedDefinitionIds);
    const pool = definitions.filter(
      (definition) => !excluded.has(definition.id),
    );

    if (pool.length === 0) {
      return SDResult.ok(undefined);
    }

    const totalWeight = pool.reduce(
      (sum, definition) => sum + definition.weight,
      0,
    );
    let roll = Math.random() * totalWeight;

    for (const definition of pool) {
      roll -= definition.weight;

      if (roll <= 0) {
        return SDResult.ok(definition);
      }
    }

    return SDResult.ok(pool[pool.length - 1]);
  }
}

export interface WorldEventCooldownService {
  canPlayerTrigger(
    playerId: string,
    definition: WorldEventDefinition,
    currentTick: number,
  ): SDResult<boolean>;

  markPlayerTriggered(playerId: string, currentTick: number): SDResult<void>;
}

export class DefaultWorldEventCooldownService implements WorldEventCooldownService {
  public constructor(private readonly playerStore: PlayerWorldEventStore) {}

  public canPlayerTrigger(
    playerId: string,
    definition: WorldEventDefinition,
    currentTick: number,
  ): SDResult<boolean> {
    const stateResult = this.playerStore.getState(playerId);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    const cooldown =
      definition.playerTriggerCooldownTicks ??
      WorldEventConstants.defaultPlayerTriggerCooldownTicks;

    return SDResult.ok(currentTick - state.lastTriggeredAtTick >= cooldown);
  }

  public markPlayerTriggered(
    playerId: string,
    currentTick: number,
  ): SDResult<void> {
    const stateResult = this.playerStore.getState(playerId);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state = stateResult.getValueOrThrow();

    return this.playerStore.setState({
      ...state,
      lastTriggeredAtTick: currentTick,
    });
  }
}

export interface WorldEventParticipationService {
  getParticipants(
    triggeringPlayer: Player,
    origin: LocationRef,
    radiusBlocks: number,
  ): SDResult<readonly string[]>;

  addParticipant(
    event: ActiveWorldEvent,
    playerId: string,
  ): SDResult<ActiveWorldEvent>;

  isParticipant(event: ActiveWorldEvent, playerId: string): boolean;
}

export class DefaultWorldEventParticipationService implements WorldEventParticipationService {
  public getParticipants(
    triggeringPlayer: Player,
    origin: LocationRef,
    radiusBlocks: number,
  ): SDResult<readonly string[]> {
    const radiusSquared = radiusBlocks * radiusBlocks;
    const participantIds: string[] = [];

    for (const player of world.getAllPlayers()) {
      if (player.dimension.id !== origin.dimensionId) {
        continue;
      }

      const dx = player.location.x - origin.x;
      const dy = player.location.y - origin.y;
      const dz = player.location.z - origin.z;

      const distanceSquared = dx * dx + dy * dy + dz * dz;

      if (distanceSquared <= radiusSquared) {
        participantIds.push(player.id);
      }
    }

    if (!participantIds.includes(triggeringPlayer.id)) {
      participantIds.push(triggeringPlayer.id);
    }

    return SDResult.ok(participantIds);
  }

  public addParticipant(
    event: ActiveWorldEvent,
    playerId: string,
  ): SDResult<ActiveWorldEvent> {
    if (event.participantPlayerIds.includes(playerId)) {
      return SDResult.ok(event);
    }

    return SDResult.ok({
      ...event,
      participantPlayerIds: [...event.participantPlayerIds, playerId],
    });
  }

  public isParticipant(event: ActiveWorldEvent, playerId: string): boolean {
    return event.participantPlayerIds.includes(playerId);
  }
}

export class WorldEventFactory {
  public constructor(
    private readonly idGenerator: WorldEventIdGenerator,
    private readonly clock: WorldEventClock,
  ) {}

  public createActiveEvent(
    request: WorldEventStartRequest,
    spawnedEntityIds: readonly string[],
  ): ActiveWorldEvent {
    const tick = this.clock.getCurrentTick();

    return {
      eventInstanceId: this.idGenerator.createEventInstanceId(
        request.definition.id,
        tick,
      ),
      definitionId: request.definition.id,
      status: WorldEventStatus.Active,
      triggeringPlayerId: request.triggeringPlayer.id,
      participantPlayerIds: request.participantPlayerIds,
      startedAtTick: tick,
      expiresAtTick: tick + request.definition.maxDurationTicks,
      origin: request.origin,
      radiusBlocks: request.definition.radiusBlocks,
      taskProgress: request.definition.objectives.map((task) => ({
        taskId: task.id,
        currentAmount: 0,
        requiredAmount: task.requiredAmount,
        completed: false,
      })),
      spawnedEntityIds,
      rewardClaimIds: [],
      metadata: request.metadata,
    };
  }

  public createHistoryEntry(event: ActiveWorldEvent): WorldEventHistoryEntry {
    return {
      eventInstanceId: event.eventInstanceId,
      definitionId: event.definitionId,
      status: event.status,
      startedAtTick: event.startedAtTick,
      completedAtTick: event.completedAtTick,
      failedAtTick: event.failedAtTick,
      expiredAtTick:
        event.status === WorldEventStatus.Expired
          ? this.clock.getCurrentTick()
          : undefined,
      cancelledAtTick: event.cancelledAtTick,
      triggeringPlayerId: event.triggeringPlayerId,
      participantPlayerIds: event.participantPlayerIds,
      origin: event.origin,
      rewardClaimIds: event.rewardClaimIds,
      failureReason: event.failureReason,
    };
  }
}

export interface WorldEventStartService {
  tryStartFromTrigger(
    context: WorldEventTriggerContext,
  ): SDResult<ActiveWorldEvent | undefined>;

  start(request: WorldEventStartRequest): SDResult<ActiveWorldEvent>;
}

export class DefaultWorldEventStartService implements WorldEventStartService {
  public constructor(
    private readonly definitions: WorldEventDefinitionRegistry,
    private readonly requirements: WorldEventRequirementRegistry,
    private readonly triggers: WorldEventTriggerHandlerRegistry,
    private readonly scenarios: WorldEventScenarioHandlerRegistry,
    private readonly selector: WorldEventSelector,
    private readonly store: WorldEventStore,
    private readonly playerStore: PlayerWorldEventStore,
    private readonly cooldowns: WorldEventCooldownService,
    private readonly participation: WorldEventParticipationService,
    private readonly factory: WorldEventFactory,
    private readonly clock: WorldEventClock,
    private readonly logger?: Logger,
  ) {}

  public tryStartFromTrigger(
    context: WorldEventTriggerContext,
  ): SDResult<ActiveWorldEvent | undefined> {
    const activeResult = this.store.getActiveEvents();

    if (activeResult.isFailure) {
      return SDResult.fail(activeResult.error!);
    }

    const activeEvents = activeResult.getValueOrThrow();

    if (activeEvents.length >= WorldEventConstants.defaultMaxActiveEvents) {
      return SDResult.ok(undefined);
    }

    const playerStateResult = this.playerStore.getState(context.player.id);

    if (playerStateResult.isFailure) {
      return SDResult.fail(playerStateResult.error!);
    }

    const candidateResult = this.getCandidateDefinitions(context, activeEvents);

    if (candidateResult.isFailure) {
      return SDResult.fail(candidateResult.error!);
    }

    const selectedResult = this.selector.select(
      candidateResult.getValueOrThrow(),
      {
        triggerContext: context,
        activeEvents,
        playerState: playerStateResult.getValueOrThrow(),
        excludedDefinitionIds: [],
      },
    );

    if (selectedResult.isFailure) {
      return SDResult.fail(selectedResult.error!);
    }

    const definition = selectedResult.value;

    if (definition === undefined) {
      return SDResult.ok(undefined);
    }

    const cooldownResult = this.cooldowns.canPlayerTrigger(
      context.player.id,
      definition,
      context.tick,
    );

    if (cooldownResult.isFailure) {
      return SDResult.fail(cooldownResult.error!);
    }

    if (!cooldownResult.getValueOrThrow()) {
      return SDResult.ok(undefined);
    }

    const triggerHandlerResult = this.triggers.get(definition.trigger.type);

    if (triggerHandlerResult.isFailure) {
      return SDResult.fail(triggerHandlerResult.error!);
    }

    const originResult = triggerHandlerResult
      .getValueOrThrow()
      .chooseOrigin(context, definition);

    if (originResult.isFailure) {
      return SDResult.fail(originResult.error!);
    }

    const participantsResult = this.participation.getParticipants(
      context.player,
      originResult.getValueOrThrow(),
      definition.radiusBlocks,
    );

    if (participantsResult.isFailure) {
      return SDResult.fail(participantsResult.error!);
    }

    const startedResult = this.start({
      definition,
      triggeringPlayer: context.player,
      origin: originResult.getValueOrThrow(),
      participantPlayerIds: participantsResult.getValueOrThrow(),
      metadata: context.metadata,
    });

    if (startedResult.isFailure) {
      return SDResult.fail(startedResult.error!);
    }

    const markResult = this.cooldowns.markPlayerTriggered(
      context.player.id,
      context.tick,
    );

    if (markResult.isFailure) {
      return SDResult.fail(markResult.error!);
    }

    return startedResult;
  }

  public start(request: WorldEventStartRequest): SDResult<ActiveWorldEvent> {
    const scenarioHandlerResult = this.scenarios.get(
      request.definition.scenario.type,
    );

    if (scenarioHandlerResult.isFailure) {
      return SDResult.fail(scenarioHandlerResult.error!);
    }

    const scenarioResult = scenarioHandlerResult
      .getValueOrThrow()
      .start(request);

    if (scenarioResult.isFailure) {
      return SDResult.fail(scenarioResult.error!);
    }

    const startResult = scenarioResult.getValueOrThrow();

    const addResult = this.store.addActiveEvent(startResult.event);

    if (addResult.isFailure) {
      return SDResult.fail(addResult.error!);
    }

    this.logger?.info("world_events", "World event started.", {
      eventInstanceId: startResult.event.eventInstanceId,
      definitionId: startResult.event.definitionId,
      triggeringPlayerId: startResult.event.triggeringPlayerId,
      participantCount: startResult.event.participantPlayerIds.length,
    });

    return SDResult.ok(startResult.event);
  }

  private getCandidateDefinitions(
    context: WorldEventTriggerContext,
    activeEvents: readonly ActiveWorldEvent[],
  ): SDResult<readonly WorldEventDefinition[]> {
    const candidates: WorldEventDefinition[] = [];

    for (const definition of this.definitions.getAll()) {
      const alreadyActiveCount = activeEvents.filter(
        (event) => event.definitionId === definition.id,
      ).length;

      if (
        definition.maxSimultaneousInstances !== undefined &&
        alreadyActiveCount >= definition.maxSimultaneousInstances
      ) {
        continue;
      }

      if (definition.trigger.dimensions !== undefined) {
        if (
          !definition.trigger.dimensions.includes(context.location.dimensionId)
        ) {
          continue;
        }
      }

      if (
        definition.trigger.structureTypes !== undefined &&
        context.structureType !== undefined
      ) {
        if (
          !definition.trigger.structureTypes.includes(context.structureType)
        ) {
          continue;
        }
      }

      if (
        definition.trigger.biomeTypes !== undefined &&
        context.biomeType !== undefined
      ) {
        if (!definition.trigger.biomeTypes.includes(context.biomeType)) {
          continue;
        }
      }

      const triggerHandlerResult = this.triggers.get(definition.trigger.type);

      if (triggerHandlerResult.isFailure) {
        return SDResult.fail(triggerHandlerResult.error!);
      }

      const canTriggerResult = triggerHandlerResult
        .getValueOrThrow()
        .canTrigger(context, definition);

      if (canTriggerResult.isFailure) {
        return SDResult.fail(canTriggerResult.error!);
      }

      if (!canTriggerResult.getValueOrThrow()) {
        continue;
      }

      const requirementsResult = this.requirements.isEligible(
        context,
        definition,
      );

      if (requirementsResult.isFailure) {
        return SDResult.fail(requirementsResult.error!);
      }

      if (!requirementsResult.getValueOrThrow()) {
        continue;
      }

      if (Math.random() > definition.trigger.chancePerCheck) {
        continue;
      }

      candidates.push(definition);
    }

    return SDResult.ok(candidates);
  }
}

export interface WorldEventProgressService {
  applyQuestEvent(event: QuestEvent): SDResult<WorldEventProgressApplyResult>;
  tick(): SDResult<WorldEventProgressApplyResult>;
}

export class DefaultWorldEventProgressService implements WorldEventProgressService {
  public constructor(
    private readonly definitions: WorldEventDefinitionRegistry,
    private readonly objectives: QuestObjectiveHandlerRegistry,
    private readonly failures: WorldEventFailureConditionRegistry,
    private readonly store: WorldEventStore,
    private readonly rewards: WorldEventRewardService,
    private readonly factory: WorldEventFactory,
    private readonly clock: WorldEventClock,
    private readonly logger?: Logger,
  ) {}

  public applyQuestEvent(
    event: QuestEvent,
  ): SDResult<WorldEventProgressApplyResult> {
    const activeResult = this.store.getActiveEvents();

    if (activeResult.isFailure) {
      return SDResult.fail(activeResult.error!);
    }

    let changed = false;
    const completedEvents: ActiveWorldEvent[] = [];
    const failedEvents: ActiveWorldEvent[] = [];
    const expiredEvents: ActiveWorldEvent[] = [];
    const createdRewardClaims: PendingQuestRewardClaim[] = [];

    const updatedEvents: ActiveWorldEvent[] = [];

    for (const activeEvent of activeResult.getValueOrThrow()) {
      if (activeEvent.status !== WorldEventStatus.Active) {
        updatedEvents.push(activeEvent);
        continue;
      }

      if (!activeEvent.participantPlayerIds.includes(event.player.id)) {
        updatedEvents.push(activeEvent);
        continue;
      }

      const definitionResult = this.definitions.get(activeEvent.definitionId);

      if (definitionResult.isFailure) {
        return SDResult.fail(definitionResult.error!);
      }

      const definition = definitionResult.getValueOrThrow();

      const updateResult = this.applyQuestEventToEvent(
        event,
        activeEvent,
        definition,
      );

      if (updateResult.isFailure) {
        return SDResult.fail(updateResult.error!);
      }

      let updated = updateResult.getValueOrThrow();

      if (updated !== activeEvent) {
        changed = true;
      }

      const finalizeResult = this.tryFinalize(updated, definition);

      if (finalizeResult.isFailure) {
        return SDResult.fail(finalizeResult.error!);
      }

      const finalized = finalizeResult.getValueOrThrow();

      if (finalized.event !== updated) {
        updated = finalized.event;
        changed = true;
      }

      if (finalized.rewardClaims.length > 0) {
        createdRewardClaims.push(...finalized.rewardClaims);
      }

      if (updated.status === WorldEventStatus.Completed) {
        completedEvents.push(updated);
      } else if (updated.status === WorldEventStatus.Failed) {
        failedEvents.push(updated);
      } else if (updated.status === WorldEventStatus.Expired) {
        expiredEvents.push(updated);
      }

      updatedEvents.push(updated);
    }

    if (changed) {
      const saveResult = this.store.setActiveEvents(updatedEvents);

      if (saveResult.isFailure) {
        return SDResult.fail(saveResult.error!);
      }
    }

    return SDResult.ok({
      changed,
      completedEvents,
      failedEvents,
      expiredEvents,
      createdRewardClaims,
    });
  }

  public tick(): SDResult<WorldEventProgressApplyResult> {
    const activeResult = this.store.getActiveEvents();

    if (activeResult.isFailure) {
      return SDResult.fail(activeResult.error!);
    }

    const currentTick = this.clock.getCurrentTick();

    let changed = false;
    const completedEvents: ActiveWorldEvent[] = [];
    const failedEvents: ActiveWorldEvent[] = [];
    const expiredEvents: ActiveWorldEvent[] = [];
    const createdRewardClaims: PendingQuestRewardClaim[] = [];
    const updatedEvents: ActiveWorldEvent[] = [];

    for (const activeEvent of activeResult.getValueOrThrow()) {
      if (activeEvent.status !== WorldEventStatus.Active) {
        updatedEvents.push(activeEvent);
        continue;
      }

      const definitionResult = this.definitions.get(activeEvent.definitionId);

      if (definitionResult.isFailure) {
        return SDResult.fail(definitionResult.error!);
      }

      const definition = definitionResult.getValueOrThrow();

      let updated = activeEvent;

      if (currentTick >= activeEvent.expiresAtTick) {
        updated = {
          ...activeEvent,
          status: WorldEventStatus.Expired,
          failedAtTick: currentTick,
          failureReason: {
            type: WorldEventFailureType.TimeExpired,
            message: "The world event expired.",
          },
        };

        expiredEvents.push(updated);
        changed = true;
      } else {
        const failureResult = this.failures.evaluate(activeEvent, definition);

        if (failureResult.isFailure) {
          return SDResult.fail(failureResult.error!);
        }

        const failureReason = failureResult.value;

        if (failureReason !== undefined) {
          updated = {
            ...activeEvent,
            status: WorldEventStatus.Failed,
            failedAtTick: currentTick,
            failureReason,
          };

          failedEvents.push(updated);
          changed = true;
        }
      }

      updatedEvents.push(updated);
    }

    if (changed) {
      const saveResult = this.store.setActiveEvents(updatedEvents);

      if (saveResult.isFailure) {
        return SDResult.fail(saveResult.error!);
      }
    }

    return SDResult.ok({
      changed,
      completedEvents,
      failedEvents,
      expiredEvents,
      createdRewardClaims,
    });
  }

  private applyQuestEventToEvent(
    event: QuestEvent,
    activeEvent: ActiveWorldEvent,
    definition: WorldEventDefinition,
  ): SDResult<ActiveWorldEvent> {
    let changed = false;
    const updatedProgress: QuestTaskProgress[] = [];

    for (const progress of activeEvent.taskProgress) {
      if (progress.completed) {
        updatedProgress.push(progress);
        continue;
      }

      const task = definition.objectives.find(
        (candidate) => candidate.id === progress.taskId,
      );

      if (task === undefined) {
        return SDResult.fail(
          new SDError(
            "world_event_progress.task_missing",
            "World event task definition is missing.",
            {
              definitionId: definition.id,
              taskId: progress.taskId,
            },
          ),
        );
      }

      const handlerResult = this.objectives.get(task.objectiveType);

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
      return SDResult.ok(activeEvent);
    }

    return SDResult.ok({
      ...activeEvent,
      taskProgress: updatedProgress,
    });
  }

  private tryFinalize(
    event: ActiveWorldEvent,
    definition: WorldEventDefinition,
  ): SDResult<{
    readonly event: ActiveWorldEvent;
    readonly rewardClaims: readonly PendingQuestRewardClaim[];
  }> {
    if (!this.isComplete(event, definition)) {
      return SDResult.ok({
        event,
        rewardClaims: [],
      });
    }

    const completionTick = this.clock.getCurrentTick();

    const rewardResult = this.rewards.createClaimsForCompletedEvent(
      event,
      definition,
    );

    if (rewardResult.isFailure) {
      return SDResult.fail(rewardResult.error!);
    }

    const rewardClaims = rewardResult.getValueOrThrow();

    const completedEvent: ActiveWorldEvent = {
      ...event,
      status: WorldEventStatus.Completed,
      completedAtTick: completionTick,
      rewardClaimIds: rewardClaims.map((claim) => claim.claimId),
    };

    const historyResult = this.store.addHistoryEntry(
      this.factory.createHistoryEntry(completedEvent),
    );

    if (historyResult.isFailure) {
      return SDResult.fail(historyResult.error!);
    }

    this.logger?.info("world_events", "World event completed.", {
      eventInstanceId: completedEvent.eventInstanceId,
      definitionId: completedEvent.definitionId,
      rewardClaimCount: rewardClaims.length,
    });

    return SDResult.ok({
      event: completedEvent,
      rewardClaims,
    });
  }

  private isComplete(
    event: ActiveWorldEvent,
    definition: WorldEventDefinition,
  ): boolean {
    for (const task of definition.objectives) {
      if (task.optional === true) {
        continue;
      }

      const progress = event.taskProgress.find(
        (candidate) => candidate.taskId === task.id,
      );

      if (progress === undefined || !progress.completed) {
        return false;
      }
    }

    return true;
  }
}

export interface WorldEventRewardService {
  createClaimsForCompletedEvent(
    event: ActiveWorldEvent,
    definition: WorldEventDefinition,
  ): SDResult<readonly PendingQuestRewardClaim[]>;
}

export class DefaultWorldEventRewardService implements WorldEventRewardService {
  public constructor(
    private readonly playerStore: PlayerWorldEventStore,
    private readonly idGenerator: WorldEventIdGenerator,
    private readonly clock: WorldEventClock,
  ) {}

  public createClaimsForCompletedEvent(
    event: ActiveWorldEvent,
    definition: WorldEventDefinition,
  ): SDResult<readonly PendingQuestRewardClaim[]> {
    const recipientIds = this.getRecipientPlayerIds(event, definition);
    const created: PendingQuestRewardClaim[] = [];

    for (const playerId of recipientIds) {
      const claim: PendingQuestRewardClaim = {
        claimId: this.idGenerator.createRewardClaimId(
          playerId,
          event.eventInstanceId,
        ),
        playerId,
        sourceQuestId: definition.id,
        sourceAssignmentId: event.eventInstanceId,
        sourcePeriod: "world_event" as never,
        title: definition.title,
        rewards: definition.rewards,
        status: QuestRewardClaimStatus.Pending,
        createdAtTick: this.clock.getCurrentTick(),
      };

      const stateResult = this.playerStore.getState(playerId);

      if (stateResult.isFailure) {
        return SDResult.fail(stateResult.error!);
      }

      const state = stateResult.getValueOrThrow();

      const saveResult = this.playerStore.setState({
        ...state,
        pendingRewardClaimIds: [...state.pendingRewardClaimIds, claim.claimId],
        participatedEventIds: state.participatedEventIds.includes(
          event.eventInstanceId,
        )
          ? state.participatedEventIds
          : [...state.participatedEventIds, event.eventInstanceId],
      });

      if (saveResult.isFailure) {
        return SDResult.fail(saveResult.error!);
      }

      created.push(claim);
    }

    return SDResult.ok(created);
  }

  private getRecipientPlayerIds(
    event: ActiveWorldEvent,
    definition: WorldEventDefinition,
  ): readonly string[] {
    switch (definition.rewardScope ?? WorldEventRewardScope.Participants) {
      case WorldEventRewardScope.TriggeringPlayer:
        return [event.triggeringPlayerId];

      case WorldEventRewardScope.AllOnlinePlayers:
        return world.getAllPlayers().map((player: Player) => player.id);

      case WorldEventRewardScope.NearbyPlayers:
      case WorldEventRewardScope.Participants:
      default:
        return event.participantPlayerIds;
    }
  }
}

export interface WorldEventGuidebookService {
  createView(player: Player): SDResult<WorldEventGuidebookView>;
}

export class DefaultWorldEventGuidebookService implements WorldEventGuidebookService {
  public constructor(
    private readonly definitions: WorldEventDefinitionRegistry,
    private readonly store: WorldEventStore,
    private readonly playerStore: PlayerWorldEventStore,
    private readonly clock: WorldEventClock,
  ) {}

  public createView(player: Player): SDResult<WorldEventGuidebookView> {
    const worldStateResult = this.store.getState();

    if (worldStateResult.isFailure) {
      return SDResult.fail(worldStateResult.error!);
    }

    const playerStateResult = this.playerStore.getState(player.id);

    if (playerStateResult.isFailure) {
      return SDResult.fail(playerStateResult.error!);
    }

    const worldState = worldStateResult.getValueOrThrow();
    const playerState = playerStateResult.getValueOrThrow();

    return SDResult.ok({
      activeEvents: worldState.activeEvents
        .filter((event) => event.status === WorldEventStatus.Active)
        .map((event) => this.createActiveEventView(event)),
      recentEvents: worldState.history.map((entry) =>
        this.createHistoryView(entry),
      ),
      pendingRewards: playerState.pendingRewardClaimIds.map((claimId) => ({
        claimId,
        eventInstanceId: this.extractEventInstanceIdFromClaimId(claimId),
        title: "Pending World Event Reward",
        rewardSummary: [],
      })),
    });
  }

  private createActiveEventView(event: ActiveWorldEvent): ActiveWorldEventView {
    const definitionResult = this.definitions.get(event.definitionId);

    if (definitionResult.isFailure) {
      return {
        eventInstanceId: event.eventInstanceId,
        definitionId: event.definitionId,
        title: "Unknown World Event",
        description: "The world event definition could not be found.",
        status: event.status,
        tags: [],
        startedAtTick: event.startedAtTick,
        expiresAtTick: event.expiresAtTick,
        timeRemainingText: this.clock.formatTimeRemaining(
          this.clock.getCurrentTick(),
          event.expiresAtTick,
        ),
        participantCount: event.participantPlayerIds.length,
        radiusBlocks: event.radiusBlocks,
        locationHint: "Somewhere nearby",
        tasks: [],
        rewardSummary: [],
      };
    }

    const definition = definitionResult.getValueOrThrow();

    return {
      eventInstanceId: event.eventInstanceId,
      definitionId: definition.id,
      title: definition.title,
      description: definition.description,
      status: event.status,
      tags: definition.tags,
      startedAtTick: event.startedAtTick,
      expiresAtTick: event.expiresAtTick,
      timeRemainingText: this.clock.formatTimeRemaining(
        this.clock.getCurrentTick(),
        event.expiresAtTick,
      ),
      participantCount: event.participantPlayerIds.length,
      radiusBlocks: event.radiusBlocks,
      locationHint: this.createLocationHint(event),
      tasks: event.taskProgress.map((progress) =>
        this.createTaskProgressView(definition, progress),
      ),
      rewardSummary: definition.rewards.map((reward) =>
        this.summarizeReward(reward),
      ),
    };
  }

  private createTaskProgressView(
    definition: WorldEventDefinition,
    progress: QuestTaskProgress,
  ): WorldEventTaskProgressView {
    const task = definition.objectives.find(
      (candidate) => candidate.id === progress.taskId,
    );

    if (task === undefined) {
      return {
        taskId: progress.taskId,
        title: "Unknown Objective",
        description: "The objective definition could not be found.",
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

  private createHistoryView(
    entry: WorldEventHistoryEntry,
  ): WorldEventHistoryView {
    const definitionResult = this.definitions.get(entry.definitionId);

    return {
      eventInstanceId: entry.eventInstanceId,
      definitionId: entry.definitionId,
      title: definitionResult.succeeded
        ? definitionResult.getValueOrThrow().title
        : "Unknown World Event",
      description: definitionResult.succeeded
        ? definitionResult.getValueOrThrow().description
        : "The world event definition could not be found.",
      status: entry.status,
      participantCount: entry.participantPlayerIds.length,
      rewardClaimCount: entry.rewardClaimIds.length,
      resultText: this.createResultText(entry),
    };
  }

  private createLocationHint(event: ActiveWorldEvent): string {
    switch (event.origin.dimensionId) {
      case "minecraft:overworld":
        return "Somewhere in the Overworld";

      case "minecraft:nether":
        return "Somewhere in the Nether";

      case "minecraft:the_end":
        return "Somewhere in the End";

      default:
        return "Somewhere nearby";
    }
  }

  private createResultText(entry: WorldEventHistoryEntry): string {
    switch (entry.status) {
      case WorldEventStatus.Completed:
        return "Completed";

      case WorldEventStatus.Failed:
        return entry.failureReason?.message ?? "Failed";

      case WorldEventStatus.Expired:
        return "Expired";

      case WorldEventStatus.Cancelled:
        return "Cancelled";

      default:
        return entry.status;
    }
  }

  private summarizeReward(reward: QuestRewardDefinition): string {
    if (reward.displayName !== undefined) {
      return reward.displayName;
    }

    return reward.id;
  }

  private extractEventInstanceIdFromClaimId(claimId: string): string {
    return claimId;
  }
}

export interface WorldEventSystemServices {
  readonly definitions: WorldEventDefinitionRegistry;
  readonly requirements: WorldEventRequirementRegistry;
  readonly triggers: WorldEventTriggerHandlerRegistry;
  readonly scenarios: WorldEventScenarioHandlerRegistry;
  readonly failures: WorldEventFailureConditionRegistry;
  readonly selector: WorldEventSelector;
  readonly worldStore: WorldEventStore;
  readonly playerStore: PlayerWorldEventStore;
  readonly cooldowns: WorldEventCooldownService;
  readonly participation: WorldEventParticipationService;
  readonly rewards: WorldEventRewardService;
  readonly start: WorldEventStartService;
  readonly progress: WorldEventProgressService;
  readonly guidebook: WorldEventGuidebookService;
  readonly clock: WorldEventClock;
}

export class WorldEventSystem {
  public constructor(public readonly services: WorldEventSystemServices) {}

  public registerDefinition(definition: WorldEventDefinition): SDResult<void> {
    return this.services.definitions.register(definition);
  }

  public registerDefinitions(
    definitions: readonly WorldEventDefinition[],
  ): SDResult<void> {
    return this.services.definitions.registerMany(definitions);
  }

  public registerTriggerHandler(
    handler: WorldEventTriggerHandler,
  ): SDResult<void> {
    return this.services.triggers.register(handler);
  }

  public registerScenarioHandler(
    handler: WorldEventScenarioHandler,
  ): SDResult<void> {
    return this.services.scenarios.register(handler);
  }

  public registerFailureConditionHandler(
    handler: WorldEventFailureConditionHandler,
  ): SDResult<void> {
    return this.services.failures.register(handler);
  }

  public registerRequirementHandler(
    handler: WorldEventRequirementHandler,
  ): SDResult<void> {
    return this.services.requirements.register(handler);
  }

  public tryStartFromTrigger(
    context: WorldEventTriggerContext,
  ): SDResult<ActiveWorldEvent | undefined> {
    return this.services.start.tryStartFromTrigger(context);
  }

  public start(request: WorldEventStartRequest): SDResult<ActiveWorldEvent> {
    return this.services.start.start(request);
  }

  public applyQuestEvent(
    event: QuestEvent,
  ): SDResult<WorldEventProgressApplyResult> {
    return this.services.progress.applyQuestEvent(event);
  }

  public tick(): SDResult<WorldEventProgressApplyResult> {
    return this.services.progress.tick();
  }

  public getGuidebookView(player: Player): SDResult<WorldEventGuidebookView> {
    return this.services.guidebook.createView(player);
  }
}

export interface WorldEventSystemOptions {
  readonly maxActiveEvents?: number;
  readonly defaultPlayerTriggerCooldownTicks?: number;
}

export class WorldEventSystemFactory {
  public static create(
    jsonStore: JsonStore,
    keys: KeyBuilder,
    questSystem: QuestSystem,
    logger?: Logger,
    _options: WorldEventSystemOptions = {},
  ): WorldEventSystem {
    const clock = new MinecraftWorldEventClock();
    const idGenerator = new DefaultWorldEventIdGenerator();

    const definitions = new WorldEventDefinitionRegistry();
    const requirements = new WorldEventRequirementRegistry();
    const triggers = new WorldEventTriggerHandlerRegistry();
    const scenarios = new WorldEventScenarioHandlerRegistry();
    const failures = new WorldEventFailureConditionRegistry();

    const selector = new WeightedRandomWorldEventSelector();

    const worldStore = new JsonWorldEventStore(jsonStore, keys);
    const playerStore = new JsonPlayerWorldEventStore(jsonStore, keys);

    const cooldowns = new DefaultWorldEventCooldownService(playerStore);
    const participation = new DefaultWorldEventParticipationService();

    const factory = new WorldEventFactory(idGenerator, clock);

    const rewards = new DefaultWorldEventRewardService(
      playerStore,
      idGenerator,
      clock,
    );

    const start = new DefaultWorldEventStartService(
      definitions,
      requirements,
      triggers,
      scenarios,
      selector,
      worldStore,
      playerStore,
      cooldowns,
      participation,
      factory,
      clock,
      logger,
    );

    const progress = new DefaultWorldEventProgressService(
      definitions,
      questSystem.services.objectives,
      failures,
      worldStore,
      rewards,
      factory,
      clock,
      logger,
    );

    const guidebook = new DefaultWorldEventGuidebookService(
      definitions,
      worldStore,
      playerStore,
      clock,
    );

    return new WorldEventSystem({
      definitions,
      requirements,
      triggers,
      scenarios,
      failures,
      selector,
      worldStore,
      playerStore,
      cooldowns,
      participation,
      rewards,
      start,
      progress,
      guidebook,
      clock,
    });
  }
}