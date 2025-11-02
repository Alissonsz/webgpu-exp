import { LDtkData, LevelData } from "./types";
import { Texture } from "./Texture";

export class Level {
  levelData: LevelData;
  textures: Record<string, Texture> = {};
  private levelFilePath: string;

  constructor(levelFilePath: string) {
    this.levelFilePath = levelFilePath;
  }

  async initialize(device: GPUDevice) {
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
        const texture = new Texture(device);
        texture.initFromBitmap(imageBitmap);

        return { path, texture };
      });

    const tilesetResults = await Promise.all(tilesetPromises);
    tilesetResults.forEach((result) => {
      if (result) {
        this.textures[result.path] = result.texture;
      }
    });
  }
}
