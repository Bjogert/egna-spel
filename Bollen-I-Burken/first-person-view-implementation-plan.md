# First-Person View Implementation Plan

## Current System Analysis

### Current Camera System (Third-Person)
**Location**: `js/main.js` - `updateDynamicCamera()` function
- **Fixed third-person view** behind and above player
- **Dynamic zoom** based on distance from arena center
- **Smooth following** with position interpolation
- **Look-at targeting** blends between arena center and player
- **Camera settings** from `CONFIG.camera` (height: 50, distance: 30, fov: 60)

### Current Input System
**Location**: `js/systems/input/input-system.js`
- **Available keys**: KeyC, KeyV, KeyF, KeyT are not mapped (perfect for camera toggle)
- **Mouse support**: Already implemented with pointer lock for character rotation
- **Key mapping structure**: Easy to extend with new actions

### Current Movement System
**Location**: `js/systems/movement-system.js`
- **Character-relative movement**: W/A/S/D relative to player facing direction ✅
- **Mouse controls character facing**: Independent of camera position ✅
- **Physics integration**: CANNON.js physics bodies working ✅

## Implementation Strategy

### Phase 1: Camera Mode System
**Goal**: Create a flexible camera mode manager that can switch between different camera types

#### New File: `js/systems/camera/camera-manager.js`
**Purpose**: Centralized camera mode management
- Camera modes enum: THIRD_PERSON, FIRST_PERSON, (future: FREE_CAM, EMPEROR_VIEW)
- Mode switching logic
- Camera state management
- Integration with existing input/movement systems

#### Camera Modes:
1. **THIRD_PERSON** (current system)
   - Dynamic positioning behind/above player
   - Smooth following and zoom
   - Look-at blending

2. **FIRST_PERSON** (new)
   - Camera positioned at player's eye level
   - Camera rotation follows mouse (like character rotation)
   - No camera lag/smoothing for immediate response
   - Slight height offset above player position

### Phase 2: Input System Extension
**Goal**: Add camera toggle key and integrate with camera manager

#### Modify: `js/systems/input/input-system.js`
**Changes**:
- Add 'KeyC': 'camera_toggle' to key mappings
- Add camera toggle action to input processing
- Notify camera manager of mode changes

### Phase 3: Camera Manager Implementation
**Goal**: Implement the actual camera switching logic

#### Camera Manager Features:
- **Mode switching**: Instant or smooth transition between modes
- **State preservation**: Remember zoom level, smoothing values between switches
- **Integration hooks**: Work with existing mouse steering system
- **Configuration**: Settings for first-person eye height, FOV, etc.

### Phase 4: First-Person Camera Logic
**Goal**: Implement first-person camera behavior

#### First-Person Requirements:
- **Camera position**: Player position + eye height offset (CONFIG.camera.firstPerson.eyeHeight)
- **Camera rotation**: Direct mapping from mouse rotation (no smoothing)
- **Look direction**: Use player's facing direction from mouse input
- **No body visibility**: Optional hide player mesh in first-person

### Phase 5: Configuration & Polish
**Goal**: Add settings and fine-tuning options

#### Configuration Extension:
- First-person specific settings (eye height, FOV)
- Toggle animation settings
- UI indicators for current camera mode

## Detailed Implementation Plan

### Phase 1: Create Camera Manager System

#### File: `js/systems/camera/camera-manager.js`
```javascript
class CameraManager extends System {
    constructor() {
        super('CameraManager');
        this.currentMode = 'THIRD_PERSON';
        this.modes = {
            THIRD_PERSON: 'third_person',
            FIRST_PERSON: 'first_person'
        };
        
        // Camera state for each mode
        this.modeStates = {
            third_person: {
                // Current third-person camera variables
            },
            first_person: {
                eyeHeight: 1.7,
                fov: 75,
                mouseSensitivityMultiplier: 1.0
            }
        };
    }
    
    switchMode(newMode) {
        // Handle mode switching logic
    }
    
    updateCamera() {
        // Route to appropriate camera update function
        switch(this.currentMode) {
            case 'THIRD_PERSON':
                this.updateThirdPersonCamera();
                break;
            case 'FIRST_PERSON':
                this.updateFirstPersonCamera();
                break;
        }
    }
    
    updateThirdPersonCamera() {
        // Move existing updateDynamicCamera() logic here
    }
    
    updateFirstPersonCamera() {
        // New first-person camera logic
        const player = this.getLocalPlayer();
        const inputSystem = window.inputSystem;
        
        if (player && inputSystem && inputSystem.isMouseLocked()) {
            // Position camera at player's eye level
            camera.position.x = player.transform.position.x;
            camera.position.y = player.transform.position.y + this.modeStates.first_person.eyeHeight;
            camera.position.z = player.transform.position.z;
            
            // Rotate camera to match player facing direction
            const mouseRotation = inputSystem.mouseInput.totalRotationX;
            // Calculate look-at point from mouse rotation
            const lookAtDistance = 10; // Look ahead distance
            const lookAtX = camera.position.x + Math.sin(mouseRotation) * lookAtDistance;
            const lookAtZ = camera.position.z + Math.cos(mouseRotation) * lookAtDistance;
            const lookAtY = camera.position.y; // Same height
            
            camera.lookAt(lookAtX, lookAtY, lookAtZ);
        }
    }
}
```

