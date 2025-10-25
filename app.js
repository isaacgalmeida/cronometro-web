// app.js (persistência robusta com endTimestamp + gate canPersist + música via music.json + mensagens via messages.json + custom via localStorage + limpar custom)
let countdown = null;
let timeLeft = 0; // segundos
let isRunning = false;
let startTime = null;
let pausedTime = 0;
let endTimestamp = null; // alvo absoluto (ms desde epoch)

// Só persistimos depois da restauração inicial
let canPersist = false;

const timerEl = document.getElementById('timer');
const controls = document.querySelector('.timer-controls');
const presetMusic = document.getElementById('presetMusic');
const youtubeLink = document.getElementById('youtubeLink');
const playCustom = document.getElementById('playCustom');
const musicPlayer = document.getElementById('musicPlayer');

// Variáveis para dados JSON
let backgroundMusic = [];
let backgroundImages = [];

// Mensagens personalizáveis (run-text)
let runMessages = [];

// -------------------- Music State Manager --------------------
const musicState = {
  isSelected: false,        // há música selecionada?
  isPlaying: false,         // música está tocando?
  currentUrl: '',           // URL da música atual
  syncEnabled: true,        // sincronização ativa?
  lastAction: 'manual'      // 'manual' | 'timer-sync'
};

function getMusicState() {
  return { ...musicState };
}

function setMusicSelected(url) {
  musicState.isSelected = !!url;
  musicState.currentUrl = url || '';
  console.log('Music selected:', { url, isSelected: musicState.isSelected });

  // Salva o estado da música automaticamente
  saveMusicState();
}

function setMusicPlaying(playing) {
  musicState.isPlaying = !!playing;
  console.log('Music playing state:', musicState.isPlaying);
}

function isMusicAvailableForSync() {
  return musicState.isSelected && musicState.currentUrl && musicState.syncEnabled;
}

function detectSelectedMusic() {
  // Verifica se há MP3 personalizado primeiro
  if (typeof mp3Data !== 'undefined' && mp3Data) {
    setMusicSelected('mp3://custom');
    return 'mp3://custom';
  }

  // Verifica música preset selecionada
  const presetSelect = document.getElementById('presetMusic');
  if (presetSelect && presetSelect.value) {
    setMusicSelected(presetSelect.value);
    return presetSelect.value;
  }

  // Verifica URL customizada válida
  const customInput = document.getElementById('youtubeLink');
  if (customInput && customInput.value.trim()) {
    const url = customInput.value.trim();
    if (isValidYouTubeUrl(url)) {
      setMusicSelected(url);
      return url;
    }
  }

  // Nenhuma música válida encontrada
  setMusicSelected('');
  return '';
}

function isValidYouTubeUrl(url) {
  if (!url) return false;
  const videoId = extractVideoId(url);
  return !!videoId;
}

function checkMusicAvailability() {
  const selectedUrl = detectSelectedMusic();
  const isAvailable = !!selectedUrl;

  console.log('Music availability check:', {
    selectedUrl,
    isAvailable,
    syncEnabled: musicState.syncEnabled
  });

  return isAvailable;
}

// Sistema de Cache
const CACHE_KEYS = {
  TIMER_STATE: 'cronometro_timer_state',
  TIMER_CONFIG: 'cronometro_timer_config',
  MUSIC_STATE: 'cronometro_music_state',
  RUN_TEXT_SELECTED: 'cronometro_run_text',
  RUN_TEXT_CUSTOMS: 'cronometro_run_text_customs' // lista de mensagens personalizadas
};

