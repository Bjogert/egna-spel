import re
from pathlib import Path

path = Path('Bollen-I-Burken/js/managers/player-manager.js')
text = path.read_text(encoding='utf-8')

constructor_regex = r"""(        constructor\(scene, gameEngine\) {\n            this\.scene = scene;\n            this\.gameEngine = gameEngine;\n            this\.playerColors = \[\n                0x4a90e2,\n                0x7ed321,\n                0xf5a623,\n                0xd0021b,\n                0x9013fe,\n                0x50e3c2,\n                0xb8e986,\n                0xbd10e0\n            \];\n            this\.colorIndex = 1;\n            this\.playerMeshes = new Map\(\);\n            this\.playerEntities = new Map\(\);\n            this\.hunterData = new Map\(\);\n        }\n)"""
match = re.search(constructor_regex, text)
if not match:
    raise SystemExit('constructor pattern not found')
helper_methods = """
        buildCharacterMesh(options = {}) {
            const {
                color = 0x4a90e2,
                playerId = null,
                opacity = 0.95,
                accentColor = null,
                type = 'player',
                namePrefix = 'character'
            } = options;

            let mesh;
            if (typeof GubbeBuilder !== 'undefined' && typeof GubbeBuilder.createCharacterMesh === 'function') {
                const suffix = (playerId !== null && playerId !== undefined) ? playerId : `visual_${Math.floor(Math.random() * 100000)}`;
                mesh = GubbeBuilder.createCharacterMesh({
                    baseColor: color,
                    accentColor: accentColor,
                    opacity: opacity,
                    name: `${namePrefix}_${suffix}`
                });
            } else {
                const geometry = new THREE.BoxGeometry(0.8, 1.0, 0.8);
                const material = new THREE.MeshLambertMaterial({
                    color: color,
                    transparent: opacity < 1,
                    opacity: opacity
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = false;
                mesh.userData = mesh.userData || {};
                mesh.userData.parts = mesh.userData.parts || {};
                mesh.userData.defaultPose = mesh.userData.defaultPose || {};
            }

            mesh.userData = mesh.userData || {};
            if (playerId !== null && playerId !== undefined) {
                mesh.userData.playerId = playerId;
            }
            mesh.userData.characterType = type;
            mesh.userData.baseColor = color;
            mesh.userData.accentColor = accentColor;

            if (typeof mesh.traverse === 'function') {
                mesh.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = false;
                    }
                });
            }

            if (!mesh.userData.parts) {
                mesh.userData.parts = {};
            }
            if (!mesh.userData.defaultPose) {
                mesh.userData.defaultPose = {};
            }

            return mesh;
        }

        positionCharacterMesh(mesh, position) {
            if (!mesh || !position) {
                return;
            }
            if (mesh.position && typeof mesh.position.set === 'function') {
                mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
            }
        }

        applyLocalPlayerTint(mesh) {
            if (!mesh) {
                return;
            }
            const userData = mesh.userData || {};
            const parts = userData.parts || null;
            const emissiveHex = 0x002200;

            if (parts && parts.torso && parts.torso.material && parts.torso.material.emissive) {
                parts.torso.material.emissive.setHex(emissiveHex);
            } else if (mesh.material && mesh.material.emissive) {
                mesh.material.emissive.setHex(emissiveHex);
            }
        }

        disposeCharacterMesh(mesh) {
            if (!mesh) {
                return;
            }

            const disposeMaterial = (material) => {
                if (!material) {
                    return;
                }
                if (Array.isArray(material)) {
                    material.forEach(item => disposeMaterial(item));
                } else if (typeof material.dispose === 'function') {
                    material.dispose();
                }
            };

            if (typeof mesh.traverse === 'function') {
                mesh.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry && typeof child.geometry.dispose === 'function') {
                            child.geometry.dispose();
                        }
                        disposeMaterial(child.material);
                    }
                });
            } else {
                if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
                    mesh.geometry.dispose();
                }
                disposeMaterial(mesh.material);
            }
        }
"""
text = text[:match.end()] + helper_methods + text[match.end():]

pattern_local = re.compile(r"""        addLocalPlayer\(playerId\) {\n            const geometry = new THREE.BoxGeometry\(0.8, 1.0, 0.8\);\n            const material = new THREE.MeshLambertMaterial\({\n                color: this.playerColors\[0\],\n                transparent: true,\n                opacity: 0.9\n            }\);\n            const mesh = new THREE.Mesh\(geometry, material\);\n            mesh.castShadow = true;\n            mesh.position.set\(0, 0.5, 0\);\n            this.scene.add\(mesh\);\n\n            const gameEntity = this.gameEngine.gameState.addPlayer\(playerId, true\);\n            gameEntity.addComponent\(new Renderable\(mesh\)\);\n\n            this.playerMeshes.set\(playerId, mesh\);\n            this.playerEntities.set\(playerId, gameEntity\);\n\n            Utils.log\(`Added local player: \${playerId}`\);\n            return gameEntity;\n        }""")
replacement_local = """        addLocalPlayer(playerId) {
            const gameEntity = this.gameEngine.gameState.addPlayer(playerId, true);
            const transform = gameEntity.getComponent('Transform');
            const spawnPos = transform ? transform.position : CONFIG.player.spawnPosition;

            const mesh = this.buildCharacterMesh({
                color: this.playerColors[0],
                playerId: playerId,
                opacity: 0.95,
                type: 'player',
                namePrefix: 'player'
            });
            mesh.userData.isLocalPlayer = true;
            this.positionCharacterMesh(mesh, spawnPos);
            this.applyLocalPlayerTint(mesh);
            this.scene.add(mesh);

            gameEntity.addComponent(new Renderable(mesh));

            this.playerMeshes.set(playerId, mesh);
            this.playerEntities.set(playerId, gameEntity);

            Utils.log(`Added local player: ${playerId}`);
            return gameEntity;
        }"""
