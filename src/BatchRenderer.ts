import { Camera } from './Camera';
import { Texture } from './Texture';
import { Rect } from "./Rect";
import { Vec2 } from "@gustavo4passos/wgpu-matrix"
import spriteBatchShaderCode from './shaders/sprite_batch.wgsl'

const F32_SIZE               = 4; // F32 has 4 bytes
const MAX_QUADS_PER_BATCH    = 1024;
const MAX_VERTICES_PER_BATCH = MAX_QUADS_PER_BATCH * 4;
const MAX_TEXTURE_SLOTS      = 16;
const VERTICES_PER_QUAD      = 4;
const INDICES_PER_QUAD       = 6;

export type Color = {
  r: number,
  g: number,
  b: number,
  a: number
};

export class VertexData {
  pos: Vec2;
  texCoords: Vec2;
  textureId: number;
  color: Color;

  static F32_LENGTH: number = 9; // Vec2 + Vec2 + number + Color

  constructor(pos: Vec2, texCoords: Vec2, textureId: number) {
    this.pos = pos;
    this.texCoords = texCoords;
    this.textureId = textureId;
  }

  static byteLength(): number {
    return VertexData.F32_LENGTH * 4;
  }
}

export class BatchRendererStats {
  quadsRendered: number = 0;
  verticesRendered: number = 0;
  batches: number = 0;

  clear() {
    this.quadsRendered = 0;
    this.verticesRendered = 0;
    this.batches = 0;
  }
}

export class BatchRenderer {
  private static hasInitialized: boolean = false
  private static device: GPUDevice

  private static vertexBuffer: GPUBuffer
  private static indexBuffer: GPUBuffer
  private static vertexBufferData: Float32Array
  private static indexBufferData: Uint32Array
  private static pipeline: GPURenderPipeline
  private static context: GPUCanvasContext
  private static shaderModule: GPUShaderModule
  private static pendingQuads: number = 0;
  private static bindGroupLayout: GPUBindGroupLayout;
  private static bindGroup: GPUBindGroup;
  private static sampler: GPUSampler;
  private static viewMatrixBuffer: GPUBuffer;
  private static texturesUsedThisBatch: Array<GPUTexture> = [];
  private static whiteTexture: Texture;
  // Helpers
  private static originUnitRect: Rect;
  private static whiteColor: Color;
  private static camera: Camera;

  static stats: BatchRendererStats;

