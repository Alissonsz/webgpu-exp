import { Component } from "../ecs/Component.ts";
import { vec2, Vec2 } from "@gustavo4passos/wgpu-matrix";
import { Camera } from "../Camera.ts";
import { Color } from "../BatchRenderer.ts";
import { Rect } from "../Rect";
import { Script } from "./scripts.ts";
import { LDtkData, LevelData } from "../types.ts";
import { Texture } from "../Texture.ts";
import { PhysicsBody } from "../physics/PhysicsBodies.ts";
import { AssetManager } from "../AssetManager.ts";

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
  flipped: boolean;

  constructor(sprite?: string, texCoords?: Vec2, width?: number, height?: number, color?: Color, flipped?: boolean) {
    this.sprite = sprite;
    this.color = color ? color : { r: 1, g: 1, b: 1, a: 1 };
    this.texCoord = texCoords;
    this.width = width;
    this.height = height;
    this.flipped = flipped ? flipped : false;
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

  constructor(frameCount: number, frameDuration: number, baseTexCoord: Vec2, loop: boolean = true) {
    this.frameCount = frameCount;
    this.currentFrame = 0;
    this.baseTexCoord = baseTexCoord;
    this.frameDuration = frameDuration;
    this.elapsedTime = 0;
    this.isPlaying = true;
    this.loop = loop;
  }

  getCurrentFrameTexSrc(spriteComponent: SpriteComponent): Vec2 {
    const srcX = this.baseTexCoord.x + this.currentFrame * spriteComponent.width;
    const srcY = this.baseTexCoord.y;
    return vec2.create(srcX, srcY);
  }
}

export class AnimationStateComponent implements Component {
  stateToAnimationAndSpriteMap: Record<string, { animation: AnimationComponent; sprite: SpriteComponent }>;
  state: string;

  constructor(
    stateToAnimationMap: Record<string, { animation: AnimationComponent; sprite: SpriteComponent }>,
    initialState: string = "",
  ) {
    this.stateToAnimationAndSpriteMap = stateToAnimationMap;
    this.state = initialState;
  }
}

export class LevelComponent implements Component {
  levelPath: string;
  levelData: LevelData;
  tilesetTextures: Record<number, Texture> = {};
  collisionRects: Array<Rect>;

  constructor(levelPath: string) {
    this.levelPath = levelPath;
    this.initialize();
  }

  async initialize() {
    const response = await fetch(this.levelPath);
    if (!response.ok) {
      throw new Error(`Failed to load level data from ${this.levelPath}`);
    }
    const levelData = await response.text();

    const parsedData: LDtkData = JSON.parse(levelData);
    if (parsedData.levels.length === 0) {
      throw new Error("No levels found in the provided data.");
    }
    // Load tilesets
    for (const tileset of parsedData.defs.tilesets) {
      this.tilesetTextures[tileset.uid] = await AssetManager.loadTexture(tileset.identifier, tileset.relPath);

    }

    this.levelData = parsedData.levels[0]; // Load the first level for simplicity

    this.collisionRects = new Array<Rect>;
    for (const layer of this.levelData.layerInstances) {
      if (layer.__type == "Entities" && layer.__identifier == "CollisionLayer") {
        console.log("Encontrei o retinho aqui");
        for (const e of layer.entityInstances) {
          if (e.__identifier == "CollisionGround") {
            this.collisionRects.push(new Rect(e.px[0], e.px[1], e.width, e.height))
          }
        }
      }
    }
  }
}

export class PhysicsBodyComponent {
  physicsBody: PhysicsBody;

  constructor(physicsBody?: PhysicsBody) {
    if (!physicsBody) this.physicsBody = new PhysicsBody();
    else this.physicsBody = physicsBody;
  }
}
