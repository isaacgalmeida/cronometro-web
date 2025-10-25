/**
 * Gerenciador de MP3 personalizado
 */

import { saveConfig, loadConfig, removeConfig } from './cache-manager.js';
import { showImageStatus } from './ui-manager.js';

// Chaves específicas para MP3
const MP3_STORAGE_KEY = 'cronometro_custom_mp3_data';
const MP3_INFO_KEY = 'cronometro_custom_mp3_info';

// Estado do MP3
let mp3Data = null;
let customMp3Player = null;

/**
 * Inicializa upload de MP3 personalizado
 */
export function initializeMp3Upload() {
  const mp3Upload = document.getElementById('mp3Upload');
  const mp3Preview = document.getElementById('mp3Preview');
  const previewAudio = document.getElementById('previewAudio');
  const applyMp3Btn = document.getElementById('applyMp3');
  const removeMp3Btn = document.getElementById('removeMp3');
  const playMp3Btn = document.getElementById('playMp3');

  if (!mp3Upload) return;

  // Carrega MP3 salvo
  loadSavedMp3();

  // Upload de MP3
  mp3Upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validação do arquivo
    if (!file.type.startsWith('audio/')) {
      showImageStatus('❌ Por favor, selecione apenas arquivos de áudio.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      showImageStatus('❌ O arquivo de áudio deve ter no máximo 10MB.', 'error');
      return;
    }

    // Lê o arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      const audioData = e.target.result;

      // Mostra preview
      previewAudio.src = audioData;
      mp3Preview.classList.remove('hidden');
      applyMp3Btn.disabled = false;

      showImageStatus('✅ Áudio carregado. Clique em "Aplicar" para usar.', 'success');
    };

    reader.onerror = () => {
      showImageStatus('❌ Erro ao carregar o arquivo de áudio.', 'error');
    };

    reader.readAsDataURL(file);
  });

  // Aplicar MP3
  if (applyMp3Btn) {
    applyMp3Btn.addEventListener('click', () => {
      const audioData = previewAudio.src;
      const file = mp3Upload.files[0];
      if (audioData && file) {
        saveMp3Data(audioData, {
          name: file.name,
          size: file.size,
          type: file.type
        });
        applyMp3(audioData, file.name);
        showImageStatus('✅ MP3 aplicado com sucesso!', 'success');
      }
    });
  }

  // Remover MP3
  if (removeMp3Btn) {
    removeMp3Btn.addEventListener('click', () => {
      removeMp3Data();
      showImageStatus('🗑️ MP3 personalizado removido.', 'info');
    });
  }

  // Play MP3
  if (playMp3Btn) {
    playMp3Btn.addEventListener('click', () => {
      if (mp3Data) {
        playMp3();
      }
    });
  }
}

/**
 * Salva dados do MP3
 * @param {string} audioData - Dados do áudio em base64
 * @param {Object} fileInfo - Informações do arquivo
 */
function saveMp3Data(audioData, fileInfo) {
  try {
    saveConfig(MP3_STORAGE_KEY, audioData);
    saveConfig(MP3_INFO_KEY, fileInfo);
    mp3Data = audioData;
    console.log('MP3 data saved');
  } catch (error) {
    console.error('Erro ao salvar MP3:', error);
    showImageStatus('❌ Erro ao salvar MP3. Tente um arquivo menor.', 'error');
  }
}

/**
 * Carrega MP3 salvo
 */
function loadSavedMp3() {
  try {
    const savedMp3 = loadConfig(MP3_STORAGE_KEY);
    const savedInfo = loadConfig(MP3_INFO_KEY);

    if (savedMp3 && savedInfo) {
      mp3Data = savedMp3;
      applyMp3(savedMp3, savedInfo.name);
      showImageStatus('🎵 MP3 personalizado carregado.', 'info');
    }
  } catch (error) {
    console.error('Error loading saved MP3:', error);
  }
}

