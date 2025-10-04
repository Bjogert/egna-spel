# Dynamic Difficulty System - "Dunkgömme"

## Concept
10 difficulty levels with Swedish humor, where **EASIER = MORE OBSTACLES** (more hiding spots) and **HARDER = FEWER OBSTACLES** (nowhere to hide).

---

## Difficulty Levels

### Level 1: "Barnkalas" (Children's Party)
**Strategy:** So many places to hide, you can basically just stand still

```javascript
{
    name: "Barnkalas",
    description: "Mer gömställen än barn på festen!",
    obstacles: {
        count: 45,
        minDistanceBetween: 2.0,
        canExclusionRadius: 3.0,
        sizeRandomness: 0.3,
        minWidth: 2.5, maxWidth: 5.0,
        minDepth: 2.5, maxDepth: 5.0,
        minHeight: 1.5, maxHeight: 3.0,
        shapes: {
            box: 0.6,        // Mostly large boxes
            tallBox: 0.2,
            wall: 0.2,
            lShape: 0.0,
            tShape: 0.0
        }
    },
    ai: {
        patrolSpeed: 2.5,
        chaseSpeed: 4.0,
        visionRange: 8,
        visionAngle: 60
    }
}
```

---

### Level 2: "Fyllekäring på Midsommar" (Drunk Uncle at Midsummer)
**Strategy:** Plenty of cover, AI is slow and distracted

```javascript
{
    name: "Fyllekäring på Midsommar",
    description: "Han ser inte så bra efter alla snapsar...",
    obstacles: {
        count: 35,
        minDistanceBetween: 2.2,
        canExclusionRadius: 3.5,
        sizeRandomness: 0.4,
        minWidth: 2.0, maxWidth: 4.5,
        minDepth: 2.0, maxDepth: 4.5,
        minHeight: 1.2, maxHeight: 2.8,
        shapes: {
            box: 0.5,
            tallBox: 0.2,
            wall: 0.2,
            lShape: 0.05,
            tShape: 0.05
        }
    },
    ai: {
        patrolSpeed: 3.0,
        chaseSpeed: 4.5,
        visionRange: 9,
        visionAngle: 65
    }
}
```

---

### Level 3: "Dagisfröken Övervakar" (Daycare Teacher Watching)
**Strategy:** Good cover, but AI is starting to pay attention

```javascript
{
    name: "Dagisfröken Övervakar",
    description: "Hon har ögon i nacken!",
    obstacles: {
        count: 28,
        minDistanceBetween: 2.5,
        canExclusionRadius: 4.0,
        sizeRandomness: 0.5,
        minWidth: 1.8, maxWidth: 4.0,
        minDepth: 1.8, maxDepth: 4.0,
        minHeight: 1.0, maxHeight: 2.5,
        shapes: {
            box: 0.4,
            tallBox: 0.2,
            wall: 0.2,
            lShape: 0.1,
            tShape: 0.1
        }
    },
    ai: {
        patrolSpeed: 3.5,
        chaseSpeed: 5.0,
        visionRange: 10,
        visionAngle: 70
    }
}
```

---

### Level 4: "Kvarterspolisen" (Neighborhood Cop)
**Strategy:** Decent cover, need to move strategically

```javascript
{
    name: "Kvarterspolisen",
    description: "Patrullerar som ett proffs",
    obstacles: {
        count: 22,
        minDistanceBetween: 2.8,
        canExclusionRadius: 4.5,
        sizeRandomness: 0.6,
        minWidth: 1.5, maxWidth: 3.5,
        minDepth: 1.5, maxDepth: 3.5,
        minHeight: 0.8, maxHeight: 2.2,
        shapes: {
            box: 0.3,
            tallBox: 0.2,
            wall: 0.2,
            lShape: 0.15,
            tShape: 0.15
        },
        // Add LOW OBSTACLES (can see over, can't jump over)
        lowObstacles: 0.2  // 20% are low (height 0.8-1.2m)
    },
    ai: {
        patrolSpeed: 4.0,
        chaseSpeed: 5.5,
        visionRange: 11,
        visionAngle: 75
    }
}
```

---

### Level 5: "Fotbollstränaren" (Soccer Coach)
**Strategy:** Limited cover, timing is key

