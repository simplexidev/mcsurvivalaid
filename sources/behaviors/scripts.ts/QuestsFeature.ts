import { FeatureBase, FeatureContext, FeatureMetadata, SDResult } from "../core";

const metadata: FeatureMetadata = {
  id: "quests",
  displayName: "Quests Feature",
  version: "1.0.0",
};

export class QuestsFeature extends FeatureBase {
  public constructor() {
    super(metadata);
  }

  protected onInitialize(_context: FeatureContext): SDResult<void> {
    return SDResult.ok(undefined);
  }
}
