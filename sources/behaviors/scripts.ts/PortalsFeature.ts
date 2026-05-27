import { FeatureBase, FeatureContext, FeatureMetadata, SDResult } from "../core";

const metadata: FeatureMetadata = {
  id: "portals",
  displayName: "Portals Feature",
  version: "1.0.0",
};

export class PortalsFeature extends FeatureBase {
  public constructor() {
    super(metadata);
  }

  protected onInitialize(_context: FeatureContext): SDResult<void> {
    return SDResult.ok(undefined);
  }
}
