import { System, World } from "../ecs";
import { BatchRenderer } from "../BatchRenderer.ts";
import { CameraComponent, LevelComponent, SpriteComponent, TransformComponent } from "../components/index.ts";
import { Rect } from "../Rect.ts";
import { Camera } from "../Camera.ts";
import { Level } from "../Level.ts";
import { LevelData } from "../types.ts";

export class RenderSystem extends System {
  constructor(level: Level) {
    super();
  }

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

    const src = new Rect(0, 0, 0, 0);
    const dst = new Rect(0, 0, 0, 0);

    const level = this.world.getComponentManager().getComponentsOfType(LevelComponent).values().next()
      .value as LevelComponent;

    if (level) {
      const texture = Object.values(level.textures)[0];

      level.levelData.layerInstances[0].gridTiles.forEach((tile) => {
        const tilePos = { x: tile.px[0], y: tile.px[1] };
        const tilesetUV = { x: tile.src[0], y: tile.src[1] };

        dst.x = tilePos.x;
        dst.y = tilePos.y;
        dst.w = 16;
        dst.h = 16;

        src.x = tilesetUV.x;
        src.y = tilesetUV.y;
        src.w = 16;
        src.h = 16;

        BatchRenderer.drawSprite(texture, src, dst);
      });
    } else {
      console.warn("No LevelComponent found in the world.");
    }

    const r: Rect = { x: 0, y: 0, w: 0, h: 0 };
    const components = this.world.queryComponents(SpriteComponent, TransformComponent);

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
