import { Texture } from "./Texture";

export class AssetManager {
  private static textures: Map<string, Texture> = new Map();

  public static async loadTexture(name: string, url: string, device: GPUDevice) {
    const texture = new Texture(device);
    const response = await fetch(`assets/${url}`);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    texture.initFromBitmap(imageBitmap);
    this.textures.set(name, texture);
  }

  public static getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }
}
