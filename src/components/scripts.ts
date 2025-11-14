import { CameraComponent, PhysicsBodyComponent, TransformComponent, SpriteComponent, AnimationStateComponent, ParticleEmmiterComponent } from ".";
import { Entity, World } from "../ecs/World";
import { GameEvent } from "../EventQueue";
import { InputState, Keys } from "../InputState";
import { PhysicsSystem } from "../systems/physics";
import { AudioSystem } from "../systems/audio";
import { Vec2, vec2 } from "@gustavo4passos/wgpu-matrix";

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
  JUMPING,
}

export class PlayerController extends Script {
  walkingDirection = WalkingDirection.RIGHT;
  currentState = State.IDLE;
  onGround = false;
  lastRunningFrame = -1;

  onCreate(): void {
    console.log("PlayerController created for entity:", this.entity);
  }

  handleSounds() {
    const audioSystem   = this.world.getSystem(AudioSystem);
    const asc = this.entity.getComponent(AnimationStateComponent);

    // Just landed
    if (this.currentState == State.JUMPING && this.onGround) {
      audioSystem.playSFX("landing");
    }

    const currentAnimation = asc.stateToAnimationAndSpriteMap[asc.state].animation;
    if (this.currentState != State.RUNNING) this.lastRunningFrame = -1;
    else {
      if (this.lastRunningFrame != currentAnimation.currentFrame) {
        this.lastRunningFrame = currentAnimation.currentFrame;
        if (currentAnimation.currentFrame == 7) {
          audioSystem.playSFX("step_r");
        }
        if (currentAnimation.currentFrame == 3) {
          audioSystem.playSFX("step_l");
        }
      }
    }

    if (InputState.isKeyPressed(Keys.Space)) {
      if (this.onGround) {
        audioSystem.playSFX("jump");
      }
    }
  }

  onUpdate(deltaTime: number): void {
    const tc  = this.entity.getComponent(TransformComponent);
    const pb  = this.entity.getComponent(PhysicsBodyComponent);
    const sc  = this.entity.getComponent(SpriteComponent);
    const asc = this.entity.getComponent(AnimationStateComponent);

    const physicsSystem = this.world.getSystem(PhysicsSystem);
    this.onGround = physicsSystem.isOnGround(this.entity);

    this.handleSounds();

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
      else this.currentState = State.RUNNING;
    } else if (InputState.isKeyPressed(Keys.ArrowLeft)) {
      this.walkingDirection = WalkingDirection.LEFT;
      pb.physicsBody.velocity.x = -JUMP_VELOCITY;
      if (!this.onGround) pb.physicsBody.velocity.x += AIR_VELOCITY_REDUCTION;
      else this.currentState = State.RUNNING;
    } else {
      pb.physicsBody.velocity.x = 0;
      this.currentState = State.IDLE;
    }

    if (InputState.isKeyPressed(Keys.Space)) {
      if (this.onGround) {
        pb.physicsBody.velocity.y = -340;
      }
    }

    if (!this.onGround) {
      this.currentState = State.JUMPING;
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
      case State.JUMPING:
        if (asc.state !== "jump") {
          asc.stateToAnimationAndSpriteMap["jump"].animation.isPlaying = true;
          asc.stateToAnimationAndSpriteMap["jump"].animation.currentFrame = 0;
        }
        asc.state = "jump";
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

export class WalkingDustController extends Script {
  initialVelocity: Vec2;
  velocityVariation: Vec2;
  offset: Vec2;

  constructor(world: World, e: Entity) {
    super(world, e);

    this.initialVelocity = vec2.create(-10, -5);
    this.velocityVariation = vec2.create(5, 2);
    this.offset = vec2.create(2, 2);
  }

  onUpdate(deltaTime: number): void {
    const player = this.world.getEntityByTag("Player");
    if (!player) return;

    const playerTc = player.getComponent(TransformComponent);
    const playerPb = player.getComponent(PhysicsBodyComponent);
    const dustTc = this.entity.getComponent(TransformComponent);
    const ec = this.entity.getComponent(ParticleEmmiterComponent);
    const physicsSystem = this.world.getSystem(PhysicsSystem);

    dustTc.position.x = playerTc.position.x + playerPb.physicsBody.collider.offset.x + playerPb.physicsBody.collider.size.x / 2;
    dustTc.position.y = playerTc.position.y + playerPb.physicsBody.collider.offset.y;
    dustTc.position.y += playerPb.physicsBody.collider.size.y - this.offset.y;

    const playerVelocity = playerPb.physicsBody.velocity.x;
    const playerOnGround = physicsSystem.isOnGround(player);
    if (playerVelocity != 0 && playerOnGround) {
      ec.active = true;

      // Moving to the right
      if (playerVelocity > 0) {
        ec.particleParamters.initialVelocity.x = this.initialVelocity.x;
      } 
      // Moving to the left
      else {
        ec.particleParamters.initialVelocity.x = -this.initialVelocity.x;
      }
    } else ec.active = false;
  }
}
