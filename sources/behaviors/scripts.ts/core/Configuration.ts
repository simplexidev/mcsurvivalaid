import { SDResult, SDError } from "./Common";
import { JsonStore } from "./Json";

export class KeyBuilder {
  public constructor(
    public readonly authorNamespace: string,
    public readonly moduleId: string,
  ) {}

  public static create(authorNamespace: string, moduleId: string): KeyBuilder {
    return new KeyBuilder(authorNamespace, moduleId);
  }

  public root(): string {
    return `${this.authorNamespace}:${this.moduleId}`;
  }

  public config(): string {
    return this.join("config");
  }

  public version(): string {
    return this.join("version");
  }

  public world(...parts: string[]): string {
    return this.join("world", ...parts);
  }

  public player(playerId: string, ...parts: string[]): string {
    return this.join("player", this.sanitize(playerId), ...parts);
  }

  public entity(entityId: string, ...parts: string[]): string {
    return this.join("entity", this.sanitize(entityId), ...parts);
  }

  public component(componentName: string, ...parts: string[]): string {
    return this.join("component", componentName, ...parts);
  }

  public child(moduleId: string): KeyBuilder {
    return new KeyBuilder(this.authorNamespace, moduleId);
  }

  public join(...parts: string[]): string {
    const cleanParts = parts
      .filter((part) => part !== undefined && part !== null && part.length > 0)
      .map((part) => this.sanitize(part));

    return `${this.root()}:${cleanParts.join(":")}`;
  }

  private sanitize(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_")
      .replace(/[^a-z0-9_\-:.]/g, "_");
  }
}

export interface ConfigSchema<TConfig> {
  readonly defaultValue: TConfig;

  validate(value: unknown): SDResult<TConfig>;
}

export interface ConfigRegistration<TConfig> {
  readonly moduleId: string;

  readonly key: string;

  readonly schema: ConfigSchema<TConfig>;
}

export interface ConfigService {
  register<TConfig>(registration: ConfigRegistration<TConfig>): SDResult<void>;

  get<TConfig>(moduleId: string, key: string): SDResult<TConfig>;

  set<TConfig>(moduleId: string, key: string, value: TConfig): SDResult<void>;

  reset(moduleId: string, key: string): SDResult<void>;
}

export class DefaultConfigService implements ConfigService {
  private readonly schemas = new Map<string, ConfigSchema<unknown>>();

  public constructor(
    private readonly store: JsonStore,
    private readonly keyBuilder: KeyBuilder,
  ) {}

  public register<TConfig>(
    registration: ConfigRegistration<TConfig>,
  ): SDResult<void> {
    const id = this.getRegistrationId(registration.moduleId, registration.key);

    if (this.schemas.has(id)) {
      return SDResult.fail(
        new SDError("config.duplicate", "Config is already registered.", {
          id,
        }),
      );
    }

    this.schemas.set(id, registration.schema as ConfigSchema<unknown>);
    return SDResult.ok(undefined);
  }

  public get<TConfig>(moduleId: string, key: string): SDResult<TConfig> {
    const schemaResult = this.getSchema<TConfig>(moduleId, key);

    if (schemaResult.isFailure) {
      return SDResult.fail(schemaResult.error!);
    }

    const schema = schemaResult.getValueOrThrow();

    const rawResult = this.store.getJson<unknown>(
      this.getStorageKey(moduleId, key),
      schema.defaultValue,
    );

    if (rawResult.isFailure) {
      return SDResult.fail(rawResult.error!);
    }

    return schema.validate(rawResult.value);
  }

  public set<TConfig>(
    moduleId: string,
    key: string,
    value: TConfig,
  ): SDResult<void> {
    const schemaResult = this.getSchema<TConfig>(moduleId, key);

    if (schemaResult.isFailure) {
      return SDResult.fail(schemaResult.error!);
    }

    const validationResult = schemaResult.getValueOrThrow().validate(value);

    if (validationResult.isFailure) {
      return SDResult.fail(validationResult.error!);
    }

    return this.store.setJson(
      this.getStorageKey(moduleId, key),
      validationResult.getValueOrThrow(),
    );
  }

  public reset(moduleId: string, key: string): SDResult<void> {
    const schemaResult = this.getSchema(moduleId, key);

    if (schemaResult.isFailure) {
      return SDResult.fail(schemaResult.error!);
    }

    return this.store.setJson(
      this.getStorageKey(moduleId, key),
      schemaResult.getValueOrThrow().defaultValue,
    );
  }

  private getSchema<TConfig>(
    moduleId: string,
    key: string,
  ): SDResult<ConfigSchema<TConfig>> {
    const id = this.getRegistrationId(moduleId, key);
    const schema = this.schemas.get(id);

    if (schema === undefined) {
      return SDResult.fail(
        new SDError("config.not_registered", "Config was not registered.", {
          id,
        }),
      );
    }

    return SDResult.ok(schema as ConfigSchema<TConfig>);
  }

  private getRegistrationId(moduleId: string, key: string): string {
    return `${moduleId}.${key}`;
  }

  private getStorageKey(moduleId: string, key: string): string {
    return this.keyBuilder.world("config", moduleId, key);
  }
}