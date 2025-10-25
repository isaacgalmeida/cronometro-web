/**
 * Gerenciador de eventos e interações do usuário
 */

import {
  startTimer,
  startCurrentTimer,
  pauseTimer,
  resetTimer,
  adjustTimer
} from './timer-core.js';

import {
  playYouTube,
  stopMusic,
  handleManualMusicControl,
  detectSelectedMusic
} from './music-manager.js';

import { debounce } from './utils.js';

/**
 * Inicializa todos os event listeners
 */
export function initializeEventListeners() {
  initializeTimerControls();
  initializeMusicControls();
  initializeCustomTimeControls();
}

/**
 * Inicializa controles do timer
 */
function initializeTimerControls() {
  const controls = document.querySelector('.timer-controls');
  if (controls) {
    controls.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const action = btn.dataset.action;

      switch (action) {
        case 'quick':
          startTimer(Number(btn.dataset.min));
          break;
        case 'adjust':
          adjustTimer(Number(btn.dataset.min));
          break;
        case 'start':
          startCurrentTimer();
          break;
        case 'pause':
          pauseTimer();
          break;
        case 'reset':
          resetTimer();
          break;
      }
    });
  }

  // Botões individuais (fallback)
  const startBtn = document.querySelector('[data-action="start"]');
  const pauseBtn = document.querySelector('[data-action="pause"]');
  const resetBtn = document.querySelector('[data-action="reset"]');

  if (startBtn) startBtn.addEventListener('click', startCurrentTimer);
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);
}

/**
 * Inicializa controles de música
 */
function initializeMusicControls() {
  const presetMusic = document.getElementById('presetMusic');
  const playCustom = document.getElementById('playCustom');
  const stopMusicBtn = document.getElementById('stopMusic');
  const youtubeInput = document.getElementById('youtubeLink');

  if (presetMusic) {
    presetMusic.addEventListener('change', () => {
      const url = presetMusic.value;
      if (url) {
        handleManualMusicControl();
        playYouTube(url);
      }
    });
  }

  if (playCustom) {
    playCustom.addEventListener('click', () => {
      const url = youtubeInput?.value.trim();
      if (url) {
        handleManualMusicControl();
        playYouTube(url);
      }
    });
  }

  if (stopMusicBtn) {
    stopMusicBtn.addEventListener('click', () => {
      handleManualMusicControl();
      stopMusic();
    });
  }

  // Detecta mudanças no campo de URL customizada
  if (youtubeInput) {
    const debouncedDetect = debounce(detectSelectedMusic, 300);
    youtubeInput.addEventListener('input', debouncedDetect);
  }
}

/**
 * Inicializa controles de tempo personalizado
 */
function initializeCustomTimeControls() {
  // Controle simples com um input
  const setCustomTimeBtn = document.getElementById('setCustomTime');
  const customTimeInput = document.getElementById('customTimeInput');

  if (setCustomTimeBtn && customTimeInput) {
    const handleCustomTime = () => {
      const customTime = parseInt(customTimeInput.value);
      if (!isNaN(customTime) && customTime > 0) {
        startTimer(customTime);
      } else {
        alert('Por favor, insira um valor válido para o tempo.');
      }
    };

    setCustomTimeBtn.addEventListener('click', handleCustomTime);

    // Permite usar Enter no campo de input
    customTimeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleCustomTime();
      }
    });
  }

  // Controle avançado com minutos e segundos separados
  const customMinutes = document.getElementById('customMinutes');
  const customSeconds = document.getElementById('customSeconds');

  if (setCustomTimeBtn && customMinutes && customSeconds) {
    const handleAdvancedCustomTime = () => {
      const minutes = parseInt(customMinutes.value) || 0;
      const seconds = parseInt(customSeconds.value) || 0;

      if (minutes === 0 && seconds === 0) {
        alert('Por favor, insira um tempo válido (minutos e/ou segundos).');
        return;
      }

      // Converte para minutos decimais
      const totalMinutes = minutes + (seconds / 60);
      startTimer(totalMinutes);

      // Limpa os campos
      customMinutes.value = '';
      customSeconds.value = '';
    };

    // Se não há customTimeInput, usa o botão para o controle avançado
    if (!customTimeInput) {
      setCustomTimeBtn.addEventListener('click', handleAdvancedCustomTime);
    }

    // Validação de entrada
    [customMinutes, customSeconds].forEach(input => {
      input.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (value < 0) e.target.value = 0;
        if (e.target === customSeconds && value > 59) e.target.value = 59;
        if (e.target === customMinutes && value > 999) e.target.value = 999;
      });
    });
  }
}

/**
 * Inicializa eventos de teclado
 */
export function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignora se estiver digitando em um input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ': // Espaço para pausar/iniciar
        e.preventDefault();
        const isRunning = document.body.classList.contains('timer-running');
        if (isRunning) {
          pauseTimer();
        } else {
          startCurrentTimer();
        }
        break;
      case 'r': // R para resetar
        e.preventDefault();
        resetTimer();
        break;
      case '1': // 1 para 5 minutos
        e.preventDefault();
        startTimer(5);
        break;
      case '2': // 2 para 10 minutos
        e.preventDefault();
        startTimer(10);
        break;
      case '3': // 3 para 15 minutos
        e.preventDefault();
        startTimer(15);
        break;
      case '4': // 4 para 25 minutos (Pomodoro)
        e.preventDefault();
        startTimer(25);
        break;
    }
  });
}