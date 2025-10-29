import { mat4, Vec2 } from "@gustavo4passos/wgpu-matrix";

export class Camera {
  pos: Vec2;
  dimensions: Vec2;

  constructor(pos: Vec2, dimensions: Vec2) {
    this.pos = pos;
    this.dimensions = dimensions;
  }

  getViewProjectionMatrix(): Float32Array {
    const ortho = mat4.ortho2d(0, this.dimensions.x, this.dimensions.y, 0);
    const view = mat4.translate(mat4.identity(), [-this.pos.x, -this.pos.y, 0]);
    return mat4.mul(ortho, view);
  }
}
