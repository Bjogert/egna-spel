# HINDER (OBSTACLE) OVERHAUL PLAN

**Created:** 2025-10-01
**Status:** Planning Phase
**Goal:** Transform simple cube obstacles into varied Tetris-like wall shapes with depth-based scaling and color coding

---

## CURRENT STATE

### What We Have Now:
- Simple box/cube obstacles (width × height × depth)
- Random sizes within min/max ranges
- Two types: Full height (brown) and Low obstacles (green, transparent)
- Uniform distribution across arena
- 10 difficulty levels (45 obstacles at easiest → 2 at hardest)
- Obstacles positioned using `canExclusionRadius` to keep area clear around center can

### Current Issues:
1. **Too cube-like** - All obstacles are basic rectangular boxes
2. **No variety** - Same shape repeated with different sizes
3. **No strategic depth** - Can't create interesting wall formations or corners
4. **Height is random** - Not related to distance from can
5. **Colors are binary** - Only brown (full) or green (low)
6. **Zone around can** - Exists but uses simple radius check

---

## VISION: NEW OBSTACLE SYSTEM

### Core Design Principles:

#### 1. **Tetris-Like Wall Shapes**
Instead of cubes, create wall sections using combinations of:
- **Straight walls** - Long rectangular walls (like Tetris "I" piece)
- **L-shaped corners** - Two walls meeting at 90° (like Tetris "L" piece)
- **T-junctions** - Three walls meeting (like Tetris "T" piece)
- **Z-shapes** - Offset parallel walls (like Tetris "Z" piece)
- **Short walls** - Smaller single-wall obstacles

**Why:** Creates more natural hiding spots, corners to peek around, and strategic gameplay

#### 2. **Depth-Based Height Scaling**
Obstacles get **taller** the further they are from the center can:
- **Near can (0-3m radius):** Short obstacles (0.5-1.2m) - hunter can see over them
- **Mid-range (3-7m):** Medium obstacles (1.2-2.5m) - partial cover
- **Far from can (7m+):** Tall obstacles (2.5-4.5m) - full cover walls

**Why:** Creates strategic zones - risk vs reward (hide far but harder to reach can)

#### 3. **Color Coding by Height**
Colors indicate obstacle height for visual gameplay cues:
- **Green (0.5-1.2m):** Low obstacles - can see over, blocks movement
- **Yellow (1.2-2.0m):** Medium-low - crouching cover
- **Orange (2.0-3.0m):** Medium-high - standing cover
- **Brown (3.0-4.5m):** Tall walls - full cover

**Why:** Instant visual feedback about cover quality

#### 4. **Clear Zone Around Can**
Enforce circular exclusion zone where NO obstacles spawn:
- **Radius:** 3-10m depending on difficulty (larger radius = harder difficulty)
- **Visual marker:** Optional floor circle to show safe zone

**Why:** Ensures final dash to can is open and tense

---

## TASK BREAKDOWN

### **TASK 1: Create Shape Definition System**
**Goal:** Define Tetris-like wall shapes as reusable templates

#### Steps:
1. **Step 1.1:** Create new file `js/managers/arena/obstacle-shapes.js`
   - Define shape types enum: `STRAIGHT`, `L_CORNER`, `T_JUNCTION`, `Z_SHAPE`, `SHORT`
   - Each shape = array of box definitions with relative positions

2. **Step 1.2:** Implement shape templates
   - **Straight wall:** Single long box (e.g., 8m × height × 0.3m)
   - **L-corner:** Two perpendicular boxes meeting at corner
   - **T-junction:** Three boxes meeting at center
   - **Z-shape:** Two parallel boxes offset by perpendicular connector
   - **Short wall:** Single medium box (e.g., 3m × height × 0.3m)

3. **Step 1.3:** Add rotation support
   - Each shape can rotate 0°, 90°, 180°, 270°
   - Rotation applied to entire shape as group

4. **Step 1.4:** Add validation function
   - Check if entire shape fits in arena bounds
   - Check if shape overlaps with existing obstacles

**Validation:** Can instantiate each shape type at origin and render without errors

---

### **TASK 2: Implement Depth-Based Height System**
**Goal:** Calculate obstacle height based on distance from center can

#### Steps:
1. **Step 2.1:** Create height calculation function in `obstacle-shapes.js`
   ```javascript
   calculateHeightFromDistance(distanceFromCan) {
       // Returns height in meters based on distance
       // Near (0-3m): 0.5-1.2m
       // Mid (3-7m): 1.2-2.5m
       // Far (7m+): 2.5-4.5m
   }
   ```

