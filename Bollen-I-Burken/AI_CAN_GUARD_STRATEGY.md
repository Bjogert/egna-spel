# AI Can-Guard Strategy - Game Mechanics Overhaul

**Date:** 2025-10-02
**Status:** Ready for testing

---

## New Game Rules

### The Race to the Can

**Old rules:**
- AI chases player directly
- AI tags player → Game Over

**NEW rules:**
- AI **guards the can** while patrolling
- When AI **spots player** → **RACE TO THE CAN!**
- **AI reaches can first (< 0.8m)** → **AI WINS** 🔴
- **Player reaches can + kicks it (Space)** → **PLAYER WINS** ✅ → Next level

---

## AI Behavior Changes

### PATROL State (NEW: Can-Guard Strategy)

**Behavior:**
1. **Orbit the can** at 3m radius
2. **Face outward** (away from can)
3. **Scan opposite side** of arena systematically
4. **Change scan direction** every 1.5-3.5 seconds
5. **Occasionally reverse** orbit direction

**Why this works:**
- AI stays close to can (can react quickly when player spotted)
- AI watches the far side of arena (where player is likely hiding)
- AI doesn't stare at can (scans for threats)
- Movement feels natural (orbiting guard behavior)

**Parameters:**
- Orbit radius: 3.0m (adjustable)
- Orbit speed: 0.3 rad/sec (slow circle)
- Scan range: ±60° from opposite side
- Too far trigger: >4.0m → return to can
- Too close trigger: <2.0m → move away

---

### HUNTING State (NEW: Sprint to Can)

**Old behavior:** Chase player directly
**NEW behavior:** SPRINT TO THE CAN!

**When triggered:**
- Vision cone detects player
- State changes: PATROL → HUNTING
- AI immediately turns toward can and accelerates

**Race mechanics:**
- AI uses **max hunting speed** (0.20 units/frame)
- AI uses **aggressive steering** (3.5x angular, 3.0x linear acceleration)
- AI checks distance to can every frame
- **If distance < 0.8m → AI WINS**

**Visual feedback:**
- Console log: `"AI spotted player! Racing to can at (x, z)"`
- Vision cone turns RED
- AI visibly accelerates toward center

---

## Files Created/Modified

### Created:
- [js/systems/ai/steering/can-guard-strategy.js](js/systems/ai/steering/can-guard-strategy.js) - Can-guarding patrol logic

### Modified:
- [js/systems/ai/ai-system.js](js/systems/ai/ai-system.js:88) - Integrated can-guard patrol
- [js/systems/ai/ai-system.js](js/systems/ai/ai-system.js:183) - Hunting now races to can
- [js/systems/ai/ai-system.js](js/systems/ai/ai-system.js:247) - Added `triggerAIWins()` method
- [js/systems/ai/ai-system.js](js/systems/ai/ai-system.js:152) - Added `getCanPosition()` method
- [index.html](index.html:120) - Added can-guard-strategy script

---

## How Can-Guard Strategy Works

### State Machine

```
guardState = {
    orbitRadius: 3.0,          // Distance from can (patrol circle)
    orbitAngle: <random>,      // Current angle around can (0-2π)
    orbitDirection: ±1,        // Clockwise or counter-clockwise
    scanTarget: <angle>,       // Where AI is currently looking
    scanDuration: 0,           // Time spent on current scan
    nextScanChange: 2000,      // When to pick new scan direction
    mode: 'ORBIT'              // Future: ORBIT | SCAN | INVESTIGATE
}
```

### Update Loop

```
Every frame:
  1. Calculate distance from can

  2. If too far (>4m):
     → Return to can (approach orbit radius)

  3. If too close (<2m):
     → Move away from can (back to orbit radius)

  4. If at good distance (2-4m):
     → Update orbit angle (move around can slowly)
     → Calculate target position on circle
     → Move toward target position
     → Face outward + scan offset
     → Update scan direction periodically

  5. Combine with obstacle avoidance (5x weight)
```

### Scan Pattern

```
Every 1.5-3.5 seconds:
  1. Calculate opposite angle (180° from current position)
  2. Add random offset (±60°)
  3. Set as new scan target
  4. Smoothly turn to face new target
  5. 20% chance to reverse orbit direction
```

