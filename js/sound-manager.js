/**
 * Gerenciador de sons e alarmes
 */

import { CACHE_KEYS, loadConfig, saveConfig } from './cache-manager.js';

/**
 * Toca som de alarme quando timer termina
 */
export function playBeepSound() {
  const soundEnabled = loadConfig(CACHE_KEYS.SOUND_ENABLED, false);
  if (!soundEnabled) return;

  try {
    // Cria contexto de áudio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Cria oscilador para o beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configura o som
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
    oscillator.type = 'sine';

    // Envelope do som
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

    // Toca o som
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);

    console.log('Beep sound played');
  } catch (error) {
    console.error('Erro ao tocar som de alarme:', error);
  }
}

/**
 * Inicializa toggle de som
 */
export function initializeSoundToggle() {
  const soundToggle = document.getElementById('soundToggle');

  if (soundToggle) {
    soundToggle.checked = loadConfig(CACHE_KEYS.SOUND_ENABLED, false);

    soundToggle.addEventListener('change', () => {
      saveConfig(CACHE_KEYS.SOUND_ENABLED, soundToggle.checked);
      console.log('Sound enabled:', soundToggle.checked);
    });
  }
}