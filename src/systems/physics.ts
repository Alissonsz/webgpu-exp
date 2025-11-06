import { System, Entity } from "../ecs";
import { Collider } from "../physics/PhysicsBodies";
import { PhysicsBodyComponent, TransformComponent } from "../components";
import { vec2, Vec2 } from "@gustavo4passos/wgpu-matrix";
import { Rect } from "../Rect.ts";

export class PhysicsSystem extends System {
  private GRAVITY_ACCELERATION = vec2.create(0, 800);
  constructor() {
    super();
  }

  update(deltaTime: number) {
    const componentGroups = this.world.getComponentGroups(PhysicsBodyComponent, TransformComponent);

    // Pre-instantiate rects and vecs that will be used every frame    
    let rPrev = new Rect(0, 0, 0, 0);
    let r1 = new Rect(0, 0, 0, 0);
    let r2 = new Rect(0, 0, 0, 0);
    for(let i = 0; i < componentGroups.length; i++) { 

      const [_, r, t] = componentGroups[i];
      const physicsBody = (r as PhysicsBodyComponent).physicsBody;
      
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
      
      const velocityDt = vec2.mulScalar(physicsBody.velocity, deltaTime);
      let furthestDestination = vec2.add(position, velocityDt);

      // Advance one unit at a time
      // Entity velocities are usually small, so nSteps will also be
      const nSteps = Math.ceil(vec2.length(velocityDt));
      let currentPosStep = position;
      let stepSize = vec2.divScalar(velocityDt, nSteps);

      for (let step = 0; step < nSteps && (stepSize.x != 0 || stepSize.y != 0); step++) {
        let hasCollidedThisStep = false;
        for (let j = 0; j < componentGroups.length; j++) {
          if (i == j) continue; // Objects do not collide with themselves

          const [_, otherR, otherT] = componentGroups[j];
          const e2PhysicsBodyComponent = otherR as PhysicsBodyComponent;

          if (e2PhysicsBodyComponent.physicsBody.collider.isTrigger) continue;

          const e2TransformComponent = otherT as TransformComponent;
          const e2Pos   = e2TransformComponent.position;

          rPrev.set(currentPosStep.x, currentPosStep.y, scale.x, scale.y);
          r1.set(currentPosStep.x + stepSize.x, currentPosStep.y + stepSize.y, scale.x, scale.y);
          const e2Collider = e2PhysicsBodyComponent.physicsBody.collider;
          PhysicsSystem.getRectFromCollider(e2Pos, e2Collider, r2);

          hasCollidedThisStep = PhysicsSystem.doRectsCollide(r1, r2);

          if (!hasCollidedThisStep) {
            continue;
          }

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
          break;
        }

        if (!hasCollidedThisStep) {
          currentPosStep.x += stepSize.x;
          currentPosStep.y += stepSize.y;
          furthestDestination = currentPosStep;
        }
      }
      
      tc.position.x = furthestDestination.x - physicsBody.collider.offset.x;
      tc.position.y = furthestDestination.y - physicsBody.collider.offset.y;
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
    const e2ColliderRect = new Rect(0, 0, 0, 0);

    for (const [e2, e2Tc, e2Pbc] of this.world.queryComponents(TransformComponent, PhysicsBodyComponent)) {
      if (e.isSameEntityAs(e2)) continue;

      const e2Pos = (e2Tc as TransformComponent).position;
      const e2Collider = (e2Pbc as PhysicsBodyComponent).physicsBody.collider;

      PhysicsSystem.getRectFromCollider(e2Pos, e2Collider, e2ColliderRect);

      if (PhysicsSystem.doRectsCollide(eColliderRect, e2ColliderRect)) return true;
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
