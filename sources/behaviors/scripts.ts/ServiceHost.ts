import { Player, world } from "@minecraft/server";
import { Feature, FeatureContext, LoggerFactory, SDResult, SDServiceProvider } from "./core";
import { GuidebookFeature } from "./features/GuidebookFeature";
import { RewardsFeature } from "./features/RewardsFeature";
import { QuestsFeature } from "./features/QuestsFeature";
import { AchievementsFeature } from "./features/AchievementsFeature";
import { WorldEventsFeature } from "./features/WorldEventsFeature";
import { PortalsFeature } from "./features/PortalsFeature";
import { TeleportFeature } from "./features/TeleportFeature";
import { StarterItemsFeature } from "./features/StarterItemsFeature";
import { SettingsFeature } from "./features/SettingsFeature";
import { DocumentationFeature } from "./features/DocumentationFeature";
import { DeveloperToolsFeature } from "./features/DeveloperToolsFeature";

export class ServiceHost {
  public readonly core: SDServiceProvider;
  private readonly features: Feature[] = [];

  public constructor(authorNamespace: string) {
    this.core = new SDServiceProvider(authorNamespace);
  }

  public initialize(): SDResult<void> {
    const registered = this.registerDefaultFeatures();
    if (registered.isFailure) return registered;

    const initResult = this.core.modules.initializeAll((feature) => this.createFeatureContext(feature));
    void initResult;

    this.registerPlayerLifecycleHandlers();
    return SDResult.ok(undefined);
  }

  private registerDefaultFeatures(): SDResult<void> {
    const defaults: Feature[] = [
      new RewardsFeature(),
      new SettingsFeature(),
      new DocumentationFeature(),
      new DeveloperToolsFeature(),
      new AchievementsFeature(),
      new QuestsFeature(),
      new WorldEventsFeature(),
      new PortalsFeature(),
      new TeleportFeature(),
      new StarterItemsFeature(),
      new GuidebookFeature(),
    ];

    for (const feature of defaults) {
      const result = this.core.modules.register(feature);
      if (result.isFailure) return result;
      this.features.push(feature);
    }

    return SDResult.ok(undefined);
  }

  private createFeatureContext(feature: Feature): FeatureContext {
    return {
      ...this.core.createModuleContext(feature),
      logger: this.coreLogger(feature.metadata.id),
    };
  }

  private coreLogger(featureId: string) {
    return LoggerFactory.createModuleLogger(featureId);
  }

  private registerPlayerLifecycleHandlers(): void {
    world.afterEvents.playerSpawn.subscribe((event) => {
      if (event.initialSpawn) {
        this.onPlayerInitialSpawn(event.player);
      }
    });
  }

  private onPlayerInitialSpawn(_player: Player): void {
    // Reserved for feature-specific first-spawn actions.
  }
}

export interface PlayerAwareFeature {
  onPlayerInitialSpawn(player: Player): SDResult<void>;
}
