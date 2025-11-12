/**
 * Gerenciador da interface do usuário
 */

import { formatTime } from './utils.js';

/**
 * Atualiza o display do timer
 * @param {Object} timerState - Estado do timer
 */
export function updateTimerDisplay(timerState) {
  const timerEl = document.getElementById('timer');
  if (timerEl) {
    timerEl.textContent = timerState.formattedTime;
  }

  const statusEl = document.getElementById('timer-status');
  if (statusEl) {
    if (timerState.isRunning) {
      statusEl.textContent = '';
    } else if (timerState.timeLeft > 0) {
      statusEl.textContent = 'Timer pausado';
    } else {
      statusEl.textContent = 'Defina um tempo para começar';
    }
  }

  // Mostra/esconde o aviso divertido DURANTE execução
  const runFun = document.getElementById('run-fun');
  if (runFun) {
    if (timerState.isRunning && timerState.timeLeft > 0) {
      runFun.classList.remove('hidden');
    } else {
      runFun.classList.add('hidden');
    }
  }
}

/**
 * Atualiza estados dos botões do timer
 * @param {string} state - Estado atual (running, paused, stopped)
 */
export function updateButtonStates(state) {
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
  }
}

/**
 * Atualiza classes CSS do body baseado no estado do timer
 * @param {boolean} isRunning - Se o timer está rodando
 */
export function updateBodyClasses(isRunning) {
  if (isRunning) {
    document.body.classList.add('timer-running');
  } else {
    document.body.classList.remove('timer-running');
  }
}

/**
 * Mostra status da música
 * @param {string} message - Mensagem a exibir
 * @param {boolean} persistent - Se deve persistir a mensagem
 */
export function showMusicStatus(message, persistent = false) {
  let statusEl = document.getElementById('musicStatus');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'musicStatus';
    statusEl.className = 'music-status';
    statusEl.style.cssText = `
      padding: 8px 12px;
      margin: 8px 0;
      border-radius: 4px;
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      color: #0c4a6e;
      font-size: 14px;
      transition: opacity 0.3s ease;
      opacity: 0;
    `;

    // Adiciona após o player de música
    const musicPlayer = document.getElementById('musicPlayer');
    if (musicPlayer && musicPlayer.parentNode) {
      musicPlayer.parentNode.insertBefore(statusEl, musicPlayer.nextSibling);
    } else {
      // Fallback: adiciona após controles de música ou no body
      const musicSection = document.querySelector('.music-controls') ||
        document.querySelector('[data-music-section]') ||
        document.body;
      musicSection.appendChild(statusEl);
    }
  }

  statusEl.textContent = message;
  statusEl.style.opacity = '1';
  statusEl.classList.add('show');

  if (!persistent) {
    setTimeout(() => {
      statusEl.style.opacity = '0';
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, 300);
    }, 4000); // Mostra por mais tempo para dar tempo de ler
  }
}

/**
 * Atualiza display do status de sincronização
 */
export function updateSyncStatusDisplay() {
  const statusEl = document.getElementById('musicStatus');
  if (!statusEl) return;

  // Lógica para mostrar status de sincronização seria implementada aqui
  // baseada no estado da música e timer
}

/**
 * Mostra erro de sincronização
 * @param {string} error - Mensagem de erro
 */
export function showSyncError(error) {
  showMusicStatus(`❌ Erro na música: ${error}. Timer continua normalmente.`, false);
  console.error('Music sync error:', error);
}

/**
 * Mostra status de imagem personalizada
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo da mensagem (success, error, info)
 */
