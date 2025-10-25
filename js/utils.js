/**
 * Utilitários gerais do cronômetro
 */

/**
 * Extrai o ID do vídeo de uma URL do YouTube
 * @param {string} url - URL do YouTube
 * @returns {string} - ID do vídeo ou string vazia
 */
export function extractVideoId(url) {
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

/**
 * Valida se uma URL é um link válido do YouTube
 * @param {string} url - URL para validar
 * @returns {boolean} - true se válida
 */
export function isValidYouTubeUrl(url) {
  if (!url) return false;
  const videoId = extractVideoId(url);
  return !!videoId;
}

/**
 * Formata tempo em segundos para MM:SS
 * @param {number} seconds - Segundos para formatar
 * @returns {string} - Tempo formatado
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Mostra notificação do navegador
 * @param {string} title - Título da notificação
 * @param {string} message - Mensagem da notificação
 */
export function showNotification(title, message) {
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
}

/**
 * Debounce function para limitar execução de funções
 * @param {Function} func - Função para fazer debounce
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} - Função com debounce
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Carrega dados JSON de um arquivo
 * @param {string} filename - Nome do arquivo JSON
 * @returns {Promise<any>} - Dados carregados
 */
export async function loadJsonData(filename) {
  try {
    const response = await fetch(filename, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Erro ao carregar ${filename}:`, error);
    return null;
  }
}