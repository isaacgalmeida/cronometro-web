/**
 * Gerenciador de música e integração com YouTube
 */

import { extractVideoId, isValidYouTubeUrl, loadJsonData } from './utils.js';
import { saveMusicState, clearMusicCache } from './cache-manager.js';
import { hasMp3Data, stopMp3, playMp3, pauseMp3, resumeMp3 } from './mp3-manager.js';

// Estado da música
const musicState = {
  isSelected: false,
  isPlaying: false,
  currentUrl: '',
  syncEnabled: true,
  lastAction: 'manual'
};

// Dados de música carregados
let backgroundMusic = [];
let youtubePlayer = null;
let isYouTubeAPIReady = false;
let pausedMusicUrl = '';

// Callbacks para eventos de música
const callbacks = {
  onMusicStart: [],
  onMusicPause: [],
  onMusicStop: [],
  onMusicError: []
};

/**
 * Registra callback para eventos de música
 * @param {string} event - Nome do evento
 * @param {Function} callback - Função callback
 */
export function onMusicEvent(event, callback) {
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
        console.error(`Erro no callback de música ${event}:`, error);
      }
    });
  }
}

/**
 * Obtém estado atual da música
 * @returns {Object} - Estado da música
 */
export function getMusicState() {
  return { ...musicState };
}

/**
 * Define música selecionada
 * @param {string} url - URL da música
 */
export function setMusicSelected(url) {
  musicState.isSelected = !!url;
  musicState.currentUrl = url || '';
  console.log('Music selected:', { url, isSelected: musicState.isSelected });
  saveMusicState(musicState);
}

/**
 * Define estado de reprodução da música
 * @param {boolean} playing - Se está tocando
 */
export function setMusicPlaying(playing) {
  musicState.isPlaying = !!playing;
  console.log('Music playing state:', musicState.isPlaying);
}

/**
 * Verifica se música está disponível para sincronização
 * @returns {boolean}
 */
export function isMusicAvailableForSync() {
  return musicState.isSelected && musicState.currentUrl && musicState.syncEnabled;
}

/**
 * Detecta música selecionada na interface
 * @returns {string} - URL da música selecionada
 */
export function detectSelectedMusic() {
  // Verifica se há MP3 personalizado primeiro
  if (hasMp3Data()) {
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

/**
 * Verifica disponibilidade de música
 * @returns {boolean}
 */
export function checkMusicAvailability() {
  const selectedUrl = detectSelectedMusic();
  const isAvailable = !!selectedUrl;

  console.log('Music availability check:', {
    selectedUrl,
    isAvailable,
    syncEnabled: musicState.syncEnabled
  });

  return isAvailable;
}

/**
 * Carrega dados de música do JSON
 */
export async function loadBackgroundMusic() {
  try {
    const data = await loadJsonData('music.json');
    backgroundMusic = Array.isArray(data) ? data : (data?.backgroundMusic || []);
    if (!Array.isArray(backgroundMusic)) backgroundMusic = [];

    populateMusicSelect();
  } catch (error) {
    console.error('Erro ao carregar music.json:', error);
    backgroundMusic = [];
  }
}

/**
 * Popula o select de música com as opções carregadas
 */
function populateMusicSelect() {
  const select = document.getElementById('presetMusic');
  if (!select) {
    console.error('Elemento select não encontrado!');
    return;
  }

  // Limpa tudo menos o placeholder
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

/**
 * Encontra título da música pela URL
 * @param {string} url - URL da música
 * @returns {string} - Título da música
 */
export function findMusicTitle(url) {
  const music = backgroundMusic.find(m => m.youtubeUrl === url);
  return music ? music.title : 'Música personalizada';
}

/**
 * Função chamada quando API do YouTube está pronta
 */
function onYouTubeIframeAPIReady() {
  isYouTubeAPIReady = true;
  console.log('YouTube API ready');
}

// Torna a função disponível globalmente para a API do YouTube
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

/**
 * Cria player do YouTube
 * @param {string} videoId - ID do vídeo
 * @returns {Promise} - Promise do player criado
 */
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

/**
 * Manipula mudanças de estado do player do YouTube
 * @param {Object} event - Evento do YouTube
 */
function handleYouTubeStateChange(event) {
  const state = event.data;

  switch (state) {
    case YT.PlayerState.PLAYING:
      setMusicPlaying(true);
      triggerEvent('onMusicStart', getMusicState());
      break;
    case YT.PlayerState.PAUSED:
    case YT.PlayerState.ENDED:
      setMusicPlaying(false);
      triggerEvent('onMusicPause', getMusicState());
      break;
  }
}

/**
 * Reproduz música do YouTube
 * @param {string} url - URL do YouTube
 */
export async function playYouTube(url) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      const errorMsg = 'Link do YouTube inválido. Verifique o URL.';
      triggerEvent('onMusicError', errorMsg);
      return;
    }

    // Verifica se a API do YouTube está disponível
    if (!isYouTubeAPIReady || typeof YT === 'undefined') {
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
      youtubePlayer.loadVideoById(videoId);
    } else {
      await createYouTubePlayer(videoId);
    }

    setMusicSelected(url);
    setMusicPlaying(true);
    triggerEvent('onMusicStart', getMusicState());

  } catch (error) {
    console.error('Error in playYouTube:', error);
    const videoId = extractVideoId(url);
    if (videoId) {
      playYouTubeFallback(url, videoId);
    } else {
      triggerEvent('onMusicError', 'Erro inesperado ao reproduzir música');
    }
  }
}

