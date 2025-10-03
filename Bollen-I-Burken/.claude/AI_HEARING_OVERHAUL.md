# AI Hearing System Overhaul

## ✅ Phase 1: COMPLETED - Instant Look-At Reaction
**Status**: Implemented and ready to test!
**Changes**: `ai-system.js` lines 176-179
**What it does**:
- AI instantly snaps heading to face sound direction (same frame)
- Updates both `aiComponent.heading` and `transform.rotation.y`
- Logs reaction angle for debugging
- Works for both initial hearing and continuous updates

**Code Added**:
```javascript
const angleToSound = Math.atan2(dx, dz);
aiComponent.heading = angleToSound;
transform.rotation.y = angleToSound;
```

## Current Status (Working)
- ✅ AI can hear player based on movement speed and distance
- ✅ Hearing range: 19m default (max 100m)
- ✅ Sound level calculation: `playerSpeed / maxSpeed * sneakMultiplier`
- ✅ Effective range: `hearingRange * soundLevel`
- ✅ Investigation state transitions to INVESTIGATE when sound heard
- ✅ Continuous target updates while investigating
- ✅ Navigation uses steering behaviors + obstacle avoidance
- ✅ Give-up logic after 3 stuck attempts

## Problem: AI Reactions Feel Unresponsive

### Current Behavior (Not Great)
1. AI hears sound → sets target position
2. AI uses steering to slowly turn and navigate
3. No immediate visual reaction
4. Doesn't acknowledge obstacles between AI and sound source
5. Takes time to turn around even if player is right behind them

### Desired Behavior (Target)
1. **Instant Head Turn**: AI immediately snaps to look toward sound direction
2. **Corner Awareness**: If obstacle blocks line of sight, look at nearest corner
3. **Visual Feedback**: Player should see AI react (head snap, then body follows)
4. **Intelligent Pathfinding**: Navigate around obstacles to investigate
5. **Persistent Tracking**: Keep updating target as player moves

## Technical Requirements

### Phase 1: Immediate Look-At Reaction
**Goal**: AI instantly turns to face sound direction when heard

**Implementation**:
```javascript
// In updateHearing() when sound detected:
1. Calculate angle from AI to sound source
2. Instantly set ai.heading = angleToSound
3. Add visual "alert" animation (optional: jump, exclamation mark)
4. THEN start navigation
```

**Files to modify**:
- `js/systems/ai/ai-system.js` - updateHearing()
- `js/core/components/ai-hunter.js` - Add reaction animation state

### Phase 2: Corner Detection & Look-At
**Goal**: If obstacle blocks direct line of sight, look at nearest visible corner

**Implementation**:
```javascript
// When sound heard:
1. Raycast from AI position to sound position
2. If raycast hits obstacle:
   a. Get all corners of blocking obstacle(s)
   b. Find nearest corner visible to AI
   c. Look at that corner instead
3. Navigate to corner first, then to sound position
```

**New utility needed**:
- `getObstacleCorners(collider, transform)` - Extract 4 corners from box collider
- `findNearestVisibleCorner(aiPos, targetPos, obstacles)` - Raycast-based corner selection
- `isLineOfSightClear(fromPos, toPos, obstacles)` - Simple raycast check

**Files to create/modify**:
- `js/systems/ai/utils/corner-detection.js` - NEW FILE
- `js/systems/ai/behaviors/investigate-behavior.js` - Use corner waypoints
- `index.html` - Add new script

### Phase 3: Visual Reaction Animation (Optional)
**Goal**: Make AI reaction visible to player

**Options**:
- Small upward jump (0.2-0.3m)
- Exclamation mark particle above head
- Color change (flash yellow briefly)
- Rotation speed burst (quick snap)

### Phase 4: Waypoint Navigation
**Goal**: AI navigates via corners when needed