  static init(device: GPUDevice, context: GPUCanvasContext): boolean {
    if (BatchRenderer.hasInitialized) return;

    BatchRenderer.stats = new BatchRendererStats();

    BatchRenderer.device = device;
    BatchRenderer.context = context
    BatchRenderer.sampler = BatchRenderer.device.createSampler();

    BatchRenderer.vertexBufferData = new Float32Array(MAX_VERTICES_PER_BATCH * VertexData.F32_LENGTH);

    BatchRenderer.vertexBuffer = BatchRenderer.device.createBuffer({
      label: "Batch Renderer Vertex Buffer",
      size: BatchRenderer.vertexBufferData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    BatchRenderer.viewMatrixBuffer = BatchRenderer.device.createBuffer({
      label: "Batch Renderer View Matrix Buffer",
      size: 64, // This considers a 4x4 matrix with f32 elements (16 * 4)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    BatchRenderer.initIndexBuffer();
    BatchRenderer.initPipeline();
    BatchRenderer.initWhiteTexture();
    BatchRenderer.originUnitRect = new Rect(0, 0, 1, 1);
    BatchRenderer.whiteColor = { r: 1, g: 1, b: 1, a: 1 };

    BatchRenderer.hasInitialized = true;

    return true;
  }

  private static initIndexBuffer() {
    BatchRenderer.indexBufferData = new Uint32Array(MAX_QUADS_PER_BATCH * 6); // 3 vertices per triangle

    BatchRenderer.indexBuffer = BatchRenderer.device.createBuffer({
      label: "Batch Renderer Index Buffer",
      size: BatchRenderer.indexBufferData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

    for (let i = 0; i < MAX_QUADS_PER_BATCH; i += 1) {
      BatchRenderer.indexBufferData[(i * INDICES_PER_QUAD) + 0] = (i * 4)
      BatchRenderer.indexBufferData[(i * INDICES_PER_QUAD) + 1] = (i * 4) + 1
      BatchRenderer.indexBufferData[(i * INDICES_PER_QUAD) + 2] = (i * 4) + 2
      BatchRenderer.indexBufferData[(i * INDICES_PER_QUAD) + 3] = (i * 4) + 1
      BatchRenderer.indexBufferData[(i * INDICES_PER_QUAD) + 4] = (i * 4) + 3
      BatchRenderer.indexBufferData[(i * INDICES_PER_QUAD) + 5] = (i * 4) + 2
    }
    BatchRenderer.device.queue.writeBuffer(BatchRenderer.indexBuffer, 0, BatchRenderer.indexBufferData)
  }

  private static initPipeline() {
    const VEC2_BYTE_LENGTH = F32_SIZE * 2;
    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: VertexData.F32_LENGTH * F32_SIZE,
      attributes: [{
        // Pos attribute
        format: "float32x2",
        offset: 0,
        shaderLocation: 0
      }, {
        // TexCoord attribute
        format: "float32x2",
        offset: VEC2_BYTE_LENGTH,
        shaderLocation: 1
      }, {
        format: "float32",
        offset: VEC2_BYTE_LENGTH * 2,
        shaderLocation: 2
      },
      {
        format: "float32x4",
        offset: VEC2_BYTE_LENGTH * 2 + F32_SIZE,
        shaderLocation: 3,
      }]
    }

    BatchRenderer.shaderModule = BatchRenderer.device.createShaderModule({
      label: "BatchRenderer Shader Module",
      code: spriteBatchShaderCode
    });

    let canvasFormat = navigator.gpu.getPreferredCanvasFormat()

    const bindGroupEntries: Array<GPUBindGroupLayoutEntry> = [];
    bindGroupEntries.push({
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: { type: "uniform" }
    })

    bindGroupEntries.push({
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {
        type: "non-filtering"
      }
    })

    const TEXTURE_BINDS_START = bindGroupEntries.length;
    for (let i = 0; i < 16; i++) {
      bindGroupEntries.push({
        binding: i + TEXTURE_BINDS_START,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: "float",
          viewDimension: "2d",
          multisampled: false
        }
      })
    }

    BatchRenderer.bindGroupLayout = BatchRenderer.device.createBindGroupLayout({
      label: "Batch Renderer Bind Group Layout",
      entries: bindGroupEntries
    })

    const pipelineLayout = BatchRenderer.device.createPipelineLayout({
      label: "Batch Renderer Pipeline Layout",
      bindGroupLayouts: [ BatchRenderer.bindGroupLayout ]
    });

    BatchRenderer.pipeline = BatchRenderer.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: BatchRenderer.shaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout]
      },
      fragment: {
        module: BatchRenderer.shaderModule,
        entryPoint: "fragmentMain",
        targets: [
          { format: canvasFormat }
        ]
      }
    })
  }

  private static initWhiteTexture() {
    BatchRenderer.whiteTexture = new Texture(BatchRenderer.device);
    BatchRenderer.whiteTexture.initFromU8(new Uint8Array([255, 255, 255, 255].flat()), 1, 1);
  }

  // TODO: Use a camera instead
  static begin(camera: Camera) {
    BatchRenderer.stats.clear();

    // TODO: Only for debug
    if (BatchRenderer.pendingQuads != 0) {
      throw new Error("Sprite batch state is invalid: Calling begin with a non-zero batch index")
    }

    BatchRenderer.device.queue.writeBuffer(BatchRenderer.viewMatrixBuffer, 0, camera.getViewProjectionMatrix());
  }

  static end() {
    BatchRenderer.flush();
  }

  static drawSprite(texture: Texture, src: Rect, dst: Rect, color?: Color) {
    BatchRenderer.flushIfQuadLimitReached();
    const textureIndex = BatchRenderer.getTextureSlot(texture);

    const textureWidth = texture.width;
    const textureHeight = texture.height;

    const currentVertexIndex = BatchRenderer.pendingQuads * VERTICES_PER_QUAD;
    // Top left vertex
    BatchRenderer.setVertexData(currentVertexIndex    , dst.x, dst.y,
      src.x / textureWidth, src.y / textureHeight, textureIndex, color ? color : BatchRenderer.whiteColor);
    // Top right vertex
    BatchRenderer.setVertexData(currentVertexIndex + 1, dst.x + dst.w, dst.y,
      (src.x + src.w) / textureWidth, src.y / textureHeight, textureIndex, color ? color : BatchRenderer.whiteColor);
    // Bottom left vertex
    BatchRenderer.setVertexData(currentVertexIndex + 2, dst.x, dst.y + dst.h,
      src.x / textureWidth, (src.y + src.h) / textureHeight, textureIndex, color ? color : BatchRenderer.whiteColor);
    // Bottom right vertex
    BatchRenderer.setVertexData(currentVertexIndex + 3, dst.x + dst.w, dst.y + dst.h,
      (src.x + src.w) / textureWidth, (src.y + src.h) / textureHeight, textureIndex, color ? color : BatchRenderer.whiteColor);

    BatchRenderer.pendingQuads += 1;
  }

