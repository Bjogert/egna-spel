# Third-Person Steering Implementation Plan

## Current Architecture Analysis

### Current Movement System (Movement-System.js)
- **Character Rotation**: Uses `Math.atan2(desiredX, desiredZ)` for INSTANT rotation facing input direction
- **Input Processing**: Gets direction from InputSystem.playerDirection (WASD normalized vector)
- **Physics Integration**: Uses CANNON.js for body physics and collision
- **Current Behavior**: Player character immediately faces the direction they're moving (WASD)

### Current Input System (Input-System.js) 
- **Keyboard Only**: WASD/Arrow keys mapped to movement directions
- **No Mouse Support**: No mouse event listeners or mouse input handling found
- **Event Binding**: Uses addEventListener for keydown/keyup events
- **Output**: Provides normalized movement vector via playerDirection property

### Current Camera System (Main.js)
- **Fixed Third-Person View**: Camera positioned behind and above player
- **Dynamic Zoom**: Zooms in at arena center, out at edges
- **Smooth Following**: Smoothly follows player horizontally with CAMERA_HORIZONTAL_FOLLOW
- **Look-At Logic**: Always looks at blend between arena center and player position
- **No User Control**: Camera is fully automatic, no manual control

## Implementation Plan for Third-Person Steering

### Phase 1: Add Mouse Input Support

#### Files to Modify: `js/systems/input/input-system.js`

**Changes Required:**
1. **Add Mouse Event Listeners**
   ```javascript
   // New properties
   this.mouseInput = { deltaX: 0, deltaY: 0, isLocked: false };
   this.mouseSensitivity = 0.002; // Radians per pixel
   
   // Event listeners
   document.addEventListener('mousemove', this.boundMouseMove);
   document.addEventListener('click', this.boundRequestPointerLock);
   document.addEventListener('pointerlockchange', this.boundPointerLockChange);
   ```

2. **Pointer Lock API Integration**
   - Request pointer lock on canvas click
   - Track pointer lock state
   - Handle mouse delta movements when locked

3. **Mouse Delta Accumulation**
   - Accumulate mouse movement deltas per frame
   - Reset deltas after each frame processed
   - Apply sensitivity scaling

#### New Methods to Add:
- `handleMouseMove(event)` - Process mouse movement deltas
- `requestPointerLock()` - Request pointer lock on canvas
- `handlePointerLockChange()` - Track lock state changes
- `getMouseDelta()` - Return and reset mouse deltas
- `isMouseLocked()` - Check if pointer is locked

### Phase 2: Separate Movement from Facing Direction

#### Files to Modify: `js/systems/movement-system.js`

**Current Logic:**
```javascript
// Currently: Instant face input direction
transform.rotation.y = Math.atan2(desiredX, desiredZ);
```

**New Logic:**
```javascript
// Separate movement direction from facing direction
// Movement: Still use WASD input for velocity
// Facing: Use mouse input for character rotation

// Movement remains the same
const velocity = this.calculateMovementVelocity(inputDirection);

// NEW: Mouse-controlled facing
this.currentMouseRotation += mouseInput.deltaX * this.mouseSensitivity;
transform.rotation.y = this.currentMouseRotation;
```

#### New Properties to Add:
- `currentMouseRotation` - Accumulated mouse rotation in radians
- `mouseSensitivity` - How fast mouse controls rotation
- `separateMovementFromFacing` - Feature toggle

#### Methods to Modify:
- `updatePlayerMovement()` - Split movement and rotation logic
- `initialize()` - Add mouse rotation tracking

### Phase 3: Camera Integration (Optional Enhancement)

#### Files to Modify: `js/main.js` (Camera Logic)

**Current Camera**: Fixed behind player, automatic following

**Enhanced Camera Options**:
1. **Mouse-Relative Movement**: Movement direction relative to camera view
2. **Camera Orbit**: Allow mouse to also control camera orbit around player
3. **Hybrid Mode**: Toggle between fixed camera and mouse-controlled camera

