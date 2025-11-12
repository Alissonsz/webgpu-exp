import { System } from "../ecs";
import { AudioEngine } from "../AudioEngine";
import { AssetManager } from "../AssetManager";

export class AudioSystem extends System {
  constructor() {
    super();
  }

  update(deltaTime: number) {
  }

  playSFX(soundName: string) {
    const buf = AssetManager.getSound(soundName);
    // TODO: To help find errors, play an 'error' sound
    if (!buf) {
      console.log(`Warning: Unkown sound ${soundName}. Ignoring.`);
      return;
    }

    const node = AudioEngine.createAudioNode(buf);
    AudioEngine.connectSFXNodeToDestination(node);
    node.start();
  }

  playMusic(soundName: string) {
  }
}