/**
 * Aplica MP3 personalizado
 * @param {string} audioData - Dados do áudio
 * @param {string} fileName - Nome do arquivo
 */
function applyMp3(audioData, fileName) {
  const mp3PlayerContainer = document.getElementById('mp3PlayerContainer');
  const mp3Player = document.getElementById('mp3Player');

  if (mp3PlayerContainer && mp3Player && audioData) {
    mp3Player.src = audioData;
    mp3Player.loop = true;
    mp3PlayerContainer.classList.remove('hidden');

    // Armazena os dados
    mp3Data = audioData;
    customMp3Player = mp3Player;

    console.log('MP3 aplicado:', fileName);
  }
}

/**
 * Reproduz MP3 personalizado
 */
export function playMp3() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player && mp3Data) {
    try {
      // Para qualquer música do YouTube que esteja tocando
      const musicPlayer = document.getElementById('musicPlayer');
      if (musicPlayer) {
        musicPlayer.src = '';
        musicPlayer.style.width = '0';
        musicPlayer.style.height = '0';
      }

      // Reproduz o MP3
      mp3Player.play().then(() => {
        console.log('MP3 started playing');
      }).catch(error => {
        console.error('Erro ao reproduzir MP3:', error);
      });
    } catch (error) {
      console.error('Erro ao reproduzir MP3:', error);
    }
  }
}

/**
 * Retoma MP3 personalizado
 */
export function resumeMp3() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player && mp3Player.paused && mp3Data) {
    mp3Player.play().then(() => {
      console.log('MP3 resumed');
    }).catch(error => {
      console.error('Erro ao retomar MP3:', error);
    });
  }
}

/**
 * Para MP3 personalizado
 */
export function stopMp3() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player) {
    mp3Player.pause();
    mp3Player.currentTime = 0;
    console.log('MP3 stopped');
  }
}

/**
 * Pausa MP3 personalizado
 */
export function pauseMp3() {
  const mp3Player = document.getElementById('mp3Player');

  if (mp3Player && !mp3Player.paused) {
    mp3Player.pause();
    console.log('MP3 paused');
  }
}

/**
 * Remove dados do MP3
 */
function removeMp3Data() {
  try {
    removeConfig(MP3_STORAGE_KEY);
    removeConfig(MP3_INFO_KEY);

    // Para o player
    stopMp3();

    // Limpa os dados
    mp3Data = null;
    customMp3Player = null;

    // Esconde a seção do player
    const mp3PlayerContainer = document.getElementById('mp3PlayerContainer');
    if (mp3PlayerContainer) {
      mp3PlayerContainer.classList.add('hidden');
    }

    // Limpa preview
    const mp3Preview = document.getElementById('mp3Preview');
    if (mp3Preview) {
      mp3Preview.classList.add('hidden');
    }

    // Reset input
    const mp3Upload = document.getElementById('mp3Upload');
    if (mp3Upload) {
      mp3Upload.value = '';
    }

    console.log('MP3 data removed');
  } catch (error) {
    console.error('Error removing MP3 data:', error);
  }
}

/**
 * Verifica se há MP3 personalizado disponível
 * @returns {boolean}
 */
export function hasMp3Data() {
  return !!mp3Data;
}

/**
 * Obtém dados do MP3
 * @returns {string|null}
 */
export function getMp3Data() {
  return mp3Data;
}

/**
 * Atualiza estado de loop do MP3
 */
export function updateMp3LoopState() {
  const mp3Player = document.getElementById('mp3Player');
  if (mp3Player) {
    mp3Player.loop = true; // Sempre mantém loop ativo
  }
}

// Torna mp3Data disponível globalmente para compatibilidade
if (typeof window !== 'undefined') {
  // Define getter/setter para manter sincronização
  Object.defineProperty(window, 'mp3Data', {
    get: () => mp3Data,
    set: (value) => { mp3Data = value; },
    configurable: true
  });
}