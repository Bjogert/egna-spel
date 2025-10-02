# Bug Report: AI Hunting Behavior Issues

**Status:** ✅ RESOLVED (Simplified to 2-state system)
**Priority:** HIGH
**Created:** 2025-10-02
**Resolved:** 2025-10-02

---

## Resolution

**Implemented KISS Solution:** Simplified from 3-state to 2-state system

### New Architecture:
```javascript
AI_STATES = {
    PATROL: 'PATROL',  // Orbit can at ~3m radius
    RACE: 'RACE'       // Sprint straight to can
}
```

### Transition Rules:
- **PATROL → RACE**: When vision cone detects player → lock in race for 2 seconds
- **RACE → PATROL**: When (a) AI wins, (b) player wins, or (c) race lock expires (2s) AND AI is far from can (>3m)

### Key Changes:
1. **No grace periods** - Clean state transitions
2. **No lastSeenPosition tracking** - Player position only triggers race, nothing else
3. **Direct velocity setting** - No steering behaviors during race, just pure sprint
4. **Race lock timer** - Once racing, commit for 2 seconds (prevents flicker)
5. **Removed SEARCHING state** - Only two modes: patrol or race

### Why This Works:
- ✅ No console spam (only logs once when race starts)
- ✅ No big circles (patrol disabled during race)
- ✅ No complex logic (if see player = run to can)
- ✅ Predictable behavior (player can learn and adapt)
- ✅ Fair gameplay (both race when AI spots player)

---

## Original Summary

AI hunter exhibits unwanted behaviors during the "race to can" mechanic when player is spotted. Multiple symptoms may be related to the same root cause.

---

## Game Rules (Expected Behavior)

When the hunter **identifies the hider**:
1. **Race begins** - Both AI and player race toward the can
2. **AI wins** if it reaches can first (< 0.8m from can position)
3. **Player wins** if they reach can first and kick it (Space key)

**AI Strategy**:
- **Patrol mode**: Guard the can by orbiting at ~3m radius, facing outward to scan arena
- **Hunting mode**: When player spotted → SPRINT directly to can (not chase player)
- **Grace period**: Continue hunting for 1.5 seconds after losing sight

---

## Reported Issues

### Issue 1: Console Spam ✅ ATTEMPTED FIX
**Symptom**: Thousands of identical log messages every frame
```
[Game] AI spotted player! Racing to can at (0.0, 0.0)
[Game] AI spotted player! Racing to can at (0.0, 0.0)
[Game] AI spotted player! Racing to can at (0.0, 0.0)
... (repeated 1000+ times)
```

**Attempted Fix**: Removed logging from hunting loop (line 208 in `ai-system.js`)
**Status**: User reports "its the same" - fix may not have worked

**Root Cause Hypothesis**:
- Log condition `timeSinceLastSeen < 100` triggers every frame
- `lastSeenTime` updates every frame player is visible
- Logging removed but issue may be deeper

### Issue 2: Big Circles When Player Near Can
**Symptom**: AI enters wide circular pattern instead of racing to can

**When it happens**: Player gets closer to can than AI during race

**Current Logic**:
```javascript
// In updateHuntingBehavior (lines 204-258)
if (timeSinceLastSeen < gracePeriod) {
    // RACE TO CAN
    seek(canPosition);

    // Check if AI won
    if (distanceToCan < 0.8) {
        triggerAIWins();
    }
} else {
    // Lost player - return to PATROL
    aiComponent.state = AI_STATES.PATROL;
}
```

**Hypothesis**:
- AI briefly loses sight when player gets between AI and can
- Falls back to patrol mode
- Guard strategy sees AI close to can → triggers "move away" behavior
- Creates circular motion instead of sprint to can

**Attempted Fix**: Reset guard state when AI < 1.5m from can (lines 91-102)

### Issue 3: AI Twitching/Shaking ✅ FIXED
**Symptom**: AI appears to vibrate or shake in place

**Cause**: Instant 180° angle jumps during repositioning in can-guard strategy

**Fix**: Smooth angle interpolation with `targetOrbitAngle` (see `can-guard-strategy.js`)

---

## Core Problem Analysis

### The Simple Requirement
User: "If he sees player = run to the can"

### The Complex Implementation
Current system has multiple layers:
1. Vision cone detection (updates `lastSeenTime` every frame)
2. Grace period logic (1.5 sec buffer)
3. State machine (PATROL, HUNTING, SEARCHING)
4. Steering behaviors (seek, arrive, flee)
5. Can-guard strategy (orbit, reposition, scan)
6. Distance checks (< 0.8m = AI wins)

**Question**: Is this overcomplicated? Can we simplify?

---

## Technical Details

### File: `js/systems/ai/ai-system.js`

**Vision Detection** (happens in vision-cone-system.js):
```javascript
// Every frame player is visible
visionCone.lastSeenTime = Date.now();
visionCone.lastSeenPosition = playerPosition;
```

**Hunting Trigger** (lines 133-145):
```javascript
if (visionCone && visionCone.canSeePlayer) {
    if (aiComponent.state !== AI_STATES.HUNTING) {
        console.log('[Game] AI spotted player, switching to HUNTING mode');
        aiComponent.state = AI_STATES.HUNTING;
    }
}
```