2. **Step 2.2:** Create color mapping function
   ```javascript
   getColorForHeight(height) {
       // Returns hex color based on height
       // Green: 0.5-1.2m
       // Yellow: 1.2-2.0m
       // Orange: 2.0-3.0m
       // Brown: 3.0-4.5m
   }
   ```

3. **Step 2.3:** Add smooth height interpolation
   - Use lerp (linear interpolation) for smooth transitions
   - Add small random variance (±10%) to avoid perfect rings

4. **Step 2.4:** Update config.js difficulty settings
   - Add `heightScaling` object to each difficulty level:
     ```javascript
     heightScaling: {
         nearMin: 0.5, nearMax: 1.2,  // 0-3m from can
         midMin: 1.2, midMax: 2.5,    // 3-7m from can
         farMin: 2.5, farMax: 4.5     // 7m+ from can
     }
     ```

**Validation:** Place test obstacles at various distances, verify heights scale correctly

---

### **TASK 3: Refactor Obstacle Placement System**
**Goal:** Update arena-obstacles.js to use new shape system

#### Steps:
1. **Step 3.1:** Update `createRandomObstacles()` function
   - Replace single box creation with shape instantiation
   - Select random shape type from available shapes
   - Calculate distance from can for each placement attempt

2. **Step 3.2:** Implement shape-aware positioning
   - Calculate bounding box for entire shape (not just single box)
   - Use shape bounding box for collision detection
   - Ensure all boxes in shape fit within arena

3. **Step 3.3:** Update collision detection
   - Modify `isValidObstaclePosition()` in arena-helpers.js
   - Check all boxes in shape against all existing obstacles
   - Account for shape rotation in collision checks

4. **Step 3.4:** Implement group mesh creation
   - Create parent `THREE.Group` for each shape
   - Add all boxes as children to group
   - Apply rotation to group, not individual boxes
   - Store entire group in obstacles array

**Validation:** Place 10-20 obstacles, verify no overlaps and shapes render correctly

---

### **TASK 4: Implement Clear Zone Around Can**
**Goal:** Enforce obstacle-free radius around center can

#### Steps:
1. **Step 4.1:** Add clear zone config to config.js
   ```javascript
   obstacles: {
       clearZoneRadius: 4.0,  // Default clear zone (overridden by difficulty)
       clearZoneVisualization: false  // Show debug circle
   }
   ```

2. **Step 4.2:** Update difficulty settings with clear zone per level
   - Easy levels (1-3): 3.0-4.0m radius
   - Medium levels (4-7): 4.0-6.0m radius
   - Hard levels (8-10): 6.0-10.0m radius

3. **Step 4.3:** Update obstacle placement validation
   - In `isValidObstaclePosition()`, check if ANY box in shape enters clear zone
   - Reject entire shape if any part violates clear zone

4. **Step 4.4:** Add optional visual indicator
   - Create floor circle mesh showing clear zone boundary
   - Only visible in debug mode (CONFIG.ui.showDebugInfo)
   - Subtle green transparent circle on floor

**Validation:** Place obstacles at all difficulties, verify clear zone is always empty

---

### **TASK 5: Integrate Color Coding System**
**Goal:** Apply height-based colors to all obstacles

#### Steps:
1. **Step 5.1:** Update `createObstacleMesh()` function
   - Remove old color logic (isLowObstacle check)
   - Calculate height-based color for entire shape
   - Apply consistent color to all boxes in same shape

2. **Step 5.2:** Add color transition zones
   - At zone boundaries (3m, 7m), blend colors slightly
   - Avoid harsh color changes between adjacent obstacles

3. **Step 5.3:** Update material properties
   - Keep transparency for very low obstacles (< 1m)
   - Full opacity for medium/tall obstacles
   - Add slight emissive glow to color for better visibility

4. **Step 5.4:** Add color legend to UI (optional)
   - Show color meanings in menu or HUD
   - "Green = Low, Yellow = Medium, Orange = High, Brown = Wall"

**Validation:** Visual inspection - colors should gradient from green (near can) to brown (far)

---

### **TASK 6: Balance and Polish**
**Goal:** Fine-tune system for gameplay balance

