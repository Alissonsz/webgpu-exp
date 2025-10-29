import { initializeWebgpu } from "./renderer";
import { mat4, vec2 } from "@gustavo4passos/wgpu-matrix";
import { Level } from "./Level";
import { InputState } from "./InputState";
import { World } from "./ecs";
import {
  TagComponent,
  ActivationStatusComponent,
  SpriteComponent,
  CameraComponent,
  ScriptComponent,
  LevelComponent,
} from "./components";
import { Camera } from "./Camera.ts";
import { RenderSystem } from "./systems/render.ts";
import { BatchRenderer } from "./BatchRenderer.ts";
import { ScriptSystem } from "./systems/script.ts";
import { CameraController, PlayerController } from "./components/scripts.ts";

window.addEventListener("load", async () => {
  console.log("Window loaded");

  const canvas = document.getElementById("webgpu-canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found.");
    return;
  }

  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  const view = mat4.lookAt(
    [0, 0, 40], // eye
    [0, 0, 0], // center
    [0, 1, 0], // up
  );

  // Use orthographic projection for 2D tile rendering
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const orthoHeight = 256; // Match your level height
  const orthoWidth = orthoHeight * aspectRatio;

  const projection = mat4.ortho(
    -orthoWidth / 2, // left
    orthoWidth / 2, // right
    -orthoHeight / 2, // bottom
    orthoHeight / 2, // top
    0.1, // near
    100, // far
  );

  const viewProjection = mat4.multiply(projection, view);

  const { device, context } = await initializeWebgpu(canvas);

  InputState.initialize();
  const level = new Level("../assets/level.ldtk");
  await level.initialize(device).then(() => {
    console.log("Level initialized");
  });

  BatchRenderer.init(device, context);

  // ECS Example
  const w = new World();
  const l = w.createEntity("Level", true);
  l.addComponent<LevelComponent>(new LevelComponent("../assets/level.ldtk", device));

  const renderSystem = new RenderSystem(level);
  w.addSystem(renderSystem);
  w.addSystem(new ScriptSystem());

  const e = w.createEntity("Player", true, vec2.create(90, 10), vec2.create(30, 30));
  e.addComponent<SpriteComponent>(new SpriteComponent({ r: 1, g: 0.5, b: 0.1, a: 1 }));
  e.addComponent<ScriptComponent>(new ScriptComponent(w, new PlayerController(w, e)));

  const c = w.createEntity("Camera", true, vec2.create(0, 0), vec2.create(0, 0));
  c.addComponent(new CameraComponent(new Camera(vec2.create(100, -50), vec2.create(orthoWidth, orthoHeight)), true));
  c.addComponent<ScriptComponent>(new ScriptComponent(w, new CameraController(w, c)));

  const viewMatrixBuffer = device.createBuffer({
    size: viewProjection.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

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

    device.queue.writeBuffer(viewMatrixBuffer, 0, viewProjection.buffer);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    w.update(deltaTime);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
