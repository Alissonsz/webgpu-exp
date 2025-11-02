import { Vec2, vec2 } from "@gustavo4passos/wgpu-matrix";

export class Collider {
  isTrigger: boolean;

  constructor(isTrigger?: boolean) {
    this.isTrigger = isTrigger? isTrigger : false;
  }
}

export class PhysicsBody {
  acceleration: Vec2;
  velocity: Vec2;
  isSolid: boolean;
  collider: Collider;

  constructor(acceleration?: Vec2, velocity?: Vec2, isSolid?: boolean, collider?: Collider) {
    this.acceleration = acceleration ? acceleration : vec2.create(0, 0); 
    this.velocity = velocity ? velocity : vec2.create(0, 0); 
    this.isSolid = isSolid ? isSolid : false; 
    this.collider = collider ? collider : new Collider();
  }
}
