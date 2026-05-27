import { SDResult, SDError } from "./Common";
import { KeyBuilder, ConfigService } from "./Configuration";
import { Logger } from "./Logging";
import { FormService } from "./Forms";
import { RewardService } from "../features/Rewards";
import { MigrationService } from "./Migration";


export enum FeatureState {
  Created = "created",

  Initializing = "initializing",

  Initialized = "initialized",

  Failed = "failed",

  Disabled = "disabled",
}

export interface FeatureMetadata {
  readonly id: string;

  readonly displayName: string;

  readonly version: string;

  readonly description?: string;

  readonly dependencies?: readonly string[];
}

export interface Feature {
  readonly metadata: FeatureMetadata;

  readonly state: FeatureState;

  initialize(context: FeatureContext): SDResult<void> | Promise<SDResult<void>>;

  shutdown?(): SDResult<void> | Promise<SDResult<void>>;
}

export interface FeatureContext {
  readonly keys: KeyBuilder;

  readonly logger: Logger;

  readonly forms: FormService;

  readonly config: ConfigService;

  readonly rewards: RewardService;

  readonly migrations: MigrationService;

  readonly modules: FeatureRegistry;
}

export interface FeatureRegistry {
  register(module: Feature): SDResult<void>;

  initializeAll(
    contextFactory: (module: Feature) => FeatureContext,
  ): Promise<SDResult<void>>;

  get(moduleId: string): SDResult<Feature>;

  has(moduleId: string): boolean;

  getAll(): readonly Feature[];
}

export class DefaultFeatureRegistry implements FeatureRegistry {
  private readonly modules = new Map<string, Feature>();

  public register(module: Feature): SDResult<void> {
    const id = module.metadata.id;

    if (this.modules.has(id)) {
      return SDResult.fail(
        new SDError("module.duplicate", "Module is already registered.", {
          id,
        }),
      );
    }

    this.modules.set(id, module);
    return SDResult.ok(undefined);
  }

  public async initializeAll(
    contextFactory: (module: Feature) => FeatureContext,
  ): Promise<SDResult<void>> {
    const sorted = this.sortByDependencies();

    if (sorted.isFailure) {
      return SDResult.fail(sorted.error!);
    }

    for (const module of sorted.getValueOrThrow()) {
      const result = await module.initialize(contextFactory(module));

      if (result.isFailure) {
        return SDResult.fail(
          new SDError(
            "module.initialize_failed",
            "Module initialization failed.",
            {
              moduleId: module.metadata.id,
              error: result.error,
            },
          ),
        );
      }
    }

    return SDResult.ok(undefined);
  }

  public get(moduleId: string): SDResult<Feature> {
    const module = this.modules.get(moduleId);

    return module === undefined
      ? SDResult.fail(
          new SDError("module.not_found", "Module was not registered.", {
            moduleId,
          }),
        )
      : SDResult.ok(module);
  }

  public has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  public getAll(): readonly Feature[] {
    return [...this.modules.values()];
  }

  private sortByDependencies(): SDResult<readonly Feature[]> {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: Feature[] = [];

    const visit = (module: Feature): SDResult<void> => {
      const id = module.metadata.id;

      if (visited.has(id)) {
        return SDResult.ok(undefined);
      }

      if (visiting.has(id)) {
        return SDResult.fail(
          new SDError("module.dependency_cycle", "Module dependency cycle.", {
            id,
          }),
        );
      }

      visiting.add(id);

      for (const dependencyId of module.metadata.dependencies ?? []) {
        const dependency = this.modules.get(dependencyId);

        if (dependency === undefined) {
          return SDResult.fail(
            new SDError(
              "module.missing_dependency",
              "Missing module dependency.",
              {
                moduleId: id,
                dependencyId,
              },
            ),
          );
        }

        const dependencyResult = visit(dependency);

        if (dependencyResult.isFailure) {
          return dependencyResult;
        }
      }

      visiting.delete(id);
      visited.add(id);
      result.push(module);

      return SDResult.ok(undefined);
    };

    for (const module of this.modules.values()) {
      const visitResult = visit(module);

      if (visitResult.isFailure) {
        return SDResult.fail(visitResult.error!);
      }
    }

    return SDResult.ok(result);
  }
}

export abstract class FeatureBase implements Feature {
  public state: FeatureState = FeatureState.Created;

  protected constructor(public readonly metadata: FeatureMetadata) {}

  public async initialize(context: FeatureContext): Promise<SDResult<void>> {
    this.state = FeatureState.Initializing;

    const result = await this.onInitialize(context);

    this.state = result.succeeded
      ? FeatureState.Initialized
      : FeatureState.Failed;

    return result;
  }

  protected abstract onInitialize(
    context: FeatureContext,
  ): SDResult<void> | Promise<SDResult<void>>;
}