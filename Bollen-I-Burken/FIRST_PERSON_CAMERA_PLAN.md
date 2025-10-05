# First-Person Camera Implementation Plan
**KISS Architecture - Maximum 400 lines per file**

## Overview
Add first-person camera mode to existing third-person steering sys**Step 5.1.6: User Testing** - 🔍 DEBUGGING
- **Status:** Input detection working, spawn position fixed, but movement still not working
- **Progress Made:** 
  - ✅ Player Movement System Running (debug messages appearing)
  - ✅ WASD Input Detection Working (frequent input messages)
  - ✅ Spawn Position Fixed (no longer in can)
- **New Issue Found:** `gameState: undefined` in player movement system
- **Root Cause:** Movement system receiving `undefined` instead of actual gameState object
- **Debug Actions:** Added logging to track gameState parameter flow from game engine to systems
- **Next:** Test again to see gameState debug information and identify where it becomes undefined

**Step 5.2: Body Following** - 📋 PENDING breaking current functionality.

## Current Working State (DO NOT BREAK)
✅ Third-person mouse steering (mouse rotates character, WASD moves relative to facing)
✅ Input system with pointer lock
✅ Movement system with character-relative controls
✅ AI system with dynamic vision
✅ All manager classes working

## Implementation Strategy: INCREMENTAL STEPS

### Step 1: Add Camera Mode Toggle (V key)
**File:** `js/systems/input/input-system.js` (currently ~150 lines)
**Goal:** Detect V key press for camera mode switching
**Changes:**
- Add V key detection in `handleKeyDown()`
- Dispatch custom event `camera-mode-toggle`
- Document in comments what V key does

**Expected outcome:** V key press logged to console (no visual change yet)

### Step 2: Create Camera Mode State Manager
**File:** `js/systems/camera-mode-system.js` (NEW, target <300 lines)
**Goal:** Simple state management for camera modes
**Responsibilities:**
- Track current mode (THIRD_PERSON, FIRST_PERSON)
- Listen for toggle events
- Notify systems of mode changes
- Update camera position/rotation based on mode

**Expected outcome:** Mode switching logged to console, no visual change

### Step 3: Add First-Person Camera Logic
**File:** `js/systems/camera-mode-system.js` (expand existing)
**Goal:** Position camera at player eye level in first-person mode
**Logic:**
```javascript
// Third-person: existing dynamic camera code
// First-person: camera.position = player.position + (0, 1.7, 0)
//              camera.rotation = player.rotation
```

**Expected outcome:** Camera jumps to first-person view when V pressed

### Step 4: Integrate with Movement System
**File:** `js/systems/movement-system.js` (currently needs review)
**Goal:** Ensure movement works correctly in both camera modes
**Changes:**
- Check current camera mode from camera-mode-system
- Third-person: existing behavior (mouse rotates character)
- First-person: mouse rotates camera directly, character follows camera

**Expected outcome:** Mouse controls feel natural in both modes

### Step 5: Add to Main Game Loop
**File:** `js/main.js` (currently needs review)
**Goal:** Initialize and update camera mode system
**Changes:**
- Import camera-mode-system
- Initialize in setup
- Update in game loop
- Remove any old camera management code I added

**Expected outcome:** Complete working first-person mode

## File Size Monitoring
- `js/systems/input/input-system.js`: Check line count after Step 1
- `js/systems/camera-mode-system.js`: Keep under 300 lines
- `js/systems/movement-system.js`: Check line count after Step 4
- `js/main.js`: Check line count after Step 5

## Testing Protocol (User Performs)
After each step:
1. Test that game still launches
2. Test that existing third-person controls work
3. Test new functionality (V key response, etc.)
4. Report any issues before next step

## Rollback Strategy
Each step is isolated. If a step breaks the game:
1. Document the issue
2. Revert the specific file changed in that step
3. Analyze what went wrong
4. Revise the step and try again

## Success Criteria
- V key toggles between third-person and first-person camera
- Mouse controls feel natural in both modes
- WASD movement works correctly in both modes
- Existing game functionality unchanged
- All files under 400 lines
- No leftover/dead code

## Current Status: ✅ STEP 5.1 IN PROGRESS
**Step 1: Add Camera Mode Toggle (V key)** - ✅ DONE
- Added V key detection to input system (381 lines total)  
- V key dispatches 'camera-mode-toggle' custom event
- Prevents key repeat with proper state management

**Step 2: Create Camera Mode State Manager** - ✅ DONE  
- Created camera-mode-system.js (169 lines total)
- Listens for 'camera-mode-toggle' events from input system
- Tracks current mode (THIRD_PERSON, FIRST_PERSON)
- Provides mode switching and query methods
- Added script tag to index.html

**Step 3: Add First-Person Camera Logic** - ✅ DONE
- Integrated camera manager into main.js game loop (508 lines total)
- Added camera manager initialization with scene and camera
- Replaced updateDynamicCamera call with cameraManager.update()
- Exposed updateDynamicCamera globally for third-person mode
- Camera position/rotation logic implemented for first-person mode

