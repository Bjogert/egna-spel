# 🐛 Bug Report: Bollen i Burken - Player Movement System Broken

**KISS**
Build slow and keep it as simple as possible. 

## 🤖 Information for Claude Code AI Assistant

### Project Architecture Overview
**Game Type**: 3D WebGL game using Three.js with Entity-Component-System (ECS) architecture
**Core Technologies**: 
- Three.js (WebGL 3D rendering)
- Vanilla JavaScript (ES6+ classes)
- ECS pattern for game entities
- Map-based entity storage system

### Key System Components
1. **InputSystem** (`js/controls.js`) - Keyboard event handling and input mapping
2. **MovementSystem** (`js/player.js`) - Entity movement processing and physics
3. **GameEngine** (`js/game.js`) - Core ECS entity/component management
4. **GameState** - Entity storage using JavaScript Map structure
5. **Component Types**: Transform (position/velocity), Movement (speed), PlayerInput (keys), Renderable (mesh)

### Critical Technical Context
- **Entity Storage**: `gameState.entities` is a JavaScript Map, NOT an array
- **Component Access**: Use `entity.getComponent('ComponentName')` or `entity.getComponent(ComponentClass)`
- **Map Iteration**: MUST use `gameState.entities.values()` or proper Map iteration methods
- **Component Naming**: Some components may have `constructor.name === 'Object'` due to build/minification

### Common Pitfalls for AI Assistants
1. **Map vs Array Confusion**: `gameState.entities.forEach()` passes `[key, value]` pairs, not values
2. **Component Reference Issues**: Creating new velocity objects instead of modifying existing ones breaks AI/player interaction
3. **Component Naming Collisions**: Multiple components with same constructor.name overwrite each other
4. **Scope Issues**: Variables declared in try-catch blocks may not be accessible outside

### Debugging Best Practices
- Always verify component existence before accessing properties
- Use `for (const entity of gameState.entities.values())` for entity iteration
- Check `entity.components.keys()` to see actual stored component names
- Add comprehensive logging at each step of ECS processing chain
- Test both player input and AI movement systems together (they share velocity objects)

## Problem Description
WASD player movement controls are completely non-functional. Player cube does not respond to any keyboard input.

## Current Issue

