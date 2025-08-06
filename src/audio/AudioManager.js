import * as THREE from 'three';

export class AudioManager {
  constructor() {
    this.listener = new THREE.AudioListener();
    this.launchSound = null;
    this.windSound = null;
    this.audioLoader = new THREE.AudioLoader();
    
    this.isWindPlaying = false;
  }

  async loadAudio() {
    try {
      // Load launch sound
      this.launchSound = new THREE.Audio(this.listener);
      const launchBuffer = await this.loadAudioBuffer('./launch_sound.mp3');
      this.launchSound.setBuffer(launchBuffer);
      this.launchSound.setVolume(0.7);
      
      // Load wind sound
      this.windSound = new THREE.Audio(this.listener);
      const windBuffer = await this.loadAudioBuffer('./wind.mp3');
      this.windSound.setBuffer(windBuffer);
      this.windSound.setVolume(0.3);
      this.windSound.setLoop(true);
      
      console.log('Audio loaded successfully');
    } catch (error) {
      console.warn('Could not load audio files:', error);
      // Create silent audio objects to prevent errors
      this.createSilentAudio();
    }
  }

  loadAudioBuffer(url) {
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        url,
        resolve,
        undefined,
        reject
      );
    });
  }

  createSilentAudio() {
    // Create empty audio objects that won't throw errors
    this.launchSound = { play: () => {}, stop: () => {} };
    this.windSound = { play: () => {}, stop: () => {}, isPlaying: false };
  }

  playLaunchSound() {
    if (this.launchSound && this.launchSound.play) {
      try {
        if (this.launchSound.isPlaying) {
          this.launchSound.stop();
        }
        this.launchSound.play();
      } catch (error) {
        console.warn('Could not play launch sound:', error);
      }
    }
  }

  startWindSound() {
    if (this.windSound && this.windSound.play && !this.isWindPlaying) {
      try {
        this.windSound.play();
        this.isWindPlaying = true;
      } catch (error) {
        console.warn('Could not play wind sound:', error);
      }
    }
  }

  stopWindSound() {
    if (this.windSound && this.windSound.stop && this.isWindPlaying) {
      try {
        this.windSound.stop();
        this.isWindPlaying = false;
      } catch (error) {
        console.warn('Could not stop wind sound:', error);
      }
    }
  }

  getListener() {
    return this.listener;
  }
}