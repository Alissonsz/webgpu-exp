import { Component } from "../ecs/Component.ts";
import { vec2, Vec2 } from "@gustavo4passos/wgpu-matrix";
import { Camera } from "../Camera.ts";
import { Color } from "../BatchRenderer.ts";
import { Script } from "./scripts.ts";
import { LDtkData, LevelData } from "../types.ts";
import { Texture } from "../Texture.ts";
import { PhysicsBody } from "../physics/PhysicsBodies.ts";

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
  texCoord: Vec2;
  width: number;
  height: number;
  color: Color;

  constructor(sprite?: string, texCoords?: Vec2, width?: number, height?: number, color?: Color) {
    this.sprite = sprite;
    this.color = color;
    this.texCoord = texCoords;
    this.width = width;
    this.height = height;
  }
}

export class ScriptComponent implements Component {
  script: Script;

  constructor(script: Script) {
    this.script = script;
  }
}

export class AnimationComponent implements Component {
  frameCount: number;
  currentFrame: number;
  frameDuration: number;
  baseTexCoord: Vec2;
  elapsedTime: number;
  isPlaying: boolean;
  loop: boolean = true;

  constructor(frameCount: number, frameDuration: number, baseTexCoord: Vec2) {
    this.frameCount = frameCount;
    this.currentFrame = 0;
    this.baseTexCoord = baseTexCoord;
    this.frameDuration = frameDuration;
    this.elapsedTime = 0;
    this.isPlaying = true;
  }

  getCurrentFrameTexSrc(spriteComponent: SpriteComponent): Vec2 {
    const srcX = this.baseTexCoord.x + this.currentFrame * spriteComponent.width;
    const srcY = this.baseTexCoord.y;
    return vec2.create(srcX, srcY);
  }
}

export class LevelComponent implements Component {
  levelPath: string;
  levelData: LevelData;
  textures: Record<string, Texture> = {};

  constructor(levelPath: string, device: GPUDevice) {
    this.levelPath = levelPath;
    this.initialize(device);
  }

  async initialize(device: GPUDevice) {
    const response = await fetch(this.levelPath);
    if (!response.ok) {
      throw new Error(`Failed to load level data from ${this.levelPath}`);
    }
    const levelData = await response.text();

    const parsedData: LDtkData = JSON.parse(levelData);
    if (parsedData.levels.length === 0) {
      throw new Error("No levels found in the provided data.");
    }
    this.levelData = parsedData.levels[0]; // Load the first level for simplicity
    // load textures for each tileset used in the level
    const tilesetPromises = this.levelData.layerInstances
      .map((layer) => layer.__tilesetRelPath)
      .filter((path, index, self) => path && self.indexOf(path) === index) // unique paths
      .map(async (path) => {
        if (!path) return;

        const response = await fetch(`assets/${path}`);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        const texture = new Texture(device);
        texture.initFromBitmap(imageBitmap);

        return { path, texture };
      });

    const tilesetResults = await Promise.all(tilesetPromises);
    tilesetResults.forEach((result) => {
      if (result) {
        this.textures[result.path] = result.texture;
      }
    });
  }
}

export class PhysicsBodyComponent {
  physicsBody: PhysicsBody;

  constructor(physicsBody?: PhysicsBody) {
    if (!physicsBody) this.physicsBody = new PhysicsBody();
    else this.physicsBody=  physicsBody;
  }
}
