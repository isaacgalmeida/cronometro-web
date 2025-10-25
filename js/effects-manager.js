/**
 * Gerenciador de efeitos visuais (neve, ano novo, etc.)
 */

import { CACHE_KEYS, loadConfig, saveConfig } from './cache-manager.js';

// Estado dos efeitos
let christmasElements = [];
let christmasAnimationId = null;
let fireworksInstance = null;
let fireworksPaused = false;

// Tipos de elementos natalinos
const CHRISTMAS_TYPES = {
  SNOWFLAKE: { symbol: '❄️', weight: 0.6 },
  STAR: { symbol: '⭐', weight: 0.15 },
  SPARKLE: { symbol: '✨', weight: 0.1 },
  BELL: { symbol: '🔔', weight: 0.05 },
  GIFT: { symbol: '🎁', weight: 0.03 },
  TREE: { symbol: '🎄', weight: 0.02 },
  CANDY: { symbol: '🍭', weight: 0.03 },
  HOLLY: { symbol: '🎅', weight: 0.02 }
};



/**
 * Obtém tipo aleatório de elemento natalino
 * @returns {Object} - Configuração do elemento
 */
function getRandomChristmasType() {
  const random = Math.random();
  let cumulative = 0;

  for (const [type, config] of Object.entries(CHRISTMAS_TYPES)) {
    cumulative += config.weight;
    if (random <= cumulative) {
      return { type, ...config };
    }
  }

  return { type: 'SNOWFLAKE', ...CHRISTMAS_TYPES.SNOWFLAKE };
}



/**
 * Cria elemento natalino
 * @returns {Object} - Elemento criado
 */
function createChristmasElement() {
  const elementType = getRandomChristmasType();
  const isEmoji = elementType.symbol.length > 1;

  return {
    x: Math.random() * window.innerWidth,
    y: -20,
    size: isEmoji ? Math.random() * 8 + 12 : Math.random() * 3 + 2,
    speed: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.6 + 0.4,
    drift: Math.random() * 1.5 - 0.75,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 4 - 2,
    symbol: elementType.symbol,
    type: elementType.type,
    isEmoji: isEmoji
  };
}



/**
 * Atualiza elementos natalinos
 */
function updateChristmasElements() {
  const container = document.getElementById('snowContainer');
  if (!container) return;

  container.innerHTML = '';

  christmasElements = christmasElements.filter(element => {
    element.y += element.speed;
    element.x += element.drift;
    element.rotation += element.rotationSpeed;

    // Remove elementos que saíram da tela
    if (element.y > window.innerHeight + 50 || element.x < -50 || element.x > window.innerWidth + 50) {
      return false;
    }

    // Cria elemento visual
    const christmasEl = document.createElement('div');

    if (element.isEmoji) {
      christmasEl.style.cssText = `
        position: absolute;
        left: ${element.x}px;
        top: ${element.y}px;
        font-size: ${element.size}px;
        opacity: ${element.opacity};
        pointer-events: none;
        transform: rotate(${element.rotation}deg);
        user-select: none;
        z-index: 31;
      `;
      christmasEl.textContent = element.symbol;
    } else {
      christmasEl.style.cssText = `
        position: absolute;
        left: ${element.x}px;
        top: ${element.y}px;
        width: ${element.size}px;
        height: ${element.size}px;
        background: white;
        border-radius: 50%;
        opacity: ${element.opacity};
        pointer-events: none;
        transform: rotate(${element.rotation}deg);
        box-shadow: 0 0 ${element.size}px rgba(255, 255, 255, 0.3);
      `;
    }

    container.appendChild(christmasEl);
    return true;
  });

  // Adiciona novos elementos ocasionalmente
  if (Math.random() < 0.25) {
    christmasElements.push(createChristmasElement());
  }

  christmasAnimationId = requestAnimationFrame(updateChristmasElements);
}





/**
 * Inicia efeito natalino
 */
export function startChristmasEffect() {
  const container = document.getElementById('snowContainer');
  if (container) {
    container.classList.remove('hidden');
    christmasElements = [];

    // Inicia com alguns elementos já na tela
    for (let i = 0; i < 30; i++) {
      const element = createChristmasElement();
      element.y = Math.random() * window.innerHeight;
      christmasElements.push(element);
    }

    updateChristmasElements();
    console.log('Christmas effect started');
  }
}

/**
 * Para efeito natalino
 */
export function stopChristmasEffect() {
  const container = document.getElementById('snowContainer');
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }

  if (christmasAnimationId) {
    cancelAnimationFrame(christmasAnimationId);
    christmasAnimationId = null;
  }

  christmasElements = [];
  console.log('Christmas effect stopped');
}

/**
 * Inicia efeito de Ano Novo com Fireworks.js
 */
