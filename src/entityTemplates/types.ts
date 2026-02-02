import { Vec2 } from "@gustavo4passos/wgpu-matrix";
import { World } from "../ecs";
import { Entity } from "../ecs/Entity";

export type BaseEntityOptions = {
  w: World;
  position: Vec2;
  size: Vec2;
};

export type EntityCreator<T extends BaseEntityOptions = BaseEntityOptions> = (
  options: T,
) => Promise<Entity>;
