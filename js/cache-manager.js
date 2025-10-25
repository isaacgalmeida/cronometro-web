/**
 * Gerenciador de cache e persistência de dados
 */

// Chaves do localStorage
export const CACHE_KEYS = {
  TIMER_STATE: 'cronometro_timer_state',
  TIMER_CONFIG: 'cronometro_timer_config',
  MUSIC_STATE: 'cronometro_music_state',
  RUN_TEXT_SELECTED: 'cronometro_run_text',
  RUN_TEXT_CUSTOMS: 'cronometro_run_text_customs',
  SNOW_ENABLED: 'cronometro_snow_enabled',
  SOUND_ENABLED: 'cronometro_sound_enabled',
  NEW_YEAR_ENABLED: 'cronometro_newyear_enabled',
  CUSTOM_IMAGE: 'cronometro_custom_background_image'
};

// Controle de persistência
let canPersist = false;

/**
 * Habilita a persistência de dados
 */
export function enablePersistence() {
  canPersist = true;
}

/**
 * Verifica se a persistência está habilitada
 * @returns {boolean}
 */
export function isPersistenceEnabled() {
  return canPersist;
}

/**
 * Salva estado do timer no localStorage
 * @param {Object} timerState - Estado do timer
 */
export function saveTimerState(timerState) {
  if (!canPersist) {
    console.log('Timer state not saved: persistence disabled');
    return;
  }

  // Só não salva se o timer está completamente resetado (sem tempo e sem histórico)
  if (timerState.timeLeft <= 0 && !timerState.isRunning && !timerState.startTime && !timerState.pausedTime) {
    console.log('Timer state not saved: timer is completely reset');
    return;
  }

  const state = {
    ...timerState,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(CACHE_KEYS.TIMER_STATE, JSON.stringify(state));
    console.log('Timer state saved:', {
      isRunning: state.isRunning,
      timeLeft: state.timeLeft,
      startTime: state.startTime,
      pausedTime: state.pausedTime
    });
  } catch (error) {
    console.error('Erro ao salvar timer:', error);
  }
}

/**
 * Carrega estado do timer do localStorage
 * @returns {Object|null} - Estado do timer ou null
 */
export function loadTimerState() {
  try {
    const saved = localStorage.getItem(CACHE_KEYS.TIMER_STATE);
    if (!saved) return null;

    const state = JSON.parse(saved);
    const now = Date.now();

    if (!state.timestamp || typeof state.timeLeft !== 'number') {
      clearTimerCache();
      return null;
    }

    const hasEnd = typeof state.endTimestamp === 'number' && state.endTimestamp > 0;

    if (state.isRunning && hasEnd) {
      const computed = Math.max(0, Math.round((state.endTimestamp - now) / 1000));
      if (computed <= 0) {
        clearTimerCache();
        return null;
      }
      return {
        ...state,
        timeLeft: computed,
        isRunning: true,
        startTime: now - (state.timeLeft - computed) * 1000,
        pausedTime: 0
      };
    }

    if (state.isRunning && state.timeLeft > 0) {
      const elapsedTime = Math.floor((now - state.timestamp) / 1000);
      const newTimeLeft = Math.max(0, state.timeLeft - elapsedTime);

      if (newTimeLeft <= 0) {
        clearTimerCache();
        return null;
      }

      return {
        ...state,
        timeLeft: newTimeLeft,
        isRunning: true,
        startTime: now - elapsedTime * 1000,
        pausedTime: 0,
        endTimestamp: now + newTimeLeft * 1000
      };
    }

    return {
      ...state,
      isRunning: false,
      endTimestamp: hasEnd ? state.endTimestamp : null
    };
  } catch (error) {
    console.error('Erro ao carregar timer:', error);
    clearTimerCache();
    return null;
  }
}

/**
 * Limpa cache do timer
 */
export function clearTimerCache() {
  localStorage.removeItem(CACHE_KEYS.TIMER_STATE);
}

/**
 * Salva estado da música
 * @param {Object} musicState - Estado da música
 */
export function saveMusicState(musicState) {
  if (!canPersist) return;

  try {
    const state = {
      currentUrl: musicState.currentUrl,
      isSelected: musicState.isSelected,
      timestamp: Date.now()
    };

    if (musicState.isSelected && musicState.currentUrl) {
      localStorage.setItem(CACHE_KEYS.MUSIC_STATE, JSON.stringify(state));
      console.log('Music state saved:', state);
    }
  } catch (error) {
    console.error('Erro ao salvar estado da música:', error);
  }
}

/**
 * Carrega estado da música
 * @returns {Object|null} - Estado da música ou null
 */
export function loadMusicState() {
  try {
    const saved = localStorage.getItem(CACHE_KEYS.MUSIC_STATE);
    if (!saved) return null;

    const state = JSON.parse(saved);

    if (state.currentUrl && state.isSelected) {
      console.log('Music state loaded:', state);
      return state;
    }
  } catch (error) {
    console.error('Erro ao carregar estado da música:', error);
    clearMusicCache();
  }

  return null;
}

/**
 * Limpa cache da música
 */
export function clearMusicCache() {
  localStorage.removeItem(CACHE_KEYS.MUSIC_STATE);
}

/**
 * Salva configuração no localStorage
 * @param {string} key - Chave da configuração
 * @param {any} value - Valor a ser salvo
 */
export function saveConfig(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Erro ao salvar configuração ${key}:`, error);
  }
}

/**
 * Carrega configuração do localStorage
 * @param {string} key - Chave da configuração
 * @param {any} defaultValue - Valor padrão se não encontrar
 * @returns {any} - Valor da configuração
 */
export function loadConfig(key, defaultValue = null) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Erro ao carregar configuração ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Remove configuração do localStorage
 * @param {string} key - Chave da configuração
 */
export function removeConfig(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Erro ao remover configuração ${key}:`, error);
  }
}

/**
 * Limpa todo o localStorage relacionado ao cronômetro
 */
export function clearAllCache() {
  try {
    // Remove todas as chaves específicas do cronômetro
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // Remove também chaves que podem não estar no CACHE_KEYS
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cronometro_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('Todo o localStorage do cronômetro foi limpo');
    showCacheStatus('🗑️ Todo o localStorage foi limpo', 'info');
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
    showCacheStatus('❌ Erro ao limpar localStorage', 'error');
  }
}

/**
 * Mostra status do cache na interface
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo da mensagem (success, error, info)
 */
export function showCacheStatus(message, type = 'success') {
  let indicator = document.querySelector('.cache-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'cache-indicator';
    document.body.appendChild(indicator);
  }

  indicator.textContent = message;
  indicator.className = `cache-indicator show ${type}`;

  setTimeout(() => {
    indicator.classList.remove('show');
  }, 2000);
}