import { SDError, SDResult } from "./Common";

export type DimensionId =
  | "minecraft:overworld"
  | "minecraft:nether"
  | "minecraft:the_end"
  | string;

export interface LocationJson {
  readonly dimensionId: DimensionId;

  readonly x: number;

  readonly y: number;

  readonly z: number;
}

export class LocationRef {
  public constructor(
    public readonly dimensionId: DimensionId,
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
  ) {}

  public static fromVector(
    dimensionId: DimensionId,
    vector: Vector3,
  ): LocationRef {
    return new LocationRef(dimensionId, vector.x, vector.y, vector.z);
  }

  public static fromJson(json: LocationJson): LocationRef {
    return new LocationRef(json.dimensionId, json.x, json.y, json.z);
  }

  public static zero(
    dimensionId: DimensionId = "minecraft:overworld",
  ): LocationRef {
    return new LocationRef(dimensionId, 0, 0, 0);
  }

  public toJson(): LocationJson {
    return {
      dimensionId: this.dimensionId,
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }

  public toVector3(): Vector3 {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }

  public getDimension(): SDResult<Dimension> {
    try {
      return SDResult.ok(world.getDimension(this.dimensionId));
    } catch (error) {
      return SDResult.fail(
        SDError.exception("location.dimension_not_found", error, this.toJson()),
      );
    }
  }

  public floor(): LocationRef {
    return new LocationRef(
      this.dimensionId,
      Math.floor(this.x),
      Math.floor(this.y),
      Math.floor(this.z),
    );
  }

  public offset(x: number, y: number, z: number): LocationRef {
    return new LocationRef(
      this.dimensionId,
      this.x + x,
      this.y + y,
      this.z + z,
    );
  }

  public distanceSquaredTo(other: LocationRef): SDResult<number> {
    if (this.dimensionId !== other.dimensionId) {
      return SDResult.fail(
        new SDError(
          "location.dimension_mismatch",
          "Cannot measure across dimensions.",
          {
            from: this.dimensionId,
            to: other.dimensionId,
          },
        ),
      );
    }

    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;

    return SDResult.ok(dx * dx + dy * dy + dz * dz);
  }
}

export class BlockLocationRef extends LocationRef {
  public override floor(): BlockLocationRef {
    return new BlockLocationRef(
      this.dimensionId,
      Math.floor(this.x),
      Math.floor(this.y),
      Math.floor(this.z),
    );
  }
}