```javascript
{
    name: "Fotbollstränaren",
    description: "Ser allt från sidan!",
    obstacles: {
        count: 18,
        minDistanceBetween: 3.0,
        canExclusionRadius: 5.0,
        sizeRandomness: 0.7,
        minWidth: 1.2, maxWidth: 3.0,
        minDepth: 1.2, maxDepth: 3.0,
        minHeight: 0.7, maxHeight: 2.0,
        shapes: {
            box: 0.25,
            tallBox: 0.15,
            wall: 0.2,
            lShape: 0.2,
            tShape: 0.2
        },
        lowObstacles: 0.3  // 30% low obstacles
    },
    ai: {
        patrolSpeed: 4.5,
        chaseSpeed: 6.0,
        visionRange: 12,
        visionAngle: 80
    }
}
```

---

### Level 6: "Gymnasieläraren" (High School Teacher)
**Strategy:** Sparse cover, need perfect timing

```javascript
{
    name: "Gymnasieläraren",
    description: "Inget mobilfuskande här!",
    obstacles: {
        count: 14,
        minDistanceBetween: 3.5,
        canExclusionRadius: 5.5,
        sizeRandomness: 0.8,
        minWidth: 1.0, maxWidth: 2.5,
        minDepth: 1.0, maxDepth: 2.5,
        minHeight: 0.6, maxHeight: 1.8,
        shapes: {
            box: 0.2,
            tallBox: 0.15,
            wall: 0.15,
            lShape: 0.25,
            tShape: 0.25
        },
        lowObstacles: 0.4  // 40% low obstacles
    },
    ai: {
        patrolSpeed: 5.0,
        chaseSpeed: 6.5,
        visionRange: 13,
        visionAngle: 85
    }
}
```

---

### Level 7: "Vakten på Ikea" (IKEA Security Guard)
**Strategy:** Very few hiding spots, long sightlines

```javascript
{
    name: "Vakten på Ikea",
    description: "Övervakar alla genvägar!",
    obstacles: {
        count: 10,
        minDistanceBetween: 4.0,
        canExclusionRadius: 6.0,
        sizeRandomness: 0.9,
        minWidth: 0.8, maxWidth: 2.0,
        minDepth: 0.8, maxDepth: 2.0,
        minHeight: 0.5, maxHeight: 1.5,
        shapes: {
            box: 0.15,
            tallBox: 0.1,
            wall: 0.15,
            lShape: 0.3,
            tShape: 0.3
        },
        lowObstacles: 0.5  // 50% low obstacles
    },
    ai: {
        patrolSpeed: 5.5,
        chaseSpeed: 7.0,
        visionRange: 14,
        visionAngle: 90
    }
}
```

---

### Level 8: "Säkerhetspolisen" (Secret Service)
**Strategy:** Barely any cover, must be perfect

```javascript
{
    name: "Säkerhetspolisen",
    description: "Ser dig innan du ens ser honom...",
    obstacles: {
        count: 7,
        minDistanceBetween: 5.0,
        canExclusionRadius: 7.0,
        sizeRandomness: 1.0,
        minWidth: 0.8, maxWidth: 1.5,
        minDepth: 0.8, maxDepth: 1.5,
        minHeight: 0.5, maxHeight: 1.2,
        shapes: {
            box: 0.1,
            tallBox: 0.05,
            wall: 0.1,
            lShape: 0.35,
            tShape: 0.4
        },
        lowObstacles: 0.6  // 60% low obstacles (hard to hide behind)
    },
    ai: {
        patrolSpeed: 6.0,
        chaseSpeed: 7.5,
        visionRange: 15,
        visionAngle: 95
    }
}
```

---

### Level 9: "Guds Öga" (God's Eye)
**Strategy:** Almost no obstacles, arena feels empty

```javascript
{
    name: "Guds Öga",
    description: "Ser allt, vet allt...",
    obstacles: {
        count: 4,
        minDistanceBetween: 6.0,
        canExclusionRadius: 8.0,
        sizeRandomness: 1.0,
        minWidth: 0.8, maxWidth: 1.2,
        minDepth: 0.8, maxDepth: 1.2,
        minHeight: 0.5, maxHeight: 1.0,
        shapes: {
            box: 0.05,
            tallBox: 0.0,
            wall: 0.05,
            lShape: 0.4,
            tShape: 0.5
        },
        lowObstacles: 0.75  // 75% low obstacles
    },
    ai: {
        patrolSpeed: 6.5,
        chaseSpeed: 8.0,
        visionRange: 16,
        visionAngle: 100
    }
}
```

---

### Level 10: "Systemet Stänger om 5 Minuter" (Liquor Store Closing in 5 Minutes)
**Strategy:** PANIC MODE - open arena, AI is fast and alert

