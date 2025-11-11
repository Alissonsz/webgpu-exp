import { initializeWebgpu } from "./renderer";
import { vec2 } from "@gustavo4passos/wgpu-matrix";
import { InputState } from "./InputState";
import { World } from "./ecs";
import {
  SpriteComponent,
  CameraComponent,
  ScriptComponent,
  LevelComponent,
  PhysicsBodyComponent,
  TransformComponent,
  AnimationComponent,
  AnimationStateComponent,
} from "./components";
import { Camera } from "./Camera.ts";
import { RenderSystem } from "./systems/render.ts";
import { ScriptSystem } from "./systems/script.ts";
import { PhysicsSystem } from "./systems/physics.ts";
import { BatchRenderer } from "./BatchRenderer.ts";
import { CameraController, PlayerController } from "./components/scripts";
import { Collider, PhysicsBody } from "./physics/PhysicsBodies";
import { AssetManager } from "./AssetManager.ts";
import { AnimationSystem } from "./systems/animation.ts";

window.addEventListener("load", async () => {
  console.log("Window loaded");

  const canvas = document.getElementById("webgpu-canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found.");
    return;
  }

  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  // Use orthographic projection for 2D tile rendering
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const orthoHeight = 256;
  const orthoWidth = orthoHeight * aspectRatio;

  const { device, context } = await initializeWebgpu(canvas);

  InputState.initialize();

  BatchRenderer.init(device, context);
  AssetManager.init(device);

  // ECS Example
  const w = new World();
  const l = w.createEntity("Level", true);
  l.addComponent<LevelComponent>(new LevelComponent("../assets/level-collision.ldtk"));
  await l.getComponent(LevelComponent).initialize();

  w.addSystem(new AnimationSystem());
  w.addSystem(new RenderSystem());
  w.addSystem(new ScriptSystem());
  w.addSystem(new PhysicsSystem());

  const playerColliderOffsetPercentage = vec2.create(0.2, 0.55);
  const playerColliderPercentage = 0.45;
  const playerSize = vec2.create(100, 100);
  const e = w.createEntity("Player", true, vec2.create(90, 10), playerSize);
  await AssetManager.loadTexture("playerRun", "Run.png");
  await AssetManager.loadTexture("playerIdle", "Idle.png");
  await AssetManager.loadTexture("playerJump", "Jump.png");
  e.addComponent<SpriteComponent>(new SpriteComponent("playerRun", vec2.create(0, 0), 128, 128));
  e.addComponent<ScriptComponent>(new ScriptComponent(new PlayerController(w, e)));
  e.addComponent<AnimationStateComponent>(
    new AnimationStateComponent(
      {
        run: {
          animation: new AnimationComponent(8, 0.1, vec2.create(0, 0)),
          sprite: new SpriteComponent("playerRun", vec2.create(0, 0), 128, 128),
        },
        idle: {
          animation: new AnimationComponent(8, 0.1, vec2.create(0, 0)),
          sprite: new SpriteComponent("playerIdle", vec2.create(0, 0), 128, 128),
        },
        jump: {
          animation: new AnimationComponent(8, 0.1, vec2.create(0, 0), false),
          sprite: new SpriteComponent("playerJump", vec2.create(0, 0), 128, 128),
        },
      },
      "idle",
    ),
  );
  e.addComponent<AnimationComponent>(new AnimationComponent(8, 0.1, vec2.create(0, 0)));
  e.addComponent<PhysicsBodyComponent>(
    new PhysicsBodyComponent(
      new PhysicsBody(
        vec2.create(0, 0),
        vec2.create(0, 0),
        false,
        new Collider(false, 
          vec2.create(Math.floor(playerSize.x * playerColliderOffsetPercentage.x), Math.floor(playerSize.y * playerColliderOffsetPercentage.y)), 
          vec2.create(Math.floor(playerSize.x * playerColliderPercentage), Math.floor(playerSize.y * playerColliderPercentage))), 
      ),
    ),
  );

  const c = w.createEntity("Camera", true, vec2.create(0, 0), vec2.create(0, 0));
  c.addComponent(new CameraComponent(new Camera(vec2.create(10, -50), vec2.create(orthoWidth, orthoHeight)), true));
  c.addComponent<ScriptComponent>(new ScriptComponent(new CameraController(w, c)));

  let lastRender = performance.now();

  function gameLoop() {
    const now = performance.now();
    const deltaTime = now - lastRender;
    lastRender = now;

    const commandEncoder = device.createCommandEncoder();

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          loadOp: "clear",
          storeOp: "store",
          view: context.getCurrentTexture().createView(),
        },
      ],
    });

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    w.update(deltaTime / 1000);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
