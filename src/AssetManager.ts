import { Texture } from "./Texture";
import { AudioEngine } from "./AudioEngine"

export class AssetManager {
  private static textures: Map<string, Texture> = new Map();
  private static sounds: Map<string, AudioBuffer> = new Map();

  private static gpuDevice: GPUDevice;
  private static audioContext: AudioContext;

  public static init(gpuDevice: GPUDevice, audioContext?: AudioContext): boolean {
    this.gpuDevice = gpuDevice;
    this.audioContext = audioContext;

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

  public static async loadSound(name: string, url: string) {
    if (name.length == 0) {
      throw new Error("Sound name cannot be empty");
    }

    const response    = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    this.sounds.set(name, audioBuffer);
  }

  public static getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }

  public static getSound(name: string): AudioBuffer | undefined {
    return this.sounds.get(name);
  }
 }