```javascript
{
    name: "Systemet Stänger om 5 Minuter",
    description: "Full panik! Ingen tid för gömlek!",
    obstacles: {
        count: 2,
        minDistanceBetween: 8.0,
        canExclusionRadius: 10.0,
        sizeRandomness: 1.0,
        minWidth: 0.8, maxWidth: 1.0,
        minDepth: 0.8, maxDepth: 1.0,
        minHeight: 0.5, maxHeight: 0.8,
        shapes: {
            box: 0.0,
            tallBox: 0.0,
            wall: 0.0,
            lShape: 0.5,
            tShape: 0.5
        },
        lowObstacles: 1.0  // 100% low obstacles (basically useless)
    },
    ai: {
        patrolSpeed: 7.0,
        chaseSpeed: 9.0,
        visionRange: 18,
        visionAngle: 110
    }
}
```

---

## Implementation Plan

### 1. Add Difficulty Config (`js/core/config.js`)
```javascript
CONFIG.difficulties = [
    /* Level 1-10 configs above */
];

CONFIG.currentDifficulty = 2; // Default to "Fyllekäring på Midsommar"
```

### 2. Update Menu (`js/systems/ui/menu-overlay.js`)
Add difficulty selector:
```html
<select id="difficultySelect">
    <option value="0">1. Barnkalas</option>
    <option value="1">2. Fyllekäring på Midsommar</option>
    <!-- ... -->
    <option value="9">10. Systemet Stänger</option>
</select>
```

### 3. Create Low Obstacle Type (`js/managers/arena/arena-obstacles.js`)
```javascript
createLowObstacle() {
    // Height: 0.5-1.2m (can see over, blocks movement)
    // Camera height: 15m looking down
    // Player can see over but cannot pass through
}
```

### 4. Apply Difficulty to AI (`js/systems/ai/ai-system.js`)
```javascript
applyDifficulty(level) {
    this.patrolSpeed = level.ai.patrolSpeed;
    this.chaseSpeed = level.ai.chaseSpeed;
    this.visionRange = level.ai.visionRange;
    this.visionAngle = level.ai.visionAngle;
}
```

---

## Progressive Difficulty Curve

| Level | Obstacles | AI Speed | Vision | Playability |
|-------|-----------|----------|--------|-------------|
| 1     | 45        | Slow     | Narrow | Relaxing    |
| 2     | 35        | Slow     | Narrow | Easy        |
| 3     | 28        | Medium   | Medium | Balanced    |
| 4     | 22        | Medium   | Medium | Fair        |
| 5     | 18        | Medium   | Wide   | Challenging |
| 6     | 14        | Fast     | Wide   | Hard        |
| 7     | 10        | Fast     | Wide   | Very Hard   |
| 8     | 7         | Very Fast| Wide   | Expert      |
| 9     | 4         | Very Fast| Wide   | Nightmare   |
| 10    | 2         | Maximum  | Maximum| Impossible? |

---

## Low Obstacles Mechanic

**Definition:** Obstacles short enough to see over (height 0.5-1.2m) but tall enough to block movement.

**Strategic Value:**
- **For Player:** Can see AI approaching, plan movement
- **For AI:** Can also see player behind low obstacles
- **Tension:** "I can see you, you can see me, who moves first?"

**Visual Design:**
- Short walls, crates, bushes
- Color: Darker green (#22c55e) to distinguish from tall obstacles
- Semi-transparent at higher difficulties to emphasize "no real cover"

---

## Swedish Humor Easter Eggs

Add random voice lines when starting each difficulty:

1. **Barnkalas:** "Mamma säger att alla ska få gömma sig!"
2. **Fyllekäring:** "Skål! *hick*"
3. **Dagisfröken:** "Nu ska vi leka schysst!"
4. **Kvarterspolisen:** "Får jag se din legitimation?"
5. **Fotbollstränaren:** "FEM VARV RUNT PLANEN!"
6. **Gymnasieläraren:** "Mobilerna i lådan, tack."
7. **Ikea-vakten:** "Följ pilarna, tack!"
8. **Säkerhetspolisen:** "Vi har situationen under kontroll."
9. **Guds Öga:** "..."
10. **Systemet:** "VI STÄNGER NU!"

---

## Testing Checklist

- [ ] Level 1: Verify 45 obstacles spawn without overlap
- [ ] Level 5: Test low obstacle visibility from camera angle
- [ ] Level 10: Confirm only 2 obstacles spawn (barely playable)
- [ ] AI speed scales correctly across all levels
- [ ] Vision cone adjusts properly
- [ ] Menu selector saves difficulty preference
- [ ] All Swedish names display correctly in UI

---

Want me to start implementing this system?
