import { vec2 } from "@gustavo4passos/wgpu-matrix";
import { AnimationComponent, AnimationStateComponent, SpriteComponent } from "../components";
import { System } from "../ecs";

export class AnimationSystem extends System {
  constructor() {
    super();
  }

  update(deltaTime: number): void {
    for (const [e, a, s] of this.world.queryComponents(AnimationStateComponent, SpriteComponent)) {
      const animComp = a as AnimationStateComponent;
      const spriteComp = s as SpriteComponent;

      const currentAnimation = animComp.stateToAnimationAndSpriteMap[animComp.state];
      currentAnimation.animation.elapsedTime += deltaTime;

      if (currentAnimation.animation.elapsedTime >= currentAnimation.animation.frameDuration) {
        currentAnimation.animation.elapsedTime =
          currentAnimation.animation.elapsedTime % currentAnimation.animation.frameDuration;

        currentAnimation.animation.currentFrame =
          (currentAnimation.animation.currentFrame + 1) % currentAnimation.animation.frameCount;

        const nextTexCoord = currentAnimation.animation.getCurrentFrameTexSrc(currentAnimation.sprite);
        spriteComp.texCoord = nextTexCoord;
        spriteComp.sprite = animComp.stateToAnimationAndSpriteMap[animComp.state].sprite.sprite;
      }
    }
  }
}