// -------------------- Cache do Timer --------------------
function saveTimerState() {
  if (!canPersist) return; // ainda inicializando
  if (timeLeft <= 0 && !isRunning) return; // não salva estado "vazio"

  const state = {
    timeLeft,
    isRunning,
    startTime,
    pausedTime,
    endTimestamp,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(CACHE_KEYS.TIMER_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Erro ao salvar timer:', error);
  }
}

function loadTimerState() {
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

    // pausado ou parado
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

function clearTimerCache() {
  localStorage.removeItem(CACHE_KEYS.TIMER_STATE);
}

// -------------------- Cache da Música --------------------
function saveMusicState() {
  if (!canPersist) return; // ainda inicializando

  try {
    const state = {
      currentUrl: musicState.currentUrl,
      isSelected: musicState.isSelected,
      timestamp: Date.now()
    };

    // Só salva se há música selecionada
    if (musicState.isSelected && musicState.currentUrl) {
      localStorage.setItem(CACHE_KEYS.MUSIC_STATE, JSON.stringify(state));
      console.log('Music state saved:', state);
    }
  } catch (error) {
    console.error('Erro ao salvar estado da música:', error);
  }
}

function loadMusicState() {
  try {
    const saved = localStorage.getItem(CACHE_KEYS.MUSIC_STATE);
    if (!saved) return null;

    const state = JSON.parse(saved);

    if (state.currentUrl && state.isSelected) {
      // Restaura a seleção da música
      setMusicSelected(state.currentUrl);

      // Aplica a seleção na interface
      applyMusicSelectionToUI(state.currentUrl);

      console.log('Music state loaded:', state);
      return true; // Retorna true quando conseguiu restaurar
    }
  } catch (error) {
    console.error('Erro ao carregar estado da música:', error);
    clearMusicCache();
  }

  return false; // Retorna false quando não conseguiu restaurar
}

function clearMusicCache() {
  localStorage.removeItem(CACHE_KEYS.MUSIC_STATE);
}

function applyMusicSelectionToUI(url) {
  console.log('Applying music selection to UI:', url);

  // Aplica a seleção no dropdown de música preset
  const presetSelect = document.getElementById('presetMusic');
  if (presetSelect) {
    // Verifica se a URL está no dropdown
    const option = Array.from(presetSelect.options).find(opt => opt.value === url);
    if (option) {
      presetSelect.value = url;
      console.log('Music applied to preset dropdown');
      return;
    }
  }

  // Se não está no dropdown, aplica no campo customizado
  const customInput = document.getElementById('youtubeLink');
  if (customInput && url && url.startsWith('http')) {
    customInput.value = url;
    console.log('Music applied to custom input');
  }
}

function showCacheStatus(message, type = 'success') {
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

// -------------------- Timer UI/Fluxo --------------------
function updateDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const statusEl = document.getElementById('timer-status');
  if (statusEl) {
    if (isRunning) statusEl.textContent = '';
    else if (timeLeft > 0) statusEl.textContent = 'Timer pausado';
    else statusEl.textContent = 'Defina um tempo para começar';
  }

  // Mostra/esconde o aviso divertido DURANTE execução
  const runFun = document.getElementById('run-fun');
  if (runFun) {
    if (isRunning && timeLeft > 0) runFun.classList.remove('hidden');
    else runFun.classList.add('hidden');
  }

  // Atualiza status de sincronização
  updateSyncStatusDisplay();

  saveTimerState();
}

function recomputeTimeLeftFromEnd() {
  if (endTimestamp && isRunning) {
    const now = Date.now();
    timeLeft = Math.max(0, Math.round((endTimestamp - now) / 1000));
  }
}

function tick() {
  recomputeTimeLeftFromEnd();
  updateDisplay();

  if (timeLeft <= 0) {
    clearInterval(countdown);
    isRunning = false;
    updateButtonStates('stopped');
    clearTimerCache();
    endTimestamp = null;

    // Atualiza efeito natalino baseado no estado do timer
    updateChristmasEffectBasedOnTimer();

    // Sincronizar música quando timer termina
    syncMusicWithTimer('stop');

    // Mensagem no status
    const statusEl = document.getElementById('timer-status');
    if (statusEl) {
      statusEl.textContent = '⏰ Tempo esgotado!';
    }

    // Toca alarme se habilitado
    const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== 'false';
    if (soundEnabled) {
      playBeepSound();

      // Adiciona efeito visual de alarme
      const timerEl = document.getElementById('timer');
      if (timerEl) {
        timerEl.classList.add('timer-finished');
        setTimeout(() => {
          timerEl.classList.remove('timer-finished');
        }, 5000); // Remove após 5 segundos (duração do alarme)
      }
    }

    showNotification('⏰ Tempo esgotado!', 'O timer chegou ao fim.');
  }
}

function startTimer(min) {
  clearInterval(countdown);
  timeLeft = Math.max(0, Math.round(min * 60));
  isRunning = true;
  startTime = Date.now();
  pausedTime = 0;
  endTimestamp = startTime + timeLeft * 1000;

  updateDisplay();
  countdown = setInterval(tick, 1000);
  updateButtonStates('running');

  document.body.classList.add('timer-running');

  // Atualiza efeito natalino baseado no estado do timer
  updateChristmasEffectBasedOnTimer();

  // Re-habilita sync e sincroniza música quando timer inicia
  reEnableSync();
  syncMusicWithTimer('start');
}

function adjustTimer(delta) {
  const deltaSecs = Math.round(delta * 60);

  if (isRunning) {
    if (!endTimestamp) endTimestamp = Date.now() + timeLeft * 1000;
    endTimestamp = Math.max(Date.now(), endTimestamp + deltaSecs * 1000);
    recomputeTimeLeftFromEnd();
  } else {
    timeLeft = Math.max(0, timeLeft + deltaSecs);
  }

  updateDisplay();
}

function startCurrentTimer() {
  if (timeLeft > 0) {
    clearInterval(countdown);
    isRunning = true;
    startTime = Date.now() - pausedTime;
    endTimestamp = Date.now() + timeLeft * 1000;

    countdown = setInterval(tick, 1000);
    updateButtonStates('running');
    document.body.classList.add('timer-running');
    updateDisplay();

    // Atualiza efeito natalino baseado no estado do timer
    updateChristmasEffectBasedOnTimer();

    // Re-habilita sync e sincroniza música quando timer atual inicia
    reEnableSync();
    syncMusicWithTimer('start');
  } else {
    showNotification('⚠️ Tempo não definido', 'Defina um tempo primeiro usando os botões de minutos!');
  }
}

function pauseTimer() {
  clearInterval(countdown);
  recomputeTimeLeftFromEnd();
  isRunning = false;
  if (startTime) pausedTime = Date.now() - startTime;

  updateButtonStates('paused');
  document.body.classList.remove('timer-running');
  updateDisplay();

  // Atualiza efeito natalino baseado no estado do timer
  updateChristmasEffectBasedOnTimer();

  // Sincronizar música quando timer pausa
  syncMusicWithTimer('pause');
}

function resetTimer() {
  clearInterval(countdown);
  isRunning = false;
  timeLeft = 0;
  startTime = null;
  pausedTime = 0;
  endTimestamp = null;

  updateDisplay();
  updateButtonStates('stopped');
  document.body.classList.remove('timer-running');
  clearTimerCache();

  // Atualiza efeito natalino baseado no estado do timer
  updateChristmasEffectBasedOnTimer();

  // Sincronizar música quando timer reseta
  syncMusicWithTimer('reset');
}

function updateButtonStates(state) {
  const startBtn = document.querySelector('[data-action="start"]');
  const pauseBtn = document.querySelector('[data-action="pause"]');

  if (startBtn && pauseBtn) {
    if (state === 'running') {
      startBtn.classList.add('hidden');
      pauseBtn.classList.remove('hidden');
    } else {
      startBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
    }
  } else {
    console.error('Botões não encontrados:', { startBtn: !!startBtn, pauseBtn: !!pauseBtn });
  }
}

function showNotification(title, message) {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏱️</text></svg>'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body: message });
        }
      });
    }
  }
  // sem alert() para não interromper a tela
}

// -------------------- YouTube Player API --------------------
let youtubePlayer = null;
let isYouTubeAPIReady = false;

// Função chamada automaticamente quando a API do YouTube está pronta
function onYouTubeIframeAPIReady() {
  isYouTubeAPIReady = true;
  console.log('YouTube API ready');
}

