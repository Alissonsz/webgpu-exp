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

  // ECS Example
  const w = new World();
  const l = w.createEntity("Level", true);
  l.addComponent<LevelComponent>(new LevelComponent("../assets/level.ldtk", device));
  await l.getComponent(LevelComponent).initialize(device);

  w.addSystem(new AnimationSystem());
  w.addSystem(new RenderSystem());
  w.addSystem(new ScriptSystem());
  w.addSystem(new PhysicsSystem());

  const e = w.createEntity("Player", true, vec2.create(90, 10), vec2.create(100, 100));
  await AssetManager.loadTexture("playerRun", "Run.png", device);
  await AssetManager.loadTexture("playerIdle", "Idle.png", device);
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
        new Collider(false, vec2.create(20, 55), vec2.create(45, 45)),
      ),
    ),
  );

  const f = w.createEntity("Floor", true, vec2.create(80, 160), vec2.create(530, 18));
  f.addComponent(new PhysicsBodyComponent(new PhysicsBody(vec2.create(0, 0), vec2.create(0, 0), true)));

  const b1 = w.createEntity("Block", true, vec2.create(330, 20), vec2.create(40, 50));
  b1.addComponent(new SpriteComponent(undefined, undefined, undefined, undefined, { r: 1, g: 0, b: 0, a: 1 }));
  b1.addComponent(new PhysicsBodyComponent(new PhysicsBody()));

  const b2 = w.createEntity("Block2", true, vec2.create(350, -120), vec2.create(20, 20));
  b2.addComponent(new SpriteComponent(undefined, undefined, undefined, undefined, { r: 1, g: 0, b: 0, a: 1 }));
  b2.addComponent(new PhysicsBodyComponent(new PhysicsBody()));

  const b3 = w.createEntity("Block3", true, vec2.create(450, -420), vec2.create(120, 20));
  b3.addComponent(new SpriteComponent(undefined, undefined, undefined, undefined, { r: 1, g: 0, b: 0, a: 1 }));
  b3.addComponent(new PhysicsBodyComponent(new PhysicsBody()));

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

    const t = b1.getComponent(TransformComponent);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
