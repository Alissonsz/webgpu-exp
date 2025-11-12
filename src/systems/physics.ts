import { System, Entity } from "../ecs";
import { Collider } from "../physics/PhysicsBodies";
import { LevelComponent, PhysicsBodyComponent, TransformComponent } from "../components";
import { vec2, Vec2 } from "@gustavo4passos/wgpu-matrix";
import { Rect } from "../Rect.ts";

type EntityCollisionData = [Entity, PhysicsBodyComponent, TransformComponent];
type EntityCollisionGroup = [Entity, PhysicsBodyComponent, TransformComponent][];

export class PhysicsSystem extends System {
  private GRAVITY_ACCELERATION = vec2.create(0, 800);
  r2: Rect; // Cached rect to avoid creating multiple new rects every time

  constructor() {
    super();
    this.r2 = new Rect(0, 0, 0, 0);
  }

  checkCollisionAgainstEntityGroup(r1: Rect, cg: EntityCollisionGroup): Rect | undefined {
    let hasCollidedThisStep = false;
    for (let j = 0; j < cg.length; j++) {

      const [_, p, t] = cg[j];

      if (!p.active) continue;
      if (p.physicsBody.collider.isTrigger) continue;

      const tc = t as TransformComponent;
      const pos   = tc.position;

      const collider = p.physicsBody.collider;
      PhysicsSystem.getRectFromCollider(pos, collider, this.r2);

      if (PhysicsSystem.doRectsCollide(r1, this.r2)) {
        return this.r2;
      }
    }

    return undefined;
  }

  checkCollisionAgainsRectGroup(r1: Rect, rects: Array<Rect>): Rect | undefined {
    for (const r of rects) {
      if (PhysicsSystem.doRectsCollide(r1, r)) {
        return r;
      }
    }

    return undefined;
  }

  update(deltaTime: number) {
    const pbComponentGroups = this.world.getComponentGroups(PhysicsBodyComponent, TransformComponent) as EntityCollisionGroup;
    const lComponentGroups = this.world.getComponentGroups(LevelComponent) as [Entity, LevelComponent][];

    // Pre-instantiate rects and vecs that will be used every frame    
    let rPrev = new Rect(0, 0, 0, 0);
    let r1 = new Rect(0, 0, 0, 0);
    let r2 = new Rect(0, 0, 0, 0);

    for(let i = 0; i < pbComponentGroups.length; i++) { 
      const [_, p, t] = pbComponentGroups[i] as EntityCollisionData;
      const physicsBody = p.physicsBody;
      
      if (physicsBody.isSolid) continue; // So far solids can't move
      
      const tc = t as TransformComponent;

      PhysicsSystem.getRectFromCollider(tc.position, physicsBody.collider, r1);

      let position = vec2.create(0, 0);
      let scale    = vec2.create(0, 0);
      position.x = r1.x;
      position.y = r1.y;
      scale.x = r1.w;
      scale.y = r1.h;

      vec2.add(physicsBody.acceleration, this.GRAVITY_ACCELERATION, physicsBody.acceleration);
      const accDt = vec2.mulScalar(physicsBody.acceleration, deltaTime);
      vec2.add(physicsBody.velocity, accDt, physicsBody.velocity);

      // Reset acceleration before next update
      physicsBody.acceleration.x = 0;
      physicsBody.acceleration.y = 0;
      
      if (physicsBody.velocity.x == 0 && physicsBody.velocity.y == 0) continue;
      p.active = false; // Avoid collisions with themselves

      const velocityDt = vec2.mulScalar(physicsBody.velocity, deltaTime);
      let furthestDestination = vec2.add(position, velocityDt);

      // Advance one unit at a time
      // Entity velocities are usually small, so nSteps will also be
      const nSteps = Math.ceil(vec2.length(velocityDt));
      let currentPosStep = position;
      let stepSize = vec2.divScalar(velocityDt, nSteps);

      for (let step = 0; step < nSteps && (stepSize.x != 0 || stepSize.y != 0); step++) {
        let hasCollidedThisStep = false;
        rPrev.set(currentPosStep.x, currentPosStep.y, scale.x, scale.y);
        r1.set(currentPosStep.x + stepSize.x, currentPosStep.y + stepSize.y, scale.x, scale.y);

        let collisionResult = this.checkCollisionAgainstEntityGroup(r1, pbComponentGroups);
        if (!collisionResult) {
          for (const [e, lc] of lComponentGroups) {
            collisionResult = this.checkCollisionAgainsRectGroup(r1, lc.collisionRects);
            if (collisionResult) break;
          }
        }
        
        if (collisionResult) {
          hasCollidedThisStep = true;
          r2 = collisionResult;
        }

        if (hasCollidedThisStep) {
          // Find if the collision was either vertical or horizontal,
          // so we can try the other axis next.
          // Then, move object as far as possible towards the collided object
          step--;
          if (rPrev.isLeftOf(r2) || rPrev.isRightOf(r2)) {
            if (rPrev.isLeftOf(r2)) {
              furthestDestination.x = r2.left - scale.x;
            } else {
              furthestDestination.x = r2.right;
            }
            stepSize.x = 0;
            physicsBody.velocity.x = 0;
          } else {
            if (rPrev.isTopOf(r2)) {
              furthestDestination.y = r2.top - scale.y;
            } else {
              furthestDestination.y = r2.bottom;
            }
            stepSize.y = 0;
            physicsBody.velocity.y = 0;
          }
        } else {
          currentPosStep.x += stepSize.x;
          currentPosStep.y += stepSize.y;
          furthestDestination = currentPosStep;
        }
      }
      
      tc.position.x = furthestDestination.x - physicsBody.collider.offset.x;
      tc.position.y = furthestDestination.y - physicsBody.collider.offset.y;
      p.active = true;
    }
  }

  isOnGround(e: Entity): boolean {
    const tc = e.getComponent(TransformComponent);
    const pbc = e.getComponent(PhysicsBodyComponent); 
    
    if (!pbc) {
      console.log("Warning: isOnGround check, but entity has no physics body component");
      return false;
    }

    const pos = tc.position;
    const physicsBody = pbc.physicsBody;

    
    const eColliderRect = PhysicsSystem.getRectFromCollider(pos, physicsBody.collider);
    eColliderRect.y += 1;
    
    const lComponentGroup = this.world.getComponentGroups(LevelComponent) as [Entity, LevelComponent][];

    for (const [e, lc] of lComponentGroup) {
      if (this.checkCollisionAgainsRectGroup(eColliderRect, lc.collisionRects)) return true;
    }
    

    return false;
  }

  // This method can take the output rect to avoid instantiating and destroy them everytime,
  // since they're mostly discardable.
  // It will create a new rect is no outputRect is passed as an argument.
  // It will return a rect regardless.
  static getRectFromCollider(pos: Vec2, collider: Collider, outputRect?: Rect): Rect {
    if (!outputRect) outputRect = new Rect(0, 0, 0, 0);

    outputRect.x = pos.x + collider.offset.x;
    outputRect.y = pos.y + collider.offset.y;
    outputRect.w = collider.size.x;
    outputRect.h = collider.size.y;

    return outputRect;
  }

  static doRectsCollide(r1: Rect, r2: Rect): boolean {
    if (r1.left >= r2.right) return false;
    if (r1.right <=r2.left) return false;
    if (r1.top >= r2.bottom) return false;
    if (r1.bottom <= r2.top) return false;

    return true;
  }
}
