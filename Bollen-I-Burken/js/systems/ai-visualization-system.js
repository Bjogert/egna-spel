/* ==========================================
   AI VISUALIZATION SYSTEM
   Handles ONLY AI vision cones and hearing circles
   KISS Architecture - Single responsibility
   ========================================== */

(function (global) {
    console.log('🔄 AI VISUALIZATION: Loading ai-visualization-system.js file');
    
    class AIVisualizationSystem extends System {
        constructor() {
            super('AIVisualizationSystem');
            console.log('🔄 AI VISUALIZATION: Constructor called');
        }

        update(gameState, deltaTime) {
            if (!gameState || gameState.gamePhase === GAME_STATES.PAUSED || gameState.gamePhase === GAME_STATES.GAME_OVER) {
                return;
            }

            // Update AI visualization elements
            this.updateAIVisualizations(gameState);
        }

        updateAIVisualizations(gameState) {
            // Update vision cones and hearing circles for all AI entities
            for (const entity of gameState.entities.values()) {
                if (!entity.hasComponent('AIHunter') || !entity.hasComponent('Transform') || !entity.hasComponent('Renderable')) {
                    continue;
                }
                const transform = entity.getComponent('Transform');
                const renderable = entity.getComponent('Renderable');
                const aiHunter = entity.getComponent('AIHunter');

                if (!transform || !renderable || !aiHunter) continue;

                this.updateVisionCone(entity, transform, renderable, aiHunter);
                this.updateHearingCircle(entity, transform, renderable, aiHunter);
            }
        }

        updateVisionCone(entity, transform, renderable, ai) {
            if (!renderable.mesh || !renderable.mesh.visionConeMesh) return;

            // Sync mesh rotation with transform
            if (renderable.mesh) {
                renderable.mesh.rotation.y = transform.rotation.y;

                // Update vision cone rotation to match AI rotation
                if (renderable.mesh.visionConeMesh) {
                    renderable.mesh.visionConeMesh.rotation.y = transform.rotation.y;

                    // UPDATE CONE GEOMETRY to match dynamic vision parameters
                    if (ai.vision && renderable.mesh.visionConeMesh.geometry) {
                        const geometry = renderable.mesh.visionConeMesh.geometry;
                        const range = ai.vision.range || 5.0;
                        const angle = ai.vision.angle || Math.PI / 3;
                        
                        // Update cone size (this could be optimized)
                        geometry.parameters = { radius: range, height: 0.2, radialSegments: 16 };
                    }

                    // Update color based on detection state
                    if (renderable.mesh.visionConeMesh.material) {
                        const material = renderable.mesh.visionConeMesh.material;
                        
                        if (ai.hasDetectedPlayer) {
                            // PLAYER DETECTED - RED
                            material.color.setHex(0xff0000);
                            material.opacity = 0.8;
                        } else if (ai.isFocused) {
                            // FOCUSED (narrow beam) - BRIGHT YELLOW
                            material.color.setHex(0xffff00);
                            material.opacity = 0.6;
                        } else {
                            // NORMAL PATROL - ORANGE
                            material.color.setHex(0xff6600);
                            material.opacity = 0.4;
                        }
                    }
                }
            }
        }

        updateHearingCircle(entity, transform, renderable, ai) {
            if (!renderable.mesh || !renderable.mesh.hearingCircleMesh) return;

            // Update hearing circle position
            if (renderable.mesh.hearingCircleMesh) {
                renderable.mesh.hearingCircleMesh.position.set(
                    transform.position.x,
                    0.1, // Fixed height slightly above ground
                    transform.position.z
                );

                // Get player speed to calculate effective hearing range
                const playerMovementSystem = global.playerMovementSystem;
                if (playerMovementSystem && ai.hearing) {
                    const playerSpeed = playerMovementSystem.getPlayerSpeed();
                    const baseRange = ai.hearing.range || 100.0;

                    if (playerSpeed > 0) {
                        // Calculate sound level (same logic as AI hearing)
                        const maxPlayerSpeed = 0.16;
                        const normalizedSpeed = Math.min(playerSpeed / maxPlayerSpeed, 1.0);
                        const baseVolume = 0.3;
                        const soundLevel = baseVolume + (normalizedSpeed * 0.7);

                        // Effective hearing range
                        const effectiveRange = baseRange * Math.max(soundLevel, 0.1); // Min 10% visible

                        // Scale the circle to match effective range
                        const scale = effectiveRange / 100.0; // 100.0 is the base mesh radius
                        renderable.mesh.hearingCircleMesh.scale.setScalar(scale);

                        // Update opacity based on sound level
                        if (renderable.mesh.hearingCircleMesh.material) {
                            const material = renderable.mesh.hearingCircleMesh.material;
                            material.opacity = Math.max(0.1, soundLevel * 0.5);
                            
                            // Color based on detection potential
                            if (soundLevel > 0.7) {
                                material.color.setHex(0xff4444); // High sound - red
                            } else if (soundLevel > 0.4) {
                                material.color.setHex(0xffaa44); // Medium sound - orange
                            } else {
                                material.color.setHex(0x4444ff); // Low sound - blue
                            }
                        }
                    } else {
                        // No movement - minimal hearing circle
                        const minScale = 0.1;
                        renderable.mesh.hearingCircleMesh.scale.setScalar(minScale);
                        
                        if (renderable.mesh.hearingCircleMesh.material) {
                            const material = renderable.mesh.hearingCircleMesh.material;
                            material.opacity = 0.1;
                            material.color.setHex(0x444444); // Gray for no sound
                        }
                    }
                }
            }
        }

        // API for debugging and tweaking
        setVisualizationVisibility(visionVisible, hearingVisible) {
            const aiEntities = EntityManager.getEntitiesWithComponents(['AI', 'Renderable']);
            
            for (const entity of aiEntities) {
                const renderable = entity.getComponent('Renderable');
                if (!renderable.mesh) continue;

                if (renderable.mesh.visionConeMesh) {
                    renderable.mesh.visionConeMesh.visible = visionVisible;
                }
                
                if (renderable.mesh.hearingCircleMesh) {
                    renderable.mesh.hearingCircleMesh.visible = hearingVisible;
                }
            }
        }
    }

    // Register system globally
    global.AIVisualizationSystem = AIVisualizationSystem;
    console.log('🔄 AI VISUALIZATION: AIVisualizationSystem class registered globally');

})(typeof window !== 'undefined' ? window : global);