/**
 * Gerenciador de MP3 personalizado com IndexedDB
 */

import { showImageStatus } from './ui-manager.js';

// Configuração do IndexedDB
const DB_NAME = 'CronometroMP3DB';
const DB_VERSION = 1;
const STORE_NAME = 'mp3Files';

// Estado do MP3
let mp3Data = null;
let customMp3Player = null;
let db = null;

/**
 * Inicializa o IndexedDB
 */
async function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Erro ao abrir IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB inicializado com sucesso');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Cria object store se não existir
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        console.log('Object store criado');
      }
    };
  });
}

/**
 * Salva MP3 no IndexedDB
 */
async function saveMp3ToIndexedDB(audioBlob, fileInfo) {
  try {
    if (!db) await initIndexedDB();

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const mp3Record = {
      id: 'custom_mp3',
      audioBlob: audioBlob,
      fileInfo: fileInfo,
      timestamp: Date.now()
    };

    const request = store.put(mp3Record);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('MP3 salvo no IndexedDB com sucesso');
        resolve();
      };

      request.onerror = () => {
        console.error('Erro ao salvar MP3 no IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Erro ao salvar MP3:', error);
    throw error;
  }
}

/**
 * Carrega MP3 do IndexedDB
 */
async function loadMp3FromIndexedDB() {
  try {
    if (!db) await initIndexedDB();

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('custom_mp3');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          console.log('MP3 carregado do IndexedDB');
          resolve(request.result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Erro ao carregar MP3 do IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Erro ao carregar MP3:', error);
    return null;
  }
}

/**
 * Remove MP3 do IndexedDB
 */
async function removeMp3FromIndexedDB() {
  try {
    if (!db) await initIndexedDB();

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('custom_mp3');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('MP3 removido do IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Erro ao remover MP3 do IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Erro ao remover MP3:', error);
    throw error;
  }
}

/**
 * Inicializa upload de MP3 personalizado
 */
export async function initializeMp3Upload() {
  try {
    // Inicializa IndexedDB
    await initIndexedDB();

    const mp3Upload = document.getElementById('mp3Upload');
    const mp3Preview = document.getElementById('mp3Preview');
    const previewAudio = document.getElementById('previewAudio');
    const applyMp3Btn = document.getElementById('applyMp3');
    const removeMp3Btn = document.getElementById('removeMp3');
    const playMp3Btn = document.getElementById('playMp3');

    if (!mp3Upload) return;

    // Carrega MP3 salvo
    await loadSavedMp3();

    // Upload de MP3
    mp3Upload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validação do arquivo
      if (!file.type.startsWith('audio/')) {
        showImageStatus('❌ Por favor, selecione apenas arquivos de áudio.', 'error');
        return;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB para IndexedDB
        showImageStatus('❌ O arquivo de áudio deve ter no máximo 50MB.', 'error');
        return;
      }

      try {
        // Converte arquivo para blob
        const audioBlob = new Blob([file], { type: file.type });

        // Cria URL para preview
        const audioUrl = URL.createObjectURL(audioBlob);
        previewAudio.src = audioUrl;
        mp3Preview.classList.remove('hidden');
        applyMp3Btn.disabled = false;

        // Armazena temporariamente para aplicação
        previewAudio.tempBlob = audioBlob;
        previewAudio.tempFileInfo = {
          name: file.name,
          size: file.size,
          type: file.type
        };

        showImageStatus('✅ Áudio carregado. Clique em "Aplicar" para salvar.', 'success');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        showImageStatus('❌ Erro ao processar arquivo de áudio.', 'error');
      }
    });

    // Aplicar MP3
    if (applyMp3Btn) {
      applyMp3Btn.addEventListener('click', async () => {
        const audioBlob = previewAudio.tempBlob;
        const fileInfo = previewAudio.tempFileInfo;

        if (audioBlob && fileInfo) {
          try {
            await saveMp3ToIndexedDB(audioBlob, fileInfo);
            await applyMp3(audioBlob, fileInfo.name);
            showImageStatus('✅ MP3 salvo com sucesso!', 'success');
          } catch (error) {
            console.error('Erro ao salvar MP3:', error);
            showImageStatus('❌ Erro ao salvar MP3.', 'error');
          }
        }
      });
    }

    // Remover MP3
    if (removeMp3Btn) {
      removeMp3Btn.addEventListener('click', async () => {
        try {
          await removeMp3Data();
          showImageStatus('🗑️ MP3 personalizado removido.', 'info');
        } catch (error) {
          console.error('Erro ao remover MP3:', error);
          showImageStatus('❌ Erro ao remover MP3.', 'error');
        }
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
  } catch (error) {
    console.error('Erro ao inicializar MP3 upload:', error);
  }
}

/**
 * Carrega MP3 salvo
 */
async function loadSavedMp3() {
  try {
    const savedMp3 = await loadMp3FromIndexedDB();

    if (savedMp3 && savedMp3.audioBlob) {
      await applyMp3(savedMp3.audioBlob, savedMp3.fileInfo.name);
      showImageStatus('🎵 MP3 personalizado carregado.', 'info');
    }
  } catch (error) {
    console.error('Erro ao carregar MP3 salvo:', error);
  }
}

/**
 * Aplica MP3 personalizado
 * @param {Blob} audioBlob - Dados do áudio
 * @param {string} fileName - Nome do arquivo
 */
async function applyMp3(audioBlob, fileName) {
  const mp3PlayerContainer = document.getElementById('mp3PlayerContainer');
  const mp3Player = document.getElementById('mp3Player');

  if (mp3PlayerContainer && mp3Player && audioBlob) {
    // Cria URL do blob para o player
    const audioUrl = URL.createObjectURL(audioBlob);

    mp3Player.src = audioUrl;
    mp3Player.loop = true;
    mp3PlayerContainer.classList.remove('hidden');

    // Armazena os dados
    mp3Data = audioUrl;
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
async function removeMp3Data() {
  try {
    await removeMp3FromIndexedDB();

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

/**
 * Limpa dados do MP3 do IndexedDB (para reset completo)
 */
export async function clearMp3Data() {
  try {
    await removeMp3FromIndexedDB();
    mp3Data = null;
    customMp3Player = null;
    console.log('MP3 data cleared from IndexedDB');
  } catch (error) {
    console.error('Error clearing MP3 data:', error);
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