// Torna a função disponível globalmente para a API do YouTube
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function createYouTubePlayer(videoId) {
  return new Promise((resolve, reject) => {
    try {
      if (youtubePlayer) {
        youtubePlayer.destroy();
      }

      youtubePlayer = new YT.Player('musicPlayer', {
        height: '200',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: videoId,
          controls: 1,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady: (event) => {
            console.log('YouTube player ready');
            resolve(event.target);
          },
          onStateChange: (event) => {
            handleYouTubeStateChange(event);
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            reject(new Error(`YouTube player error: ${event.data}`));
          }
        }
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
      reject(error);
    }
  });
}

function handleYouTubeStateChange(event) {
  const state = event.data;

  // YT.PlayerState constants: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
  switch (state) {
    case YT.PlayerState.PLAYING:
      setMusicPlaying(true);
      break;
    case YT.PlayerState.PAUSED:
    case YT.PlayerState.ENDED:
      setMusicPlaying(false);
      break;
  }
}

// -------------------- Eventos / Música --------------------
function initializeEventListeners() {
  const controls = document.querySelector('.timer-controls');
  if (controls) {
    controls.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'quick') return startTimer(Number(btn.dataset.min));
      if (action === 'adjust') return adjustTimer(Number(btn.dataset.min));
      if (action === 'start') return startCurrentTimer();
      if (action === 'pause') return pauseTimer();
      if (action === 'reset') return resetTimer();
    });
  }

  const startBtn = document.querySelector('[data-action="start"]');
  const pauseBtn = document.querySelector('[data-action="pause"]');
  const resetBtn = document.querySelector('[data-action="reset"]');

  if (startBtn) startBtn.addEventListener('click', startCurrentTimer);
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);

  const presetMusic = document.getElementById('presetMusic');
  const playCustom = document.getElementById('playCustom');
  const stopMusicBtn = document.getElementById('stopMusic');

  if (presetMusic) {
    presetMusic.addEventListener('change', () => {
      const url = presetMusic.value;
      if (url) {
        handleManualMusicControl();
        playYouTube(url);
      } else {
        // Quando deseleciona música
        setMusicSelected('');
      }
    });
  }

  if (playCustom) {
    playCustom.addEventListener('click', () => {
      const url = document.getElementById('youtubeLink').value.trim();
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
  const youtubeInput = document.getElementById('youtubeLink');
  if (youtubeInput) {
    youtubeInput.addEventListener('input', () => {
      // Detecta música selecionada quando usuário digita
      setTimeout(detectSelectedMusic, 300); // debounce
    });
  }

  const setCustomTimeBtn = document.getElementById('setCustomTime');
  if (setCustomTimeBtn) {
    setCustomTimeBtn.addEventListener('click', () => {
      const customTime = parseInt(document.getElementById('customTimeInput').value);
      if (!isNaN(customTime) && customTime > 0) {
        // startTimer já inclui sincronização automática com música
        startTimer(customTime);
      } else {
        alert('Por favor, insira um valor válido para o tempo.');
      }
    });
  }
}

async function playYouTube(url) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      const errorMsg = 'Link do YouTube inválido. Verifique o URL.';
      if (musicState.lastAction === 'timer-sync') {
        showSyncError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    // Verifica se a API do YouTube está disponível
    if (!isYouTubeAPIReady || typeof YT === 'undefined') {
      // Fallback para iframe simples se API não estiver disponível
      playYouTubeFallback(url, videoId);
      return;
    }

    // Mostra o player
    const playerElement = document.getElementById('musicPlayer');
    if (playerElement) {
      playerElement.style.width = '100%';
      playerElement.style.height = '200px';
      playerElement.style.maxWidth = '600px';
      playerElement.style.display = 'block';
    }

    // Cria ou atualiza o player do YouTube
    if (youtubePlayer && youtubePlayer.loadVideoById) {
      // Player já existe, apenas carrega novo vídeo
      youtubePlayer.loadVideoById(videoId);
    } else {
      // Cria novo player
      await createYouTubePlayer(videoId);
    }

    // Atualizar music state
    setMusicSelected(url);
    setMusicPlaying(true);

    const musicTitle = findMusicTitle(url);
    showMusicStatus(`🎵 Reproduzindo: ${musicTitle}`);
  } catch (error) {
    console.error('Error in playYouTube:', error);
    // Fallback para iframe simples em caso de erro
    const videoId = extractVideoId(url);
    if (videoId) {
      playYouTubeFallback(url, videoId);
    } else {
      showSyncError('Erro inesperado ao reproduzir música');
    }
  }
}

// Função fallback para usar iframe simples quando API não está disponível
function playYouTubeFallback(url, videoId) {
  try {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`;

    const playerElement = document.getElementById('musicPlayer');
    if (playerElement) {
      // Cria iframe dentro do div
      playerElement.innerHTML = `<iframe 
        src="${embedUrl}" 
        width="100%" 
        height="200" 
        frameborder="0" 
        allow="autoplay; encrypted-media"
        class="rounded-lg shadow-lg"
        title="Reprodutor do YouTube">
      </iframe>`;

      playerElement.style.width = '100%';
      playerElement.style.height = '200px';
      playerElement.style.maxWidth = '600px';
      playerElement.style.display = 'block';
    }

    // Atualizar music state
    setMusicSelected(url);
    setMusicPlaying(true);

    const musicTitle = findMusicTitle(url);
    showMusicStatus(`🎵 Reproduzindo: ${musicTitle} (modo compatibilidade)`);

    console.log('Using fallback iframe method');
  } catch (error) {
    showSyncError('Erro ao reproduzir música');
    console.error('Error in playYouTubeFallback:', error);
  }
}

function findMusicTitle(url) {
  const music = backgroundMusic.find(m => m.youtubeUrl === url);
  return music ? music.title : 'Música personalizada';
}

// Variável para armazenar URL pausada
let pausedMusicUrl = '';

function pauseMusic() {
  try {
    // Tenta usar a API do YouTube primeiro
    if (youtubePlayer && youtubePlayer.pauseVideo && isYouTubeAPIReady) {
      youtubePlayer.pauseVideo();
      setMusicPlaying(false);
      showMusicStatus('⏸️ Música pausada');
      console.log('Music paused via YouTube API');
      return;
    }

    // Fallback para método iframe (salva URL e remove src)
    const playerElement = document.getElementById('musicPlayer');
    if (playerElement && (playerElement.querySelector('iframe') || playerElement.src)) {
      pausedMusicUrl = musicState.currentUrl;

      if (playerElement.querySelector('iframe')) {
        playerElement.innerHTML = '';
      } else {
        playerElement.src = '';
      }

      playerElement.style.width = '0';
      playerElement.style.height = '0';
      setMusicPlaying(false);
      showMusicStatus('⏸️ Música pausada');
      console.log('Music paused via fallback method');
    }
  } catch (error) {
    console.error('Erro ao pausar música:', error);
  }
}

function resumeMusic() {
  try {
    // Tenta usar a API do YouTube primeiro
    if (youtubePlayer && youtubePlayer.playVideo && isYouTubeAPIReady && musicState.isPlaying === false) {
      youtubePlayer.playVideo();

      // Mostra o player
      const playerElement = document.getElementById('musicPlayer');
      if (playerElement) {
        playerElement.style.width = '100%';
        playerElement.style.height = '200px';
        playerElement.style.maxWidth = '600px';
        playerElement.style.display = 'block';
      }

      setMusicPlaying(true);
      showMusicStatus('▶️ Música retomada');
      console.log('Music resumed via YouTube API');
      return;
    }

    // Fallback para método iframe (recarrega a música)
    if (pausedMusicUrl) {
      playYouTube(pausedMusicUrl);
      pausedMusicUrl = '';
      showMusicStatus('▶️ Música retomada');
      console.log('Music resumed via fallback method');
    }
  } catch (error) {
    console.error('Erro ao retomar música:', error);
  }
}

function stopMusic() {
  try {
    // Para MP3 se estiver tocando
    if (musicState.currentUrl === 'mp3://custom') {
      if (typeof stopMp3 === 'function') {
        stopMp3();
      }
      setMusicPlaying(false);
      showMusicStatus('🔇 Música parada');
      return;
    }

    // Tenta usar a API do YouTube primeiro
    if (youtubePlayer && youtubePlayer.stopVideo && isYouTubeAPIReady) {
      youtubePlayer.stopVideo();
      console.log('Music stopped via YouTube API');
    }

    // Limpa o player element
    const playerElement = document.getElementById('musicPlayer');
    if (playerElement) {
      if (playerElement.querySelector('iframe')) {
        playerElement.innerHTML = '';
      } else {
        playerElement.src = '';
      }

      playerElement.style.width = '0';
      playerElement.style.height = '0';
      playerElement.style.display = 'block'; // reset display
    }

    // Limpa URL pausada quando para completamente
    pausedMusicUrl = '';
    setMusicPlaying(false);
    // Não limpa seleção quando para - mantém para persistência
    showMusicStatus('🔇 Música parada');
  } catch (error) {
    console.error('Erro ao parar música:', error);
  }
}

// -------------------- Sync Controller --------------------
function syncMusicWithTimer(action) {
  // Verifica se há música disponível antes de sincronizar
  if (!checkMusicAvailability()) {
    console.log('Music sync skipped - no music selected');
    return;
  }

  if (!musicState.syncEnabled) {
    console.log('Music sync skipped - sync disabled');
    return;
  }

  try {
    musicState.lastAction = 'timer-sync';

    switch (action) {
      case 'start':
        handleTimerStart();
        break;
      case 'pause':
        handleTimerPause();
        break;
      case 'stop':
      case 'reset':
        handleTimerStop();
        break;
      default:
        console.warn('Unknown sync action:', action);
    }
  } catch (error) {
    console.error('Erro na sincronização música-timer:', error);
    // Timer continua normalmente mesmo se música falhar
  }
}

function handleTimerStart() {
  try {
    // Se há música pausada, retoma
    if (pausedMusicUrl) {
      resumeMusic();
      console.log('Music resumed via timer sync');
    }
    // Se há URL selecionada mas não está tocando, inicia
    else if (musicState.currentUrl && !musicState.isPlaying) {
      playYouTube(musicState.currentUrl);
      console.log('Music started via timer sync');
    }
  } catch (error) {
    showSyncError('Falha ao iniciar música');
    console.error('Error in handleTimerStart:', error);
  }
}

function handleTimerPause() {
  try {
    if (musicState.isPlaying) {
      pauseMusic();
      console.log('Music paused via timer sync');
    }
  } catch (error) {
    showSyncError('Falha ao pausar música');
    console.error('Error in handleTimerPause:', error);
  }
}

function handleTimerStop() {
  try {
    if (musicState.isPlaying) {
      // Para música completamente quando timer para/reseta
      stopMusic();
      console.log('Music stopped via timer sync');
    }
  } catch (error) {
    showSyncError('Falha ao parar música');
    console.error('Error in handleTimerStop:', error);
  }
}

function handleManualMusicControl() {
  // Desabilita sync temporariamente quando usuário controla música manualmente
  musicState.lastAction = 'manual';
  musicState.syncEnabled = false;
  console.log('Manual music control detected - sync temporarily disabled');

  // Re-habilita sync após um tempo ou na próxima ação do timer
  setTimeout(() => {
    if (musicState.lastAction === 'manual') {
      musicState.syncEnabled = true;
      console.log('Sync re-enabled after manual control timeout');
    }
  }, 5000); // 5 segundos
}

function reEnableSync() {
  musicState.syncEnabled = true;
  musicState.lastAction = 'timer-sync';
  console.log('Sync re-enabled by timer action');
}

function showMusicStatus(message, persistent = false) {
  let statusEl = document.getElementById('musicStatus');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'musicStatus';
    statusEl.style.cssText = 'margin-top: 8px; font-size: 0.9rem; opacity: 0.8; text-align: center;';
    const container = document.querySelector('.music-player-container');
    if (container) container.appendChild(statusEl);
  }

  // Adiciona informação de sincronização se aplicável
  let fullMessage = message;
  if (musicState.lastAction === 'timer-sync' && musicState.isPlaying) {
    fullMessage += ' 🔄 (Sincronizado com timer)';
  }

  statusEl.textContent = fullMessage;

  if (!persistent) {
    setTimeout(() => {
      if (statusEl.textContent === fullMessage) {
        updateSyncStatusDisplay();
      }
    }, 3000);
  }
}

function updateSyncStatusDisplay() {
  const statusEl = document.getElementById('musicStatus');
  if (!statusEl) return;

  if (isRunning && isMusicAvailableForSync()) {
    statusEl.textContent = '🔄 Timer e música sincronizados';
    statusEl.style.color = '#10b981'; // verde
  } else if (isRunning && !musicState.isSelected) {
    statusEl.textContent = '⏱️ Apenas timer ativo';
    statusEl.style.color = '#f59e0b'; // amarelo
  } else if (musicState.isSelected && !isRunning) {
    statusEl.textContent = '🎵 Música selecionada';
    statusEl.style.color = '#3b82f6'; // azul
  } else {
    statusEl.textContent = '';
    statusEl.style.color = '';
  }
}

function showSyncError(error) {
  showMusicStatus(`❌ Erro na música: ${error}. Timer continua normalmente.`, false);
  console.error('Music sync error:', error);
}

// Função de debug para testar sincronização
function debugMusicSync() {
  console.log('=== Music Sync Debug Info ===');
  console.log('Music State:', getMusicState());
  console.log('Timer Running:', isRunning);
  console.log('Time Left:', timeLeft);
  console.log('Music Available for Sync:', isMusicAvailableForSync());
  console.log('Selected Music URL:', detectSelectedMusic());
  console.log('============================');
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /[?&]v=([^&\n?#]+)/ // Para URLs com parâmetros extras como list=
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1].split('&')[0].split('#')[0];
  }
  return '';
}

// -------------------- Carregar JSONs --------------------
async function loadBackgroundMusic() {
  try {
    const response = await fetch('music.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    backgroundMusic = Array.isArray(data) ? data : (data.backgroundMusic || []);
    if (!Array.isArray(backgroundMusic)) backgroundMusic = [];
  } catch (error) {
    console.error('Erro ao carregar music.json:', error);
    backgroundMusic = [];
  }

  populateMusicSelect();
}

function populateMusicSelect() {
  const select = document.getElementById('presetMusic');
  if (!select) {
    console.error('Elemento select não encontrado!');
    return;
  }

  // limpa tudo menos o placeholder
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }

  if (!backgroundMusic.length) return;

  backgroundMusic.forEach((music) => {
    const option = document.createElement('option');
    option.value = music.youtubeUrl || music.url || '';
    option.textContent = `${music.title || 'Sem título'}${music.duration ? ` (${music.duration})` : ''}`;
    option.dataset.category = music.category || '';
    select.appendChild(option);
  });
}

// ======== MENSAGENS (messages.json + personalizadas via localStorage) ========
async function loadRunMessages() {
  try {
    const res = await fetch('messages.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    runMessages = Array.isArray(data) ? data : (data.messages || []);
    if (!Array.isArray(runMessages)) runMessages = [];
  } catch (e) {
    console.error('Erro ao carregar messages.json:', e);
    runMessages = [];
  }

  renderRunMessageOptions();
  // aplica a seleção persistida (ou primeira opção)
  applySelectedRunText(getSavedRunText() || getAllMessages()[0] || 'Estamos no ritmo! 💨');
}

function renderRunMessageOptions() {
  const container = document.getElementById('messageOptions');
  if (!container) return;
  container.innerHTML = '';

  const all = getAllMessages();
  const saved = getSavedRunText();

  // cria os pills para todas as mensagens (JSON + personalizadas)
  all.forEach((msg) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'msg-option' + (saved === msg ? ' active' : '');
    pill.textContent = msg;

    pill.addEventListener('click', () => {
      // marca visualmente
      [...container.children].forEach(c => c.classList.remove('active'));
      pill.classList.add('active');
      // salva e aplica
      saveRunText(msg);
      applySelectedRunText(msg);
    });

    container.appendChild(pill);
  });

  // ➕ pill para adicionar mensagem personalizada
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'msg-option';
  add.textContent = '➕ Personalizar';
  add.title = 'Criar sua própria mensagem';
  add.addEventListener('click', addCustomMessage);
  container.appendChild(add);

  // 🗑️ limpar personalizadas (só aparece se houver custom)
  if (getCustomMessages().length > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'msg-option';
    clearBtn.textContent = '🗑️ Limpar personalizadas';
    clearBtn.title = 'Remover todas as mensagens personalizadas';
    clearBtn.addEventListener('click', clearCustomMessages);
    container.appendChild(clearBtn);
  }
}

function getSavedRunText() {
  try { return localStorage.getItem(CACHE_KEYS.RUN_TEXT_SELECTED) || ''; }
  catch { return ''; }
}

function saveRunText(txt) {
  try { localStorage.setItem(CACHE_KEYS.RUN_TEXT_SELECTED, txt); } catch { }
}

function applySelectedRunText(txt) {
  const el = document.querySelector('#run-fun .run-text');
  if (el && txt) el.textContent = txt;
}

// ----- mensagens personalizadas (lista) -----
function getCustomMessages() {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.RUN_TEXT_CUSTOMS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveCustomMessages(arr) {
  try { localStorage.setItem(CACHE_KEYS.RUN_TEXT_CUSTOMS, JSON.stringify(arr)); } catch { }
}
function getAllMessages() {
  // JSON + personalizadas (sem duplicar)
  const base = runMessages.slice();
  const customs = getCustomMessages();
  const set = new Set(base.concat(customs).map(s => (s || '').trim()).filter(Boolean));
  return Array.from(set);
}
function addCustomMessage() {
  const txt = (prompt('Digite sua mensagem (máx. 120 caracteres):') || '').trim();
  if (!txt) return;
  const clean = txt.slice(0, 120);

  const customs = getCustomMessages();
  // evita duplicatas (case-insensitive)
  if (!customs.find(m => m.toLowerCase() === clean.toLowerCase())) {
    customs.push(clean);
    saveCustomMessages(customs);
  }

  // seleciona imediatamente a nova mensagem
  saveRunText(clean);
  applySelectedRunText(clean);
  renderRunMessageOptions();
}
function clearCustomMessages() {
  const customs = getCustomMessages();
  if (!customs.length) return;

  const ok = confirm('Deseja apagar TODAS as mensagens personalizadas? Esta ação não pode ser desfeita.');
  if (!ok) return;

  // limpa todas as personalizadas
  saveCustomMessages([]);

  // se a selecionada era personalizada, escolher fallback
  const selected = getSavedRunText();
  const allNow = getAllMessages(); // agora só as do JSON
  if (!allNow.includes(selected)) {
    const fallback = allNow[0] || 'Estamos no ritmo! 💨';
    saveRunText(fallback);
    applySelectedRunText(fallback);
  }

  renderRunMessageOptions();
}

// Slideshow de fundo
let currentSlide = 0;
let slides = [];

async function loadBackgroundImages() {
  try {
    const response = await fetch('images.json');
    const data = await response.json();
    backgroundImages = data.backgroundImages;
    createSlideshow();
  } catch (error) {
    console.error('Erro ao carregar imagens:', error);
    backgroundImages = [
      {
        id: 1,
        url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&h=800&fit=crop&crop=center',
        alt: 'Estudantes em sala de aula',
        category: 'classroom'
      }
    ];
    createSlideshow();
  }
}

function createSlideshow() {
  const slideshowContainer = document.getElementById('backgroundSlideshow');
  if (!slideshowContainer) return;

  slideshowContainer.innerHTML = '';
  slides = [];

  backgroundImages.forEach((image, index) => {
    const slideDiv = document.createElement('div');
    slideDiv.className = 'slide';
    slideDiv.style.backgroundImage = `url('${image.url}')`;
    slideDiv.setAttribute('aria-label', image.alt);
    slideDiv.dataset.category = image.category;

    if (index === 0) slideDiv.classList.add('active');

    slideshowContainer.appendChild(slideDiv);
    slides.push(slideDiv);
  });

  if (slides.length > 1) startSlideshow();
}

function nextSlide() {
  if (slides.length === 0) return;

  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}

function startSlideshow() {
  setInterval(nextSlide, 10000);
}

// -------------------- Boot --------------------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (typeof lucide !== 'undefined') lucide.createIcons();

    initializeEventListeners();
    initializeImageUpload();
    initializePersonalization();
    initializeCustomTime();

    // restaura estado ANTES de permitir salvar
    const savedState = loadTimerState();
    if (savedState) {
      timeLeft = savedState.timeLeft;
      isRunning = savedState.isRunning;
      startTime = savedState.startTime;
      pausedTime = savedState.pausedTime;
      endTimestamp = savedState.endTimestamp || (isRunning ? Date.now() + timeLeft * 1000 : null);

      if (isRunning && timeLeft > 0) {
        countdown = setInterval(tick, 1000);
        updateButtonStates('running');
        document.body.classList.add('timer-running');
        showCacheStatus('Timer restaurado', 'success');
      } else {
        updateButtonStates('stopped');
      }
    }

    // agora permitimos persistir
    canPersist = true;
    updateDisplay(); // render com persistência habilitada

    await Promise.all([
      loadBackgroundMusic(),
      loadBackgroundImages(),
      loadRunMessages() // carrega as mensagens
    ]);

    // Carrega estado da música APÓS carregar os dados de música
    const musicRestored = loadMusicState();

    // Se timer está rodando e música foi restaurada, inicia a música
    if (isRunning && musicRestored && musicState.isSelected) {
      setTimeout(() => {
        console.log('Auto-starting music after restore');
        console.log('Music state before auto-start:', getMusicState());

        // Força a detecção da música selecionada
        detectSelectedMusic();

        // Inicia a música via sync
        syncMusicWithTimer('start');
      }, 500); // Pequeno delay para garantir que tudo foi inicializado
    }

    // Inicializa detecção de música após carregar dados
    setTimeout(() => {
      detectSelectedMusic();
      updateSyncStatusDisplay();
    }, 100);

    // Inicializa YouTube API se ainda não estiver pronta
    if (typeof YT === 'undefined' || !isYouTubeAPIReady) {
      console.log('Waiting for YouTube API to load...');
      // A função onYouTubeIframeAPIReady será chamada automaticamente quando a API estiver pronta
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } catch (error) {
    console.error('Erro na inicialização:', error);
    canPersist = true;
    updateDisplay();
  }
});

// Fallback caso DOMContentLoaded já tenha passado
if (document.readyState !== 'loading') {
  setTimeout(async () => {
    try {
      if (typeof lucide !== 'undefined') lucide.createIcons();
      initializeEventListeners();
      initializeImageUpload();
      initializePersonalization();
      initializeCustomTime();

      const savedState = loadTimerState();
      if (savedState) {
        timeLeft = savedState.timeLeft;
        isRunning = savedState.isRunning;
        startTime = savedState.startTime;
        pausedTime = savedState.pausedTime;
        endTimestamp = savedState.endTimestamp || (isRunning ? Date.now() + timeLeft * 1000 : null);

        if (isRunning && timeLeft > 0) {
          countdown = setInterval(tick, 1000);
          updateButtonStates('running');
          document.body.classList.add('timer-running');
        } else {
          updateButtonStates('stopped');
        }
      }

      canPersist = true;
      updateDisplay();

      await Promise.all([
        loadBackgroundMusic(),
        loadBackgroundImages(),
        loadRunMessages() // também no fallback
      ]);

      // Carrega estado da música APÓS carregar os dados (fallback)
      const musicRestored = loadMusicState();

      // Se timer está rodando e música foi restaurada, inicia a música (fallback)
      if (isRunning && musicRestored && musicState.isSelected) {
        setTimeout(() => {
          console.log('Auto-starting music after restore (fallback)');
          console.log('Music state before auto-start (fallback):', getMusicState());

          // Força a detecção da música selecionada
          detectSelectedMusic();

          // Inicia a música via sync
          syncMusicWithTimer('start');
        }, 500);
      }

      // Inicializa detecção de música após carregar dados (fallback)
      setTimeout(() => {
        detectSelectedMusic();
        updateSyncStatusDisplay();
      }, 100);
    } catch (error) {
      console.error('Erro na inicialização:', error);
      canPersist = true;
      updateDisplay();
    }
  }, 100);
}

window.addEventListener('beforeunload', () => {
  saveTimerState();
});

// salva periodicamente
setInterval(() => {
  if (isRunning || timeLeft > 0) saveTimerState();
}, 5000);

// -------------------- Custom Background Image Manager --------------------
const CUSTOM_IMAGE_KEY = 'cronometro_custom_background_image';

function initializeImageUpload() {
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const applyImageBtn = document.getElementById('applyImage');
  const removeImageBtn = document.getElementById('removeImage');
  const imageStatus = document.getElementById('imageStatus');
  const customImageContainer = document.getElementById('customImageContainer');

  if (!imageUpload) return;

  // Carrega imagem salva no localStorage
  loadSavedImage();

  // Upload de imagem
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validação do arquivo
    if (!file.type.startsWith('image/')) {
      showImageStatus('❌ Por favor, selecione apenas arquivos de imagem.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      showImageStatus('❌ A imagem deve ter no máximo 5MB.', 'error');
      return;
    }

    // Lê o arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;

      // Mostra preview
      previewImg.src = imageData;
      imagePreview.classList.remove('hidden');
      applyImageBtn.disabled = false;

      showImageStatus('✅ Imagem carregada. Clique em "Aplicar" para usar como fundo.', 'success');
    };

    reader.onerror = () => {
      showImageStatus('❌ Erro ao carregar a imagem.', 'error');
    };

    reader.readAsDataURL(file);
  });

  // Aplicar imagem
  applyImageBtn.addEventListener('click', () => {
    const imageData = previewImg.src;
    if (imageData) {
      saveCustomImage(imageData);
      applyCustomImage(imageData);
      showImageStatus('✅ Imagem aplicada como fundo!', 'success');
    }
  });

  // Remover imagem
  removeImageBtn.addEventListener('click', () => {
    removeCustomImage();
    showImageStatus('🗑️ Imagem de fundo removida.', 'info');
  });
}

function showImageStatus(message, type = 'info') {
  const statusEl = document.getElementById('imageStatus');
  if (!statusEl) return;

  statusEl.textContent = message;

  // Define cor baseada no tipo
  switch (type) {
    case 'success':
      statusEl.style.color = '#10b981';
      break;
    case 'error':
      statusEl.style.color = '#ef4444';
      break;
    case 'info':
      statusEl.style.color = '#3b82f6';
      break;
    default:
      statusEl.style.color = '';
  }

  // Remove mensagem após 5 segundos
  setTimeout(() => {
    if (statusEl.textContent === message) {
      statusEl.textContent = '';
      statusEl.style.color = '';
    }
  }, 5000);
}

function saveCustomImage(imageData) {
  try {
    localStorage.setItem(CUSTOM_IMAGE_KEY, imageData);
    console.log('Custom image saved to localStorage');
  } catch (error) {
    console.error('Error saving custom image:', error);
    showImageStatus('❌ Erro ao salvar imagem. Tente uma imagem menor.', 'error');
  }
}

function loadSavedImage() {
  try {
    const savedImage = localStorage.getItem(CUSTOM_IMAGE_KEY);
    if (savedImage) {
      applyCustomImage(savedImage);
      showImageStatus('📸 Imagem personalizada carregada.', 'info');
    }
  } catch (error) {
    console.error('Error loading saved image:', error);
  }
}

function applyCustomImage(imageData) {
  const customImageDisplay = document.getElementById('customImageDisplay');
  const displayedImage = document.getElementById('displayedImage');
  const timerCard = document.querySelector('.w-full.max-w-2xl.mb-8');

  if (customImageDisplay && displayedImage && imageData) {
    // Aplica a imagem personalizada
    displayedImage.src = imageData;
    customImageDisplay.classList.remove('hidden');

    // Reduz o tamanho do timer quando há imagem
    if (timerCard) {
      timerCard.classList.remove('max-w-2xl');
      timerCard.classList.add('max-w-xl');
    }

    // Ajusta o timer display para ficar menor
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.classList.remove('text-9xl', 'md:text-9xl');
      timerEl.classList.add('text-6xl', 'md:text-7xl');
    }

    // Adiciona classe ao body para CSS responsivo
    document.body.classList.add('timer-with-image');

    console.log('Custom image applied');
  }
}

function removeCustomImage() {
  try {
    localStorage.removeItem(CUSTOM_IMAGE_KEY);

    const customImageDisplay = document.getElementById('customImageDisplay');
    const imagePreview = document.getElementById('imagePreview');
    const imageUpload = document.getElementById('imageUpload');
    const applyImageBtn = document.getElementById('applyImage');
    const timerCard = document.querySelector('.w-full.max-w-xl.mb-8') || document.querySelector('.w-full.max-w-2xl.mb-8');

    // Remove imagem personalizada
    if (customImageDisplay) {
      customImageDisplay.classList.add('hidden');
    }

    // Restaura tamanho original do timer
    if (timerCard) {
      timerCard.classList.remove('max-w-xl');
      timerCard.classList.add('max-w-2xl');
    }

    // Restaura tamanho original do timer display
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.classList.remove('text-6xl', 'md:text-7xl');
      timerEl.classList.add('text-9xl', 'md:text-9xl');
    }

    // Limpa preview
    if (imagePreview) {
      imagePreview.classList.add('hidden');
    }

    // Reset input
    if (imageUpload) {
      imageUpload.value = '';
    }

    // Desabilita botão aplicar
    if (applyImageBtn) {
      applyImageBtn.disabled = true;
    }

    // Remove classe do body
    document.body.classList.remove('timer-with-image');

    console.log('Custom image removed');
  } catch (error) {
    console.error('Error removing custom image:', error);
  }
}

// -------------------- Snow Effect Manager --------------------
const SNOW_ENABLED_KEY = 'cronometro_snow_enabled';
const SOUND_ENABLED_KEY = 'cronometro_sound_enabled';

let christmasElements = [];
let christmasAnimationId = null;

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

function updateChristmasElements() {
  const container = document.getElementById('snowContainer');
  if (!container) return;

  // Limpa container
  container.innerHTML = '';

  // Atualiza posições dos elementos
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
      // Para emojis
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
      // Para flocos de neve tradicionais
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

function startChristmasEffect() {
  const container = document.getElementById('snowContainer');
  if (container) {
    container.classList.remove('hidden');
    christmasElements = [];
    // Inicia com alguns elementos já na tela
    for (let i = 0; i < 30; i++) {
      const element = createChristmasElement();
      element.y = Math.random() * window.innerHeight; // Distribui pela tela
      christmasElements.push(element);
    }
    updateChristmasElements();
    console.log('Christmas effect started');
  }
}

function stopChristmasEffect() {
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

function updateChristmasEffectBasedOnTimer() {
  const snowEnabled = localStorage.getItem(SNOW_ENABLED_KEY) === 'true';
  const shouldRun = snowEnabled && isRunning;
  const isCurrentlyRunning = !!christmasAnimationId;

  console.log('Christmas effect check:', {
    snowEnabled,
    isRunning,
    shouldRun,
    isCurrentlyRunning
  });

  if (shouldRun && !isCurrentlyRunning) {
    // Inicia efeito se deveria rodar mas não está rodando
    startChristmasEffect();
  } else if (!shouldRun && isCurrentlyRunning) {
    // Para efeito se não deveria rodar mas está rodando
    stopChristmasEffect();
  }
  // Se shouldRun === isCurrentlyRunning, não faz nada (já está no estado correto)
}

// -------------------- Sound Effect Manager --------------------
function playBeepSound() {
  try {
    // Cria um alarme de relógio tradicional por 5 segundos
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 5; // 5 segundos
    const ringInterval = 0.5; // intervalo entre "ring-ring"
    const ringDuration = 0.15; // duração de cada "ring"
    const ringGap = 0.05; // pausa entre os dois rings

    for (let i = 0; i < duration / ringInterval; i++) {
      const ringStartTime = audioContext.currentTime + (i * ringInterval);

      // Primeiro "ring"
      createAlarmRing(audioContext, ringStartTime, ringDuration);

      // Segundo "ring" (ring-ring)
      createAlarmRing(audioContext, ringStartTime + ringDuration + ringGap, ringDuration);
    }

    console.log('Alarm clock sound started (5 seconds)');
  } catch (error) {
    console.error('Error playing alarm sound:', error);
  }
}

function createAlarmRing(audioContext, startTime, duration) {
  // Cria o som característico de alarme de relógio com múltiplas frequências
  const frequencies = [800, 1000, 1200]; // Harmônicos para som mais rico
  const volumes = [0.3, 0.2, 0.1]; // Volumes decrescentes para os harmônicos

  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(freq, startTime);
    oscillator.type = 'square'; // Onda quadrada para som mais "metálico"

    // Envelope rápido e agressivo típico de alarme
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volumes[index], startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(volumes[index], startTime + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  });

  // Adiciona um pouco de ruído para simular o mecanismo do relógio
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);

  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.02; // Ruído baixo
  }

  const noiseSource = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();

  noiseSource.buffer = noiseBuffer;
  noiseSource.connect(noiseGain);
  noiseGain.connect(audioContext.destination);

  noiseGain.gain.setValueAtTime(0.1, startTime);
  noiseGain.gain.linearRampToValueAtTime(0, startTime + duration);

  noiseSource.start(startTime);
}

// -------------------- Personalization Manager --------------------
function initializePersonalization() {
  const snowToggle = document.getElementById('snowToggle');
  const soundToggle = document.getElementById('soundToggle');

  if (!snowToggle || !soundToggle) return;

  // Carrega configurações salvas
  const snowEnabled = localStorage.getItem(SNOW_ENABLED_KEY) === 'true';
  const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) === 'true'; // padrão false

  snowToggle.checked = snowEnabled;
  soundToggle.checked = soundEnabled;

  // Aplica configurações iniciais - só inicia se timer estiver rodando
  if (snowEnabled && isRunning) {
    startChristmasEffect();
  }

  // Event listeners
  snowToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem(SNOW_ENABLED_KEY, enabled.toString());

    if (enabled && isRunning) {
      startChristmasEffect();
    } else {
      stopChristmasEffect();
    }
  });

  soundToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
  });
}

// -------------------- Custom Time Manager --------------------
function initializeCustomTime() {
  const setCustomTimeBtn = document.getElementById('setCustomTime');
  const customMinutes = document.getElementById('customMinutes');
  const customSeconds = document.getElementById('customSeconds');

  if (!setCustomTimeBtn || !customMinutes || !customSeconds) return;

  setCustomTimeBtn.addEventListener('click', () => {
    const minutes = parseInt(customMinutes.value) || 0;
    const seconds = parseInt(customSeconds.value) || 0;

    if (minutes === 0 && seconds === 0) {
      alert('Por favor, insira um tempo válido (minutos e/ou segundos).');
      return;
    }

    // Converte para minutos decimais para usar com startTimer existente
    const totalMinutes = minutes + (seconds / 60);
    startTimer(totalMinutes);

    // Limpa os campos
    customMinutes.value = '';
    customSeconds.value = '';
  });

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

// render inicial (não persiste porque canPersist=false)
updateDisplay();
// -------------------- MP3 Upload and Player Manager --------------------
const MP3_STORAGE_KEY = 'cronometro_custom_mp3';
const MP3_INFO_KEY = 'cronometro_mp3_info';

let customMp3Player = null;
let mp3Data = null;

function initializeMp3Upload() {
  const mp3Upload = document.getElementById('mp3Upload');
  const mp3PlayerSection = document.getElementById('mp3PlayerSection');
  const mp3Player = document.getElementById('mp3Player');
  const mp3Info = document.getElementById('mp3Info');
  const playMp3Btn = document.getElementById('playMp3');
  const removeMp3Btn = document.getElementById('removeMp3');

  if (!mp3Upload) return;

  // Carrega MP3 salvo no localStorage
  loadSavedMp3();

  // Upload de MP3
  mp3Upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validação do arquivo
    if (!file.type.startsWith('audio/')) {
      showMp3Status('❌ Por favor, selecione apenas arquivos de áudio.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      showMp3Status('❌ O arquivo deve ter no máximo 10MB.', 'error');
      return;
    }

    // Lê o arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      const audioData = e.target.result;

      // Salva no localStorage
      saveMp3Data(audioData, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Aplica o MP3
      applyMp3(audioData, file.name);
      showMp3Status('✅ MP3 carregado com sucesso!', 'success');
    };

    reader.onerror = () => {
      showMp3Status('❌ Erro ao ler o arquivo MP3.', 'error');
    };

    reader.readAsDataURL(file);
  });

  // Reproduzir MP3
  if (playMp3Btn) {
    playMp3Btn.addEventListener('click', () => {
      if (mp3Data) {
        handleManualMusicControl();
        playMp3();
      }
    });
  }

  // Remover MP3
  if (removeMp3Btn) {
    removeMp3Btn.addEventListener('click', () => {
      removeMp3();
    });
  }

  // Event listeners do player de áudio
  if (mp3Player) {
    mp3Player.addEventListener('play', () => {
      setMusicSelected('mp3://custom');
      setMusicPlaying(true);
      updateMp3LoopState();
      showMp3Status('🎵 Reproduzindo MP3 personalizado', 'info');
    });

    mp3Player.addEventListener('pause', () => {
      setMusicPlaying(false);
      showMp3Status('⏸️ MP3 pausado', 'info');
    });

    mp3Player.addEventListener('ended', () => {
      // Se o timer estiver rodando, reinicia o MP3
      if (isRunning && timeLeft > 0) {
        mp3Player.currentTime = 0;
        mp3Player.play().catch(error => {
          console.error('Erro ao reiniciar MP3:', error);
        });
      } else {
        setMusicPlaying(false);
        showMp3Status('🔄 MP3 finalizado', 'info');
      }
    });

    mp3Player.addEventListener('error', () => {
      showMp3Status('❌ Erro ao reproduzir MP3', 'error');
    });

    // Listener para mudanças no volume
    mp3Player.addEventListener('volumechange', () => {
      updateMp3LoopState();
    });
  }
}

function saveMp3Data(audioData, fileInfo) {
  try {
    localStorage.setItem(MP3_STORAGE_KEY, audioData);
    localStorage.setItem(MP3_INFO_KEY, JSON.stringify(fileInfo));
    mp3Data = audioData;
  } catch (error) {
    console.error('Erro ao salvar MP3:', error);
    showMp3Status('❌ Erro ao salvar MP3. Arquivo muito grande para o localStorage.', 'error');
  }
}

function loadSavedMp3() {
  try {
    const savedMp3 = localStorage.getItem(MP3_STORAGE_KEY);
    const savedInfo = localStorage.getItem(MP3_INFO_KEY);

    if (savedMp3 && savedInfo) {
      const fileInfo = JSON.parse(savedInfo);
      applyMp3(savedMp3, fileInfo.name);
      showMp3Status('📁 MP3 personalizado carregado.', 'info');
    }
  } catch (error) {
    console.error('Erro ao carregar MP3 salvo:', error);
  }
}

function applyMp3(audioData, fileName) {
  const mp3PlayerSection = document.getElementById('mp3PlayerSection');
  const mp3Player = document.getElementById('mp3Player');
  const mp3Info = document.getElementById('mp3Info');

  if (mp3PlayerSection && mp3Player && mp3Info && audioData) {
    // Configura o player
    mp3Player.src = audioData;
    mp3Player.load();

    // Mostra informações do arquivo
    mp3Info.textContent = `🎵 ${fileName}`;

    // Mostra a seção do player
    mp3PlayerSection.classList.remove('hidden');

    // Armazena os dados
    mp3Data = audioData;

    console.log('MP3 aplicado:', fileName);
  }
}

function updateMp3LoopState() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player) {
    // Habilita loop apenas quando o timer está rodando
    mp3Player.loop = isRunning && timeLeft > 0;
    console.log('MP3 loop state updated:', mp3Player.loop, 'Timer running:', isRunning, 'Time left:', timeLeft);
  }
}

function playMp3() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player && mp3Data) {
    try {
      // Para qualquer música do YouTube que esteja tocando
      stopMusic();

      // Atualiza o estado do loop antes de reproduzir
      updateMp3LoopState();

      // Reproduz o MP3
      mp3Player.currentTime = 0;
      mp3Player.play().then(() => {
        setMusicSelected('mp3://custom');
        setMusicPlaying(true);
        showMp3Status('🎵 Reproduzindo MP3 personalizado', 'info');
      }).catch(error => {
        console.error('Erro ao reproduzir MP3:', error);
        showMp3Status('❌ Erro ao reproduzir MP3', 'error');
      });
    } catch (error) {
      console.error('Erro ao reproduzir MP3:', error);
      showMp3Status('❌ Erro ao reproduzir MP3', 'error');
    }
  }
}

function pauseMp3() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player && !mp3Player.paused) {
    mp3Player.pause();
    setMusicPlaying(false);
    showMp3Status('⏸️ MP3 pausado', 'info');
  }
}

function resumeMp3() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player && mp3Player.paused && mp3Data) {
    mp3Player.play().then(() => {
      setMusicPlaying(true);
      showMp3Status('▶️ MP3 retomado', 'info');
    }).catch(error => {
      console.error('Erro ao retomar MP3:', error);
      showMp3Status('❌ Erro ao retomar MP3', 'error');
    });
  }
}

function stopMp3() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player) {
    mp3Player.pause();
    mp3Player.currentTime = 0;
    setMusicPlaying(false);
    setMusicSelected('');
    showMp3Status('🔇 MP3 parado', 'info');
  }
}

function removeMp3() {
  try {
    // Remove do localStorage
    localStorage.removeItem(MP3_STORAGE_KEY);
    localStorage.removeItem(MP3_INFO_KEY);

    // Para o player
    stopMp3();

    // Limpa os dados
    mp3Data = null;

    // Esconde a seção do player
    const mp3PlayerSection = document.getElementById('mp3PlayerSection');
    const mp3Upload = document.getElementById('mp3Upload');

    if (mp3PlayerSection) {
      mp3PlayerSection.classList.add('hidden');
    }

    if (mp3Upload) {
      mp3Upload.value = '';
    }

    showMp3Status('🗑️ MP3 removido com sucesso.', 'success');

    setTimeout(() => {
      showMp3Status('', '');
    }, 3000);

  } catch (error) {
    console.error('Erro ao remover MP3:', error);
    showMp3Status('❌ Erro ao remover MP3', 'error');
  }
}

function showMp3Status(message, type = '') {
  const statusEl = document.getElementById('mp3Status');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `text-center text-white/70 text-sm mt-2 ${type}`;

  if (message && type !== 'info') {
    setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = '';
        statusEl.className = 'text-center text-white/70 text-sm mt-2';
      }
    }, 5000);
  }
}

// Função detectSelectedMusic já definida acima - removendo duplicação

// Atualiza as funções de controle de música para incluir MP3
function handleTimerStart() {
  try {
    const selectedUrl = detectSelectedMusic();

    if (selectedUrl === 'mp3://custom') {
      updateMp3LoopState(); // Atualiza loop antes de retomar
      resumeMp3();
      console.log('MP3 resumed via timer sync');
    } else if (pausedMusicUrl) {
      resumeMusic();
      console.log('Music resumed via timer sync');
    } else if (musicState.currentUrl && !musicState.isPlaying) {
      playYouTube(musicState.currentUrl);
      console.log('Music started via timer sync');
    }
  } catch (error) {
    showSyncError('Falha ao iniciar música');
    console.error('Error in handleTimerStart:', error);
  }
}

function handleTimerPause() {
  try {
    if (musicState.currentUrl === 'mp3://custom') {
      updateMp3LoopState(); // Desabilita loop quando pausa
      pauseMp3();
      console.log('MP3 paused via timer sync');
    } else if (musicState.isPlaying) {
      pauseMusic();
      console.log('Music paused via timer sync');
    }
  } catch (error) {
    showSyncError('Falha ao pausar música');
    console.error('Error in handleTimerPause:', error);
  }
}

function handleTimerStop() {
  try {
    if (musicState.currentUrl === 'mp3://custom') {
      updateMp3LoopState(); // Desabilita loop quando para
      stopMp3();
      console.log('MP3 stopped via timer sync');
    } else if (musicState.isPlaying) {
      stopMusic();
      console.log('Music stopped via timer sync');
    }
  } catch (error) {
    showSyncError('Falha ao parar música');
    console.error('Error in handleTimerStop:', error);
  }
}

// Função stopMusic unificada já definida acima - removendo duplicação