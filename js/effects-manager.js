/**
 * Gerenciador de efeitos visuais (neve, ano novo, etc.)
 */

import { CACHE_KEYS, loadConfig, saveConfig } from './cache-manager.js';

// Estado dos efeitos
let christmasElements = [];
let christmasAnimationId = null;
let newYearElements = [];
let newYearAnimationId = null;

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

// Tipos de elementos de Ano Novo
const NEW_YEAR_TYPES = {
  FIREWORK_RED: { symbol: '🎆', weight: 0.25, color: '#FF4444' },
  FIREWORK_BLUE: { symbol: '🎇', weight: 0.25, color: '#4444FF' },
  FIREWORK_GOLD: { symbol: '🎆', weight: 0.2, color: '#FFD700' },
  FIREWORK_GREEN: { symbol: '🎇', weight: 0.15, color: '#44FF44' },
  FIREWORK_PURPLE: { symbol: '🎆', weight: 0.1, color: '#AA44FF' },
  SPARKLE_EXPLOSION: { symbol: '✨', weight: 0.05, color: '#FFFFFF' }
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
 * Obtém tipo aleatório de elemento de Ano Novo
 * @returns {Object} - Configuração do elemento
 */
function getRandomNewYearType() {
  const random = Math.random();
  let cumulative = 0;

  for (const [type, config] of Object.entries(NEW_YEAR_TYPES)) {
    cumulative += config.weight;
    if (random <= cumulative) {
      return { type, ...config };
    }
  }

  return { type: 'FIREWORK_GOLD', ...NEW_YEAR_TYPES.FIREWORK_GOLD };
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
 * Cria elemento de Ano Novo
 * @returns {Object} - Elemento criado
 */
function createNewYearElement() {
  const elementType = getRandomNewYearType();
  const isEmoji = elementType.symbol.length > 1;
  const isFirework = elementType.type.includes('FIREWORK');

  return {
    x: Math.random() * window.innerWidth,
    y: isFirework ? window.innerHeight + 20 : -30,
    size: isEmoji ? Math.random() * 12 + 18 : Math.random() * 5 + 4,
    speed: isFirework ? Math.random() * 4 + 3 : Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
    drift: Math.random() * 1 - 0.5,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 8 - 4,
    symbol: elementType.symbol,
    color: elementType.color,
    type: elementType.type,
    isEmoji: isEmoji,
    isFirework: isFirework,
    fireworkPhase: 0,
    explosionTime: 0,
    targetHeight: Math.random() * (window.innerHeight * 0.4) + (window.innerHeight * 0.1)
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
 * Atualiza elementos de Ano Novo
 */
function updateNewYearElements() {
  const container = document.getElementById('newYearContainer');
  if (!container) return;

  container.innerHTML = '';

  newYearElements = newYearElements.filter(element => {
    // Lógica especial para fogos de artifício
    if (element.isFirework) {
      if (element.fireworkPhase === 0) {
        element.y -= element.speed;
        element.x += element.drift * 0.3;

        if (element.y <= element.targetHeight) {
          element.fireworkPhase = 1;
          element.explosionTime = 0;
          createFireworkExplosion(element.x, element.y, element.color);
          return false;
        }
      }
    } else if (element.type === 'EXPLOSION_PARTICLE' || element.type === 'EXPLOSION_CENTER') {
      element.life--;
      if (element.life <= 0) return false;

      element.x += element.drift;
      element.y += element.verticalSpeed;
      element.verticalSpeed += 0.1;
      element.drift *= 0.98;
      element.rotation += element.rotationSpeed;
      element.opacity = Math.max(0, element.life / 60);
    } else {
      element.y += element.speed;
      element.x += element.drift;
      element.rotation += element.rotationSpeed;

      if (element.type === 'SPARKLE_EXPLOSION') {
        element.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.4;
      }
    }

    // Remove elementos que saíram da tela
    if (element.y > window.innerHeight + 50 || element.x < -50 || element.x > window.innerWidth + 50) {
      return false;
    }

    // Cria elemento visual
    const newYearEl = document.createElement('div');

    if (element.isEmoji) {
      newYearEl.style.cssText = `
        position: absolute;
        left: ${element.x}px;
        top: ${element.y}px;
        font-size: ${element.size}px;
        opacity: ${element.opacity};
        pointer-events: none;
        transform: rotate(${element.rotation}deg);
        user-select: none;
        z-index: 32;
        filter: drop-shadow(0 0 ${element.size / 4}px ${element.color});
      `;
      newYearEl.textContent = element.symbol;
    } else {
      newYearEl.style.cssText = `
        position: absolute;
        left: ${element.x}px;
        top: ${element.y}px;
        width: ${element.size}px;
        height: ${element.size}px;
        background: ${element.color};
        opacity: ${element.opacity};
        pointer-events: none;
        transform: rotate(${element.rotation}deg);
        border-radius: 2px;
        box-shadow: 0 0 ${element.size}px ${element.color};
      `;
    }

    container.appendChild(newYearEl);
    return true;
  });

  // Adiciona novos fogos de artifício
  if (Math.random() < 0.15) {
    newYearElements.push(createNewYearElement());
  }

  newYearAnimationId = requestAnimationFrame(updateNewYearElements);
}

/**
 * Cria explosão de fogo de artifício
 * @param {number} x - Posição X
 * @param {number} y - Posição Y
 * @param {string} color - Cor da explosão
 */
function createFireworkExplosion(x, y, color) {
  const particleCount = 15 + Math.random() * 10;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
    const speed = Math.random() * 3 + 2;

    newYearElements.push({
      x: x,
      y: y,
      size: Math.random() * 4 + 2,
      opacity: 1,
      drift: Math.cos(angle) * speed,
      verticalSpeed: Math.sin(angle) * speed,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
      color: color,
      type: 'EXPLOSION_PARTICLE',
      isEmoji: false,
      life: 60 + Math.random() * 30
    });
  }
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
 * Inicia efeito de Ano Novo
 */
export function startNewYearEffect() {
  const container = document.getElementById('newYearContainer');
  if (container) {
    container.classList.remove('hidden');
    newYearElements = [];

    // Inicia com alguns elementos
    for (let i = 0; i < 20; i++) {
      const element = createNewYearElement();
      if (!element.isFirework) {
        element.y = Math.random() * window.innerHeight;
      }
      newYearElements.push(element);
    }

    updateNewYearElements();
    console.log('New Year effect started');
  }
}

/**
 * Para efeito de Ano Novo
 */
export function stopNewYearEffect() {
  const container = document.getElementById('newYearContainer');
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }

  if (newYearAnimationId) {
    cancelAnimationFrame(newYearAnimationId);
    newYearAnimationId = null;
  }

  newYearElements = [];
  console.log('New Year effect stopped');
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
  const shouldRun = newYearEnabled && isRunning;
  const isCurrentlyRunning = !!newYearAnimationId;

  console.log('New Year effect check:', {
    newYearEnabled,
    isRunning,
    shouldRun,
    isCurrentlyRunning
  });

  if (shouldRun && !isCurrentlyRunning) {
    startNewYearEffect();
  } else if (!shouldRun && isCurrentlyRunning) {
    stopNewYearEffect();
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