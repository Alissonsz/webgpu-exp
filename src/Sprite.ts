import { vec2, Vec2 } from "@gustavo4passos/wgpu-matrix";
import { Rect } from "./Rect";

export class SpriteSheet {
  texture: string;
  nColumns: number;
  spriteSize: Vec2;

  constructor(texture: string, spriteSize: Vec2, nColumns: number) {
    this.texture = texture;
    this.nColumns = nColumns;
    this.spriteSize = spriteSize;
  }

  getSpriteRect(spriteNumber: number): Rect {
    return new Rect(
      ((spriteNumber % this.nColumns) * this.spriteSize.x),
      (Math.floor(spriteNumber / this.nColumns)) * this.spriteSize.y,
      this.spriteSize.x,
      this.spriteSize.y
    );
  }
}

export class Sprite {
  spriteSheet: SpriteSheet;
  spriteNumber: number;
  rect: Rect;

  constructor(spriteSheet: SpriteSheet, spriteNumber: number) {
    this.spriteSheet = spriteSheet;
    this.spriteNumber = spriteNumber;
    this.rect = spriteSheet.getSpriteRect(spriteNumber);
  }
}
