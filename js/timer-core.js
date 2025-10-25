/**
 * Núcleo do cronômetro - lógica principal do timer
 */

import { formatTime, showNotification } from './utils.js';
import { saveTimerState, clearTimerCache, clearAllCache } from './cache-manager.js';

// Estado do timer
let countdown = null;
let timeLeft = 0; // segundos
let isRunning = false;
let startTime = null;
let pausedTime = 0;
let endTimestamp = null; // alvo absoluto (ms desde epoch)

// Callbacks para eventos do timer
const callbacks = {
  onTick: [],
  onStart: [],
  onPause: [],
  onStop: [],
  onFinish: []
};

/**
 * Registra callback para eventos do timer
 * @param {string} event - Nome do evento
 * @param {Function} callback - Função callback
 */
export function onTimerEvent(event, callback) {
  if (callbacks[event]) {
    callbacks[event].push(callback);
  }
}

/**
 * Executa callbacks de um evento
 * @param {string} event - Nome do evento
 * @param {any} data - Dados do evento
 */
function triggerEvent(event, data = null) {
  if (callbacks[event]) {
    callbacks[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erro no callback ${event}:`, error);
      }
    });
  }
}

/**
 * Obtém estado atual do timer
 * @returns {Object} - Estado do timer
 */
export function getTimerState() {
  return {
    timeLeft,
    isRunning,
    startTime,
    pausedTime,
    endTimestamp,
    formattedTime: formatTime(timeLeft)
  };
}

/**
 * Define o tempo restante do timer
 * @param {number} seconds - Segundos para definir
 */
export function setTimeLeft(seconds) {
  timeLeft = Math.max(0, Math.round(seconds));
  triggerEvent('onTick', getTimerState());
}

/**
 * Recalcula tempo restante baseado no timestamp final
 */
function recomputeTimeLeftFromEnd() {
  if (endTimestamp && isRunning) {
    const now = Date.now();
    timeLeft = Math.max(0, Math.round((endTimestamp - now) / 1000));
  }
}

/**
 * Função de tick do timer
 */
function tick() {
  recomputeTimeLeftFromEnd();

  const state = getTimerState();
  triggerEvent('onTick', state);

  // Salva estado automaticamente
  saveTimerState(state);

  if (timeLeft <= 0) {
    stopTimer();
    triggerEvent('onFinish', state);
    showNotification('⏰ Tempo esgotado!', 'O timer chegou ao fim.');
  }
}

/**
 * Inicia o timer com tempo específico
 * @param {number} minutes - Minutos para o timer
 */
export function startTimer(minutes) {
  clearInterval(countdown);
  timeLeft = Math.max(0, Math.round(minutes * 60));
  isRunning = true;
  startTime = Date.now();
  pausedTime = 0;
  endTimestamp = startTime + timeLeft * 1000;

  countdown = setInterval(tick, 1000);

  const state = getTimerState();
  // Salva estado imediatamente após mudança
  saveTimerState(state);
  triggerEvent('onStart', state);
  triggerEvent('onTick', state);
}

/**
 * Inicia o timer com o tempo atual
 */
export function startCurrentTimer() {
  if (timeLeft > 0) {
    clearInterval(countdown);
    isRunning = true;
    startTime = Date.now() - pausedTime;
    endTimestamp = Date.now() + timeLeft * 1000;

    countdown = setInterval(tick, 1000);

    const state = getTimerState();
    // Salva estado imediatamente após mudança
    saveTimerState(state);
    triggerEvent('onStart', state);
    triggerEvent('onTick', state);
  } else {
    showNotification('⚠️ Tempo não definido', 'Defina um tempo primeiro usando os botões de minutos!');
  }
}

/**
 * Pausa o timer
 */
export function pauseTimer() {
  clearInterval(countdown);
  recomputeTimeLeftFromEnd();
  isRunning = false;

  if (startTime) {
    pausedTime = Date.now() - startTime;
  }

  const state = getTimerState();
  // Salva estado imediatamente após mudança
  saveTimerState(state);
  triggerEvent('onPause', state);
  triggerEvent('onTick', state);
}

/**
 * Para o timer completamente
 */
export function stopTimer() {
  clearInterval(countdown);
  isRunning = false;

  const state = getTimerState();
  triggerEvent('onStop', state);
}

/**
 * Reseta apenas o estado do timer (não limpa configurações)
 */
export function resetTimerOnly() {
  clearInterval(countdown);
  isRunning = false;
  timeLeft = 0;
  startTime = null;
  pausedTime = 0;
  endTimestamp = null;

  const state = getTimerState();
  triggerEvent('onStop', state);
  triggerEvent('onTick', state);

  // Limpa apenas o estado do timer (mantém outras configurações)
  clearTimerCache();

  console.log('Timer resetado (apenas estado do cronômetro)');
}

/**
 * Reseta o timer completo (função legada para compatibilidade)
 */
export async function resetTimer() {
  clearInterval(countdown);
  isRunning = false;
  timeLeft = 0;
  startTime = null;
  pausedTime = 0;
  endTimestamp = null;

  const state = getTimerState();
  triggerEvent('onStop', state);
  triggerEvent('onTick', state);

  // Para reset completo, limpa TODO o localStorage e IndexedDB
  await clearAllCache();

  // Refresh automático da página após 3 segundos
  setTimeout(() => {
    console.log('Recarregando página após reset completo...');
    window.location.reload();
  }, 3000);
}

/**
 * Ajusta o tempo do timer
 * @param {number} deltaMinutes - Minutos para adicionar/remover (pode ser negativo)
 */
export function adjustTimer(deltaMinutes) {
  const deltaSecs = Math.round(deltaMinutes * 60);

  if (isRunning) {
    if (!endTimestamp) {
      endTimestamp = Date.now() + timeLeft * 1000;
    }
    endTimestamp = Math.max(Date.now(), endTimestamp + deltaSecs * 1000);
    recomputeTimeLeftFromEnd();
  } else {
    timeLeft = Math.max(0, timeLeft + deltaSecs);
  }

  const state = getTimerState();
  triggerEvent('onTick', state);
}

/**
 * Restaura estado do timer
 * @param {Object} savedState - Estado salvo do timer
 */
export function restoreTimerState(savedState) {
  if (!savedState) return false;

  timeLeft = savedState.timeLeft;
  isRunning = savedState.isRunning;
  startTime = savedState.startTime;
  pausedTime = savedState.pausedTime;
  endTimestamp = savedState.endTimestamp || (isRunning ? Date.now() + timeLeft * 1000 : null);

  if (isRunning && timeLeft > 0) {
    countdown = setInterval(tick, 1000);
    triggerEvent('onStart', getTimerState());
  }

  triggerEvent('onTick', getTimerState());
  return true;
}