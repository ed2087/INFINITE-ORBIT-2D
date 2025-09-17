# Core Game Systems

This folder contains the fundamental systems that orchestrate the entire Infinite Orbit 2D experience.

## Files Overview

### Game.js
- **Main orchestrator** that coordinates all systems
- Manages game states (menu, playing, paused, gameOver)
- Handles the 60-minute survival progression
- Integrates audio analysis with gameplay mechanics
- Performance monitoring and optimization

### AudioManager.js
- **Real-time audio analysis** of your electronic music mix
- Beat detection and BPM calculation
- Frequency band separation (bass, mids, highs)
- Audio-reactive color and intensity generation
- Phase detection for 60-minute progression

### Canvas2D.js
- **2D rendering system** optimized for performance
- High-DPI display support with pixel ratio scaling
- Screen shake effects and visual post-processing
- Background gradient generation based on audio
- Viewport culling and render optimization

### InputManager.js
- **Cross-platform input handling** (desktop + mobile)
- Keyboard, mouse, and touch input support
- Virtual on-screen controls for mobile devices
- Input state management and event handling
- Responsive control layout

## System Integration

The core systems work together to create the emergent gameplay:

1. **AudioManager** analyzes your music and provides real-time data
2. **Game** uses audio data to drive difficulty scaling and visual effects
3. **Canvas2D** renders everything with audio-reactive backgrounds
4. **InputManager** provides precise orbital control across all devices

## Performance Considerations

- Object pooling for particles and projectiles
- Spatial grid optimization for collision detection
- Viewport culling for off-screen entities
- Frame rate monitoring and adaptive quality scaling
- Memory management to prevent leaks during 60-minute sessions

## Development Notes

All core systems support debug modes and provide statistics for performance monitoring. Use `window.game.getGameStats()` in the browser console to access real-time metrics.