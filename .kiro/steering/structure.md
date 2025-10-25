# Project Structure

## File Organization

```
/
├── index.html              # Main HTML entry point
├── style.css              # All styles and responsive design
├── music.json             # Background music data
├── messages.json          # Customizable messages data
├── images.json            # Background images data
├── app-original.js        # Backup of original monolithic code
├── .gitattributes         # Git configuration
├── .git/                  # Git repository data
├── js/                    # 📁 Modular JavaScript architecture
│   ├── app.js            # Main application integrator
│   ├── timer-core.js     # Timer logic and state management
│   ├── music-manager.js  # YouTube and MP3 music handling
│   ├── cache-manager.js  # localStorage persistence
│   ├── ui-manager.js     # DOM manipulation and UI updates
│   ├── effects-manager.js # Visual effects (snow, fireworks)
│   ├── messages-manager.js # Customizable messages system
│   ├── sound-manager.js  # Audio alerts and beeps
│   ├── image-manager.js  # Background images and slideshow
│   ├── event-manager.js  # Event handling and keyboard shortcuts
│   ├── mp3-manager.js    # Custom MP3 upload and playback
│   ├── utils.js          # Utility functions and helpers
│   └── README.md         # Module documentation
├── docs/                  # 📁 Documentation files
│   ├── README.md         # Main project documentation
│   ├── REFACTORING_SUMMARY.md # Refactoring details
│   ├── COMO_USAR.md      # Usage guide
│   ├── REFATORACAO_COMPLETA.md # Complete refactoring summary
│   └── CORRECAO_ISRUNNING.md # Bug fix documentation
└── tests/                 # 📁 Test files
    ├── test-modules.html  # Module loading tests
    ├── test-final.html    # Complete functionality tests
    └── test-localstorage.html # localStorage specific tests
```

## Architecture Patterns

### Modular ES6 Architecture

- **12 specialized modules** instead of monolithic code
- **ES6 import/export** for module communication
- **Separation of concerns** with clear responsibilities
- **Event-driven communication** between modules via callbacks

### Module Organization

- **timer-core.js** - Core timer logic, state management, time calculations
- **music-manager.js** - YouTube API integration, MP3 handling, music synchronization
- **cache-manager.js** - localStorage persistence, state restoration, configuration management
- **ui-manager.js** - DOM manipulation, display updates, visual feedback
- **effects-manager.js** - Visual effects (Christmas snow, New Year fireworks)
- **messages-manager.js** - Customizable run-time messages system
- **sound-manager.js** - Audio alerts, beep generation, sound settings
- **image-manager.js** - Background images, slideshow, custom image upload
- **event-manager.js** - Event handling, keyboard shortcuts, user interactions
- **mp3-manager.js** - Custom MP3 upload, playback, audio management
- **utils.js** - Utility functions, validation, formatting helpers
- **app.js** - Main integrator, initialization, callback coordination

### Code Structure Conventions

#### JavaScript Modules

- **ES6 modules** with explicit imports/exports
- **JSDoc documentation** for all functions
- **Single responsibility** principle per module
- **Callback system** for inter-module communication
- **Error handling** with try/catch blocks
- **Console logging** for debugging and monitoring

#### CSS (`style.css`)

- CSS custom properties (variables) defined in `:root`
- Mobile-first responsive design with `@media` queries
- Component-based class naming (`.timer-controls`, `.music-grid`)
- Utility classes for accessibility (`.sr-only`)

#### HTML (`index.html`)

- Semantic structure with `<main>`, `<header>`, `<section>`
- Accessibility attributes throughout
- Portuguese language declaration (`lang="pt-BR"`)
- ES6 module loading with `type="module"`

## File Organization Rules

### Documentation Files (`docs/`)

- All `.md` documentation files should be placed in `docs/` folder
- Include project guides, API documentation, and technical specifications
- Use descriptive filenames with uppercase for main docs (README.md, CHANGELOG.md)

### Test Files (`tests/`)

- All test files (`.html`, `.js`) should be placed in `tests/` folder
- Include unit tests, integration tests, and manual test pages
- Use `test-` prefix for test filenames

### Module Files (`js/`)

- All JavaScript modules in `js/` folder
- Use kebab-case for module filenames
- Include module-specific documentation in `js/README.md`

## File Naming Conventions

- **Modules**: kebab-case (timer-core.js, music-manager.js)
- **Documentation**: UPPERCASE for main docs (README.md), kebab-case for specific docs
- **Tests**: test- prefix with descriptive names (test-modules.html)
- **Configs**: lowercase with extensions (.json, .md)
- **Backups**: -original suffix (app-original.js)
