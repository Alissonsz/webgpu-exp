import { mat4 } from "@gustavo4passos/wgpu-matrix";
import vertexShaderCode from "./shaders/vertex.wgsl";
import fragmentShaderCode from "./shaders/fragment.wgsl";
import { LDtkData, LevelData } from "./types";

export class Level {
  private levelData: LevelData;
  private textures: Map<string, { texture: GPUTexture; sampler: GPUSampler }> = new Map();
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private levelFilePath: string;
  private renderPipeline: GPURenderPipeline;
  private static squareVertices = new Float32Array([
    -0.5,
    0.5,
    0.0, // Vertex 1: x, y, z
    -0.5,
    -0.5,
    0.0, // Vertex 2: x, y, z
    0.5,
    -0.5,
    0.0, // Vertex 3: x, y, z
    0.5,
    0.5,
    0.0, // Vertex 4: x, y, z
  ]);

  private static squareIndices = new Uint16Array([
    0,
    1,
    2, // First triangle
    0,
    2,
    3, // Second triangle
  ]);

  constructor(levelFilePath: string, device: GPUDevice) {
    this.levelFilePath = levelFilePath;

    this.vertexBuffer = device.createBuffer({
      size: Level.squareVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(Level.squareVertices);
    this.vertexBuffer.unmap();

    this.indexBuffer = device.createBuffer({
      size: Level.squareIndices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(Level.squareIndices);
    this.indexBuffer.unmap();
  }

  async initialize(device: GPUDevice, context: GPUCanvasContext) {
    const response = await fetch(this.levelFilePath);
    if (!response.ok) {
      throw new Error(`Failed to load level data from ${this.levelFilePath}`);
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
        const texture = device.createTexture({
          size: [imageBitmap.width, imageBitmap.height, 1],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, [
          imageBitmap.width,
          imageBitmap.height,
        ]);
        return { path, texture };
      });
    await Promise.all(tilesetPromises).then((textures) => {
      textures.forEach(({ path, texture }) => {
        if (path && texture) {
          this.textures.set(path, {
            texture,
            sampler: device.createSampler({
              magFilter: "nearest",
              minFilter: "nearest",
              addressModeU: "clamp-to-edge",
              addressModeV: "clamp-to-edge",
            }),
          });
        }
      });
    });

    // Create render pipeline once after textures are loaded
    this.renderPipeline = device.createRenderPipeline({
      layout: "auto",
      label: "Level Tile Render Pipeline",
      vertex: {
        module: device.createShaderModule({
          code: vertexShaderCode,
        }),
        buffers: [
          {
            attributes: [
              {
                shaderLocation: 0, // Position attribute
                offset: 0,
                format: "float32x3",
              },
            ],
            stepMode: "vertex",
            arrayStride: 3 * Level.squareVertices.BYTES_PER_ELEMENT,
          },
          {
            attributes: [
              {
                shaderLocation: 1, // Texture coordinate attribute
                offset: 0,
                format: "float32x2",
              },
            ],
            stepMode: "vertex",
            arrayStride: 2 * 4,
          },
        ],
        entryPoint: "main",
      },
      fragment: {
        module: device.createShaderModule({
          code: fragmentShaderCode,
        }),
        entryPoint: "main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
    });
  }

  render(
    device: GPUDevice,
    context: GPUCanvasContext,
    passEncoder: GPURenderPassEncoder,
    viewMatrixBuffer?: GPUBuffer,
  ): void {
    passEncoder.setPipeline(this.renderPipeline);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, "uint16");

    // Vertices (reuse same geometry)
    const squareVerts = new Float32Array([-0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0]);
    device.queue.writeBuffer(this.vertexBuffer, 0, squareVerts);

    const texture = this.textures.get(this.levelData.layerInstances[0].__tilesetRelPath!);

    // Render all tiles!
    this.levelData.layerInstances[0].gridTiles.forEach((tile) => {
      const tilePos = { x: tile.px[0], y: tile.px[1] };
      const tilesetUV = { x: tile.src[0], y: tile.src[1] };
      const worldPos = transformCoord(tilePos.x, tilePos.y, this.levelData.pxWid / 2, this.levelData.pxHei / 2);

      // Model matrix with position and scale
      let modelMatrix = mat4.identity();
      modelMatrix = mat4.translate(modelMatrix, [...worldPos, 0]);
      modelMatrix = mat4.scale(modelMatrix, [18, 18, 1]);

      const modelMatrixBuffer = device.createBuffer({
        size: modelMatrix.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(modelMatrixBuffer, 0, modelMatrix.buffer);

      // Texture coords
      const texCoords = this.getTextureCoordinates(tilesetUV.x, tilesetUV.y);
      const textureCoordBuffer = device.createBuffer({
        size: texCoords.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(textureCoordBuffer.getMappedRange()).set(texCoords);
      textureCoordBuffer.unmap();
      passEncoder.setVertexBuffer(1, textureCoordBuffer);

      // Bind group
      if (texture && viewMatrixBuffer) {
        const bindGroup = device.createBindGroup({
          layout: this.renderPipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: { buffer: viewMatrixBuffer },
            },
            {
              binding: 1,
              resource: { buffer: modelMatrixBuffer },
            },
            {
              binding: 3,
              resource: texture.sampler,
            },
            {
              binding: 2,
              resource: texture.texture.createView(),
            },
          ],
        });
        passEncoder.setBindGroup(0, bindGroup);
      }

      passEncoder.drawIndexed(Level.squareIndices.length);
    });
  }

  getTextureCoordinates(u: number, v: number): Float32Array {
    // it returns unnormalized texture coordinates
    const texCoords = new Float32Array([
      u,
      v, // Top-left
      u,
      v + 18, // Bottom-left
      u + 18,
      v + 18, // Bottom-right
      u + 18,
      v, // Top-right
    ]);
    return texCoords;
  }
}

// we need this to transform 0, 256 to -128 to 128
function transformCoord(x: number, y: number, levelWidth: number, levelHeight: number): [number, number] {
  return [x - levelWidth, levelHeight - y];
}
