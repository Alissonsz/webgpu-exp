import { Component } from "./Component.ts";
import { vec2, Vec2 } from "@gustavo4passos/wgpu-matrix";
import { Camera } from "../Camera.ts";
import { Color } from "../BatchRenderer.ts"

export class TagComponent implements Component {
  tag: string;

  constructor(tag: string = "Unnamed Entity") {
    this.tag = tag;
  }
}

export class TransformComponent implements Component {
  position: Vec2;
  scale: Vec2;

  constructor(position?: Vec2, scale?: Vec2) {
    if (!position) position = vec2.create(0, 0);
    if (!scale) scale = vec2.create(200, 200);
    this.position = position;
    this.scale = scale;
  }
}

export class ActivationStatusComponent implements Component {
  isActive: boolean;

  constructor(activationStatus?: boolean) {
    this.isActive = activationStatus;
  }
}

export class CameraComponent implements Component {
  camera: Camera;
  isMainCamera: boolean;
  constructor(camera: Camera, isMainCamera: boolean) {
    this.camera = camera;
    this.isMainCamera = isMainCamera;
  }
}

export class SpriteComponent implements Component {
  sprite: string;
  color: Color;

  constructor(color: Color) {
    this.color = color;
  }
}