**Race to Can** (lines 204-258):
```javascript
const timeSinceLastSeen = Date.now() - visionCone.lastSeenTime;
const gracePeriod = 1500;

if (timeSinceLastSeen < gracePeriod) {
    // Seek to can position (0, 0.3, 0)
    const steering = SteeringBehaviors.seek(aiComponent, canPosition, transform.position);

    // Fast turning (3.5x angular acceleration)
    aiComponent.heading += steering.angular * dt;

    // Fast movement (3.0x linear acceleration)
    aiComponent.velocity.x += steering.linear.x * dt;
    aiComponent.velocity.z += steering.linear.z * dt;

    // Win condition
    const dx = transform.position.x - canPosition.x;
    const dz = transform.position.z - canPosition.z;
    const distanceToCan = Math.sqrt(dx * dx + dz * dz);

    if (distanceToCan < 0.8) {
        this.triggerAIWins(gameState);
    }
}
```

### File: `js/systems/ai/steering/can-guard-strategy.js`

**Patrol Behavior**:
- Orbit can at 3m radius
- Dynamic tempo (sometimes fast, slow, repositioning)
- Scan opposite side of arena
- Stay between 1.8m - 5.0m from can

**State Reset** (to prevent big circles):
```javascript
// In ai-system.js lines 91-102
if (aiComponent.guardState && distToCan < 1.5) {
    const currentAngle = Math.atan2(dx, dz);
    aiComponent.guardState.orbitAngle = currentAngle;
    aiComponent.guardState.targetOrbitAngle = undefined;
}
```

---

## Questions for Research

### 1. Why is console spam still happening?
- Is the logging actually removed in running code?
- Is there another log statement we missed?
- Is the issue not logging but actual behavior (AI repeatedly entering/exiting hunting)?

### 2. Why does AI circle when player near can?
- Is grace period logic working correctly?
- Is vision cone losing sight when it shouldn't?
- Should we disable patrol entirely during grace period?

### 3. Can we simplify this?
Current flow:
```
Player spotted → Set HUNTING → Check grace period → Seek can → Check distance → Win?
                      ↓
                 Lost sight → Grace period → Still lost → PATROL → Guard strategy → Circles?
```

Simpler flow:
```
Player visible → Sprint to can → Reached can → Win
Player not visible → Orbit can
```

### 4. Is the state machine helping or hurting?
- Do we need separate HUNTING/PATROL/SEARCHING states?
- Or just: "Can see player" vs "Cannot see player"?

### 5. What's the actual user experience?
Need to test in-game:
- Does AI reliably race to can when player spotted?
- Does player have fair chance to win the race?
- Are the circular patterns breaking gameplay?

---

## Possible Solutions

### Option 1: Debug Current System
**Approach**: Find why grace period / state reset isn't working
- Add targeted logging to track state transitions
- Monitor `timeSinceLastSeen` values
- Check if vision cone is flickering on/off

**Pros**: Fixes existing architecture
**Cons**: May be chasing symptoms not root cause

### Option 2: Simplify State Machine
**Approach**: Remove grace period, remove state resets, make it binary
```javascript
if (visionCone.canSeePlayer) {
    // Sprint to can (no grace period)
    seek(canPosition);
} else {
    // Orbit can (standard patrol)
    canGuardStrategy();
}
```

**Pros**: Simple, matches user's request ("if see player = run to can")
**Cons**: May cause rapid toggling if vision flickers

### Option 3: Lock-In Hunting Mode
**Approach**: Once hunting starts, AI commits until reaching can or timeout
```javascript
if (visionCone.canSeePlayer && !aiComponent.huntingLockUntil) {
    aiComponent.huntingLockUntil = Date.now() + 5000;  // Hunt for 5 sec
}

if (Date.now() < aiComponent.huntingLockUntil) {
    seek(canPosition);  // Race regardless of vision
} else {
    canGuardStrategy();  // Back to patrol
}
```

**Pros**: Prevents state flicker, AI commits to race
**Cons**: AI might race even if player hides again

### Option 4: Distance-Based Override
**Approach**: If AI is close to can during hunting, disable patrol logic
```javascript
if (aiComponent.state === AI_STATES.HUNTING || distanceToCan < 2.0) {
    // Force hunting behavior (no guard strategy)
    seek(canPosition);
}
```

**Pros**: Prevents guard strategy from interfering
**Cons**: Band-aid on larger issue?

---

## Files Involved

### Core AI Logic:
- `js/systems/ai/ai-system.js` - Main AI update loop
- `js/systems/ai/steering/can-guard-strategy.js` - Patrol behavior
- `js/systems/ai/steering/steering-behaviors.js` - Seek/arrive/flee
- `js/core/components/ai-hunter.js` - AI component definition

### Vision System:
- `js/systems/ai/vision-cone-system.js` - Player detection
- `js/core/components/vision-cone.js` - Vision component

### Supporting:
- `js/systems/ai/steering/obstacle-avoidance.js` - Wall avoidance
- `js/core/config.js` - AI_STATES constants

---

## Next Steps

1. **User Testing**: Run game and observe exact behavior
   - When does console spam appear?
   - When do circles happen?
   - Is race-to-can working at all?

2. **Instrumentation**: Add minimal debug logging
   - Track state transitions (PATROL → HUNTING → PATROL?)
   - Monitor `timeSinceLastSeen` values
   - Log distance to can during hunting

3. **Simplification Test**: Try Option 2 (remove grace period/state complexity)
   - See if simple binary logic works better
   - Measure if vision flickering is actually a problem

4. **User Feedback**: What does "its the same" mean?
   - Same as what? Previous broken version?
   - What specific issue is user seeing?

---

## KISS Principle Reminder

Original requirement: "If AI sees player → run to can"

Current implementation: Multi-state machine with grace periods, state resets, guard strategies, and conditional overrides.

**Question**: Did we over-engineer this?

**Recommendation**: Try simplest possible version first, add complexity only if needed.
