/**
 * Music Cards Manager
 * Gerencia a interface de cards de música com categorias e busca
 */

import { playYouTube, handleManualMusicControl, stopMusic } from './music-manager.js';

console.log('Music Cards module loaded');

/**
 * Inicializa o sistema de cards de música
 */
export function initializeMusicCards(backgroundMusic) {
  console.log('Initializing music cards with', backgroundMusic.length, 'songs');
  
  const musicGrid = document.getElementById('musicGrid');
  if (!musicGrid) {
    console.warn('Elemento musicGrid não encontrado - usando fallback para select');
    return false;
  }

  // Limpa o grid
  musicGrid.innerHTML = '';

  if (!backgroundMusic.length) return false;

  // Cria filtros de categoria
  createCategoryFilters(backgroundMusic);

  // Cria os cards de música
  backgroundMusic.forEach((music) => {
    const card = createMusicCard(music);
    musicGrid.appendChild(card);
  });

  // Atualiza contador
  updateMusicCount();

  // Inicializa os event listeners
  initializeMusicGridListeners();

  console.log('Music cards initialized successfully');
  return true;
}

/**
 * Cria os filtros de categoria
 */
function createCategoryFilters(backgroundMusic) {
  const filterContainer = document.getElementById('categoryFilters');
  if (!filterContainer) return;

  // Extrai categorias únicas
  const categories = [...new Set(backgroundMusic.map(m => m.category || 'geral'))];
  categories.sort();

  // Limpa filtros existentes (exceto o botão "Todas")
  const allButton = filterContainer.querySelector('[data-category="all"]');
  filterContainer.innerHTML = '';
  if (allButton) {
    filterContainer.appendChild(allButton);
  }

  // Cria botões de categoria
  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-filter';
    button.dataset.category = category;
    button.textContent = category;
    
    button.addEventListener('click', () => {
      filterByCategory(category);
    });

    filterContainer.appendChild(button);
  });
}

/**
 * Cria um card de música
 */
function createMusicCard(music) {
  const card = document.createElement('div');
  card.className = 'music-card';
  card.dataset.url = music.youtubeUrl || music.url || '';
  card.dataset.title = music.title || 'Sem título';
  card.dataset.duration = music.duration || '';
  card.dataset.category = music.category || 'geral';

  // Extrai o emoji do título
  const titleMatch = music.title.match(/^([\u{1F300}-\u{1F9FF}])\s*(.+)$/u);
  const emoji = titleMatch ? titleMatch[1] : '🎵';
  const titleText = titleMatch ? titleMatch[2] : music.title;

  card.innerHTML = `
    <div class="music-card-icon">${emoji}</div>
    <div class="music-card-content">
      <div class="music-card-title" title="${titleText}">${titleText}</div>
      <div class="music-card-info">
        <span class="music-card-category">${music.category || 'geral'}</span>
        <span class="music-card-duration">
          <i data-lucide="clock" class="w-3 h-3"></i>
          ${music.duration || 'N/A'}
        </span>
      </div>
    </div>
  `;

  // Event listener para seleção
  card.addEventListener('click', () => {
    selectMusicCard(card);
  });

  return card;
}

/**
 * Seleciona um card de música e toca a música
 */
function selectMusicCard(card) {
  const url = card.dataset.url;
  const title = card.dataset.title;
  const duration = card.dataset.duration;

  console.log('Music card selected:', { url, title, duration });

  // Remove seleção anterior
  document.querySelectorAll('.music-card').forEach(c => c.classList.remove('selected'));

  // Adiciona seleção ao card clicado
  card.classList.add('selected');

  // Atualiza o display de música selecionada
  updateSelectedMusicDisplay(title, duration);

  // Fecha o painel após seleção
  const musicPanel = document.getElementById('musicPanel');
  const toggleIcon = document.getElementById('toggleMusicIcon');
  const toggleText = document.getElementById('toggleMusicText');
  
  if (musicPanel) {
    musicPanel.classList.add('hidden');
    if (toggleIcon) toggleIcon.classList.remove('rotated');
    if (toggleText) toggleText.textContent = 'Escolher Música de Fundo';
  }

  // Toca a música
  if (url) {
    console.log('Attempting to play music:', url);
    try {
      handleManualMusicControl();
      playYouTube(url);
      console.log('Music playback initiated');
    } catch (error) {
      console.error('Error playing music:', error);
    }
  } else {
    console.warn('No URL found for selected music card');
  }
}

