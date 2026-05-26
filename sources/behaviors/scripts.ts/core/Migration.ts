import {SDError, SDResult } from "./Common";
import { KeyBuilder } from "./Configuration";
import { DynamicPropertyStore, JsonStore } from "./Json";

export interface Migration {
  readonly id: string;

  readonly moduleId: string;

  readonly fromVersion: string;

  readonly toVersion: string;

  apply(context: MigrationContext): SDResult<void> | Promise<SDResult<void>>;
}

export interface MigrationContext {
  readonly keys: KeyBuilder;

  readonly jsonStore: JsonStore;

  readonly properties: DynamicPropertyStore;
}

export interface ModuleVersionState {
  readonly moduleId: string;

  readonly version: string;

  readonly appliedMigrations: readonly string[];
}

export interface MigrationService {
  register(migration: Migration): SDResult<void>;

  migrateModule(
    moduleId: string,
    targetVersion: string,
    context: MigrationContext,
  ): Promise<SDResult<void>>;

  getVersion(moduleId: string): SDResult<string | undefined>;

  setVersion(moduleId: string, version: string): SDResult<void>;
}

export class DefaultMigrationService implements MigrationService {
  private readonly migrationsByModule = new Map<string, Migration[]>();

  public constructor(
    private readonly store: JsonStore,
    private readonly keyBuilder: KeyBuilder,
  ) {}

  public register(migration: Migration): SDResult<void> {
    const migrations = this.migrationsByModule.get(migration.moduleId) ?? [];

    if (migrations.some((existing) => existing.id === migration.id)) {
      return SDResult.fail(
        new SDError(
          "migration.duplicate",
          "Migration is already registered.",
          migration,
        ),
      );
    }

    migrations.push(migration);
    this.migrationsByModule.set(migration.moduleId, migrations);

    return SDResult.ok(undefined);
  }

  public async migrateModule(
    moduleId: string,
    targetVersion: string,
    context: MigrationContext,
  ): Promise<SDResult<void>> {
    const stateResult = this.getState(moduleId);

    if (stateResult.isFailure) {
      return SDResult.fail(stateResult.error!);
    }

    const state =
      stateResult.value ??
      ({
        moduleId,
        version: "0.0.0",
        appliedMigrations: [],
      } satisfies ModuleVersionState);

    const migrations = this.migrationsByModule.get(moduleId) ?? [];
    const applied = new Set(state.appliedMigrations);

    for (const migration of migrations) {
      if (applied.has(migration.id)) {
        continue;
      }

      const result = await migration.apply(context);

      if (result.isFailure) {
        return SDResult.fail(
          new SDError("migration.apply_failed", "Migration failed.", {
            migration,
            error: result.error,
          }),
        );
      }

      applied.add(migration.id);
    }

    return this.setState({
      moduleId,
      version: targetVersion,
      appliedMigrations: [...applied],
    });
  }

  public getVersion(moduleId: string): SDResult<string | undefined> {
    return this.getState(moduleId).map((state) => state?.version);
  }

  public setVersion(moduleId: string, version: string): SDResult<void> {
    const current = this.getState(moduleId).getValueOrDefault({
      moduleId,
      version,
      appliedMigrations: [],
    });

    return this.setState({
      ...current,
      version,
    });
  }

  private getState(moduleId: string): SDResult<ModuleVersionState | undefined> {
    return this.store.getJson<ModuleVersionState | undefined>(
      this.keyBuilder.world("migrations", moduleId),
      undefined,
    );
  }

  private setState(state: ModuleVersionState): SDResult<void> {
    return this.store.setJson(
      this.keyBuilder.world("migrations", state.moduleId),
      state,
    );
  }
}