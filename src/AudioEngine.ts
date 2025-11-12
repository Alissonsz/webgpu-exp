export class AudioEngine {
  static audioContext: AudioContext;
  static musicGainNode: GainNode;
  static sfxGainNode: GainNode;

  static init(): boolean {
    this.audioContext = new AudioContext();
    this.sfxGainNode = this.audioContext.createGain();
    this.musicGainNode = this.audioContext.createGain();

    return true;
  }

  static setMusicVolume(volume: number) {
    this.musicGainNode.gain.value = volume;
  }

  static setSFXVolume(volume: number) {
    this.sfxGainNode.gain.value = volume; 
  }

  static connectMusicNodeToDestination(audioNode: AudioNode) {
    audioNode.connect(this.musicGainNode).connect(this.audioContext.destination);
  }

  static connectSFXNodeToDestination(audioNode: AudioNode) {
    audioNode.connect(this.sfxGainNode).connect(this.audioContext.destination);
  }

  static createAudioNode(audioBuffer: AudioBuffer): AudioBufferSourceNode {
    const node = this.audioContext.createBufferSource();
    node.buffer = audioBuffer;
    return node;
  }
}
