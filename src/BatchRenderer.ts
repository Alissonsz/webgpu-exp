import { Texture } from './Texture';
import { Vec2, Rect } from './Vec'
import spriteBatchShaderCode from './shaders/sprite_batch.wgsl'
import { mat4 } from 'wgpu-matrix'

const F32_SIZE               = 4; // F32 has 4 bytes
const VERTEX_SIZE            = F32_SIZE * 2;
const MAX_QUADS_PER_BATCH    = 2048;
const MAX_VERTICES_PER_BATCH = MAX_QUADS_PER_BATCH * 4;
const MAX_TEXTURE_SLOTS      = 16;
const VERTICES_PER_QUAD      = 4;
const INDICES_PER_QUAD       = 6;

export class VertexData {
  pos: Vec2;
  texCoord: Vec2;
  textureId: number;

  static F32_SIZE: number = 5; // Vec2 + Vec2 + number

  constructor(pos: Vec2, texCoord: Vec2, textureId: number) {
    this.pos = pos;
    this.texCoord = texCoord;
    this.textureId = textureId;
  }

  static byteLength(): number {
    return VertexData.F32_SIZE * 4;
  }
} 

export class BatchRendererStats {
  quadsRendered: number = 0;
  verticesRendered: number = 0;
  batches: number = 0;
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
  private static pendingQuads: bigint = 0n;
  private static bindGroupLayout: GPUBindGroupLayout;
  private static bindGroup: GPUBindGroup;
  private static sampler: GPUSampler;
  private static viewMatrixBuffer: GPUBuffer;
  private static texturesUsedThisBatch: Array<GPUTexture> = [];
  private static whiteTexture: Texture;

  static stats: BatchRendererStats;

