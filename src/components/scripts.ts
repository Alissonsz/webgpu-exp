import { CameraComponent, PhysicsBodyComponent, TransformComponent, SpriteComponent, AnimationStateComponent } from ".";
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

enum WalkingDirection {
  LEFT,
  RIGHT,
}

enum State {
  IDLE,
  RUNNING,
}

export class PlayerController extends Script {
  walkingDirection = WalkingDirection.RIGHT;
  currentState = State.IDLE;
  onGround = false;

  onCreate(): void {
    console.log("PlayerController created for entity:", this.entity);
  }

  onUpdate(deltaTime: number): void {
    const tc = this.entity.getComponent(TransformComponent);
    const pb = this.entity.getComponent(PhysicsBodyComponent);
    const sc = this.entity.getComponent(SpriteComponent);
    const asc = this.entity.getComponent(AnimationStateComponent);

    this.onGround = this.world.physicsSystem.isOnGround(this.entity);

    if (tc.position.y > 300) {
      tc.position.y = -100;
      pb.physicsBody.velocity.y = 0;
    }
    if (InputState.isKeyPressed(Keys.ArrowRight)) {
      this.walkingDirection = WalkingDirection.RIGHT;
      pb.physicsBody.velocity.x = 200.0;
      this.currentState = State.RUNNING;
    } else if (InputState.isKeyPressed(Keys.ArrowLeft)) {
      this.walkingDirection = WalkingDirection.LEFT;
      pb.physicsBody.velocity.x = -200.0;
      this.currentState = State.RUNNING;
    } else {
      pb.physicsBody.velocity.x = 0;
      this.currentState = State.IDLE;
    }

    if (InputState.isKeyPressed(Keys.Space)) {
      if (this.onGround) pb.physicsBody.velocity.y = -340;
    } 

    if (this.walkingDirection == WalkingDirection.LEFT) {
      sc.flipped = true;
    } else sc.flipped = false;

    switch (this.currentState) {
      case State.IDLE:
        asc.state = "idle";
        break;
      case State.RUNNING:
        asc.state = "run";
        break;
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
