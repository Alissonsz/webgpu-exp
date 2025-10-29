import { initializeWebgpu } from "./renderer";
import { mat4, vec2 } from "@gustavo4passos/wgpu-matrix";
import { Level } from "./Level";
import { InputState } from "./InputState";
import { World, Components } from "./ecs";
import { TagComponent, ActivationStatusComponent, SpriteComponent, CameraComponent } from "./ecs/ComponentTypes.ts";
import { Camera } from "./Camera.ts";
import { RenderSystem } from "./RenderSystem.ts";
import { BatchRenderer } from "./BatchRenderer.ts";

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
  const level = new Level("../assets/level.ldtk", device);
  await level.initialize(device, context).then(() => {
    console.log("Level initialized");
  });

  BatchRenderer.init(device, context);

  // ECS Example
  const w = new World();

  const renderSystem = new RenderSystem();
  w.addSystem(renderSystem);

  const e = w.createEntity("Player", true, vec2.create(90, 10), vec2.create(100, 100));
  e.addComponent<SpriteComponent>(new SpriteComponent({ r: 1, g: 0.5, b: 0.1, a: 1}));

  const c = w.createEntity("Camera", true, vec2.create(0, 0), vec2.create(0, 0));
  c.addComponent(new CameraComponent(new Camera(vec2.create(0, 0), vec2.create(canvas.width, canvas.height)), true));

  let lastRender = new Date().getMilliseconds();
  const animationFrame = requestAnimationFrame(() => {
    const now = new Date().getMilliseconds();
    const deltaTime = now - lastRender;
    lastRender = now;

    // jump the frame to limit fps to ~30
    if (deltaTime > 33) {
      return;
    }

    // Create render pass AFTER initialization to get a valid texture
    const commandEncoder = device.createCommandEncoder();
    const clearColor = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: clearColor,
          loadOp: "clear",
          storeOp: "store",
          view: context.getCurrentTexture().createView(),
        },
      ],
    });

    const viewMatrixBuffer = device.createBuffer({
      size: viewProjection.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(viewMatrixBuffer, 0, viewProjection.buffer);

    level.render(device, context, passEncoder, viewMatrixBuffer);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

  });
});
