import { System, World } from "../ecs";
import { BatchRenderer } from "../BatchRenderer.ts";
import {
  CameraComponent,
  LevelComponent,
  PhysicsBodyComponent,
  SpriteComponent,
  TransformComponent,
} from "../components/index.ts";
import { Rect } from "../Rect.ts";
import { Camera } from "../Camera.ts";
import { LevelData } from "../types.ts";
import { AssetManager } from "../AssetManager.ts";
import { PhysicsBody } from "../physics/PhysicsBodies.ts";

export class RenderSystem extends System {
  constructor() {
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
      for (const layer of level.levelData.layerInstances) {
        // Render tile layer
        const layerType = layer.__type;

        if (layerType == "Tiles" || layerType == "IntGrid") {
          const gridTiles = layerType == "Tiles" ? layer.gridTiles : layer.autoLayerTiles;
          gridTiles.forEach((tile) => {
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
    
            BatchRenderer.drawSprite(level.tilesetTextures[layer.__tilesetDefUid], src, dst);
          });
        }
        else if (layer.__type == "IntGrid") {

        }
      }
    } else {
      console.warn("No LevelComponent found in the world.");
    }

    const r: Rect = new Rect(0, 0, 0, 0);

    for (const [_, s, t] of this.world.queryComponents(SpriteComponent, TransformComponent)) {
      const spriteComp = s as SpriteComponent;
      r.x = (t as TransformComponent).position.x;
      r.y = (t as TransformComponent).position.y;
      r.w = (t as TransformComponent).scale.x;
      r.h = (t as TransformComponent).scale.y;

      if (spriteComp.sprite != undefined) {
        const src = new Rect(spriteComp.texCoord.x, spriteComp.texCoord.y, spriteComp.width, spriteComp.height);
        BatchRenderer.drawSprite(
          AssetManager.getTexture(spriteComp.sprite),
          src,
          r,
          spriteComp.color,
          spriteComp.flipped,
        );
      } else BatchRenderer.drawRect(r, spriteComp.color);
    }

    // Drawing collision rects
    const drawCollisionRects = false;
    if (drawCollisionRects) {
      let collisionRect = new Rect(0, 0, 0, 0);
      for (const [_, t, p] of this.world.queryComponents(TransformComponent, PhysicsBodyComponent)) {
        const pbc = p as PhysicsBodyComponent;
        const tc = t as TransformComponent;

        collisionRect.x = tc.position.x + pbc.physicsBody.collider.offset.x;
        collisionRect.y = tc.position.y + pbc.physicsBody.collider.offset.y;
        collisionRect.w = pbc.physicsBody.collider.size.x;
        collisionRect.h = pbc.physicsBody.collider.size.y;

        BatchRenderer.drawRect(collisionRect, { r: 1, g: 0, b: 0, a: 0.3 });
      }
    }
    BatchRenderer.end();
  }
}
