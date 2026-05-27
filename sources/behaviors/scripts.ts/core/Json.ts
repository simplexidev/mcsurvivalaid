import { SDError, SDResult } from "./Common";
import { world, Entity, Player } from "@minecraft/server";

export interface JsonSerializer {
  serialize(value: unknown): SDResult<string>;

  deserialize<T>(json: string): SDResult<T>;
}

export class DefaultJsonSerializer implements JsonSerializer {
  public serialize(value: unknown): SDResult<string> {
    try {
      return SDResult.ok(JSON.stringify(value));
    } catch (error) {
      return SDResult.fail(
        SDError.exception("json.serialize_failed", error, { value }),
      );
    }
  }

  public deserialize<T>(json: string): SDResult<T> {
    try {
      return SDResult.ok(JSON.parse(json) as T);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("json.deserialize_failed", error, { json }),
      );
    }
  }
}

export interface JsonStore {
  getJson<T>(key: string, fallback: T): SDResult<T>;

  setJson<T>(key: string, value: T): SDResult<void>;

  remove(key: string): SDResult<void>;

  has(key: string): SDResult<boolean>;
}

export abstract class JsonStoreBase implements JsonStore {
  protected constructor(protected readonly serializer: JsonSerializer) {}

  public getJson<T>(key: string, fallback: T): SDResult<T> {
    const rawResult = this.getRaw(key);

    if (rawResult.isFailure) {
      return SDResult.fail(rawResult.error!);
    }

    const raw = rawResult.getValueOrDefault(undefined);

    if (typeof raw !== "string" || raw.length === 0) {
      return SDResult.ok(fallback);
    }

    return this.serializer.deserialize<T>(raw);
  }

  public setJson<T>(key: string, value: T): SDResult<void> {
    const jsonResult = this.serializer.serialize(value);

    if (jsonResult.isFailure) {
      return SDResult.fail(jsonResult.error!);
    }

    return this.setRaw(key, jsonResult.getValueOrThrow());
  }

  public abstract remove(key: string): SDResult<void>;

  public abstract has(key: string): SDResult<boolean>;

  protected abstract getRaw(key: string): SDResult<string | undefined>;

  protected abstract setRaw(key: string, value: string): SDResult<void>;
}

export type DynamicPropertyPrimitive = string | number | boolean;
type DynamicPropertyValue = string | number | boolean | { x: number; y: number; z: number };

export interface DynamicPropertyHost {
  getDynamicProperty(identifier: string): DynamicPropertyValue | undefined;

  setDynamicProperty(
    identifier: string,
    value?: string | number | boolean,
  ): void;

  getDynamicPropertyIds?(): string[];

  clearDynamicProperties?(): void;
}

export interface DynamicPropertyStore {
  getString(key: string, fallback?: string): SDResult<string | undefined>;

  getNumber(key: string, fallback?: number): SDResult<number | undefined>;

  getBoolean(key: string, fallback?: boolean): SDResult<boolean | undefined>;

  setString(key: string, value: string): SDResult<void>;

  setNumber(key: string, value: number): SDResult<void>;

  setBoolean(key: string, value: boolean): SDResult<void>;

  remove(key: string): SDResult<void>;

  has(key: string): SDResult<boolean>;
}

export class MinecraftDynamicPropertyStore implements DynamicPropertyStore {
  public constructor(private readonly host: DynamicPropertyHost) {}

  public static forWorld(): MinecraftDynamicPropertyStore {
    return new MinecraftDynamicPropertyStore(world);
  }

  public static forEntity(entity: Entity): MinecraftDynamicPropertyStore {
    return new MinecraftDynamicPropertyStore(entity);
  }

  public static forPlayer(player: Player): MinecraftDynamicPropertyStore {
    return new MinecraftDynamicPropertyStore(player);
  }

  public getString(
    key: string,
    fallback?: string,
  ): SDResult<string | undefined> {
    return this.getTyped(key, "string", fallback);
  }

  public getNumber(
    key: string,
    fallback?: number,
  ): SDResult<number | undefined> {
    return this.getTyped(key, "number", fallback);
  }

  public getBoolean(
    key: string,
    fallback?: boolean,
  ): SDResult<boolean | undefined> {
    return this.getTyped(key, "boolean", fallback);
  }

  public setString(key: string, value: string): SDResult<void> {
    return this.set(key, value);
  }

  public setNumber(key: string, value: number): SDResult<void> {
    return this.set(key, value);
  }

  public setBoolean(key: string, value: boolean): SDResult<void> {
    return this.set(key, value);
  }

  public remove(key: string): SDResult<void> {
    try {
      this.host.setDynamicProperty(key, undefined);
      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("dynamic_property.remove_failed", error, { key }),
      );
    }
  }

  public has(key: string): SDResult<boolean> {
    try {
      return SDResult.ok(this.host.getDynamicProperty(key) !== undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("dynamic_property.has_failed", error, { key }),
      );
    }
  }

  private getTyped<T extends DynamicPropertyPrimitive>(
    key: string,
    expectedType: "string" | "number" | "boolean",
    fallback?: T,
  ): SDResult<T | undefined> {
    try {
      const value = this.host.getDynamicProperty(key);

      if (value === undefined) {
        return SDResult.ok(fallback);
      }

      if (typeof value !== expectedType) {
        return SDResult.fail(
          new SDError(
            "dynamic_property.type_mismatch",
            "Dynamic property type mismatch.",
            {
              key,
              expectedType,
              actualType: typeof value,
            },
          ),
        );
      }

      return SDResult.ok(value as T);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("dynamic_property.get_failed", error, { key }),
      );
    }
  }

  private set(key: string, value: DynamicPropertyPrimitive): SDResult<void> {
    try {
      this.host.setDynamicProperty(key, value);
      return SDResult.ok(undefined);
    } catch (error) {
      return SDResult.fail(
        SDError.exception("dynamic_property.set_failed", error, { key, value }),
      );
    }
  }
}

export class JsonDynamicPropertyStore extends JsonStoreBase {
  public constructor(
    private readonly properties: DynamicPropertyStore,
    serializer: JsonSerializer = new DefaultJsonSerializer(),
  ) {
    super(serializer);
  }

  public remove(key: string): SDResult<void> {
    return this.properties.remove(key);
  }

  public has(key: string): SDResult<boolean> {
    return this.properties.has(key);
  }

  protected getRaw(key: string): SDResult<string | undefined> {
    return this.properties.getString(key);
  }

  protected setRaw(key: string, value: string): SDResult<void> {
    return this.properties.setString(key, value);
  }
}