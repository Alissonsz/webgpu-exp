import { Texture } from "./Texture";

export class AssetManager {
  private static textures: Map<string, Texture> = new Map();
  private static gpuDevice: GPUDevice;

  public static init(gpuDevice: GPUDevice): boolean {
    this.gpuDevice = gpuDevice;

    return true;
  }

  public static async loadTexture(name: string, url: string): Promise<Texture> {
    const texture = new Texture(this.gpuDevice);
    const response = await fetch(`assets/${url}`);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    texture.initFromBitmap(imageBitmap);
    this.textures.set(name, texture);

    return texture;
  }

  public static getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }
}
