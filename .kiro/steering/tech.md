# Technology Stack

## Frontend Technologies

- **HTML5** - Semantic markup with accessibility features (aria-live, aria-label, sr-only classes)
- **CSS3** - Modern CSS with CSS Grid, Flexbox, custom properties (CSS variables), and responsive design
- **ES6+ JavaScript** - Modern JavaScript with modules, async/await, arrow functions, destructuring
- **Web APIs** - localStorage, Notification API, Web Audio API, FileReader API

## Module Architecture

- **ES6 Modules** - Native import/export for code organization
- **12 Specialized Modules** - Each with single responsibility
- **Event-Driven Communication** - Callback system between modules
- **No External Dependencies** - Pure vanilla JavaScript implementation

## Build System

- **No build system** - Static files served directly with ES6 modules
- **No package manager** - No npm, yarn, or other dependency management
- **No bundling** - Native ES6 module loading in browsers
- **No transpilation** - Modern JavaScript features used directly

## Development Workflow

### Local Development

```bash
# Serve files locally (required for ES6 modules)
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000

# Note: file:// protocol won't work due to CORS restrictions with modules
```

### Testing

```bash
# Open test files in browser (with local server)
http://localhost:8000/tests/test-modules.html
http://localhost:8000/tests/test-final.html
http://localhost:8000/tests/test-localstorage.html
```

### Deployment

- Copy files directly to web server
- Ensure server supports ES6 modules (modern browsers required)
- No compilation or build step required

## Code Conventions

### JavaScript Modules

- **ES6 import/export** syntax for all modules
- **JSDoc comments** for all exported functions
- **Single responsibility** principle per module
- **Error handling** with try/catch blocks
- **Console logging** for debugging
- **Async/await** for asynchronous operations
- **Arrow functions** where appropriate
- **Template literals** for string formatting
- **Destructuring** for cleaner code

### Module Communication

- **Callback registration** system for events
- **State management** through dedicated modules
- **No global variables** except for compatibility
- **Explicit dependencies** through imports

### Performance Optimizations

- **Event delegation** for better performance
- **Debouncing** for frequent events
- **DOM caching** to minimize queries
- **Lazy loading** of heavy operations
- **Memory management** with proper cleanup

### Browser Compatibility

- **Modern browsers** required (Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+)
- **ES6 modules** support required
- **Graceful degradation** for unsupported features
- **Feature detection** before using advanced APIs

## File Organization Standards

### Module Structure

```javascript
/**
 * Module description
 */

// Imports
import { function1, function2 } from "./other-module.js";

// Private variables and functions
let privateVar = null;

function privateFunction() {
  // Implementation
}

// Public exports
export function publicFunction() {
  // Implementation with JSDoc
}

export { anotherFunction };
```

### Documentation Standards

- **JSDoc** for all public functions
- **Inline comments** for complex logic
- **README.md** for each major component
- **Portuguese** for user-facing text and comments
- **English** for technical documentation and code

### Testing Standards

- **Manual testing** with dedicated test pages
- **Module loading tests** to verify imports
- **Functionality tests** for user workflows
- **localStorage tests** for persistence
- **Cross-browser testing** for compatibility

## Quality Assurance

### Code Quality

- **Consistent formatting** and indentation
- **Meaningful variable names** in English
- **Function length** kept under 30 lines
- **Module size** kept under 300 lines
- **No code duplication** across modules

### Performance Monitoring

- **Console logging** for debugging
- **Performance timing** for critical operations
- **Memory usage** monitoring in DevTools
- **Network requests** optimization

### Accessibility

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** compatibility
- **Semantic HTML** structure
- **Portuguese language** declarations
