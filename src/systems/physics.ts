import { System } from "../ecs";
import { PhysicsBodyComponent, TransformComponent } from "../components";
import { vec2 } from "@gustavo4passos/wgpu-matrix";
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

      const [e, r, t] = componentGroups[i];
      const physicsBody = (r as PhysicsBodyComponent).physicsBody;
      
      if (physicsBody.isSolid) continue; // So far solids can't move
      
      const tc = t as TransformComponent;
      const position = tc.position;
      const scale = tc.scale;

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
          const e2RigidBodyComponent = otherR as PhysicsBodyComponent;

          if (e2RigidBodyComponent.physicsBody.collider.isTrigger) continue;

          const e2TransformComponent = otherT as TransformComponent;
          const e2Pos   = e2TransformComponent.position;
          const e2Scale = e2TransformComponent.scale;

          rPrev.set(currentPosStep.x, currentPosStep.y, scale.x, scale.y);
          r1.set(currentPosStep.x + stepSize.x, currentPosStep.y + stepSize.y, scale.x, scale.y);
          r2.set(e2Pos.x, e2Pos.y, e2Scale.x, e2Scale.y);

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
      
      tc.position = furthestDestination;
    }
  }

  static doRectsCollide(r1: Rect, r2: Rect): boolean {
    if (r1.left >= r2.right) return false;
    if (r1.right <=r2.left) return false;
    if (r1.top >= r2.bottom) return false;
    if (r1.bottom <= r2.top) return false;

    return true;
  }
}
