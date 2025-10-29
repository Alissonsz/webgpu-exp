import { System, World } from "./ecs";
import { BatchRenderer } from "./BatchRenderer.ts";
import { CameraComponent, SpriteComponent, TransformComponent } from "./ecs/ComponentTypes.ts";
import { Rect } from "./Rect.ts";
import { Camera } from "./Camera.ts";

export class RenderSystem extends System {
  constructor() { super(); }

  update(deltaTime: number) {
    let camera: Camera;

    for (const [e, c] of this.world.queryComponents(CameraComponent)) {
      if ((c as CameraComponent).isMainCamera) {
        camera = (c as CameraComponent).camera;
        break;
      }
    }

    if (!camera) {
      throw new Error("Trying to render without a camera.");
    }

    BatchRenderer.begin(camera);

    const r: Rect = { x: 0, y: 0, w: 0, h: 0 };
    for (const [e, s, t] of this.world.queryComponents(SpriteComponent, TransformComponent)) {
      r.x = (t as TransformComponent).position.x;
      r.y = (t as TransformComponent).position.y;
      r.w = (t as TransformComponent).scale.x;
      r.h = (t as TransformComponent).scale.y;

      BatchRenderer.drawRect(r, (s as SpriteComponent).color);
    }

    BatchRenderer.end();
  }
}