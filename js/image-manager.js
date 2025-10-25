/**
 * Gerenciador de imagens personalizadas e slideshow
 */

import { loadJsonData } from './utils.js';
import { CACHE_KEYS, loadConfig, saveConfig, removeConfig } from './cache-manager.js';
import { showImageStatus, applyCustomImage, removeCustomImage } from './ui-manager.js';

// Dados de imagens
let backgroundImages = [];
let currentSlide = 0;
let slides = [];

/**
 * Carrega imagens de fundo do JSON
 */
export async function loadBackgroundImages() {
  try {
    const data = await loadJsonData('images.json');
    backgroundImages = data?.backgroundImages || [];
    createSlideshow();
  } catch (error) {
    console.error('Erro ao carregar imagens:', error);
    // Fallback para uma imagem padrão
    backgroundImages = [{
      id: 1,
      url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&h=800&fit=crop&crop=center',
      alt: 'Estudantes em sala de aula',
      category: 'classroom'
    }];
    createSlideshow();
  }
}

/**
 * Cria slideshow de fundo
 */
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

/**
 * Próximo slide
 */
function nextSlide() {
  if (slides.length === 0) return;

  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}

/**
 * Inicia slideshow automático
 */
function startSlideshow() {
  setInterval(nextSlide, 10000); // Muda a cada 10 segundos
}

/**
 * Inicializa upload de imagem personalizada
 */
export function initializeImageUpload() {
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const applyImageBtn = document.getElementById('applyImage');
  const removeImageBtn = document.getElementById('removeImage');

  if (!imageUpload) return;

  // Carrega imagem salva
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
  if (applyImageBtn) {
    applyImageBtn.addEventListener('click', () => {
      const imageData = previewImg.src;
      if (imageData) {
        saveCustomImage(imageData);
        applyCustomImage(imageData);
        showImageStatus('✅ Imagem aplicada como fundo!', 'success');
      }
    });
  }

  // Remover imagem
  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
      removeCustomImageData();
      showImageStatus('🗑️ Imagem de fundo removida.', 'info');
    });
  }
}

/**
 * Salva imagem personalizada
 * @param {string} imageData - Dados da imagem em base64
 */
function saveCustomImage(imageData) {
  try {
    saveConfig(CACHE_KEYS.CUSTOM_IMAGE, imageData);
    console.log('Custom image saved');
  } catch (error) {
    console.error('Error saving custom image:', error);
    showImageStatus('❌ Erro ao salvar imagem. Tente uma imagem menor.', 'error');
  }
}

/**
 * Carrega imagem salva
 */
function loadSavedImage() {
  try {
    const savedImage = loadConfig(CACHE_KEYS.CUSTOM_IMAGE);
    if (savedImage) {
      applyCustomImage(savedImage);
      showImageStatus('📸 Imagem personalizada carregada.', 'info');
    }
  } catch (error) {
    console.error('Error loading saved image:', error);
  }
}

/**
 * Remove dados da imagem personalizada
 */
function removeCustomImageData() {
  try {
    removeConfig(CACHE_KEYS.CUSTOM_IMAGE);
    removeCustomImage();
    console.log('Custom image removed');
  } catch (error) {
    console.error('Error removing custom image:', error);
  }
}