**Example:**
- AI at position: angle 45° (northeast of can)
- Opposite side: 225° (southwest)
- Random offset: +30°
- Scan target: 255° (AI looks west-southwest)
- **Result:** AI watches the far corner where player might be hiding

---

## Race Mechanics

### When Player Spotted:

```
updateHunting():
  1. Get can position (from Interactable entity)
  2. Seek toward can (max speed + max acceleration)
  3. Every frame: check distance to can
  4. If distance < 0.8m:
     → triggerAIWins()
     → Game Over (AI wins)
```

### Player's Response (TODO):

```
Player sees vision cone turn RED
  ↓
Player must SPRINT to can
  ↓
Player reaches can
  ↓
Player presses SPACE to kick
  ↓
If player kicks BEFORE AI reaches:
  → Player wins
  → Next level
```

---

## Win Conditions

### AI Wins:
- ✅ AI distance to can < 0.8m during HUNTING state
- ✅ Triggers `GameEngine.gameOver('ai_won')`
- ✅ Alert: "AI WON! The hunter reached the can before you could kick it."

### Player Wins (TODO - needs implementation):
- ⏸️ Player reaches can (distance < 1.5m)
- ⏸️ Player presses Space
- ⏸️ Can interaction triggers
- ⏸️ Triggers `GameEngine.levelComplete()` or similar
- ⏸️ Load next level / increase difficulty

---

## Testing Checklist

### Can-Guard Patrol:
- [ ] AI orbits can at ~3m radius
- [ ] AI faces outward (away from can)
- [ ] AI changes scan direction every few seconds
- [ ] AI returns to can if it wanders too far
- [ ] AI doesn't get stuck on can

### Race Mechanics:
- [ ] Vision cone detects player → AI immediately turns toward can
- [ ] AI sprints to can (fast, aggressive movement)
- [ ] AI wins if reaching can first (< 0.8m)
- [ ] Console logs race start: "AI spotted player! Racing to can..."
- [ ] Console logs AI win: "AI reached can first! AI WINS the race!"

### Player Experience (needs can-kick implementation):
- [ ] Player can see AI guarding can
- [ ] Player can sneak around edges
- [ ] When spotted: race feels urgent
- [ ] Player can reach can and interact (Space)
- [ ] Player wins if kicking before AI arrives

---

## Strategic Implications

### For Player (Hider):
- **Can't hide near can** - AI is always watching that area
- **Must hide on opposite side** - AI scans systematically
- **When spotted: immediate sprint** - race is very fast
- **Risk vs reward** - closer to can = easier to win race, but easier to be spotted

### For AI (Hunter):
- **Efficient guarding** - covers most likely hiding spots
- **Fast response** - already close to can when player spotted
- **Predictable but effective** - player can learn pattern but still challenging
- **Scalable with difficulty** - can adjust orbit radius, scan speed, sprint speed

---

## Future Enhancements (Phase 2+)

### Smarter Patrol:
- **Investigation mode** - Move toward noise/movement
- **Corner checking** - Occasionally move to corners to check thoroughly
- **Memory system** - Remember where player was last seen, prioritize that area

### Dynamic Difficulty:
- **Easy:** Large orbit radius (4-5m), slow scan
- **Hard:** Small orbit radius (2-3m), fast scan, faster sprint

### Player Abilities:
- **Sneaking** - Reduced detection range when moving slowly
- **Distraction** - Throw object to make noise elsewhere
- **Sprint stamina** - Limited sprint meter for race

---

## Next Steps

1. ✅ **Can-guard patrol** - Complete
2. ✅ **Race to can (AI side)** - Complete
3. ⏳ **Can interaction (player side)** - TODO
4. ⏳ **Win conditions** - Partial (AI win done, player win TODO)
5. ⏳ **Testing & balancing** - In progress

**Ready to test AI behavior!** 🎮

The AI should now:
- Circle the can while watching outward
- Sprint to can when spotting player
- Win if reaching can first

**Next:** Implement player can-kicking interaction for player win condition.
