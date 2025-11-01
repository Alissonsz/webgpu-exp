import { vec2 } from "@gustavo4passos/wgpu-matrix";
import { AnimationComponent, SpriteComponent } from "../components";
import { System } from "../ecs";

export class AnimationSystem extends System {
  constructor() {
    super();
  }

  update(deltaTime: number): void {
    for (const [e, a, s] of this.world.queryComponents(AnimationComponent, SpriteComponent)) {
      const animComp = a as AnimationComponent;
      const spriteComp = s as SpriteComponent;

      animComp.elapsedTime += deltaTime;

      if (animComp.elapsedTime >= animComp.frameDuration) {
        animComp.elapsedTime = 0;
        animComp.currentFrame = (animComp.currentFrame + 1) % animComp.frameCount;

        const nextTexCoord = animComp.getCurrentFrameTexSrc(spriteComp);
        spriteComp.texCoord = nextTexCoord;
      }
    }
  }
}