### Phase 2: Input System Integration

#### Modify: `js/systems/input/input-system.js`
```javascript
// Add to keyMappings
'KeyC': 'camera_toggle',

// Add to handleKeyDown
if (action === 'camera_toggle') {
    const cameraManager = window.cameraManager;
    if (cameraManager) {
        cameraManager.toggleMode();
    }
}
```

### Phase 3: Main.js Integration

#### Modify: `js/main.js`
- Replace `updateDynamicCamera()` call with `cameraManager.updateCamera()`
- Initialize camera manager system
- Move existing camera logic to camera manager

### Phase 4: Configuration Extension

#### Modify: `js/core/config.js`
```javascript
camera: {
    // Existing third-person settings
    height: 50,
    distance: 30,
    fov: 60,
    lookAtOffset: { x: 0, y: -6, z: 0 },
    
    // New first-person settings
    firstPerson: {
        eyeHeight: 1.7,        // Height above player position
        fov: 75,               // Wider FOV for first-person
        mouseSensitivity: 1.0, // Multiplier for mouse sensitivity
        hidePlayerMesh: true   // Hide player in first-person
    },
    
    // Mode switching settings
    modeSwitch: {
        smoothTransition: false,  // Instant vs smooth switching
        transitionDuration: 0.3   // Seconds for smooth transition
    }
}
```

## Testing Strategy

### Phase 1 Testing
1. Create camera manager skeleton
2. Test mode switching without camera changes
3. Verify input integration works

### Phase 2 Testing
1. Test third-person mode (should work exactly as before)
2. Test camera toggle key detection
3. Verify mode switching triggers

### Phase 3 Testing
1. Test first-person camera positioning
2. Test mouse rotation in first-person
3. Test switching between modes
4. Test movement feels natural in both modes

### Phase 4 Testing
1. Test various settings combinations
2. Test edge cases (alt-tab, mouse unlock/lock)
3. Test with different arena positions
4. Test with AI interactions

## Potential Challenges & Solutions

### Challenge 1: Mouse Control Conflicts
**Issue**: Mouse currently controls character facing, need it to also control camera in first-person
**Solution**: In first-person mode, camera rotation and character rotation are the same - they both use the mouse input

### Challenge 2: Movement Feel Different
**Issue**: Character-relative movement might feel different in first-person vs third-person
**Solution**: Movement system already uses character facing direction, so it should feel consistent

### Challenge 3: Camera Collision
**Issue**: First-person camera might clip through walls/obstacles
**Solution**: Keep first-person camera simple initially, add collision detection in later phase if needed

### Challenge 4: Smooth Transitions
**Issue**: Jarring switch between camera modes
**Solution**: Implement instant switching first, add smooth transitions as polish

## Files to Modify/Create

### New Files:
1. `js/systems/camera/camera-manager.js` - Main camera management system
2. `js/systems/camera/first-person-camera.js` - First-person specific logic (optional separate file)

### Modified Files:
1. `js/main.js` - Replace camera update call, add camera manager initialization
2. `js/systems/input/input-system.js` - Add camera toggle key
3. `js/core/config.js` - Add first-person camera settings
4. `js/systems/ui/tweak-panel.js` - Add camera mode controls (optional)

## Implementation Timeline

1. **Phase 1** (Camera Manager Foundation) - Test after each step
2. **Phase 2** (Input Integration) - Test toggle detection
3. **Phase 3** (First-Person Logic) - Test basic first-person view
4. **Phase 4** (Polish & Settings) - Fine-tune and add options

## Expected Results

After implementation:
- **C key** toggles between third-person and first-person view
- **Third-person mode** works exactly as before
- **First-person mode** positions camera at player eye level
- **Mouse controls** work identically in both modes (character facing)
- **Movement** feels natural and consistent in both camera modes
- **Smooth integration** with existing steering system

This will give you the best of both worlds:
- **Third-person**: Great for spatial awareness and seeing your character
- **First-person**: Immersive view and precise aiming/looking around

---

## IMPLEMENTATION PROGRESS LOG

### Phase 1: Camera Manager Foundation ✅ COMPLETED
**Date**: October 5, 2025

**Files Created**:
- `js/systems/camera/camera-manager.js` (196 lines) - Main camera system
- `js/systems/camera/third-person-camera.js` (165 lines) - Third-person logic

**Files Modified**:
- `js/systems/input/input-system.js` - Added C key toggle
- `js/core/config.js` - Added first-person settings
- `js/main.js` - Integrated camera manager
- `index.html` - Added scripts and updated controls

**Status**: ✅ Ready for testing!

**Test Plan**:
1. Load game - should work in third-person (default)
2. Press C key - should switch to first-person
3. Test mouse look in first-person mode
4. Test movement (W/A/S/D) works in both modes