import { Vec2, vec2 } from "@gustavo4passos/wgpu-matrix";
import { AssetManager } from "../../AssetManager";
import {
  AnimationComponent,
  AnimationStateComponent,
  PhysicsBodyComponent,
  RopeComponent,
  ScriptComponent,
  SpriteComponent,
  TextComponent,
} from "../../components";
import { Collider, PhysicsBody } from "../../physics/PhysicsBodies";
import { BaseEntityOptions, EntityCreator } from "../types";
import { BulletController } from "../../components/scripts";

import { AudioSystem } from "../../systems/audio";

const COLLIDER_OFFSET_PERCENTAGE = vec2.create(0.2, 0.55);
const COLLIDER_PERCENTAGE = 0.45;

export const createBullet: EntityCreator<
  BaseEntityOptions & {
    velocity?: Vec2;
    acceleration?: Vec2;
  }
> = async ({ w, position, size, velocity = vec2.create(0, 0), acceleration = vec2.create(0, 0) }) => {
  const e = w.createEntity("Bullet", true, position, size);

  e.addComponent(new SpriteComponent("Tilemap_packed", vec2.create(18 * 8, 0), 18, 18));
  e.addComponent(new ScriptComponent(new BulletController({ world: w, entity: e })));
  e.addComponent(
    new PhysicsBodyComponent(
      new PhysicsBody({
        acceleration,
        velocity,
        useGravity: false,
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

  const audioSystem = w.getSystem(AudioSystem);
  audioSystem.playSFX("bullet");

  return e;
};

export const createParable: EntityCreator<
  BaseEntityOptions & {
    velocity?: Vec2;
    acceleration?: Vec2;
  }
> = async ({ w, position, size, velocity = vec2.create(0, 0), acceleration = vec2.create(0, 0) }) => {
  const e = w.createEntity("Parable", true, position, size);

  e.addComponent(new SpriteComponent("Tilemap_packed", vec2.create(18 * 8, 0), 18, 18));
  e.addComponent(
    new ScriptComponent(new BulletController({ world: w, entity: e, withTrace: true, autoDestroy: false })),
  );
  const rc = new RopeComponent();
  rc.points.push({
    position: vec2.create(position.x, position.y),
    pinned: true,
    pastPosition: vec2.create(position.x, position.y),
  });
  e.addComponent(rc);
  e.addComponent(
    new PhysicsBodyComponent(
      new PhysicsBody({
        acceleration,
        velocity,
        useGravity: true,
        collider: new Collider({
          isTrigger: true,
          size: vec2.create(Math.floor(size.x * COLLIDER_PERCENTAGE), Math.floor(size.y * COLLIDER_PERCENTAGE)),
          offset: vec2.create(
            Math.floor(size.x * COLLIDER_OFFSET_PERCENTAGE.x),
            Math.floor(size.y * COLLIDER_OFFSET_PERCENTAGE.y),
          ),
          ignoredTags: ["Player"],
        }),
      }),
    ),
  );

  const audioSystem = w.getSystem(AudioSystem);
  audioSystem.playSFX("bullet");

  return e;
};
