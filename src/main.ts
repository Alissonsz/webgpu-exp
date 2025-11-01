import { initializeWebgpu } from "./renderer";
import { vec2 } from "@gustavo4passos/wgpu-matrix";
import { InputState } from "./InputState";
import { World } from "./ecs";
import { SpriteComponent, CameraComponent, ScriptComponent, LevelComponent, AnimationComponent } from "./components";
import { Camera } from "./Camera.ts";
import { RenderSystem } from "./systems/render.ts";
import { BatchRenderer } from "./BatchRenderer.ts";
import { ScriptSystem } from "./systems/script.ts";
import { CameraController, PlayerController } from "./components/scripts.ts";
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

  const renderSystem = new RenderSystem();
  w.addSystem(new AnimationSystem());
  w.addSystem(renderSystem);
  w.addSystem(new ScriptSystem());

  const e = w.createEntity("Player", true, vec2.create(90, 10), vec2.create(128, 128));
  await AssetManager.loadTexture("playerRun", "Run.png", device);
  e.addComponent<SpriteComponent>(new SpriteComponent("playerRun", vec2.create(0, 0), 128, 128));
  e.addComponent<ScriptComponent>(new ScriptComponent(new PlayerController(w, e)));
  e.addComponent<AnimationComponent>(new AnimationComponent(8, 100, vec2.create(0, 0)));

  const c = w.createEntity("Camera", true, vec2.create(0, 0), vec2.create(0, 0));
  c.addComponent(
    new CameraComponent(new Camera(vec2.create(100, -50), vec2.create(orthoWidth * 2, orthoHeight * 2)), true),
  );
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

    w.update(deltaTime);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