text = pattern_local.sub(replacement_local, text, count=1)

pattern_remote = re.compile(r"""        addRemotePlayer\(playerId\) {\n            const color = this.playerColors\[this.colorIndex % this.playerColors.length\];\n            this.colorIndex\+\+;\n\n            const geometry = new THREE.BoxGeometry\(0.8, 1.0, 0.8\);\n            const material = new THREE.MeshLambertMaterial\({\n                color: color,\n                transparent: true,\n                opacity: 0.9\n            }\);\n            const mesh = new THREE.Mesh\(geometry, material\);\n            mesh.castShadow = true;\n            mesh.position.set\(0, 0.5, 0\);\n            this.scene.add\(mesh\);\n\n            const gameEntity = this.gameEngine.gameState.addPlayer\(playerId, false\);\n            gameEntity.addComponent\(new Renderable\(mesh\)\);\n\n            this.playerMeshes.set\(playerId, mesh\);\n            this.playerEntities.set\(playerId, gameEntity\);\n\n            Utils.log\(`Added remote player: \${playerId}`\);\n            return gameEntity;\n        }""")
replacement_remote = """        addRemotePlayer(playerId) {
            const color = this.playerColors[this.colorIndex % this.playerColors.length];
            this.colorIndex++;

            const gameEntity = this.gameEngine.gameState.addPlayer(playerId, false);
            const transform = gameEntity.getComponent('Transform');
            const spawnPos = transform ? transform.position : CONFIG.player.spawnPosition;

            const mesh = this.buildCharacterMesh({
                color: color,
                playerId: playerId,
                opacity: 0.95,
                type: 'player',
                namePrefix: 'player'
            });
            mesh.userData.isLocalPlayer = false;
            this.positionCharacterMesh(mesh, spawnPos);
            this.scene.add(mesh);

            gameEntity.addComponent(new Renderable(mesh));

            this.playerMeshes.set(playerId, mesh);
            this.playerEntities.set(playerId, gameEntity);

            Utils.log(`Added remote player: ${playerId}`);
            return gameEntity;
        }"""
text = pattern_remote.sub(replacement_remote, text, count=1)

pattern_ai_mesh = re.compile(r"""            const geometry = new THREE.BoxGeometry\(0.9, 1.1, 0.9\);\n            const material = new THREE.MeshLambertMaterial\({\n                color: 0xff4444,\n                transparent: true,\n                opacity: 0.9\n            }\);\n            const mesh = new THREE.Mesh\(geometry, material\);\n            mesh.castShadow = true;\n\n            const spawnPos = position || CONFIG.ai.hunter.spawnPosition;  // Default AI spawn from config (avoid can!)\n            mesh.position.set\(spawnPos.x, spawnPos.y, spawnPos.z\);\n            this.scene.add\(mesh\);""")
replacement_ai_mesh = """            const mesh = this.buildCharacterMesh({
                color: 0xff4444,
                playerId: hunterId,
                opacity: 0.9,
                type: 'hunter',
                namePrefix: 'hunter'
            });
            mesh.userData.hunterId = hunterId;

            const spawnPos = position || CONFIG.ai.hunter.spawnPosition;  // Default AI spawn from config (avoid can!)
            this.positionCharacterMesh(mesh, spawnPos);
            this.scene.add(mesh);"""
text = pattern_ai_mesh.sub(replacement_ai_mesh, text, count=1)

pattern_remove_player_entity = re.compile(r"""                if \(renderable && renderable.mesh\) {\n                    this.scene.remove\(renderable.mesh\);\n                    if \(renderable.mesh.geometry\) renderable.mesh.geometry.dispose\(\);\n                    if \(renderable.mesh.material\) {\n                        if \(Array.isArray\(renderable.mesh.material\)\) {\n                            renderable.mesh.material.forEach\(material => material.dispose\(\)\);\n                        } else {\n                            renderable.mesh.material.dispose\(\);\n                        }\n                    }\n                }""")
text = pattern_remove_player_entity.sub("""                if (renderable && renderable.mesh) {
                    this.scene.remove(renderable.mesh);
                    this.disposeCharacterMesh(renderable.mesh);
                }""", text, count=1)

pattern_remove_player_mesh = re.compile(r"""                if \(mesh\) {\n                    this.scene.remove\(mesh\);\n                    if \(mesh.geometry\) mesh.geometry.dispose\(\);\n                    if \(mesh.material\) {\n                        if \(Array.isArray\(mesh.material\)\) {\n                            mesh.material.forEach\(material => material.dispose\(\)\);\n                        } else {\n                            mesh.material.dispose\(\);\n                        }\n                    }\n                }""")
text = pattern_remove_player_mesh.sub("""                if (mesh) {
                    this.scene.remove(mesh);
                    this.disposeCharacterMesh(mesh);
                }""", text, count=1)

pattern_remove_ai_mesh = re.compile(r"""            if \(hunterInfo.mesh\) {\n                this.scene.remove\(hunterInfo.mesh\);\n                if \(hunterInfo.mesh.geometry\) hunterInfo.mesh.geometry.dispose\(\);\n                if \(hunterInfo.mesh.material\) hunterInfo.mesh.material.dispose\(\);\n            }""")
text = pattern_remove_ai_mesh.sub("""            if (hunterInfo.mesh) {
                this.scene.remove(hunterInfo.mesh);
                this.disposeCharacterMesh(hunterInfo.mesh);
            }""", text, count=1)

path.write_text(text, encoding='utf-8')
