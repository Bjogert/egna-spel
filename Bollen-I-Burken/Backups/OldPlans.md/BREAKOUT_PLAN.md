## Stage 5 – Networking & Resource Manager
1. Delete or archive enterprise networking stubs that aren’t used (WebRTC/WebSocket classes) or move them to `js/network/legacy/`.
2. Split `NetworkSystem` into `js/systems/network/network-system.js` and leave a shim in `js/networking.js`.
3. Break `resource-manager.js` into core manager plus `resource-factories.js` and `resource-observers.js`.
4. Update `index.html` to load new modules.
5. Test: ensure networking local mode still logs properly and arena cleanup works (ResourceManager stats intact).

## Stage 6 – Polish
- Evaluate the inline bootstrap script in `index.html`; consider extracting to `js/main.js`.
- Double-check interactions between systems.
- General cleanup if time permits.