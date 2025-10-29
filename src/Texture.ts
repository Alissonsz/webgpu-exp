export class Texture {
  width: number = 0;
  height: number = 0;
  internalTexture: GPUTexture;
  private device: GPUDevice;

  constructor(device: GPUDevice) {
    this.device = device;
  }

  getInternalTexture(): GPUTexture {
    return this.internalTexture;
  }

  // TODO: Image format needs to be an argument
  initFromU8(data: Uint8Array, width: number, height: number) {
    this.width = width;
    this.height = height;

    this.internalTexture = this.device.createTexture({
      size: [this.width, this.height],
      format: "rgba8unorm",
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.writeTexture(
      { texture: this.internalTexture },
      data.buffer,
      { bytesPerRow: width * 4 },
      { width: width, height: height },
    );
  }

  initFromBitmap(bitmap: ImageBitmap) {
    this.width = bitmap.width;
    this.height = bitmap.height;

    this.internalTexture = this.device.createTexture({
      size: [this.width, this.height],
      format: "rgba8unorm",
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture: this.internalTexture },
      { width: this.width, height: this.height },
    );
  }
}
