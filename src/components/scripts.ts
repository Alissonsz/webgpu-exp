import { CameraComponent, PhysicsBodyComponent, TransformComponent } from ".";
import { Entity, World } from "../ecs/World";
import { GameEvent } from "../EventQueue";
import { InputState, Keys } from "../InputState";

export abstract class Script {
  world: World;
  entity: Entity;
  abstract onUpdate(deltaTime: number): void;

  onCreate(): void {
    // Default implementation does nothing
  }

  onEvent(event: GameEvent): void {
    // Default implementation does nothing
  }

  constructor(world: World, entity: Entity) {
    this.entity = entity;
    this.world = world;
  }
}

export class PlayerController extends Script {
  onCreate(): void {
    console.log("PlayerController created for entity:", this.entity);
  }

  onUpdate(deltaTime: number): void {
    const pos = this.entity.getComponent(TransformComponent);
    const pb  = this.entity.getComponent(PhysicsBodyComponent);

    if (InputState.isKeyPressed(Keys.ArrowRight)) {
      pb.physicsBody.velocity.x = 200.0;
    }
    else if (InputState.isKeyPressed(Keys.ArrowLeft)) {
      pb.physicsBody.velocity.x = -200.0;
    } else {
      pb.physicsBody.velocity.x = 0;
    }

    if (InputState.isKeyPressed(Keys.Space)) {
      if (pb.physicsBody.velocity.y >= 0) pb.physicsBody.velocity.y = -300;
    } 
  }
}

export class CameraController extends Script {
  onUpdate(deltaTime: number): void {
    const player = this.world.getEntityByTag("Player");
    if (!player) return;

    const playerPos = player?.getComponent(TransformComponent)?.position;
    const cameraComp = this.entity.getComponent(CameraComponent);
    if (!playerPos || !cameraComp) return;

    const cameraPos = cameraComp.camera.pos;

    cameraComp.camera.pos.x = cameraPos.x + (playerPos.x - 200 - cameraPos.x) * 0.2;
    cameraComp.camera.pos.y = cameraPos.y + (playerPos.y - 100 - cameraPos.y) * 0.2;
  }
}