#### Steps:
1. **Step 6.1:** Test all 10 difficulty levels
   - Verify obstacle counts feel right
   - Ensure clear zone sizes create good gameplay tension
   - Check that height scaling doesn't make game too easy/hard

2. **Step 6.2:** Adjust shape spawn probabilities
   - More straight walls and L-corners (common)
   - Fewer T-junctions and Z-shapes (rare, interesting)
   - Short walls as filler

3. **Step 6.3:** Add shape placement hints
   - Prefer placing L-corners near walls (creates alcoves)
   - Prefer straight walls in open areas (creates corridors)
   - Avoid placing T-junctions too close together

4. **Step 6.4:** Performance optimization
   - Merge geometries where possible (reduce draw calls)
   - Reuse materials for same-colored obstacles
   - Profile frame rate with max obstacles (45 on easiest level)

**Validation:** Playtest all difficulties, gather feedback on obstacle variety and fairness

---

### **TASK 7: Documentation and Cleanup**
**Goal:** Document new system and remove old code

#### Steps:
1. **Step 7.1:** Update PROJECT_STRUCTURE.yaml
   - Document new obstacle-shapes.js file
   - Update arena-obstacles.js description
   - Add height/color system documentation

2. **Step 7.2:** Update claude.md
   - Add obstacle shape system to architecture notes
   - Document color coding convention
   - Note depth-based scaling system

3. **Step 7.3:** Add code comments
   - Document shape definition format
   - Explain height calculation formulas
   - Note collision detection for complex shapes

4. **Step 7.4:** Remove legacy code
   - Clean up old single-box obstacle creation
   - Remove `isLowObstacle` flag (replaced by height-based colors)
   - Archive old code in git history (don't delete from main branch yet)

**Validation:** Read docs, verify everything is clear for future AI/developer

---

## IMPLEMENTATION ORDER

### Phase 1: Foundation (Tasks 1-2)
1. Create shape definition system
2. Implement height calculation and color mapping
3. **Test:** Render static shapes at various distances

### Phase 2: Integration (Tasks 3-4)
1. Refactor obstacle placement
2. Implement clear zone enforcement
3. **Test:** Generate full arena with new obstacles

### Phase 3: Polish (Tasks 5-6)
1. Integrate color coding
2. Balance and optimize
3. **Test:** Playtest all difficulty levels

### Phase 4: Finalize (Task 7)
1. Documentation
2. Cleanup
3. **Final Test:** Full game regression test

---

## TESTING CHECKPOINTS

After each task, test the following:

✅ **Game starts without errors**
✅ **Player can move**
✅ **Obstacles render correctly**
✅ **No overlapping obstacles**
✅ **Clear zone is respected**
✅ **Colors match height as expected**
✅ **All difficulty levels work**
✅ **Frame rate stays above 30 FPS**

---

## ROLLBACK PLAN

If anything breaks:

1. **Git branch:** Create `obstacle-overhaul` branch BEFORE starting
2. **Incremental commits:** Commit after each task completion
3. **Backup files:** Keep copy of old arena-obstacles.js
4. **Rollback:** If broken, `git checkout main -- js/managers/arena/`

---

## FILE SIZE COMPLIANCE (KISS Rule)

All files MUST stay under 500 lines:

- `obstacle-shapes.js`: ~300 lines (shape definitions + utilities)
- `arena-obstacles.js`: ~250 lines (placement logic)
- `arena-helpers.js`: ~200 lines (collision detection updates)
- `config.js`: Already large (489 lines) - may need to refactor if we add more difficulty settings

**If any file exceeds 500 lines:** Split into smaller modules immediately

---

## SUCCESS CRITERIA

✅ Obstacles are visually distinct Tetris-like shapes
✅ Height increases with distance from can
✅ Colors correctly indicate obstacle height
✅ Clear zone around can is always obstacle-free
✅ All 10 difficulty levels work correctly
✅ No performance degradation (60 FPS maintained)
✅ Code is documented and follows KISS principles
✅ Game is more fun and strategic to play

---

## QUESTIONS TO RESOLVE

1. **Shape complexity:** How many boxes per shape? (Suggest max 4 boxes to keep simple)
2. **Clear zone visualization:** Always show or debug-only?
3. **Color transitions:** Hard boundaries or gradient blending?
4. **Shape weights:** Equal probability or weighted by shape type?
5. **Wall thickness:** Keep uniform 0.3m or vary by obstacle type?

---

**Next Step:** Review this plan, approve, and create `obstacle-overhaul` git branch to begin work.