/**
 * Carrega vídeo do YouTube no player sem autoplay (para restauração)
 * @param {string} url - URL do YouTube
 */
function loadYouTubeVideoWithoutAutoplay(url) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      console.log('Invalid YouTube URL for restoration:', url);
      return;
    }

    // Verifica se a API do YouTube está disponível
    if (!isYouTubeAPIReady || typeof YT === 'undefined') {
      loadYouTubeFallbackWithoutAutoplay(url, videoId);
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

    // Cria player sem autoplay
    if (youtubePlayer) {
      youtubePlayer.destroy();
    }

    youtubePlayer = new YT.Player('musicPlayer', {
      height: '200',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0, // Não toca automaticamente
        loop: 1,
        playlist: videoId,
        controls: 1,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: (event) => {
          console.log('YouTube player loaded for restoration (no autoplay)');
          setMusicPlaying(false); // Marca como não tocando
        },
        onStateChange: (event) => {
          handleYouTubeStateChange(event);
        },
        onError: (event) => {
          console.error('YouTube player error during restoration:', event.data);
        }
      }
    });

    const musicTitle = findMusicTitle(url);
    showMusicStatus(`🎵 Música carregada: ${musicTitle} (clique play para tocar)`);

  } catch (error) {
    console.error('Error loading YouTube video for restoration:', error);
    const videoId = extractVideoId(url);
    if (videoId) {
      loadYouTubeFallbackWithoutAutoplay(url, videoId);
    }
  }
}

/**
 * Fallback para carregar YouTube via iframe sem autoplay
 * @param {string} url - URL original
 * @param {string} videoId - ID do vídeo
 */
function loadYouTubeFallbackWithoutAutoplay(url, videoId) {
  try {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`;

    const playerElement = document.getElementById('musicPlayer');
    if (playerElement) {
      playerElement.innerHTML = `<iframe 
        src="${embedUrl}" 
        width="100%" 
        height="200" 
        frameborder="0" 
        allow="encrypted-media"
        class="rounded-lg shadow-lg"
        title="Reprodutor do YouTube">
      </iframe>`;

      playerElement.style.width = '100%';
      playerElement.style.height = '200px';
      playerElement.style.maxWidth = '600px';
      playerElement.style.display = 'block';
    }

    setMusicPlaying(false);
    const musicTitle = findMusicTitle(url);
    showMusicStatus(`🎵 Música carregada: ${musicTitle} (modo compatibilidade)`);

    console.log('Using fallback iframe method for restoration (no autoplay)');
  } catch (error) {
    console.error('Error in loadYouTubeFallbackWithoutAutoplay:', error);
  }
}

/**
 * Fallback para reproduzir YouTube via iframe
 * @param {string} url - URL original
 * @param {string} videoId - ID do vídeo
 */
function playYouTubeFallback(url, videoId) {
  try {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`;

    const playerElement = document.getElementById('musicPlayer');
    if (playerElement) {
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

    setMusicSelected(url);
    setMusicPlaying(true);
    triggerEvent('onMusicStart', getMusicState());

    console.log('Using fallback iframe method');
  } catch (error) {
    triggerEvent('onMusicError', 'Erro ao reproduzir música');
    console.error('Error in playYouTubeFallback:', error);
  }
}

/**
 * Pausa a música
 */
export function pauseMusic() {
  try {
    if (youtubePlayer && youtubePlayer.pauseVideo && isYouTubeAPIReady) {
      youtubePlayer.pauseVideo();
      setMusicPlaying(false);
      triggerEvent('onMusicPause', getMusicState());
      return;
    }

    // Fallback para método iframe
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
      triggerEvent('onMusicPause', getMusicState());
    }
  } catch (error) {
    console.error('Erro ao pausar música:', error);
  }
}

/**
 * Retoma a música
 */
export function resumeMusic() {
  try {
    if (youtubePlayer && youtubePlayer.playVideo && isYouTubeAPIReady && musicState.isPlaying === false) {
      youtubePlayer.playVideo();

      const playerElement = document.getElementById('musicPlayer');
      if (playerElement) {
        playerElement.style.width = '100%';
        playerElement.style.height = '200px';
        playerElement.style.maxWidth = '600px';
        playerElement.style.display = 'block';
      }

      setMusicPlaying(true);
      triggerEvent('onMusicStart', getMusicState());
      return;
    }

    // Fallback para método iframe
    if (pausedMusicUrl) {
      playYouTube(pausedMusicUrl);
      pausedMusicUrl = '';
      triggerEvent('onMusicStart', getMusicState());
    }
  } catch (error) {
    console.error('Erro ao retomar música:', error);
  }
}

