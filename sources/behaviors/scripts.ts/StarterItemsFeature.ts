import { FeatureBase, FeatureContext, FeatureMetadata, SDResult } from "../core";

const metadata: FeatureMetadata = {
  id: "starteritems",
  displayName: "StarterItems Feature",
  version: "1.0.0",
};

export class StarterItemsFeature extends FeatureBase {
  public constructor() {
    super(metadata);
  }

  protected onInitialize(_context: FeatureContext): SDResult<void> {
    return SDResult.ok(undefined);
  }
}