  static init(device: GPUDevice, context: GPUCanvasContext): boolean {
    if (BatchRenderer.hasInitialized) return;

    BatchRenderer.stats = new BatchRendererStats();
    BatchRenderer.device = device;
    BatchRenderer.context = context
    BatchRenderer.sampler = BatchRenderer.device.createSampler();

    BatchRenderer.vertexBufferData = new Float32Array(MAX_VERTICES_PER_BATCH * VertexData.F32_SIZE);

    BatchRenderer.vertexBuffer = BatchRenderer.device.createBuffer({
      label: "Batch Renderer Vertex Buffer",
      size: BatchRenderer.vertexBufferData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    BatchRenderer.viewMatrixBuffer = BatchRenderer.device.createBuffer({
      label: "Batch Renderer View Matrix Buffer",
      size: 64, // This consider a 4x4 matrix with f32 elements (16 * 4)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST 
    });

    BatchRenderer.initIndexBuffer();
    BatchRenderer.initPipeline();
    BatchRenderer.initWhiteTexture();

    BatchRenderer.hasInitialized = true;

    return true;
  }

  private static initIndexBuffer() {
    BatchRenderer.indexBufferData = new Uint32Array(MAX_QUADS_PER_BATCH * 6) // 3 vertices per triangle

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
9
    BatchRenderer.device.queue.writeBuffer(BatchRenderer.indexBuffer, 0, BatchRenderer.indexBufferData)
  }

  private static initPipeline() {
    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: VertexData.F32_SIZE * F32_SIZE,
      attributes: [{
        // Pos attribute
        format: "float32x2",
        offset: 0,
        shaderLocation: 0
      }, {
        // TexCoord attribute
        format: "float32x2",
        offset: Vec2.byteLength(),
        shaderLocation: 1
      }, {
        format: "float32",
        offset: Vec2.byteLength() * 2,
        shaderLocation: 2
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
  static begin(viewMatrix: ArrayBufferLike) {
    BatchRenderer.stats.batches = 0;
    BatchRenderer.stats.quadsRendered = 0;
    BatchRenderer.stats.verticesRendered = 0;

    // TODO: Only for debug
    if (BatchRenderer.pendingQuads != 0n) {
      throw new Error("Sprite batch state is invalid: Calling begin with a non-zero batch index")
    }

    if (viewMatrix.byteLength != 64) throw new Error("View matrix array has unsupported size");

    BatchRenderer.device.queue.writeBuffer(BatchRenderer.viewMatrixBuffer, 0, viewMatrix);
  }

  static end() {
    BatchRenderer.flush();
  }

  static drawSprite(texture: Texture, src: Rect, dst: Rect) {
    BatchRenderer.flushIfQuadLimitReached();
    const textureIndex = BatchRenderer.getTextureSlot(texture);

    const textureWidth = texture.width;
    const textureHeight = texture.height;

    // Top left vertex
    const v1: VertexData = new VertexData(new Vec2(dst.x, dst.y), 
      new Vec2(src.x / textureWidth, src.y / textureHeight), textureIndex);
    // Top right vertex
    const v2: VertexData = new VertexData(new Vec2(dst.x + dst.w, dst.y), 
      new Vec2((src.x + src.w) / textureWidth, src.y / textureHeight), textureIndex);
    // Bottom left vertex
    const v3: VertexData = new VertexData(new Vec2(dst.x, dst.y + dst.h), 
      new Vec2(src.x / textureWidth, (src.y + src.h) / textureHeight), textureIndex);
    // Bottom right vertex
    const v4: VertexData = new VertexData(new Vec2(dst.x + dst.w, dst.y + dst.h), 
      new Vec2((src.x + src.w) / textureWidth, (src.y + src.h) / textureHeight), textureIndex);

    const currentVertexIndex = Number(BatchRenderer.pendingQuads) * VERTICES_PER_QUAD;
    BatchRenderer.setVertexData(currentVertexIndex    , v1);
    BatchRenderer.setVertexData(currentVertexIndex + 1, v2);
    BatchRenderer.setVertexData(currentVertexIndex + 2, v3);
    BatchRenderer.setVertexData(currentVertexIndex + 3, v4);

    BatchRenderer.pendingQuads += 1n;
  }

  private static setVertexData(index: number, vertexData: VertexData) {
    const startingIndex = index * VertexData.F32_SIZE;
    BatchRenderer.vertexBufferData[startingIndex    ] = vertexData.pos.x;
    BatchRenderer.vertexBufferData[startingIndex + 1] = vertexData.pos.y;
    BatchRenderer.vertexBufferData[startingIndex + 2] = vertexData.texCoord.x;
    BatchRenderer.vertexBufferData[startingIndex + 3] = vertexData.texCoord.y;
    BatchRenderer.vertexBufferData[startingIndex + 4] = vertexData.textureId;
  }

  private static flushIfQuadLimitReached() {
    if (Number(BatchRenderer.pendingQuads) == MAX_QUADS_PER_BATCH) {
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
        }
    ];

    const TEXTURE_BINDS_START = bindGroupEntries.length;
    BatchRenderer.texturesUsedThisBatch.forEach((t, i) => bindGroupEntries.push({
      binding: i + TEXTURE_BINDS_START,
      resource: t
    }));

    // Fill remaining slots with white texture - WebGPU does not allow unbound slots
    const UNBOUND_TEXTURE_BINDS_START = TEXTURE_BINDS_START + BatchRenderer.texturesUsedThisBatch.length;
    for (let i = UNBOUND_TEXTURE_BINDS_START; i < MAX_TEXTURE_SLOTS + TEXTURE_BINDS_START; i++) {
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
      Number(BatchRenderer.pendingQuads) * VertexData.F32_SIZE * VERTICES_PER_QUAD);

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
    const nIndicesToDraw = Number(BatchRenderer.pendingQuads) * INDICES_PER_QUAD;
    pass.drawIndexed(nIndicesToDraw);
    pass.end();

    BatchRenderer.device.queue.submit([encoder.finish()]);

    //Update rendering stats
    BatchRenderer.stats.quadsRendered += Number(BatchRenderer.pendingQuads);
    BatchRenderer.stats.batches += 1;
    BatchRenderer.stats.verticesRendered += Number(BatchRenderer.pendingQuads) * VERTICES_PER_QUAD;

    BatchRenderer.pendingQuads = 0n;
    BatchRenderer.texturesUsedThisBatch = [];
  }

  private static getTextureSlot(texture: Texture): number {
    const texIdx = BatchRenderer.texturesUsedThisBatch.indexOf(texture.getInternalTexture());

    if (texIdx != -1) return texIdx;

    if (BatchRenderer.texturesUsedThisBatch.length >= MAX_QUADS_PER_BATCH - 1) {
      BatchRenderer.flush();
    }

    return BatchRenderer.texturesUsedThisBatch.push(texture.getInternalTexture()) - 1;
  }
}
