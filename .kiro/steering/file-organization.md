# File Organization Rules

## Directory Structure Standards

### Documentation Files (`docs/`)

All documentation files must be organized in the `docs/` folder:

```
docs/
├── README.md                    # Main project documentation
├── REFACTORING_SUMMARY.md      # Technical refactoring details
├── COMO_USAR.md                # User guide and installation
├── REFATORACAO_COMPLETA.md     # Complete refactoring summary
├── CORRECAO_ISRUNNING.md       # Bug fix documentation
├── API.md                      # API documentation (if needed)
├── CHANGELOG.md                # Version history (if needed)
└── CONTRIBUTING.md             # Contribution guidelines (if needed)
```

#### Documentation Rules:

- **All `.md` files** related to project documentation go in `docs/`
- **Main documentation** uses UPPERCASE names (README.md, CHANGELOG.md)
- **Specific documentation** uses descriptive kebab-case names
- **Portuguese** for user-facing documentation
- **English** for technical/developer documentation
- **Include date stamps** in documentation when relevant

### Test Files (`tests/`)

All test files must be organized in the `tests/` folder:

```
tests/
├── test-modules.html           # ES6 module loading tests
├── test-final.html             # Complete functionality tests
├── test-localstorage.html      # localStorage persistence tests
├── test-timer-core.html        # Timer logic specific tests
├── test-music-manager.html     # Music functionality tests
├── test-ui-components.html     # UI component tests
└── manual-test-checklist.md   # Manual testing procedures
```

#### Test Rules:

- **All test files** (`.html`, `.js`, `.md`) go in `tests/` folder
- **Use `test-` prefix** for all test filenames
- **Descriptive names** indicating what is being tested
- **HTML test files** for manual/visual testing
- **JavaScript test files** for automated testing (if implemented)
- **Include test documentation** in markdown format

### Module Files (`js/`)

JavaScript modules remain in the `js/` folder with specific organization:

```
js/
├── app.js                      # Main application integrator
├── timer-core.js              # Core timer functionality
├── music-manager.js           # Music and audio management
├── cache-manager.js           # Data persistence
├── ui-manager.js              # User interface management
├── effects-manager.js         # Visual effects
├── messages-manager.js        # Message system
├── sound-manager.js           # Audio alerts
├── image-manager.js           # Image management
├── event-manager.js           # Event handling
├── mp3-manager.js             # MP3 functionality
├── utils.js                   # Utility functions
└── README.md                  # Module documentation
```

#### Module Rules:

- **Kebab-case naming** for all module files
- **Single responsibility** per module
- **Clear, descriptive names** indicating module purpose
- **Include module documentation** in `js/README.md`

## File Naming Conventions

### Documentation Files

- **Main docs**: UPPERCASE (README.md, CHANGELOG.md, LICENSE.md)
- **Specific docs**: kebab-case (como-usar.md, api-reference.md)
- **Bug fixes**: descriptive names (correcao-isrunning.md)
- **Summaries**: descriptive names (refatoracao-completa.md)

### Test Files

- **Prefix**: Always start with `test-`
- **Format**: `test-[component/feature].html`
- **Examples**: test-modules.html, test-timer-core.html
- **Checklists**: manual-test-checklist.md

### Module Files

- **Format**: kebab-case with descriptive names
- **Pattern**: `[functionality]-[type].js`
- **Examples**: timer-core.js, music-manager.js, cache-manager.js

### Configuration Files

- **JSON files**: lowercase (music.json, messages.json, images.json)
- **Config files**: descriptive names (.gitattributes, package.json)

## File Movement Rules

### When Creating New Files

#### Documentation Files

```bash
# ✅ Correct - Place in docs/
docs/new-feature-guide.md
docs/troubleshooting.md
docs/API-reference.md

# ❌ Incorrect - Don't place in root
new-feature-guide.md
troubleshooting.md
```

#### Test Files

```bash
# ✅ Correct - Place in tests/
tests/test-new-feature.html
tests/test-integration.html
tests/manual-testing-guide.md

# ❌ Incorrect - Don't place in root
test-new-feature.html
test-integration.html
```

### When Refactoring Existing Files

#### Moving Documentation

```bash
# Move existing docs to docs/ folder
mv README.md docs/README.md
mv CHANGELOG.md docs/CHANGELOG.md
mv *.md docs/
```

#### Moving Tests

```bash
# Move existing tests to tests/ folder
mv test-*.html tests/
mv *-test.html tests/
mv test-*.js tests/
```

## Automatic Organization

### Kiro IDE Rules

When working with Kiro IDE, follow these automatic organization rules:

1. **Documentation Creation**:

   - Any new `.md` file should be automatically suggested for `docs/` folder
   - Prompt user if they want to place documentation in `docs/`

2. **Test Creation**:

   - Any file starting with `test-` should be suggested for `tests/` folder
   - Any `.html` file with "test" in the name should be suggested for `tests/`

3. **Module Creation**:
   - Any new `.js` file should be suggested for `js/` folder (unless it's a config file)
   - Maintain the modular architecture pattern

## Maintenance Rules

### Regular Cleanup

- **Monthly review** of file organization
- **Move misplaced files** to correct directories
- **Update documentation** when structure changes
- **Verify test files** are in correct location

### Documentation Updates

- **Update this file** when adding new organization rules
- **Reflect changes** in main project README
- **Maintain consistency** across all steering files

### Version Control

- **Commit organization changes** separately from feature changes
- **Use descriptive commit messages** for file movements
- **Update .gitignore** if new directories are added

## Benefits of This Organization

### For Developers

- **Clear separation** of concerns
- **Easy navigation** to relevant files
- **Consistent structure** across projects
- **Reduced cognitive load** when finding files

### For Documentation

- **Centralized documentation** in one location
- **Easy maintenance** and updates
- **Clear hierarchy** of information
- **Better discoverability** for users

### For Testing

- **Isolated test environment**
- **Easy test execution** and management
- **Clear test coverage** visibility
- **Simplified CI/CD** integration (future)

This organization ensures the project remains maintainable, scalable, and professional as it grows.
