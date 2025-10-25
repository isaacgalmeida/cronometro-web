/**
 * Gerenciador de mensagens personalizáveis
 */

import { loadJsonData } from './utils.js';
import { CACHE_KEYS, loadConfig, saveConfig } from './cache-manager.js';
import { renderRunMessageOptions, applySelectedRunText } from './ui-manager.js';

// Dados de mensagens
let runMessages = [];

/**
 * Carrega mensagens do arquivo JSON
 */
export async function loadRunMessages() {
  try {
    const data = await loadJsonData('messages.json');
    runMessages = Array.isArray(data) ? data : (data?.messages || []);
    if (!Array.isArray(runMessages)) runMessages = [];
  } catch (error) {
    console.error('Erro ao carregar messages.json:', error);
    runMessages = [];
  }

  renderMessageOptions();
  // Aplica a seleção persistida ou primeira opção
  const savedText = getSavedRunText();
  const allMessages = getAllMessages();
  const textToApply = savedText || allMessages[0] || 'Estamos no ritmo! 💨';
  applySelectedRunText(textToApply);
}

/**
 * Obtém mensagem salva
 * @returns {string} - Mensagem salva
 */
function getSavedRunText() {
  return loadConfig(CACHE_KEYS.RUN_TEXT_SELECTED, '');
}

/**
 * Salva mensagem selecionada
 * @param {string} text - Texto a salvar
 */
function saveRunText(text) {
  saveConfig(CACHE_KEYS.RUN_TEXT_SELECTED, text);
}

/**
 * Obtém mensagens personalizadas
 * @returns {Array} - Array de mensagens personalizadas
 */
function getCustomMessages() {
  return loadConfig(CACHE_KEYS.RUN_TEXT_CUSTOMS, []);
}

/**
 * Salva mensagens personalizadas
 * @param {Array} messages - Array de mensagens
 */
function saveCustomMessages(messages) {
  saveConfig(CACHE_KEYS.RUN_TEXT_CUSTOMS, messages);
}

/**
 * Obtém todas as mensagens (JSON + personalizadas)
 * @returns {Array} - Array com todas as mensagens
 */
function getAllMessages() {
  const base = runMessages.slice();
  const customs = getCustomMessages();
  const set = new Set(base.concat(customs).map(s => (s || '').trim()).filter(Boolean));
  return Array.from(set);
}

/**
 * Renderiza opções de mensagens na interface
 */
function renderMessageOptions() {
  const allMessages = getAllMessages();
  const savedMessage = getSavedRunText();
  const hasCustomMessages = getCustomMessages().length > 0;

  renderRunMessageOptions(
    allMessages,
    savedMessage,
    handleMessageSelect,
    addCustomMessage,
    clearCustomMessages,
    hasCustomMessages
  );
}

/**
 * Manipula seleção de mensagem
 * @param {string} message - Mensagem selecionada
 */
function handleMessageSelect(message) {
  saveRunText(message);
  applySelectedRunText(message);
}

/**
 * Adiciona mensagem personalizada
 */
function addCustomMessage() {
  const text = (prompt('Digite sua mensagem (máx. 120 caracteres):') || '').trim();
  if (!text) return;

  const clean = text.slice(0, 120);
  const customs = getCustomMessages();

  // Evita duplicatas (case-insensitive)
  if (!customs.find(m => m.toLowerCase() === clean.toLowerCase())) {
    customs.push(clean);
    saveCustomMessages(customs);
  }

  // Seleciona imediatamente a nova mensagem
  saveRunText(clean);
  applySelectedRunText(clean);
  renderMessageOptions();
}

/**
 * Limpa mensagens personalizadas
 */
function clearCustomMessages() {
  const customs = getCustomMessages();
  if (!customs.length) return;

  const confirmed = confirm('Deseja apagar TODAS as mensagens personalizadas? Esta ação não pode ser desfeita.');
  if (!confirmed) return;

  // Limpa todas as personalizadas
  saveCustomMessages([]);

  // Se a selecionada era personalizada, escolher fallback
  const selected = getSavedRunText();
  const allNow = getAllMessages(); // Agora só as do JSON
  if (!allNow.includes(selected)) {
    const fallback = allNow[0] || 'Estamos no ritmo! 💨';
    saveRunText(fallback);
    applySelectedRunText(fallback);
  }

  renderMessageOptions();
}

/**
 * Reseta seleção de mensagem para a primeira opção
 */
export function resetRunMessageSelection() {
  const allMessages = getAllMessages();
  if (allMessages.length > 0) {
    const firstMessage = allMessages[0];
    saveRunText(firstMessage);
    applySelectedRunText(firstMessage);
    renderMessageOptions();
  }
}