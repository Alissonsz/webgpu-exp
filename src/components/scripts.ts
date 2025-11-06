import { CameraComponent, PhysicsBodyComponent, TransformComponent, SpriteComponent, AnimationStateComponent } from ".";
import { Entity, World } from "../ecs/World";
import { GameEvent } from "../EventQueue";
import { InputState, Keys } from "../InputState";
import { PhysicsSystem } from "../systems/physics";

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

    const physicsSystem = this.world.getSystem(PhysicsSystem);
    this.onGround = physicsSystem.isOnGround(this.entity);

    const JUMP_VELOCITY = 200;
    const AIR_VELOCITY_REDUCTION = 50;
    if (tc.position.y > 300) {
      tc.position.y = -100;
      pb.physicsBody.velocity.y = 0;
    }
    if (InputState.isKeyPressed(Keys.ArrowRight)) {
      this.walkingDirection = WalkingDirection.RIGHT;
      pb.physicsBody.velocity.x = JUMP_VELOCITY;
      if (!this.onGround) pb.physicsBody.velocity.x -= AIR_VELOCITY_REDUCTION;
    }
    else if (InputState.isKeyPressed(Keys.ArrowLeft)) {
      this.walkingDirection = WalkingDirection.LEFT;
      pb.physicsBody.velocity.x = -JUMP_VELOCITY;
      if (!this.onGround) pb.physicsBody.velocity.x += AIR_VELOCITY_REDUCTION;
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

    const playerTransform = player?.getComponent(TransformComponent);
    const playerPos = playerTransform.position;
    const playerScale = playerTransform.scale;
    const cameraComp = this.entity.getComponent(CameraComponent);
    if (!playerPos || !cameraComp) return;

    const cameraPos = cameraComp.camera.pos;
    const destinationPosX = playerPos.x - (cameraComp.camera.dimensions.x - playerScale.x) * 0.5;    
    const destinationPosY = playerPos.y - (cameraComp.camera.dimensions.y - playerScale.y) * 0.5;    

    cameraComp.camera.pos.x = cameraPos.x + (destinationPosX - cameraPos.x) * 0.2;
    cameraComp.camera.pos.y = cameraPos.y + (destinationPosY - cameraPos.y) * 0.2;
  }
}
