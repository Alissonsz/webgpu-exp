import { Vec2, vec2 } from "@gustavo4passos/wgpu-matrix";

export interface ColliderOptions {
  isTrigger?: boolean;
  size?: Vec2;
  offset?: Vec2;
}

export class Collider {
  isTrigger: boolean;
  size: Vec2;
  offset: Vec2;

  constructor({ isTrigger = false, size = vec2.create(0, 0), offset = vec2.create(0, 0) }: ColliderOptions = {}) {
    this.isTrigger = isTrigger;
    this.size = size;
    this.offset = offset;
  }
}

export interface PhysicsBodyOptions {
  acceleration?: Vec2;
  velocity?: Vec2;
  isSolid?: boolean;
  useGravity?: boolean;
  collider?: Collider;
}

export class PhysicsBody {
  acceleration: Vec2;
  velocity: Vec2;
  isSolid: boolean;
  useGravity: boolean;
  collider: Collider;

  constructor({
    acceleration = vec2.create(0, 0),
    velocity = vec2.create(0, 0),
    isSolid = false,
    useGravity = true,
    collider = new Collider(),
  }: PhysicsBodyOptions = {}) {
    this.acceleration = acceleration;
    this.velocity = velocity;
    this.isSolid = isSolid;
    this.useGravity = useGravity;
    this.collider = collider;
  }
}
