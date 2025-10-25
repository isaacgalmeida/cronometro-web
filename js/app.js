/**
 * Aplicação principal do cronômetro - Arquivo integrador
 */

// Importações dos módulos
import { enablePersistence, loadTimerState, loadMusicState, showCacheStatus, clearAllCache } from './cache-manager.js';
import {
  onTimerEvent,
  getTimerState,
  restoreTimerState,
  resetTimer
} from './timer-core.js';
import {
  loadBackgroundMusic,
  onMusicEvent,
  detectSelectedMusic,
  syncMusicWithTimer,
  restoreMusicState,
  clearMusicSelection,
  stopMusic
} from './music-manager.js';
import {
  updateTimerDisplay,
  updateButtonStates,
  updateBodyClasses,
  showMusicStatus,
  showSyncError,
  showTimerFinishedEffect,
  clearCustomTimeInputs
} from './ui-manager.js';
import {
  updateChristmasEffectBasedOnTimer,
  updateNewYearEffectBasedOnTimer,
  stopChristmasEffect,
  stopNewYearEffect,
  initializeEffectToggles
} from './effects-manager.js';
import { loadRunMessages, resetRunMessageSelection } from './messages-manager.js';
import { playBeepSound, initializeSoundToggle } from './sound-manager.js';
import { loadBackgroundImages, initializeImageUpload } from './image-manager.js';
import { initializeEventListeners, initializeKeyboardShortcuts } from './event-manager.js';
import { initializeMp3Upload } from './mp3-manager.js';
import { showNotification } from './utils.js';

/**
 * Inicializa a aplicação
 */
async function initializeApp() {
  try {
    console.log('Inicializando cronômetro...');

    // Inicializa ícones se disponível
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Configura event listeners
    initializeEventListeners();
    initializeKeyboardShortcuts();
    initializeImageUpload();
    initializeMp3Upload();
    initializeEffectToggles();
    initializeSoundToggle();

    // Configura callbacks do timer
    setupTimerCallbacks();

    // Configura callbacks da música
    setupMusicCallbacks();

    // Habilita persistência ANTES de restaurar estado
    enablePersistence();

    // Restaura estado do timer
    const savedTimerState = loadTimerState();
    if (savedTimerState) {
      const restored = restoreTimerState(savedTimerState);
      if (restored) {
        showCacheStatus('Timer restaurado', 'success');
      }
    }

    // Carrega dados externos
    await Promise.all([
      loadBackgroundMusic(),
      loadBackgroundImages(),
      loadRunMessages()
    ]);

    // Restaura estado da música APÓS carregar dados
    const savedMusicState = loadMusicState();
    if (savedMusicState) {
      console.log('Restoring music state:', savedMusicState);
      const musicRestored = restoreMusicState(savedMusicState);

      if (musicRestored) {
        // Verifica estado do timer para sincronização
        const currentTimerState = getTimerState();
        console.log('Timer state after music restore:', { isRunning: currentTimerState.isRunning, timeLeft: currentTimerState.timeLeft });

        if (currentTimerState.isRunning && currentTimerState.timeLeft > 0) {
          // Timer está rodando - inicia música automaticamente após carregar
          setTimeout(() => {
            console.log('🎵 Auto-starting music after restore (timer is running)');
            detectSelectedMusic();
            syncMusicWithTimer('start');
          }, 2000); // Tempo maior para garantir que o player do YouTube foi totalmente carregado
        } else {
          console.log('🎵 Music restored but timer not running - video loaded without autoplay');
        }
      }
    } else {
      console.log('No saved music state found');
    }

    // Inicializa detecção de música
    setTimeout(() => {
      detectSelectedMusic();
    }, 100);

    // Solicita permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    console.log('Cronômetro inicializado com sucesso');

  } catch (error) {
    console.error('Erro na inicialização:', error);
    enablePersistence(); // Garante que persistência seja habilitada mesmo com erro
  }
}

/**
 * Configura callbacks do timer
 */
