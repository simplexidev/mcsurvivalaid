import { Player, world } from "@minecraft/server";
import { QuestModule } from "./modules/QuestModule";

export class ServiceHost {
  public readonly core: SimplexiCoreServices;

  private readonly modules: GameModule[] = [];

  public constructor(authorNamespace: string) {
    this.core = new SimplexiCoreServices(authorNamespace);
  }

  public initialize(): Result<void> {
    this.core.logger.info("host", "Initializing service host.");

    const questModule = new QuestModule();

    this.registerModule(questModule);

    const initializeResult = this.initializeModules();

    if (initializeResult.isFailure) {
      this.core.logger.error("host", "Service host initialization failed.", {
        error: initializeResult.error,
      });

      return initializeResult;
    }

    this.registerPlayerLifecycleHandlers();

    this.core.logger.info("host", "Service host initialized.");

    return Result.ok(undefined);
  }

  public registerModule(module: GameModule): Result<void> {
    const result = this.core.modules.register(module);

    if (result.isFailure) {
      this.core.logger.error("host", "Failed to register module.", {
        moduleId: module.metadata.id,
        error: result.error,
      });

      return result;
    }

    this.modules.push(module);

    this.core.logger.info("host", "Module registered.", {
      moduleId: module.metadata.id,
      displayName: module.metadata.displayName,
      version: module.metadata.version,
    });

    return Result.ok(undefined);
  }

  private initializeModules(): Result<void> {
    for (const module of this.modules) {
      const context = this.createModuleContext(module);
      const result = module.initialize(context);

      if (result instanceof Promise) {
        return Result.fail(
          "Async module initialization is not supported in this simple host example."
        );
      }

      if (result.isFailure) {
        return result;
      }
    }

    return Result.ok(undefined);
  }

  private createModuleContext(module: GameModule): ModuleContext {
    return {
      keys: this.createModuleKeys(module.metadata.id),
      logger: this.core.createModuleLogger(module),
      forms: this.core.forms,
      config: this.core.config,
      rewards: this.core.rewards,
      migrations: this.core.migrations,
      modules: this.core.modules,
    };
  }

  private createModuleKeys(moduleId: string): KeyBuilder {
    return this.core.createModuleKeys(moduleId);
  }

  private registerPlayerLifecycleHandlers(): void {
    world.afterEvents.playerSpawn.subscribe((event) => {
      if (!event.initialSpawn) {
        return;
      }

      this.onPlayerInitialSpawn(event.player);
    });
  }

  private onPlayerInitialSpawn(player: Player): void {
    this.core.logger.info("host", "Player initial spawn detected.", {
      playerId: player.id,
      playerName: player.name,
    });

    for (const module of this.modules) {
      if (this.isPlayerAwareModule(module)) {
        const result = module.onPlayerInitialSpawn(player);

        if (result.isFailure) {
          this.core.logger.warn("host", "Module failed during player initial spawn.", {
            moduleId: module.metadata.id,
            playerId: player.id,
            error: result.error,
          });
        }
      }
    }
  }

  private isPlayerAwareModule(module: GameModule): module is GameModule & PlayerAwareModule {
    return typeof (module as Partial<PlayerAwareModule>).onPlayerInitialSpawn === "function";
  }
}

export interface PlayerAwareModule {
  onPlayerInitialSpawn(player: Player): Result<void>;
}