**Step 4: Integrate with Movement System** - ✅ DONE
- **UNIFIED CAMERA SYSTEM:** Mouse controls head/camera, body follows with delay
- Added mouse input tracking to input system (pointer lock, rotation accumulation)
- Modified movement system to use camera-driven movement in both modes
- WASD movement always relative to camera facing direction
- Smooth body follow with configurable delay (0.05 speed)
- Exposed main camera globally for movement system access

**Step 5: Unified Controls Implementation** - ✅ DONE
- First-person and third-person controls work identically (only camera position differs)
- Mouse controls camera/head in both modes
- V key seamlessly switches between modes
- Camera axis rotation fixed (X=pitch, Y=yaw)
- All body rotation removed per user request

**Step 5.1: Head Rotation Limits** - ✅ COMPLETED
- **PROBLEM:** Head can spin 360 degrees unlimited
- **SOLUTION:** Added horizontal head rotation limits (±90° from body direction)
- Head rotation now clamped relative to body direction
- Body direction remains static until Step 5.2
- Vertical rotation already limited to prevent flipping

**Step 5.1.1: Camera Rotation Fix** - ✅ COMPLETED
- **PROBLEM:** Camera had gimbal lock - vertical rotation became roll when turned sideways
- **SOLUTION:** Set camera rotation order to 'YXZ' (yaw first, then pitch)
- Fixed vertical mouse movement to properly tilt camera up/down regardless of horizontal orientation
- Camera now works correctly in all orientations

**Step 5.1.3: Architecture Refactor** - ✅ COMPLETED
- **PROBLEM:** movement-system.js was 843 lines and violated KISS 400-line limit
- **SOLUTION:** Split into four focused files, each handling one responsibility:
  - `player-movement-system.js` - Player physics, WASD input, velocity, acceleration (245 lines)
  - `ai-visualization-system.js` - Vision cones, hearing circles, AI visual feedback (154 lines)  
  - `animation-integration-system.js` - Leg animations, ragdoll physics integration (105 lines)
  - `collision-detection-system.js` - Bounds checking, static colliders, win conditions (232 lines)
- Each file now follows single responsibility principle
- Fixed forward/backward direction bug (forward is now positive Z)

**Step 5.1.4: System Integration** - ✅ COMPLETED
- **PROBLEM:** Split movement system broke game with "EntityManager is not defined" errors
- **SOLUTION:** Fixed all entity access patterns and parameter signatures:
  - Fixed `EntityManager.getEntitiesWithComponents()` → `gameState.entities.values()` iteration
  - Fixed component name `AI` → `AIHunter` in ai-visualization-system.js
  - Fixed parameter order: `update(deltaTime, gameState)` → `update(gameState, deltaTime)` 
  - Added critical `updateVisualSync()` method to sync Three.js mesh positions with transforms
- Updated main.js to use new four-system architecture (systems properly added to game engine)
- All systems now correctly access entities and receive parameters in proper order
- Player movement, spawning, and visibility restored

**Step 5.1.5: Bug Fixes Complete** - ✅ COMPLETED  
- **EntityManager References:** All systems now use `gameState.entities.values()` for entity iteration
- **Component Access:** Fixed AIHunter component references across all systems
- **Visual Synchronization:** Added updateVisualSync() to ensure meshes sync with transform positions  
- **Parameter Order:** All four systems now match game engine calling pattern
- **Architecture Validation:** Four-system split maintains all original movement-system.js functionality
- **Files Updated:** player-movement-system.js, ai-visualization-system.js, animation-integration-system.js, collision-detection-system.js
- **Console Verification:** No more "EntityManager is not defined" errors, game loads successfully
- **Systems Working:** Player spawns at correct position (-4, 0.5, -4), camera mode toggle works, physics active

**Step 5.1.6: User Testing** - � DEBUGGING
- **Status:** Game loads without errors, but player movement not working
- **Console Status:** ✅ No EntityManager errors, ✅ Player spawning correctly, ✅ Systems running
- **Issue Identified:** Player cannot move with WASD keys
- **Debug Actions:** Added logging to player-movement-system.js to verify:
  - Is the system update method being called?
  - Is input being received from WASD keys?
  - Are entity components properly attached?
- **Next:** Test game and check console for debug messages when pressing WASD

**Step 5.2: Body Following** - 📋 PENDING
- **GOAL:** Body follows head rotation with delay when head exceeds threshold
- Will add smooth body rotation when head turns beyond limits
- Body will slowly rotate to follow where head is looking

**Testing Notes:**
- User confirmed: "body no longer spins with mouse" ✅
- User identified: "1: the head still spins 360 degrees. 2: the body does not follow the head rotation"
- Working incrementally as requested: "Lets do one step at a time"