export function startNewYearEffect() {
  const container = document.getElementById('fireworksContainer');
  if (container && typeof Fireworks !== 'undefined') {
    container.classList.remove('hidden');

    // Cria instância do Fireworks.js
    fireworksInstance = new Fireworks.default(container, {
      autoresize: true,
      opacity: 0.5,
      acceleration: 1.05,
      friction: 0.97,
      gravity: 1.5,
      particles: 50,
      traceLength: 3,
      traceSpeed: 10,
      explosion: 5,
      intensity: 30,
      flickering: 50,
      lineStyle: 'round',
      hue: {
        min: 0,
        max: 360
      },
      delay: {
        min: 30,
        max: 60
      },
      rocketsPoint: {
        min: 50,
        max: 50
      },
      lineWidth: {
        explosion: {
          min: 1,
          max: 3
        },
        trace: {
          min: 1,
          max: 2
        }
      },
      brightness: {
        min: 50,
        max: 80
      },
      decay: {
        min: 0.015,
        max: 0.03
      },
      mouse: {
        click: false,
        move: false,
        max: 1
      }
    });

    fireworksInstance.start();
    fireworksPaused = false;
    console.log('New Year fireworks effect started');
  } else {
    console.error('Fireworks.js library not loaded or container not found');
  }
}

/**
 * Pausa efeito de Ano Novo
 */
export function pauseNewYearEffect() {
  const container = document.getElementById('fireworksContainer');
  if (container && fireworksInstance) {
    container.style.opacity = '0.3';
    fireworksInstance.stop();
    fireworksPaused = true;
    console.log('New Year fireworks effect paused');
  }
}

/**
 * Retoma efeito de Ano Novo
 */
export function resumeNewYearEffect() {
  const container = document.getElementById('fireworksContainer');
  if (container && fireworksInstance && fireworksPaused) {
    container.style.opacity = '1';
    fireworksInstance.start();
    fireworksPaused = false;
    console.log('New Year fireworks effect resumed');
  }
}

/**
 * Para efeito de Ano Novo
 */
export function stopNewYearEffect() {
  const container = document.getElementById('fireworksContainer');
  if (container) {
    container.classList.add('hidden');
    container.style.opacity = '1';
  }

  if (fireworksInstance) {
    fireworksInstance.stop();
    fireworksInstance = null;
  }

  fireworksPaused = false;
  console.log('New Year fireworks effect stopped');
}

/**
 * Atualiza efeito natalino baseado no estado do timer
 * @param {boolean} isRunning - Se o timer está rodando
 */
export function updateChristmasEffectBasedOnTimer(isRunning) {
  const snowEnabled = loadConfig(CACHE_KEYS.SNOW_ENABLED, false);
  const shouldRun = snowEnabled && isRunning;
  const isCurrentlyRunning = !!christmasAnimationId;

  console.log('Christmas effect check:', {
    snowEnabled,
    isRunning,
    shouldRun,
    isCurrentlyRunning
  });

  if (shouldRun && !isCurrentlyRunning) {
    startChristmasEffect();
  } else if (!shouldRun && isCurrentlyRunning) {
    stopChristmasEffect();
  }
}

/**
 * Atualiza efeito de Ano Novo baseado no estado do timer
 * @param {boolean} isRunning - Se o timer está rodando
 */
export function updateNewYearEffectBasedOnTimer(isRunning) {
  const newYearEnabled = loadConfig(CACHE_KEYS.NEW_YEAR_ENABLED, false);

  if (!newYearEnabled) {
    // Se o efeito está desabilitado, para completamente
    if (fireworksInstance) {
      stopNewYearEffect();
    }
    return;
  }

  const isCurrentlyActive = !!fireworksInstance;

  console.log('New Year fireworks effect check:', {
    newYearEnabled,
    isRunning,
    isCurrentlyActive,
    fireworksPaused
  });

  if (newYearEnabled && !isCurrentlyActive && isRunning) {
    // Inicia o efeito se não estiver ativo e o timer estiver rodando
    startNewYearEffect();
  } else if (newYearEnabled && isCurrentlyActive) {
    // Se já está ativo, controla pause/resume baseado no timer
    if (isRunning && fireworksPaused) {
      resumeNewYearEffect();
    } else if (!isRunning && !fireworksPaused) {
      pauseNewYearEffect();
    }
  } else if (newYearEnabled && !isCurrentlyActive && !isRunning) {
    // Se o efeito está habilitado mas o timer não está rodando, não faz nada
    // (aguarda o timer iniciar para ativar o efeito)
    console.log('New Year effect enabled but timer not running - waiting');
  }
}

/**
 * Inicializa toggles dos efeitos
 */
export function initializeEffectToggles() {
  const snowToggle = document.getElementById('snowToggle');
  const newYearToggle = document.getElementById('newYearToggle');

  if (snowToggle) {
    snowToggle.checked = loadConfig(CACHE_KEYS.SNOW_ENABLED, false);
    snowToggle.addEventListener('change', () => {
      saveConfig(CACHE_KEYS.SNOW_ENABLED, snowToggle.checked);
    });
  }

  if (newYearToggle) {
    newYearToggle.checked = loadConfig(CACHE_KEYS.NEW_YEAR_ENABLED, false);
    newYearToggle.addEventListener('change', () => {
      saveConfig(CACHE_KEYS.NEW_YEAR_ENABLED, newYearToggle.checked);
    });
  }
}