  static drawRect(dst: Rect, color: Color) {
    console.log("Destination: ", dst);
    BatchRenderer.drawSprite(BatchRenderer.whiteTexture, BatchRenderer.originUnitRect, dst, color);
  }

  private static setVertexData(index: number, x: number, y: number, texCoordX: number, texCoordY: number, textureId: number, color: Color) {
    const startingIndex = index * VertexData.F32_LENGTH;
    BatchRenderer.vertexBufferData[startingIndex    ] = x;
    BatchRenderer.vertexBufferData[startingIndex + 1] = y;
    BatchRenderer.vertexBufferData[startingIndex + 2] = texCoordX;
    BatchRenderer.vertexBufferData[startingIndex + 3] = texCoordY;
    BatchRenderer.vertexBufferData[startingIndex + 4] = textureId;
    BatchRenderer.vertexBufferData[startingIndex + 5] = color.r;
    BatchRenderer.vertexBufferData[startingIndex + 6] = color.g;
    BatchRenderer.vertexBufferData[startingIndex + 7] = color.b;
    BatchRenderer.vertexBufferData[startingIndex + 8] = color.a;
  }

  private static flushIfQuadLimitReached() {
    if (BatchRenderer.pendingQuads >= MAX_QUADS_PER_BATCH) {
      BatchRenderer.flush();
    }
  }

  private static flush() {
    const bindGroupEntries: Array<GPUBindGroupEntry> = [
        {
          binding: 0,
          resource: BatchRenderer.viewMatrixBuffer,
        },
        {
          binding: 1,
          resource: BatchRenderer.sampler,
        },
      {
        binding: 2,
        resource: BatchRenderer.whiteTexture.getInternalTexture(),
      }
    ];

    const TEXTURE_BINDS_START = bindGroupEntries.length;
    BatchRenderer.texturesUsedThisBatch.forEach((t, i) => bindGroupEntries.push({
      binding: i + TEXTURE_BINDS_START,
      resource: t
    }));

    // Fill remaining slots with white texture - WebGPU does not allow unbound slots
    const UNBOUND_TEXTURE_BINDS_START = TEXTURE_BINDS_START + BatchRenderer.texturesUsedThisBatch.length;
    for (let i = UNBOUND_TEXTURE_BINDS_START; i < MAX_TEXTURE_SLOTS + TEXTURE_BINDS_START - 1; i++) {
     bindGroupEntries.push({
       binding: i,
       resource: BatchRenderer.whiteTexture.getInternalTexture(),
     })
    }

    BatchRenderer.bindGroup = BatchRenderer.device.createBindGroup({
      layout: BatchRenderer.bindGroupLayout,
      entries: bindGroupEntries
    })

    BatchRenderer.device.queue.writeBuffer(BatchRenderer.vertexBuffer, 0,
      BatchRenderer.vertexBufferData, 0,
      BatchRenderer.pendingQuads * VertexData.F32_LENGTH * VERTICES_PER_QUAD);

    const encoder = BatchRenderer.device.createCommandEncoder({
      label: "Sprite Batch Main Command Encoder"
    })

    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: BatchRenderer.context.getCurrentTexture().createView(),
        loadOp: BatchRenderer.stats.batches == 0 ? 'clear' : 'load', // Only clear screen if first batch
        storeOp: 'store',
        clearValue: { r: 0.3, g: 0.3, b: 0.4, a: 1 }
      }]
    })

    pass.setPipeline(BatchRenderer.pipeline);
    pass.setVertexBuffer(0, BatchRenderer.vertexBuffer);
    pass.setIndexBuffer(BatchRenderer.indexBuffer, "uint32");
    pass.setBindGroup(0, BatchRenderer.bindGroup);
    const nIndicesToDraw = BatchRenderer.pendingQuads * INDICES_PER_QUAD;
    pass.drawIndexed(nIndicesToDraw);
    pass.end();

    BatchRenderer.device.queue.submit([encoder.finish()]);

    //Update rendering stats
    BatchRenderer.stats.quadsRendered += BatchRenderer.pendingQuads;
    BatchRenderer.stats.batches += 1;
    BatchRenderer.stats.verticesRendered += BatchRenderer.pendingQuads * VERTICES_PER_QUAD;

    BatchRenderer.pendingQuads = 0;
    BatchRenderer.texturesUsedThisBatch = [];
  }

  private static getTextureSlot(texture: Texture): number {
    const texIdx = BatchRenderer.texturesUsedThisBatch.indexOf(texture.getInternalTexture());

    if (texIdx != -1) return texIdx + 1;

    if (BatchRenderer.texturesUsedThisBatch.length >= MAX_TEXTURE_SLOTS - 1) {
      BatchRenderer.flush();
    }

    return BatchRenderer.texturesUsedThisBatch.push(texture.getInternalTexture());
  }
}
