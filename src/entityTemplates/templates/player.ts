import { vec2 } from "@gustavo4passos/wgpu-matrix";
import { AssetManager } from "../../AssetManager";
import {
  AnimationComponent,
  AnimationStateComponent,
  PhysicsBodyComponent,
  ScriptComponent,
  SpriteComponent,
  TextComponent,
} from "../../components";
import { PlayerController } from "../../components/scripts";
import { Collider, PhysicsBody } from "../../physics/PhysicsBodies";
import { BaseEntityOptions, EntityCreator } from "../types";

const COLLIDER_OFFSET_PERCENTAGE = vec2.create(0.2, 0.55);
const COLLIDER_PERCENTAGE = 0.45;

export const createPlayer: EntityCreator<BaseEntityOptions> = async ({ w, position, size }) => {
  const e = w.createEntity("Player", true, position, size);

  await AssetManager.loadTexture("playerRun", "Run.png");
  await AssetManager.loadTexture("playerIdle", "Idle.png");
  await AssetManager.loadTexture("playerJump", "Jump.png");

  e.addComponent(new SpriteComponent("playerRun", vec2.create(0, 0), 512, 512));
  e.addComponent(new ScriptComponent(new PlayerController(w, e)));
  e.addComponent(
    new AnimationStateComponent(
      {
        run: {
          animation: new AnimationComponent(4, 0.1, vec2.create(0, 0)),
          sprite: new SpriteComponent("playerRun", vec2.create(0, 0), 512, 512),
        },
        idle: {
          animation: new AnimationComponent(2, 0.2, vec2.create(0, 0)),
          sprite: new SpriteComponent("playerIdle", vec2.create(0, 0), 512, 512),
        },
        jump: {
          animation: new AnimationComponent(11, 0.1, vec2.create(0, 0), false),
          sprite: new SpriteComponent("playerJump", vec2.create(0, 0), 512, 512),
        },
      },
      "idle",
    ),
  );
  e.addComponent(
    new PhysicsBodyComponent(
      new PhysicsBody({
        collider: new Collider({
          size: vec2.create(Math.floor(size.x * COLLIDER_PERCENTAGE), Math.floor(size.y * COLLIDER_PERCENTAGE)),
          offset: vec2.create(
            Math.floor(size.x * COLLIDER_OFFSET_PERCENTAGE.x),
            Math.floor(size.y * COLLIDER_OFFSET_PERCENTAGE.y),
          ),
        }),
      }),
    ),
  );
  e.addComponent(new TextComponent("Hello World", vec2.create(10, 50), 48, "#000000"));

  return e;
};