**Implementation:**
```javascript
// Option 1: Movement relative to camera facing
const cameraAngle = Math.atan2(camera.position.x - player.x, camera.position.z - player.z);
const relativeMovement = rotateVector(inputDirection, cameraAngle);

// Option 2: Independent camera control
if (mouseControlsCamera) {
    // Mouse controls camera orbit around player
    const orbitRadius = getCurrentCameraDistance();
    camera.position = calculateOrbitPosition(player.position, mouseRotation, orbitRadius);
}
```

### Phase 4: Configuration and Polish

#### Files to Modify: `js/utils.js` or Create `js/config/input-config.js`

**Settings to Add:**
```javascript
INPUT_CONFIG = {
    mouse: {
        sensitivity: 0.002,
        invertY: false,
        smoothing: 0.1
    },
    steering: {
        separateMovementFromFacing: true,
        cameraRelativeMovement: false,
        mouseControlsCamera: false
    }
};
```

#### Files to Modify: `js/systems/ui/tweak-panel.js`

**UI Controls to Add:**
- Mouse sensitivity slider
- Toggle for third-person steering mode
- Toggle for camera-relative movement
- Reset mouse rotation button

## Implementation Order

1. **Start with Input System** - Add mouse support and pointer lock
2. **Test Mouse Input** - Verify mouse deltas are captured correctly
3. **Modify Movement System** - Separate movement from facing direction
4. **Test Basic Steering** - WASD moves, mouse turns character
5. **Add Configuration** - Make settings adjustable
6. **Polish and UI** - Add tweak panel controls

## Technical Considerations

### Challenges:
- **Pointer Lock UX**: Need clear indication when mouse is locked/unlocked
- **Physics Integration**: Ensure mouse rotation doesn't conflict with physics
- **Input Lag**: Mouse input should feel immediate, movement can be physics-delayed
- **Edge Cases**: Handle alt-tab, escape key, losing window focus

### Testing Strategy:
1. Test mouse input capture with console logs
2. Test character rotation without movement
3. Test movement without rotation
4. Test combined steering behavior
5. Test edge cases (focus loss, escape, etc.)

## Files Summary

**Files to Modify:**
- `js/systems/input/input-system.js` - Add mouse input support
- `js/systems/movement-system.js` - Separate movement from facing
- `js/main.js` - Optional camera enhancements
- `js/utils.js` - Add configuration settings
- `js/systems/ui/tweak-panel.js` - Add UI controls

**New Files (Optional):**
- `js/config/input-config.js` - Dedicated input configuration
- `js/systems/input/mouse-handler.js` - Separate mouse logic if input-system gets too complex

## Expected Result

After implementation:
- **WASD**: Controls character movement direction (velocity)
- **Mouse**: Controls character facing direction (rotation)
- **Camera**: Remains smooth third-person follow (or optionally mouse-controlled)
- **Physics**: Character body moves in WASD direction while facing mouse direction
- **Natural Feel**: Like modern third-person games (Dark Souls, GTA, etc.)

---

## IMPLEMENTATION PROGRESS LOG

### Phase 1: Add Mouse Input Support ✅ COMPLETED
**Target File**: `js/systems/input/input-system.js`

**Status**: ✅ COMPLETED - Mouse input working perfectly!
**Date**: October 5, 2025

**Tasks**:
- [x] Add mouse event listeners and pointer lock support
- [x] Add mouse delta tracking properties
- [x] Implement handleMouseMove method
- [x] Implement pointer lock request/change handlers
- [x] Test mouse input capture with console logs

**Testing Plan**:
1. ✅ Add console.log to verify mouse deltas are captured
2. ✅ Test pointer lock request on canvas click
3. ✅ Verify mouse movement generates proper delta values
4. ✅ Test edge cases (alt-tab, escape, focus loss)

**Changes Made**:
- Added mouseInput properties to constructor (deltaX, deltaY, isLocked, totalRotationX)
- Added mouseSensitivity setting (0.002 radians per pixel)
- Implemented setupMouseControls() method
- Added handleMouseMove() with delta accumulation
- Added requestPointerLock() for canvas click handling
- Added handlePointerLockChange() for lock state tracking
- Added getMouseDelta() and isMouseLocked() helper methods
- Added comprehensive console logging for debugging