export function showImageStatus(message, type = 'info') {
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

/**
 * Aplica efeito visual de timer finalizado
 */
export function showTimerFinishedEffect() {
  const timerEl = document.getElementById('timer');
  if (timerEl) {
    timerEl.classList.add('timer-finished');
    setTimeout(() => {
      timerEl.classList.remove('timer-finished');
    }, 5000);
  }

  const statusEl = document.getElementById('timer-status');
  if (statusEl) {
    statusEl.textContent = '⏰ Tempo esgotado!';
  }
}

/**
 * Limpa campos de tempo personalizado
 */
export function clearCustomTimeInputs() {
  const customMinutes = document.getElementById('customMinutes');
  const customSeconds = document.getElementById('customSeconds');

  if (customMinutes) {
    customMinutes.value = '';
  }

  if (customSeconds) {
    customSeconds.value = '';
  }
}

/**
 * Aplica imagem personalizada como fundo
 * @param {string} imageData - Dados da imagem em base64
 */
export function applyCustomImage(imageData) {
  const customImageDisplay = document.getElementById('customImageDisplay');
  const displayedImage = document.getElementById('displayedImage');
  const mainContent = document.querySelector('main#conteudo');
  
  // Procura o primeiro card do timer (logo após o customImageDisplay)
  const timerCard = customImageDisplay ? customImageDisplay.nextElementSibling : null;

  if (customImageDisplay && displayedImage && imageData) {
    displayedImage.src = imageData;
    customImageDisplay.classList.remove('hidden');

    // Aplica layout lado a lado
    if (mainContent) {
      mainContent.classList.add('image-timer-layout');
      mainContent.classList.remove('flex-col', 'items-center', 'justify-center');
    }

    // Envolve o timer card em um wrapper se ainda não existir
    if (timerCard && !timerCard.classList.contains('timer-card-wrapper')) {
      // Verifica se já não está dentro de um wrapper
      if (!timerCard.parentElement.classList.contains('timer-card-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'timer-card-wrapper';
        timerCard.parentNode.insertBefore(wrapper, timerCard);
        wrapper.appendChild(timerCard);
        
        // Ajusta o posicionamento dos cards seguintes após o timer ser renderizado
        setTimeout(() => {
          adjustCardsPosition();
        }, 100);
      }
    }

    document.body.classList.add('timer-with-image');
    console.log('Custom image applied with side-by-side layout');
  }
}

/**
 * Ajusta a posição dos cards após o timer
 */
function adjustCardsPosition() {
  const timerWrapper = document.querySelector('.timer-card-wrapper');
  const firstCardAfterTimer = timerWrapper ? timerWrapper.nextElementSibling : null;
  
  if (timerWrapper && firstCardAfterTimer) {
    const timerHeight = timerWrapper.offsetHeight;
    firstCardAfterTimer.style.marginTop = `${timerHeight + 32}px`; // 32px = 2rem
  }
}

/**
 * Remove imagem personalizada
 */
export function removeCustomImage() {
  const customImageDisplay = document.getElementById('customImageDisplay');
  const imagePreview = document.getElementById('imagePreview');
  const imageUpload = document.getElementById('imageUpload');
  const applyImageBtn = document.getElementById('applyImage');
  const mainContent = document.querySelector('main#conteudo');
  const timerCardWrapper = document.querySelector('.timer-card-wrapper');

  if (customImageDisplay) {
    customImageDisplay.classList.add('hidden');
  }

  // Remove layout lado a lado
  if (mainContent) {
    mainContent.classList.remove('image-timer-layout');
    mainContent.classList.add('flex-col', 'items-center', 'justify-center');
  }

  // Remove o wrapper do timer card se existir
  if (timerCardWrapper) {
    const timerCard = timerCardWrapper.firstElementChild;
    if (timerCard) {
      timerCardWrapper.parentNode.insertBefore(timerCard, timerCardWrapper);
    }
    timerCardWrapper.remove();
  }

  if (imagePreview) {
    imagePreview.classList.add('hidden');
  }

  if (imageUpload) {
    imageUpload.value = '';
  }

  if (applyImageBtn) {
    applyImageBtn.disabled = true;
  }

  document.body.classList.remove('timer-with-image');
  console.log('Custom image removed');
}

/**
 * Aplica texto selecionado para execução
 * @param {string} text - Texto a ser aplicado
 */
export function applySelectedRunText(text) {
  const el = document.querySelector('#run-fun .run-text');
  if (el && text) {
    el.textContent = text;
  }
}

/**
 * Renderiza opções de mensagens personalizáveis
 * @param {Array} allMessages - Todas as mensagens disponíveis
 * @param {string} savedMessage - Mensagem salva atualmente
 * @param {Function} onMessageSelect - Callback para seleção de mensagem
 * @param {Function} onAddCustom - Callback para adicionar mensagem personalizada
 * @param {Function} onClearCustom - Callback para limpar mensagens personalizadas
 * @param {boolean} hasCustomMessages - Se há mensagens personalizadas
 */
export function renderRunMessageOptions(allMessages, savedMessage, onMessageSelect, onAddCustom, onClearCustom, hasCustomMessages) {
  const container = document.getElementById('messageOptions');
  if (!container) return;

  container.innerHTML = '';

  // Cria pills para todas as mensagens
  allMessages.forEach((msg) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'msg-option' + (savedMessage === msg ? ' active' : '');
    pill.textContent = msg;

    pill.addEventListener('click', () => {
      // Marca visualmente
      [...container.children].forEach(c => c.classList.remove('active'));
      pill.classList.add('active');
      onMessageSelect(msg);
    });

    container.appendChild(pill);
  });

  // Botão para adicionar mensagem personalizada
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'msg-option';
  addBtn.textContent = '➕ Personalizar';
  addBtn.title = 'Criar sua própria mensagem';
  addBtn.addEventListener('click', onAddCustom);
  container.appendChild(addBtn);

  // Botão para limpar personalizadas (só aparece se houver)
  if (hasCustomMessages) {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'msg-option';
    clearBtn.textContent = '🗑️ Limpar personalizadas';
    clearBtn.title = 'Remover todas as mensagens personalizadas';
    clearBtn.addEventListener('click', onClearCustom);
    container.appendChild(clearBtn);
  }
}