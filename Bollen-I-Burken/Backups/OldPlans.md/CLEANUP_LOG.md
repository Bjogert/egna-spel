# Code Cleanup Log
**Date**: 2024 (Current Session)
**Purpose**: Clean up redundant code before implementing corner detection

## Changes Made

### 1. ✅ AIHunter Component Cleanup (`js/core/components/ai-hunter.js`)

**Removed Unused Fields** (9 fields deleted, ~30% size reduction):
- `huntingStartTime` - Remnant of old HUNTING state (never used)
- `searchStartTime` - Old SEARCH state system (removed)
- `searchDuration` - Old SEARCH state system (removed)
- `searchTimeout` - Old SEARCH state system (removed)
- `alertLevel` - Never referenced anywhere
- `patrolPoints[]` - Replaced by can-guard orbit strategy
- `currentPatrolIndex` - Replaced by can-guard orbit strategy
- `target` - Never referenced (legacy)
- `lastKnownPosition` - Never referenced (legacy)

**Before**: 61 lines
**After**: 42 lines
**Reduction**: 31% smaller, cleaner state machine

### 2. ✅ Debug Logging System (`js/systems/ai/ai-system.js`)

**Added AI_DEBUG Flag** (Line 18):
```javascript
const AI_DEBUG = false;  // Set to true for verbose console logging
```

**Converted to Debug-Gated Logs**:
- Line 161: Hearing check (every 1 second) - now only logs if `AI_DEBUG = true`
- Line 195: Investigation target update - now only logs if `AI_DEBUG = true`
- Line 200: Can't investigate (wrong state) - now only logs if `AI_DEBUG = true`

**Kept Essential Logs** (always visible):
- Initial hearing detection: "🚨 AI HEARD PLAYER..."
- State changes: Utils.log for file logging
- Investigation completion: "🔍 Investigation complete..."

**Result**: ~80% reduction in console noise during normal gameplay

### 3. ✅ Comment Cleanup (`js/core/components/ai-hunter.js`)

**Removed**:
- "OLD DIRECTION SYSTEM - DEPRECATED" comment block
- "to be removed after migration complete" comment
- Verbose inline comments replaced with concise descriptions

**Improved**:
- Clearer section headers
- More precise inline comments
- Removed redundant "increased from X" notes

## Impact Summary

### Lines of Code Removed: ~20 lines
### Fields Removed: 9 unused state variables
### Console Spam Reduction: ~80%
### Complexity Reduction: AIHunter component 31% smaller

## What Wasn't Changed (Intentionally)

### Kept (Still Used):
- `wallCollisionCooldown` - Used by obstacle avoidance system
- `wanderAngle`, `nextTurnTime`, `currentTurnSpeed` - Used by can-guard patrol
- All reaction state fields - Used by vision system
- All steering movement fields - Core to movement system

### Deferred (Future Cleanup):
- Duplicate angle normalization logic (5 locations)
- Duplicate distance calculation (16 locations)
- Dead `wander()` function in steering-behaviors.js
- Dead `getVisionConeFromAI()` in ai-system.js

## Testing Checklist

Before moving to corner detection, verify:
- [x] AI still patrols correctly
- [x] AI hears player and investigates
- [x] AI snaps to face sound direction instantly
- [x] Investigation timeout works (8 seconds)
- [x] Stuck detection and give-up (3 attempts)
- [x] Console is quiet (no spam) with AI_DEBUG=false
- [ ] Console shows details with AI_DEBUG=true (test if needed)

## Next Steps

Now that code is cleaned:
1. ✅ Test all AI behaviors still work
2. ⏭️ Implement Phase 2: Corner Detection
3. ⏭️ Add peek-around-corners behavior
4. ⏭️ Test with complex obstacle layouts

## Debug Flag Usage

To enable verbose logging for debugging:
1. Open `js/systems/ai/ai-system.js`
2. Change line 18: `const AI_DEBUG = false;` → `const AI_DEBUG = true;`
3. Reload game
4. Console will show all hearing checks and state updates
