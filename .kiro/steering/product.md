# Product Overview

## PRODITEC/UFCG Timer Application

A web-based timer application designed for the PRODITEC/UFCG program (Programa de apoio técnico e financeiro à formação continuada para diretores escolares e técnicos das secretarias de educação).

### Key Features

#### Timer Functionality

- **Countdown timer** with preset durations (5min, 10min, 15min, 25min)
- **Manual time adjustment** (+/-1 minute increments)
- **Custom time input** (minutes and seconds)
- **Pause, resume, and reset** functionality
- **Keyboard shortcuts** for quick control (Space, R, 1-4)
- **State persistence** - timer continues after page reload
- **Visual and audio alerts** when timer completes

#### Music Integration

- **YouTube music integration** with API and fallback support
- **Preset relaxing music** options with categories
- **Custom YouTube link** support with validation
- **MP3 file upload** for personal music
- **Music-timer synchronization** (auto play/pause with timer)
- **Manual music controls** independent of timer
- **Volume control** and loop functionality

#### Visual Effects

- **Christmas snow effect** with 8 different element types
- **New Year fireworks** with realistic particle physics
- **Effects sync with timer** (only active when running)
- **Customizable effect toggles** with persistence

#### Personalization

- **Custom background images** upload and management
- **Automatic slideshow** of background images
- **Customizable run messages** during timer execution
- **Personal message creation** and management
- **Theme persistence** across sessions

#### Accessibility & UX

- **Responsive design** for all screen sizes
- **Keyboard navigation** support
- **Screen reader compatibility** with ARIA labels
- **High contrast** support
- **Portuguese language** throughout interface
- **Intuitive controls** with visual feedback

### Target Audience

Educational administrators and technical staff participating in continuing education programs, including:

- School directors and principals
- Education department technicians
- Training coordinators
- Educational consultants
- Administrative staff in educational institutions

### Use Cases

#### Educational Training Sessions

- **Pomodoro technique** for focused study periods
- **Break timing** during long training sessions
- **Presentation timing** for speakers and workshops
- **Group activity timing** in educational settings

#### Administrative Work

- **Meeting timing** for structured discussions
- **Task time management** for productivity
- **Break reminders** during long work sessions
- **Focus sessions** with background music

### Language & Localization

- **Primary Language**: Portuguese (pt-BR)
- **UI Text**: All interface elements in Portuguese
- **Code Comments**: Portuguese for user-facing logic
- **Documentation**: Portuguese for user guides, English for technical docs
- **Error Messages**: Portuguese with clear, helpful text
- **Accessibility Labels**: Portuguese for screen readers

### Technical Requirements

#### Browser Support

- **Modern browsers** with ES6 module support
- **Chrome 61+**, **Firefox 60+**, **Safari 10.1+**, **Edge 16+**
- **JavaScript enabled** for full functionality
- **localStorage support** for state persistence

#### Performance Standards

- **Fast loading** - under 2 seconds on 3G connection
- **Responsive interface** - smooth animations at 60fps
- **Low memory usage** - efficient resource management
- **Offline capability** - works without internet (except YouTube)

#### Security & Privacy

- **No external tracking** or analytics
- **Local data storage** only (localStorage)
- **No personal data collection** beyond user preferences
- **Secure YouTube embedding** with restricted permissions
