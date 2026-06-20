import { Vec2, vec2 } from "@gustavo4passos/wgpu-matrix";
import { LevelComponent, RopeComponent } from "../components";
import { System } from "../ecs";
import { Rect } from "../Rect";
import { PhysicsSystem } from "./physics";

export class RopeSystem extends System {
  private GRAVITY_ACCELERATION = vec2.create(0, 800);
  constructor() {
    super();
  }

  update(dt: number) {
    for (const [_, r] of this.world.queryComponents(RopeComponent)) {
      const rc = r as RopeComponent;
      if (!rc.hooked) continue;

      for (const point of rc.points) {
        if (point.pinned) continue;

        const vx = point.position.x - point.pastPosition.x;
        const vy = point.position.y - point.pastPosition.y;

        point.pastPosition.x = point.position.x;
        point.pastPosition.y = point.position.y;

        const nextPos = vec2.create(
          point.position.x + vx,
          point.position.y + vy + this.GRAVITY_ACCELERATION.y * dt * dt,
        );

        let collided = false;
        for (const [_, l] of this.world.queryComponents(LevelComponent)) {
          const lc = l as LevelComponent;

          for (const rect of lc.collisionRects) {
            if (PhysicsSystem.doRectsCollide(rect, rectFromPoint(nextPos, 2))) {
              collided = true;
              break;
            }
          }
        }

        if (!collided) point.position = nextPos;
      }
    }
  }
}

const rectFromPoint = (point: Vec2, radius: number) => {
  return new Rect(point.x - radius / 2, point.y - radius / 2, radius, radius);
};