**Test Results**:
- ✅ Pointer lock activates on canvas click
- ✅ Mouse deltas captured correctly (values like -68, +103, etc.)
- ✅ Total rotation accumulates properly (values like -6.590, -7.746, etc.)
- ✅ Console logging shows proper debug output format
- ✅ Mouse sensitivity of 0.002 feels reasonable for testing

---

### Phase 2: Separate Movement from Facing Direction ✅ COMPLETED
**Target File**: `js/systems/movement-system.js`

**Status**: ✅ COMPLETED - Mouse steering working perfectly!
**Date**: October 5, 2025

**Tasks**:
- [x] Read current movement system implementation
- [x] Add mouse rotation tracking to movement system
- [x] Separate WASD movement from character facing direction
- [x] Test character rotation with mouse while WASD still controls movement
- [x] Verify physics integration works correctly

**Testing Plan**:
1. ✅ Test character faces mouse direction independent of movement
2. ✅ Test WASD movement works regardless of facing direction
3. ✅ Test strafing (move sideways while facing forward)
4. ✅ Test physics body rotation matches visual rotation

**Changes Made**:
- Added mouseFacingEnabled toggle to constructor (default: true)
- Added currentMouseRotation property to track accumulated rotation
- Added inputSystemRef property for accessing input system
- Modified character rotation logic in updatePlayerMovement()
- Added mouse lock detection via window.inputSystem reference
- Implemented fallback to old rotation behavior when mouse not locked
- Added comprehensive console logging for debugging (🎯 STEERING DEBUG)
- Preserved old rotation logic as fallback option

**Test Results**:
- ✅ Mouse rotation controls character facing direction
- ✅ WASD movement independent from facing direction
- ✅ Strafing works perfectly (move sideways while looking forward)
- ✅ Console shows proper rotation values being applied
- ✅ Smooth integration with existing physics system
- ✅ Pointer lock integration working seamlessly

**User Feedback**: "it works! i can cotate the player with the mouse."

---

### Phase 3: Character-Relative Movement ⏳ IN PROGRESS
**Target File**: `js/systems/movement-system.js`

**Status**: Implementing character-relative movement (corrected from camera-relative)
**Date**: October 5, 2025

**IMPORTANT CORRECTION**: User clarified they want movement relative to **player facing direction** (mouse), not camera direction. This enables both "emperor view" and "over-the-shoulder" camera angles while maintaining consistent controls.

**Movement Logic**:
- **W** = Forward in direction player is facing (mouse direction)
- **S** = Backward from player facing direction
- **A** = Strafe left relative to player facing
- **D** = Strafe right relative to player facing

**Tasks**:
- [x] Understand difference between camera-relative vs character-relative movement
- [x] Change from camera direction to player facing direction
- [x] Use player's mouse rotation angle for movement transformation
- [ ] Test character-relative movement with different camera angles
- [ ] Verify works with both emperor and over-shoulder camera views

**Testing Plan**:
1. Test W always moves forward in player facing direction
2. Test A/D strafe relative to player facing, not camera
3. Test movement consistency with different camera positions
4. Test "emperor view" (camera above) vs "over-shoulder" (camera behind)

**Changes Made**:
- Renamed cameraRelativeMovement to characterRelativeMovement
- Changed calculation to use inputSystem.mouseInput.totalRotationX
- Use Math.sin/cos of player facing angle for forward/right vectors
- Updated debug logging to show player facing angle and vectors

**Test Results**:
- (Testing in progress)

---

### Phase 2: Separate Movement from Facing Direction ⏸️ PENDING
**Target File**: `js/systems/movement-system.js`

**Status**: Awaiting Phase 1 completion

---

### Phase 3: Camera Integration ⏸️ PENDING
**Target File**: `js/main.js`

**Status**: Optional - will decide after Phase 2

---

### Phase 4: Configuration and Polish ⏸️ PENDING
**Target Files**: `js/utils.js`, `js/systems/ui/tweak-panel.js`

**Status**: Final polish phase