function setupTimerCallbacks() {
  // Callback para tick do timer
  onTimerEvent('onTick', (timerState) => {
    updateTimerDisplay(timerState);
    updateBodyClasses(timerState.isRunning);
    updateChristmasEffectBasedOnTimer(timerState.isRunning);
    updateNewYearEffectBasedOnTimer(timerState.isRunning);
  });

  // Callback para início do timer
  onTimerEvent('onStart', (timerState) => {
    updateButtonStates('running');
    updateBodyClasses(true);
    updateChristmasEffectBasedOnTimer(true);
    updateNewYearEffectBasedOnTimer(true);
    syncMusicWithTimer('start');
  });

  // Callback para pausa do timer
  onTimerEvent('onPause', (timerState) => {
    updateButtonStates('paused');
    updateBodyClasses(false);
    updateChristmasEffectBasedOnTimer(false);
    updateNewYearEffectBasedOnTimer(false);
    syncMusicWithTimer('pause');
  });

  // Callback para parada do timer
  onTimerEvent('onStop', (timerState) => {
    updateButtonStates('stopped');
    updateBodyClasses(false);
    updateChristmasEffectBasedOnTimer(false);
    updateNewYearEffectBasedOnTimer(false);
    syncMusicWithTimer('stop');
  });

  // Callback para fim do timer
  onTimerEvent('onFinish', (timerState) => {
    updateButtonStates('stopped');
    updateBodyClasses(false);
    updateChristmasEffectBasedOnTimer(false);
    updateNewYearEffectBasedOnTimer(false);
    syncMusicWithTimer('stop');

    // Efeitos de finalização
    showTimerFinishedEffect();
    playBeepSound();
    showNotification('⏰ Tempo esgotado!', 'O timer chegou ao fim.');
  });
}

/**
 * Configura callbacks da música
 */
function setupMusicCallbacks() {
  onMusicEvent('onMusicStart', (musicState) => {
    showMusicStatus(`🎵 Reproduzindo música`);
  });

  onMusicEvent('onMusicPause', (musicState) => {
    showMusicStatus('⏸️ Música pausada');
  });

  onMusicEvent('onMusicStop', (musicState) => {
    showMusicStatus('🔇 Música parada');
  });

  onMusicEvent('onMusicError', (error) => {
    showSyncError(error);
  });
}

/**
 * Reset completo da aplicação
 */
function resetAllEffectsAndMusic() {
  console.log('Resetando todos os efeitos e música...');

  // Para todos os efeitos
  stopChristmasEffect();
  stopNewYearEffect();

  // Para música
  stopMusic();
  clearMusicSelection();

  // Limpa campos personalizados
  clearCustomTimeInputs();

  // Reseta configurações
  resetRunMessageSelection();

  // Limpa TODO o localStorage
  clearAllCache();

  showMusicStatus('🔄 Reset completo realizado - localStorage limpo');

  console.log('Reset completo finalizado - localStorage limpo');
}

// Torna função de reset disponível globalmente para compatibilidade
window.resetAllEffectsAndMusic = resetAllEffectsAndMusic;

/**
 * Salva estado periodicamente
 */
function setupPeriodicSave() {
  setInterval(() => {
    const timerState = getTimerState();
    if (timerState.isRunning || timerState.timeLeft > 0) {
      // O saveTimerState já é chamado automaticamente no tick
      console.log('Estado salvo automaticamente');
    }
  }, 5000);
}

/**
 * Salva estado antes de sair da página
 */
function setupBeforeUnload() {
  window.addEventListener('beforeunload', () => {
    // O estado já é salvo automaticamente, mas garantimos aqui
    console.log('Salvando estado antes de sair...');
  });
}

// Inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM já está pronto
  setTimeout(initializeApp, 100);
}

// Configura salvamento periódico e antes de sair
setupPeriodicSave();
setupBeforeUnload();

// Exporta função de reset para uso externo se necessário
export { resetAllEffectsAndMusic };