**Implementation**:
```javascript
// In INVESTIGATE behavior:
1. If direct path blocked:
   - Set currentWaypoint = nearestCorner
2. Navigate to waypoint using arrive()
3. When reached waypoint (distance < 1m):
   - Clear waypoint
   - Recalculate path (might need another corner)
4. Continue until reaching heard position
```

**Files to modify**:
- `js/systems/ai/behaviors/investigate-behavior.js` - Waypoint logic
- `js/core/components/ai-hunter.js` - Add currentWaypoint field

## Code Cleanup Needed (Before Implementation)

### Debug Logging to Clean Up
Current files have excessive console.log statements:

1. **ai-system.js**:
   - Line 159: Throttled hearing check (KEEP but maybe reduce frequency)
   - Line 182: AI HEARD PLAYER (KEEP)
   - Line 187: Updated investigation target (KEEP but reduce verbosity)
   - Line 190: Can't investigate in state X (REDUCE to Utils.log)

2. **investigate-behavior.js**:
   - Check for debug logs in unstuck logic
   - Verify Utils.log vs console.log usage

3. **obstacle-avoidance.js**:
   - Line 82: [AVOID] logs (KEEP but maybe reduce threshold to 0.7)
   - Line 118: [UNSTUCK] logs (KEEP)

### Recommendation:
- Add `AI_DEBUG` flag to toggle verbose logging
- Convert most console.log to Utils.log (goes to log file, not console spam)
- Keep critical state changes as console.log for now

## Implementation Plan

### Step 1: Analyze Current Code with Serena ⏳
Use code-detective-serena to map:
- All hearing-related code paths
- Current investigation flow
- Obstacle avoidance integration points
- Component relationships

### Step 2: Clean Up Debug Logging
- Add debug flag system
- Reduce console noise
- Keep essential state logs

### Step 3: Implement Immediate Look-At (Quick Win)
- Instant heading change on sound detection
- Visual feedback (optional jump)
- Test feel/responsiveness

### Step 4: Implement Corner Detection
- Create corner-detection.js utility
- Raycast from AI to sound
- Extract corners from blocking obstacles

### Step 5: Implement Corner Waypoint Navigation
- Modify investigate-behavior.js
- Add waypoint system
- Navigate via corners when needed

### Step 6: Polish & Test
- Tune reaction speeds
- Test with various obstacle configurations
- Balance hearing range and responsiveness

## Success Criteria

✅ AI turns head toward sound **instantly** (< 1 frame delay)
✅ AI looks at corners when obstacles block direct view
✅ AI navigates smoothly around obstacles to investigate
✅ Player feels "seen" or "heard" immediately
✅ No excessive debug spam in console
✅ Hearing continues to work during investigation (target updates)

## Questions to Resolve

1. **Reaction animation**: Jump, color flash, or just head snap?
2. **Corner selection**: Nearest corner, or "best" corner toward player?
3. **Waypoint persistence**: Clear waypoints on new sound, or keep navigating?
4. **Multiple obstacles**: Handle complex paths or just one corner?
5. **Debug mode**: Toggle via tweak panel or code constant?

## File Structure (After Implementation)

```
js/systems/ai/
├── ai-system.js                    (Main AI controller)
├── behaviors/
│   ├── investigate-behavior.js     (Investigation logic + waypoints)
│   └── (future: patrol-behavior.js, chase-behavior.js)
├── steering/
│   ├── steering-behaviors.js       (Wander, seek, arrive, flee)
│   ├── obstacle-avoidance.js       (Collision avoidance)
│   └── can-guard-strategy.js       (Patrol pattern)
├── utils/
│   ├── corner-detection.js         (NEW: Corner extraction & raycasting)
│   └── (future: pathfinding.js)
└── dynamic-vision.js               (Vision cone logic)
```

## Notes

- Keep KISS principle: Start with simple immediate rotation
- Corner detection can come later if simple rotation feels good
- Test each phase independently before moving to next
- Consider using Serena to ensure we don't break existing systems
