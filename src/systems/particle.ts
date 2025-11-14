import { vec2, vec4 } from "@gustavo4passos/wgpu-matrix";
import { ParticleEmmiterComponent, TransformComponent } from "../components/index.ts";
import { System } from "../ecs/System.ts";
import { Entity } from "../ecs/World.ts";
import { Particle } from "../Particles.ts";

export class ParticleSystem extends System {
  constructor() {
    super();
  }

  update(deltaTime: number) {
    type ParticleSystemGroup = [Entity, TransformComponent, ParticleEmmiterComponent][];
    const componentGroup = this.world.getComponentGroups(TransformComponent, ParticleEmmiterComponent) as ParticleSystemGroup;

    componentGroup.forEach(([e, tc, pc]) => {
      this.updateParticleComponent(pc, tc, deltaTime);
    })
  }

  updateParticleComponent(pc: ParticleEmmiterComponent, tc: TransformComponent, deltaTime: number) {
    if (pc.active) {
      while (pc.internalTime >= pc.particleParamters.emissionTime) {
        this.emitParticle(pc, tc);
        pc.internalTime -= pc.particleParamters.emissionTime;
      }
      pc.internalTime += deltaTime;
    }

    let currentVel = vec2.create(0, 0);
    for (const particle of pc.particles) {
      if (!particle.active) continue;
      if (particle.lifeRemaining <= 0) {
        particle.active = false;
        continue;
      }


      const life = 1 - (particle.lifeRemaining / pc.particleParamters.lifetime);
      vec4.lerp(pc.particleParamters.initialColor, pc.particleParamters.finalColor, life, particle.color);
      vec4.lerp(pc.particleParamters.initialSize, pc.particleParamters.finalSize, life, particle.size);
      vec2.mulScalar(particle.velocity, deltaTime, currentVel);
      vec2.add(particle.position, currentVel, particle.position);

      particle.lifeRemaining -= deltaTime;
    }
  }

  emitParticle(pc: ParticleEmmiterComponent, tc: TransformComponent) {
    let particle = pc.particles[pc.nextActiveParticle];
    const parameters = pc.particleParamters;
    particle.active = true;
    particle.lifeRemaining = parameters.lifetime;

    particle.position.x = tc.position.x;
    particle.position.y = tc.position.y;

    particle.size.x = parameters.initialSize.x;
    particle.size.y = parameters.initialSize.y;

    vec2.set(parameters.initialVelocity.x + ((Math.random() - 0.5) * parameters.velocityVariation.x), 
             parameters.initialVelocity.y + ((Math.random() - 0.5) * parameters.velocityVariation.y),
             particle.velocity);

    pc.nextActiveParticle = (pc.nextActiveParticle - 1) % ParticleEmmiterComponent.MAX_PARTICLES;
    if (pc.nextActiveParticle < 0) pc.nextActiveParticle = ParticleEmmiterComponent.MAX_PARTICLES - 1;
  }
}
