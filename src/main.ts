import { initializeWebgpu } from "./renderer";
import { vec2, vec4 } from "@gustavo4passos/wgpu-matrix";
import { InputState } from "./InputState";
import { World } from "./ecs";
import {
  SpriteComponent,
  CameraComponent,
  ScriptComponent,
  LevelComponent,
  PhysicsBodyComponent,
  AnimationComponent,
  AnimationStateComponent,
  ParticleEmmiterComponent,
} from "./components";
import { Camera } from "./Camera.ts";
import { RenderSystem } from "./systems/render.ts";
import { ScriptSystem } from "./systems/script.ts";
import { PhysicsSystem } from "./systems/physics.ts";
import { BatchRenderer } from "./BatchRenderer.ts";
import { CameraController, PlayerController, WalkingDustController } from "./components/scripts";
import { Collider, PhysicsBody } from "./physics/PhysicsBodies";
import { AssetManager } from "./AssetManager.ts";
import { AnimationSystem } from "./systems/animation.ts";
import { AudioSystem } from "./systems/audio";
import { AudioEngine } from "./AudioEngine";
import { ParticleSystem } from "./systems/particle"

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

  AudioEngine.init();
  BatchRenderer.init(device, context);
  AssetManager.init(device, AudioEngine.audioContext);

  AssetManager.loadSound("jump", "../assets/sounds/jump.mp3");
  AssetManager.loadSound("landing", "../assets/sounds/landing.mp3");
  AssetManager.loadSound("step", "../assets/sounds/step.wav");
  AssetManager.loadSound("step_r", "../assets/sounds/step_r.wav");
  AssetManager.loadSound("step_l", "../assets/sounds/step_l.wav");

  // ECS Example
  const w = new World();
  const l = w.createEntity("Level", true);
  l.addComponent<LevelComponent>(new LevelComponent("../assets/level-collision.ldtk"));
  await l.getComponent(LevelComponent).initialize();

  w.addSystem(new PhysicsSystem());
  w.addSystem(new AnimationSystem());
  w.addSystem(new ScriptSystem());
  w.addSystem(new ParticleSystem());
  w.addSystem(new AudioSystem());
  w.addSystem(new RenderSystem());

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

  const p = w.createEntity("ParticleEmitter", true, vec2.create(100, 100), vec2.create(0, 0));
  p.addComponent<ParticleEmmiterComponent>(new ParticleEmmiterComponent({
    initialVelocity: vec2.create(-20, -10),
    velocityVariation: vec2.create(5, 25),
    lifetime: 0.3,
    initialColor: vec4.create(0.75, 0.64, 0.51, 0.6),
    finalColor: vec4.create(0.75, 0.64, 0.51, 0),
    initialSize: vec2.create(2, 2),
    finalSize: vec2.create(8, 8),
    emissionTime: 0.02
  }));
  p.addComponent<ScriptComponent>(new ScriptComponent(new WalkingDustController(w, p)));

  const f = w.createEntity("Fire", true, vec2.create(100, 160), vec2.create(0, 0));
  f.addComponent<ParticleEmmiterComponent>(new ParticleEmmiterComponent({
    initialVelocity: vec2.create(0, -35),
    velocityVariation: vec2.create(20, 10),
    lifetime: 2,
    initialColor: vec4.create(0.85, 0.3, 0.1, 0.7),
    finalColor: vec4.create(0.85, 0.1, 0.1, 0),
    initialSize: vec2.create(2, 2),
    finalSize: vec2.create(8, 8),
    emissionTime: 0.02
  }));

  const f2 = w.createEntity("Fire2", true, vec2.create(400, 100), vec2.create(0, 0));
  f2.addComponent<ParticleEmmiterComponent>(new ParticleEmmiterComponent({
    initialVelocity: vec2.create(0, -25),
    velocityVariation: vec2.create(20, 10),
    lifetime: 2,
    initialColor: vec4.create(0.85, 0.1, 0.1, 0.6),
    finalColor: vec4.create(0.85, 0.64, 0.1, 0),
    initialSize: vec2.create(2, 2),
    finalSize: vec2.create(8, 8),
    emissionTime: 0.05
  }));

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
