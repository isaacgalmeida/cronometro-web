# ✅ Checklist de Testes Manuais - Cronômetro PRODITEC/UFCG

## 📋 Visão Geral

Este documento contém uma lista completa de testes manuais para validar todas as funcionalidades do cronômetro após a refatoração modular.

## 🧪 Testes Automatizados

### 1. Teste de Carregamento dos Módulos

**Arquivo**: `test-modules.html`

- [ ] Abrir arquivo no navegador
- [ ] Verificar se todos os 12 módulos carregam sem erro
- [ ] Confirmar mensagens de sucesso no console
- [ ] Validar que não há erros de importação

### 2. Teste Completo de Funcionalidades

**Arquivo**: `test-final.html`

- [ ] Executar todos os testes automatizados
- [ ] Verificar taxa de sucesso de 100%
- [ ] Confirmar que funções utilitárias funcionam
- [ ] Validar timer core e cache manager

### 3. Teste Específico do localStorage

**Arquivo**: `test-localstorage.html`

- [ ] Testar salvamento do estado `isRunning`
- [ ] Verificar persistência após iniciar/pausar
- [ ] Confirmar logs de debug no console
- [ ] Validar visualização em tempo real do localStorage

## 🎯 Testes Funcionais Manuais

### ⏱️ Funcionalidades do Timer

#### Inicialização

- [ ] Timer inicia em 00:00
- [ ] Status mostra "Defina um tempo para começar"
- [ ] Botões de preset estão visíveis e funcionais
- [ ] Botão "Iniciar" está visível

#### Presets de Tempo

- [ ] **5 minutos**: Clique no botão "5min" → Timer vai para 05:00 e inicia
- [ ] **10 minutos**: Clique no botão "10min" → Timer vai para 10:00 e inicia
- [ ] **15 minutos**: Clique no botão "15min" → Timer vai para 15:00 e inicia
- [ ] **25 minutos**: Clique no botão "25min" → Timer vai para 25:00 e inicia

#### Controles Básicos

- [ ] **Iniciar**: Timer começa a contar regressivamente
- [ ] **Pausar**: Timer para mas mantém tempo restante
- [ ] **Retomar**: Timer continua de onde parou
- [ ] **Reset**: Timer volta para 00:00 e para

#### Ajustes de Tempo

- [ ] **+1 min**: Adiciona 1 minuto ao tempo atual
- [ ] **-1 min**: Remove 1 minuto do tempo atual
- [ ] Ajustes funcionam tanto com timer rodando quanto pausado
- [ ] Tempo não fica negativo

#### Tempo Personalizado

- [ ] Campo de minutos aceita valores de 0-999
- [ ] Campo de segundos aceita valores de 0-59
- [ ] Validação impede valores inválidos
- [ ] Botão "Definir" aplica o tempo personalizado
- [ ] Campos são limpos após aplicar

#### Finalização do Timer

- [ ] Timer chega a 00:00 e para automaticamente
- [ ] Status mostra "⏰ Tempo esgotado!"
- [ ] Notificação do navegador é exibida (se permitida)
- [ ] Som de alarme toca (se habilitado)
- [ ] Efeito visual de finalização é aplicado

### 🎵 Funcionalidades de Música

#### Música Preset

- [ ] Dropdown mostra opções de música carregadas do JSON
- [ ] Seleção de música inicia reprodução automaticamente
- [ ] Player do YouTube é exibido corretamente
- [ ] Controles do YouTube funcionam (play/pause/volume)

#### Música Personalizada

- [ ] Campo de URL aceita links válidos do YouTube
- [ ] Botão "Reproduzir" inicia música personalizada
- [ ] URLs inválidas mostram erro apropriado
- [ ] Player é atualizado com nova música

#### Upload de MP3

- [ ] Botão de upload aceita apenas arquivos de áudio
- [ ] Preview do áudio é exibido após upload
- [ ] Botão "Aplicar" ativa o MP3 personalizado
- [ ] Player de MP3 é exibido e funcional
- [ ] Botão "Remover" limpa o MP3 personalizado

#### Sincronização com Timer

- [ ] **Timer inicia**: Música inicia automaticamente (se selecionada)
- [ ] **Timer pausa**: Música pausa automaticamente
- [ ] **Timer retoma**: Música retoma automaticamente
- [ ] **Timer reseta**: Música para completamente
- [ ] Controle manual desabilita sync temporariamente

#### Controles Independentes

- [ ] Botão "Parar Música" para a música sem afetar timer
- [ ] Controles do YouTube funcionam independentemente
- [ ] Seleção de nova música funciona a qualquer momento

### ✨ Efeitos Visuais

#### Efeito de Neve (Natal)

- [ ] Toggle "Neve" liga/desliga o efeito
- [ ] Efeito só ativa quando timer está rodando
- [ ] Diferentes tipos de elementos natalinos aparecem
- [ ] Animação é suave e não afeta performance
- [ ] Configuração é persistida no localStorage

#### Efeito de Ano Novo

- [ ] Toggle "Ano Novo" liga/desliga fogos de artifício
- [ ] Efeito só ativa quando timer está rodando
- [ ] Fogos sobem e explodem realisticamente
- [ ] Partículas caem com física realista
- [ ] Configuração é persistida no localStorage

