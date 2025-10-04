/* ==========================================
   PLAYER VISUAL BUILDER - GUBBE STYLE
   Builds grouped meshes for player/hunter characters
   ========================================== */

(function (global) {
    function adjustColor(hex, hOffset = 0, sOffset = 0, lOffset = 0) {
        const color = new THREE.Color(hex);
        color.offsetHSL(hOffset, sOffset, lOffset);
        return color.getHex();
    }

    function createLambertMaterial(colorHex, opacity = 0.95) {
        return new THREE.MeshLambertMaterial({
            color: colorHex,
            transparent: opacity < 1,
            opacity: opacity
        });
    }

    class GubbeBuilder {
        static createCharacterMesh(options = {}) {
            const {
                baseColor = 0x4a90e2,
                limbColor = null,
                headColor = null,
                accentColor = null,
                opacity = 0.95
            } = options;

            const resolvedBase = baseColor;
            const resolvedLimb = limbColor !== null ? limbColor : adjustColor(baseColor, 0, -0.1, -0.05);
            const resolvedHead = headColor !== null ? headColor : adjustColor(baseColor, 0, -0.1, 0.08);
            const resolvedAccent = accentColor !== null ? accentColor : adjustColor(baseColor, 0, 0, 0.12);

            const torsoMaterial = createLambertMaterial(resolvedBase, opacity);
            const limbMaterial = createLambertMaterial(resolvedLimb, opacity);
            const headMaterial = createLambertMaterial(resolvedHead, opacity);
            const accentMaterial = createLambertMaterial(resolvedAccent, opacity);

            const group = new THREE.Group();

            // Torso
            const torsoGeometry = new THREE.BoxGeometry(0.55, 0.35, 0.3);
            const torsoMesh = new THREE.Mesh(torsoGeometry, torsoMaterial);
            torsoMesh.position.set(0, 0.125, 0);
            group.add(torsoMesh);

            // Head
            const headGeometry = new THREE.BoxGeometry(0.28, 0.2, 0.28);
            const headMesh = new THREE.Mesh(headGeometry, headMaterial);
            headMesh.position.set(0, 0.4, 0);
            group.add(headMesh);

            // Arms
            const armGeometry = new THREE.BoxGeometry(0.16, 0.3, 0.16);
            const leftArm = new THREE.Mesh(armGeometry, limbMaterial);
            const rightArm = new THREE.Mesh(armGeometry, limbMaterial.clone());
            const armY = 0.1; // relative to center (torso mid)
            const armOffsetX = torsoGeometry.parameters.width / 2 + 0.09;
            leftArm.position.set(-armOffsetX, armY, 0);
            rightArm.position.set(armOffsetX, armY, 0);
            group.add(leftArm);
            group.add(rightArm);

            // Legs
            const legGeometry = new THREE.BoxGeometry(0.18, 0.45, 0.22);
            const leftLeg = new THREE.Mesh(legGeometry, limbMaterial.clone());
            const rightLeg = new THREE.Mesh(legGeometry, limbMaterial.clone());
            const legY = -0.275;
            const legOffsetX = 0.12;
            leftLeg.position.set(-legOffsetX, legY, 0);
            rightLeg.position.set(legOffsetX, legY, 0);
            group.add(leftLeg);
            group.add(rightLeg);

            // Simple accent belt for visual separation
            const beltGeometry = new THREE.BoxGeometry(0.57, 0.08, 0.32);
            const beltMesh = new THREE.Mesh(beltGeometry, accentMaterial);
            beltMesh.position.set(0, -0.02, 0);
            group.add(beltMesh);

            // Enable shadows for all body parts
            group.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            });

            group.userData.parts = {
                torso: torsoMesh,
                head: headMesh,
                leftArm,
                rightArm,
                leftLeg,
                rightLeg,
                belt: beltMesh
            };

            return group;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GubbeBuilder;
    } else {
        global.GameManagers = global.GameManagers || {};
        global.GameManagers.GubbeBuilder = GubbeBuilder;
        global.GubbeBuilder = GubbeBuilder;
    }
})(typeof window !== 'undefined' ? window : globalThis);
