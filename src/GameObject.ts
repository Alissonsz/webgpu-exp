import vertexShaderCode from "./shaders/vertex.wgsl";
import fragmentShaderCode from "./shaders/fragment.wgsl";
import tileMapUrl from "../assets/tilemap_packed.png";
import { mat4, vec3, Vec3 } from "@gustavo4passos/wgpu-matrix";

type RenderNonVoidReturn = {
  passEncoder: GPURenderPassEncoder;
};
type RenderReturn = RenderNonVoidReturn | void;

class GameObject {
  position: Vec3;

  constructor(position: Vec3 = vec3.create(0, 0, 0)) {
    this.position = position;
  }

  render(
    device: GPUDevice,
    context: GPUCanvasContext,
    passEncoder: GPURenderPassEncoder,
    viewMatrixBuffer?: GPUBuffer,
  ): RenderReturn {
    console.log("Not implemented");
  }
}

export class Triangle extends GameObject {
  private vertexBuffer: GPUBuffer;
  private static triangleVertices = new Float32Array([
    0.0,
    0.5,
    0.0, // Vertex 1: x, y, z
    -0.5,
    -0.5,
    0.0, // Vertex 2: x, y, z
    0.5,
    -0.5,
    0.0, // Vertex 3: x, y, z
  ]);

  constructor(device: GPUDevice, position: Vec3 = vec3.create(0, 0, 0)) {
    super(position);
    this.vertexBuffer = device.createBuffer({
      size: Triangle.triangleVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(this.vertexBuffer.getMappedRange()).set(Triangle.triangleVertices);
    this.vertexBuffer.unmap();
  }

  render(
    device: GPUDevice,
    context: GPUCanvasContext,
    passEncoder: GPURenderPassEncoder,
    viewMatrixBuffer?: GPUBuffer,
  ): RenderReturn {
    const renderPipeline = device.createRenderPipeline({
      layout: "auto",
      label: "Triangle Render Pipeline",
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
            arrayStride: 3 * Triangle.triangleVertices.BYTES_PER_ELEMENT,
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
    });

    device.queue.writeBuffer(this.vertexBuffer, 0, Triangle.triangleVertices, 0, Triangle.triangleVertices.length);

    const modelMatrix = mat4.translation(this.position);
    const modelMatrixBuffer = device.createBuffer({
      size: modelMatrix.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(modelMatrixBuffer, 0, modelMatrix.buffer);

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);

    if (viewMatrixBuffer) {
      const bindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: { buffer: viewMatrixBuffer },
          },
          {
            binding: 1,
            resource: { buffer: modelMatrixBuffer },
          },
        ],
      });
      passEncoder.setBindGroup(0, bindGroup);
    }

    passEncoder.draw(3);
    return { passEncoder };
  }
}

export class Square extends GameObject {
  private static textureTileSize = 18;
  private vertexBuffer: GPUBuffer;
  private texture: {
    texture: GPUTexture;
    sampler: GPUSampler;
  } | null = null;
  public static squareVertices = new Float32Array([
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

  private static textureXY = new Float32Array([
    36.0,
    0.0, // UV for Vertex 1 (top-left)
    36.0,
    18.0, // UV for Vertex 2 (bottom-left)
    54.0,
    18.0, // UV for Vertex 3 (bottom-right)
    54.0,
    0.0, // UV for Vertex 4 (top-right)
  ]);

  public static squareIndices = new Uint16Array([
    0,
    1,
    2, // First triangle
    0,
    2,
    3, // Second triangle
  ]);

  private indexBuffer: GPUBuffer;

  constructor(device: GPUDevice, position: Vec3 = vec3.create(0, 0, 0)) {
    super(position);
    this.vertexBuffer = device.createBuffer({
      size: Square.squareVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(this.vertexBuffer.getMappedRange()).set(Square.squareVertices);
    this.vertexBuffer.unmap();

    this.indexBuffer = device.createBuffer({
      size: Square.squareIndices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(Square.squareIndices);
    this.indexBuffer.unmap();
  }

  async initialize(device: GPUDevice) {
    const response = await fetch(tileMapUrl);
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

    this.texture = {
      texture,
      sampler: device.createSampler({
        magFilter: "nearest",
        minFilter: "nearest",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
      }),
    };

    console.log("Texture loaded and initialized");
  }

  render(
    device: GPUDevice,
    context: GPUCanvasContext,
    passEncoder: GPURenderPassEncoder,
    viewMatrixBuffer?: GPUBuffer,
  ): RenderReturn {
    if (!this.texture) {
      console.warn("Texture not loaded yet, skipping render");
      return;
    }

    const renderPipeline = device.createRenderPipeline({
      layout: "auto",
      label: "Square Render Pipeline",
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
            arrayStride: 3 * Square.squareVertices.BYTES_PER_ELEMENT,
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
            arrayStride: 2 * Square.textureXY.BYTES_PER_ELEMENT,
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

    device.queue.writeBuffer(this.vertexBuffer, 0, Square.squareVertices, 0, Square.squareVertices.length);

    const modelMatrix = mat4.translation(this.position);
    const modelMatrixBuffer = device.createBuffer({
      size: modelMatrix.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(modelMatrixBuffer, 0, modelMatrix.buffer);

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, "uint16");

    // pass texture coordinates
    const textureCoordBuffer = device.createBuffer({
      size: Square.textureXY.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(textureCoordBuffer.getMappedRange()).set(Square.textureXY);
    textureCoordBuffer.unmap();
    passEncoder.setVertexBuffer(1, textureCoordBuffer);

    if (viewMatrixBuffer) {
      const bindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
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
            resource: this.texture.sampler,
          },
          {
            binding: 2,
            resource: this.texture.texture.createView(),
          },
        ],
      });
      passEncoder.setBindGroup(0, bindGroup);
    }

    passEncoder.drawIndexed(Square.squareIndices.length);
    return { passEncoder };
  }
}