/**
 * Atualiza o display de música selecionada
 */
function updateSelectedMusicDisplay(title, duration) {
  const titleEl = document.getElementById('selectedMusicTitle');
  const durationEl = document.getElementById('selectedMusicDuration');
  const clearBtn = document.getElementById('clearMusicSelection');

  if (titleEl) {
    titleEl.textContent = title;
  }
  
  if (durationEl) {
    durationEl.textContent = duration;
  }

  if (clearBtn) {
    clearBtn.classList.remove('hidden');
  }
}

/**
 * Limpa a seleção de música
 */
function clearMusicSelection() {
  // Remove seleção de todos os cards
  document.querySelectorAll('.music-card').forEach(c => c.classList.remove('selected'));

  // Atualiza o display
  const titleEl = document.getElementById('selectedMusicTitle');
  const durationEl = document.getElementById('selectedMusicDuration');
  const clearBtn = document.getElementById('clearMusicSelection');

  if (titleEl) {
    titleEl.textContent = 'Nenhuma música selecionada';
  }
  
  if (durationEl) {
    durationEl.textContent = '';
  }

  if (clearBtn) {
    clearBtn.classList.add('hidden');
  }

  // Para a música
  stopMusic();
}

/**
 * Filtra músicas por categoria
 */
function filterByCategory(category) {
  const cards = document.querySelectorAll('.music-card');
  const filters = document.querySelectorAll('.category-filter');

  // Atualiza botões ativos
  filters.forEach(f => f.classList.remove('active'));
  const activeFilter = document.querySelector(`[data-category="${category}"]`);
  if (activeFilter) {
    activeFilter.classList.add('active');
  }

  // Filtra cards
  if (category === 'all') {
    cards.forEach(card => card.style.display = 'flex');
  } else {
    cards.forEach(card => {
      if (card.dataset.category === category) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  updateMusicCount();
}

/**
 * Atualiza o contador de músicas
 */
function updateMusicCount() {
  const countEl = document.getElementById('musicCount');
  if (!countEl) return;

  const visibleCards = document.querySelectorAll('.music-card:not([style*="display: none"])');
  const total = document.querySelectorAll('.music-card').length;
  
  if (visibleCards.length === total) {
    countEl.textContent = `${total} músicas`;
  } else {
    countEl.textContent = `${visibleCards.length} de ${total} músicas`;
  }
}

/**
 * Inicializa os event listeners do grid de músicas
 */
function initializeMusicGridListeners() {
  // Toggle do painel de músicas
  const toggleBtn = document.getElementById('toggleMusicGrid');
  const musicPanel = document.getElementById('musicPanel');
  const toggleText = document.getElementById('toggleMusicText');
  const toggleIcon = document.getElementById('toggleMusicIcon');

  if (toggleBtn && musicPanel) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = musicPanel.classList.contains('hidden');
      
      if (isHidden) {
        musicPanel.classList.remove('hidden');
        toggleText.textContent = 'Fechar Seleção';
        toggleIcon.classList.add('rotated');
      } else {
        musicPanel.classList.add('hidden');
        toggleText.textContent = 'Escolher Música de Fundo';
        toggleIcon.classList.remove('rotated');
      }

      // Atualiza os ícones do Lucide
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  }

  // Busca/filtro de músicas
  const searchInput = document.getElementById('musicSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.music-card');

      cards.forEach(card => {
        const title = card.dataset.title.toLowerCase();
        const category = card.dataset.category.toLowerCase();
        
        if (title.includes(searchTerm) || category.includes(searchTerm)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      updateMusicCount();
    });
  }

  // Limpar seleção
  const clearBtn = document.getElementById('clearMusicSelection');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearMusicSelection();
    });
  }

  // Filtro "Todas"
  const allFilter = document.querySelector('[data-category="all"]');
  if (allFilter) {
    allFilter.addEventListener('click', () => {
      filterByCategory('all');
    });
  }

  // Atualiza os ícones do Lucide
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
