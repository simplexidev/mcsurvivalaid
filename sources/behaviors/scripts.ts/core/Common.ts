import { KeyBuilder, ConfigService, DefaultConfigService } from "./Configuration";
import { DynamicPropertyStore, JsonDynamicPropertyStore, DefaultJsonSerializer, JsonStore, MinecraftDynamicPropertyStore } from "./Json";
import { FormService, MinecraftFormService } from "./Forms";
import { LoggerFactory } from "./Logging";
import { MigrationService, DefaultMigrationService } from "./Migration";
import { Feature, FeatureContext, FeatureRegistry, DefaultFeatureRegistry } from "./Features";
import { PlayerService } from "./Player";
import { RewardService, DefaultRewardService } from "../features/Rewards";

//TODO: Localize all error messages via `*.lang` files, focusing on `en_US`.
//TODO: Create an `enum` for all error codes.

export class SDError {
  public constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: unknown,
  ) {}

  public static fromMessage(message: string): SDError {
    return new SDError("core.error", message);
  }

  public static exception(
    code: string,
    error: unknown,
    details?: unknown,
  ): SDError {
    return new SDError(code, String(error), details);
  }
}

export class SDResult<T> {
  private constructor(
    public readonly succeeded: boolean,
    public readonly value: T | undefined,
    public readonly error: SDError | undefined,
  ) {}

  public static ok<T>(value: T): SDResult<T> {
    return new SDResult<T>(true, value, undefined);
  }

  public static fail<T = never>(error: SDError | string): SDResult<T> {
    return new SDResult<T>(
      false,
      undefined,
      typeof error === "string" ? SDError.fromMessage(error) : error,
    );
  }

  public get isFailure(): boolean {
    return !this.succeeded;
  }

  public getValueOrThrow(): T {
    if (!this.succeeded || this.value === undefined) {
      throw new Error(this.error?.message ?? "SDResult failed.");
    }

    return this.value;
  }

  public getValueOrDefault(defaultValue: T): T {
    return this.succeeded && this.value !== undefined
      ? this.value
      : defaultValue;
  }

  public map<TNext>(mapper: (value: T) => TNext): SDResult<TNext> {
    if (!this.succeeded || this.value === undefined) {
      return SDResult.fail<TNext>(
        this.error ?? SDError.fromMessage("SDResult failed."),
      );
    }

    return SDResult.ok(mapper(this.value));
  }
}


export class SDServiceProvider {
  public readonly keys: KeyBuilder;

  public readonly properties: DynamicPropertyStore;

  public readonly jsonStore: JsonStore;

  public readonly forms: FormService;

  public readonly config: ConfigService;

  public readonly rewards: RewardService;

  public readonly migrations: MigrationService;

  public readonly modules: FeatureRegistry;

  public readonly players: PlayerService;

  public constructor(authorNamespace: string) {
    this.keys = KeyBuilder.create(authorNamespace, "core");

    this.properties = MinecraftDynamicPropertyStore.forWorld();

    this.jsonStore = new JsonDynamicPropertyStore(
      this.properties,
      new DefaultJsonSerializer(),
    );

    this.forms = new MinecraftFormService();

    this.config = new DefaultConfigService(this.jsonStore, this.keys);

    this.rewards = new DefaultRewardService();

    this.migrations = new DefaultMigrationService(this.jsonStore, this.keys);

    this.modules = new DefaultFeatureRegistry();

    this.players = new PlayerService();
  }

  public createModuleKeys(moduleId: string): KeyBuilder {
    return this.keys.child(moduleId);
  }

  public createModuleContext(module: Feature): FeatureContext {
    return {
      keys: this.createModuleKeys(module.metadata.id),
      forms: this.forms,
      config: this.config,
      rewards: this.rewards,
      migrations: this.migrations,
      modules: this.modules,
      logger: LoggerFactory.createModuleLogger(module.metadata.id),
    };
  }
}