### 🎨 Personalização

#### Imagens de Fundo

- [ ] Upload aceita apenas arquivos de imagem (máx 5MB)
- [ ] Preview da imagem é exibido após upload
- [ ] Botão "Aplicar" define imagem como fundo
- [ ] Timer se redimensiona adequadamente
- [ ] Botão "Remover" restaura fundo padrão
- [ ] Slideshow automático funciona (se configurado)

#### Mensagens Personalizáveis

- [ ] Pills de mensagens são exibidas
- [ ] Clique em pill ativa a mensagem
- [ ] Botão "➕ Personalizar" permite criar nova mensagem
- [ ] Mensagens personalizadas são salvas
- [ ] Botão "🗑️ Limpar" remove mensagens personalizadas
- [ ] Mensagem ativa é exibida durante execução do timer

### 🔊 Sons e Configurações

#### Som de Alarme

- [ ] Toggle "Som" liga/desliga alarme
- [ ] Som toca quando timer termina (se habilitado)
- [ ] Som é audível e apropriado
- [ ] Configuração é persistida

#### Configurações Gerais

- [ ] Todas as configurações são salvas no localStorage
- [ ] Configurações persistem após recarregar página
- [ ] Reset geral limpa todas as configurações

### ⌨️ Atalhos de Teclado

- [ ] **Espaço**: Inicia/pausa timer
- [ ] **R**: Reseta timer
- [ ] **1**: Inicia timer de 5 minutos
- [ ] **2**: Inicia timer de 10 minutos
- [ ] **3**: Inicia timer de 15 minutos
- [ ] **4**: Inicia timer de 25 minutos
- [ ] Atalhos não funcionam quando digitando em inputs

### 💾 Persistência de Dados

#### Estado do Timer

- [ ] Timer rodando persiste após recarregar página
- [ ] Timer pausado persiste com tempo correto
- [ ] Tempo restante é calculado corretamente após reload
- [ ] Estado `isRunning` é salvo corretamente no localStorage

#### Estado da Música

- [ ] Música selecionada persiste após reload
- [ ] Música retoma automaticamente se timer estava rodando
- [ ] Configurações de música são mantidas

#### Configurações Gerais

- [ ] Efeitos visuais mantêm estado após reload
- [ ] Som mantém configuração após reload
- [ ] Mensagens personalizadas persistem
- [ ] Imagem de fundo persiste

## 📱 Testes de Responsividade

### Desktop (1920x1080)

- [ ] Layout se adapta corretamente
- [ ] Todos os elementos são visíveis
- [ ] Interações funcionam normalmente

### Tablet (768x1024)

- [ ] Layout se reorganiza adequadamente
- [ ] Timer permanece legível
- [ ] Controles são acessíveis

### Mobile (375x667)

- [ ] Layout mobile é funcional
- [ ] Timer é claramente visível
- [ ] Botões têm tamanho adequado para toque
- [ ] Menus e controles são acessíveis

## 🌐 Testes de Compatibilidade

### Navegadores

- [ ] **Chrome 61+**: Todas as funcionalidades
- [ ] **Firefox 60+**: Todas as funcionalidades
- [ ] **Safari 10.1+**: Todas as funcionalidades
- [ ] **Edge 16+**: Todas as funcionalidades

### Recursos Específicos

- [ ] **ES6 Modules**: Carregamento correto
- [ ] **localStorage**: Persistência funcional
- [ ] **Notification API**: Notificações (se permitidas)
- [ ] **Web Audio API**: Sons funcionais
- [ ] **FileReader API**: Upload de arquivos

## 🚨 Testes de Erro

### Cenários de Erro

- [ ] **Sem conexão**: App funciona offline (exceto YouTube)
- [ ] **localStorage cheio**: Graceful degradation
- [ ] **Arquivo inválido**: Mensagens de erro apropriadas
- [ ] **URL inválida**: Validação e feedback
- [ ] **Permissões negadas**: Fallbacks funcionais

### Recovery

- [ ] **Erro de módulo**: App não quebra completamente
- [ ] **Erro de música**: Timer continua funcionando
- [ ] **Erro de efeito**: Outras funcionalidades não são afetadas

## ✅ Critérios de Aprovação

Para considerar os testes aprovados, todos os itens devem estar marcados como ✅:

- **Funcionalidades Críticas**: 100% funcionais
- **Persistência**: Dados salvos e restaurados corretamente
- **Performance**: Sem travamentos ou lentidão
- **Compatibilidade**: Funciona nos navegadores suportados
- **Responsividade**: Adaptação adequada a diferentes telas
- **Acessibilidade**: Navegação por teclado e leitores de tela

## 📊 Relatório de Testes

**Data do Teste**: ****\_\_\_****  
**Testador**: ****\_\_\_****  
**Navegador**: ****\_\_\_****  
**Versão**: ****\_\_\_****

**Resultados**:

- ✅ Aprovado: **_/_**
- ❌ Reprovado: **_/_**
- ⚠️ Com ressalvas: **_/_**

**Observações**:

---

---

---

**Status Final**: [ ] Aprovado [ ] Reprovado [ ] Necessita correções
