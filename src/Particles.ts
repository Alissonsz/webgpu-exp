import { Vec2, Vec4 } from "@gustavo4passos/wgpu-matrix";

export type Particle = {
  active: boolean;
  position: Vec2;
  velocity: Vec2;
  color: Vec4;
  size: Vec2;
  lifeRemaining: number;
}

export type ParticleParameters = {
  initialVelocity: Vec2,
  velocityVariation: Vec2,
  lifetime: number,
  initialColor: Vec4;
  finalColor: Vec4;
  initialSize: Vec2;
  finalSize: Vec2;
  emissionTime: number;
};