/**
 * Para a música
 */
export function stopMusic() {
  try {
    // Para MP3 se estiver tocando
    if (musicState.currentUrl === 'mp3://custom') {
      stopMp3();
      setMusicPlaying(false);
      triggerEvent('onMusicStop', getMusicState());
      return;
    }

    // Para YouTube
    if (youtubePlayer && youtubePlayer.stopVideo && isYouTubeAPIReady) {
      youtubePlayer.stopVideo();
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
      playerElement.style.display = 'block';
    }

    pausedMusicUrl = '';
    setMusicPlaying(false);
    triggerEvent('onMusicStop', getMusicState());
  } catch (error) {
    console.error('Erro ao parar música:', error);
  }
}

/**
 * Limpa seleção de música
 */
export function clearMusicSelection() {
  const presetSelect = document.getElementById('presetMusic');
  if (presetSelect) {
    presetSelect.value = '';
  }

  const customInput = document.getElementById('youtubeLink');
  if (customInput) {
    customInput.value = '';
  }

  const musicPlayer = document.getElementById('musicPlayer');
  if (musicPlayer) {
    musicPlayer.src = '';
    musicPlayer.style.width = '0';
    musicPlayer.style.height = '0';
    musicPlayer.innerHTML = '';
  }

  setMusicSelected('');
}

/**
 * Aplica seleção de música na interface
 * @param {string} url - URL da música
 */
export function applyMusicSelectionToUI(url) {
  console.log('Applying music selection to UI:', url);

  const presetSelect = document.getElementById('presetMusic');
  if (presetSelect) {
    const option = Array.from(presetSelect.options).find(opt => opt.value === url);
    if (option) {
      presetSelect.value = url;
      console.log('Music applied to preset dropdown');
      return;
    }
  }

  const customInput = document.getElementById('youtubeLink');
  if (customInput && url && url.startsWith('http')) {
    customInput.value = url;
    console.log('Music applied to custom input');
  }
}

/**
 * Controla música manualmente (desabilita sync temporariamente)
 */
export function handleManualMusicControl() {
  console.log('Manual music control activated - disabling sync temporarily');
  musicState.lastAction = 'manual';
  musicState.syncEnabled = false;

  setTimeout(() => {
    musicState.syncEnabled = true;
    console.log('Music sync re-enabled after manual control');
  }, 3000);
}

/**
 * Reabilita sincronização
 */
export function reEnableSync() {
  console.log('Re-enabling music sync');
  musicState.syncEnabled = true;
  musicState.lastAction = 'timer-sync';
}

/**
 * Sincroniza música com timer
 * @param {string} action - Ação do timer (start, pause, stop)
 */
export function syncMusicWithTimer(action) {
  console.log('syncMusicWithTimer called:', { action, musicAvailable: checkMusicAvailability(), syncEnabled: musicState.syncEnabled });

  if (!checkMusicAvailability()) {
    console.log('Music sync skipped - no music available');
    return;
  }

  if (!musicState.syncEnabled) {
    console.log('Music sync skipped - sync disabled');
    return;
  }

  try {
    musicState.lastAction = 'timer-sync';
    const selectedUrl = detectSelectedMusic();

    switch (action) {
      case 'start':
        console.log('Timer started - syncing music start');
        if (selectedUrl) {
          if (musicState.isPlaying) {
            console.log('Music already playing - no action needed');
          } else {
            console.log('Starting music playback');
            playYouTube(selectedUrl);
          }
        }
        break;

      case 'pause':
        console.log('Timer paused - syncing music pause');
        if (musicState.isPlaying) {
          console.log('Pausing music');
          pauseMusic();
        } else {
          console.log('Music already paused - no action needed');
        }
        break;

      case 'stop':
        console.log('Timer stopped - syncing music stop');
        if (musicState.isPlaying) {
          console.log('Stopping music');
          stopMusic();
        } else {
          console.log('Music already stopped - no action needed');
        }
        break;

      default:
        console.log('Unknown sync action:', action);
    }
  } catch (error) {
    console.error('Erro na sincronização de música:', error);
    triggerEvent('onMusicError', error.message);
  }
}

/**
 * Restaura estado da música
 * @param {Object} savedState - Estado salvo da música
 */
export function restoreMusicState(savedState) {
  if (!savedState) return false;

  console.log('Restoring music state:', savedState);

  setMusicSelected(savedState.currentUrl);
  applyMusicSelectionToUI(savedState.currentUrl);

  // Garante que a sincronização esteja habilitada após restauração
  reEnableSync();

  // Carrega o vídeo no player sem tocar automaticamente
  if (savedState.currentUrl && savedState.currentUrl.startsWith('http')) {
    setTimeout(() => {
      console.log('Loading YouTube video for restoration:', savedState.currentUrl);
      loadYouTubeVideoWithoutAutoplay(savedState.currentUrl);
    }, 1000); // Aguarda um pouco para garantir que a API do YouTube esteja pronta
  }

  console.log('Music state restored successfully');
  return true;
}