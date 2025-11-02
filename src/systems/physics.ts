import { System } from "../ecs";
import { PhysicsBodyComponent, TransformComponent } from "../components";
import { vec2 } from "@gustavo4passos/wgpu-matrix";
import { Rect } from "../Rect.ts";

enum CollisionSide {
  TOP,
  RIGHT,
  BOTTOM,
  LEFT
};

type CollisionInfo = {
  side: CollisionSide;
};

export class PhysicsSystem extends System {
  private GRAVITY_ACCELERATION = vec2.create(0, 800);
  constructor() {
    super();
  }

  update(deltaTime: number) {
    const componentGroups = this.world.getComponentGroups(PhysicsBodyComponent, TransformComponent);

    
    
    for(let i = 0; i < componentGroups.length; i++) { 
      let rPrev = new Rect(0, 0, 0, 0);
      let r1 = new Rect(0, 0, 0, 0);
      let r2 = new Rect(0, 0, 0, 0);
      let destination = vec2.create(0, 0);

      const [e, r, t] = componentGroups[i];
      const physicsBody = (r as PhysicsBodyComponent).physicsBody;
      
      if (physicsBody.isSolid) continue;
      
      const tc = t as TransformComponent;
      let position = tc.position;
      const scale = tc.scale;

      vec2.add(physicsBody.acceleration, this.GRAVITY_ACCELERATION, physicsBody.acceleration);
      const accDt = vec2.mulScalar(physicsBody.acceleration, deltaTime);
      vec2.add(physicsBody.velocity, accDt, physicsBody.velocity);

      physicsBody.acceleration.x = 0;
      physicsBody.acceleration.y = 0;
      
      if (physicsBody.velocity.x == 0 && physicsBody.velocity.y == 0) continue;
      
      const velocityDt = vec2.mulScalar(physicsBody.velocity, deltaTime);
      
      vec2.add(position, velocityDt, destination);

      // Advance one unit at a time
      // Entity velocities are usually small, so nSteps will also be
      const nSteps = Math.ceil(vec2.length(velocityDt));
      let currentPosStep = position;
      let stepSize = vec2.divScalar(velocityDt, nSteps);

      for (let step = 0; step < nSteps && (stepSize.x != 0 || stepSize.y != 0); step++) {
        let hasCollidedThisStep = false;
        for (let j = 0; j < componentGroups.length; j++) {
          if (i == j) continue;

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

          // Horizontal collision
          step--;
          if (rPrev.isLeftOf(r2) || rPrev.isRightOf(r2)) {
            stepSize.x = 0;
            physicsBody.velocity.x = 0;
          } else {
            stepSize.y = 0;
            physicsBody.velocity.y = 0;
          }
          break;
        }

        if (!hasCollidedThisStep) {
          currentPosStep.x += stepSize.x;
          currentPosStep.y += stepSize.y;
        }
        destination = currentPosStep;
      }
      
      tc.position = destination;
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
