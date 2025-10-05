/* ==========================================
   TWEAK PANEL
   Live settings editor for gameplay tuning
   ========================================== */

(function (global) {
    class TweakPanel {
        constructor() {
            this.isVisible = false;
            this.panel = null;
            this.settings = new Map();

            this.createPanel();
            this.setupKeybind();

            Utils.log('TweakPanel initialized - Press T to toggle');
        }

        createPanel() {
            // Create overlay container
            const overlay = document.createElement('div');
            overlay.id = 'tweak-panel';
            overlay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #00ff00;
                border-radius: 8px;
                padding: 15px;
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 10000;
                display: none;
                max-height: calc(100vh - 20px);
                overflow-y: auto;
                width: 320px;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            `;

            // Title
            const title = document.createElement('h2');
            title.textContent = '⚙️ LIVE TWEAK PANEL';
            title.style.cssText = `
                margin: 0 0 20px 0;
                text-align: center;
                color: #00ff00;
                text-shadow: 0 0 10px #00ff00;
            `;
            overlay.appendChild(title);

            // Settings container
            const container = document.createElement('div');
            container.id = 'tweak-settings';
            overlay.appendChild(container);

            // Export button
            const exportBtn = document.createElement('button');
            exportBtn.textContent = '📋 Copy Settings';
            exportBtn.style.cssText = `
                margin-top: 15px;
                width: 100%;
                padding: 10px;
                background: #ffaa00;
                color: black;
                border: none;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
            `;
            exportBtn.onclick = () => this.exportSettings();
            overlay.appendChild(exportBtn);

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Close (T)';
            closeBtn.style.cssText = `
                margin-top: 10px;
                width: 100%;
                padding: 10px;
                background: #00ff00;
                color: black;
                border: none;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
            `;
            closeBtn.onclick = () => this.toggle();
            overlay.appendChild(closeBtn);

            document.body.appendChild(overlay);
            this.panel = overlay;
            this.container = container;
        }

        exportSettings() {
            const exported = {};

            for (const [key, setting] of this.settings) {
                exported[key] = setting.getValue();
            }

            const json = JSON.stringify(exported, null, 2);

            // Copy to clipboard
            navigator.clipboard.writeText(json).then(() => {
                alert('✅ Settings copied to clipboard!\n\nPaste them in chat or save them.');
                console.log('Exported settings:', json);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Settings:\n\n' + json);
            });
        }

        setupKeybind() {
            document.addEventListener('keydown', (e) => {
                if (e.code === 'KeyT' && !e.repeat) {
                    this.toggle();
                }
            });
        }

        toggle() {
            this.isVisible = !this.isVisible;
            this.panel.style.display = this.isVisible ? 'block' : 'none';

            if (this.isVisible) {
                this.refresh();
            }
        }

        addSetting(category, name, options) {
            const key = `${category}.${name}`;
            this.settings.set(key, options);
        }

        refresh() {
            this.container.innerHTML = '';

            // Group settings by category
            const categories = new Map();
            for (const [key, setting] of this.settings) {
                const [category] = key.split('.');
                if (!categories.has(category)) {
                    categories.set(category, []);
                }
                categories.get(category).push({ key, ...setting });
            }

            // Render each category
            for (const [category, settings] of categories) {
                const categoryDiv = document.createElement('div');
                categoryDiv.style.marginBottom = '20px';

                const categoryTitle = document.createElement('h3');
                categoryTitle.textContent = `━━━ ${category.toUpperCase()} ━━━`;
                categoryTitle.style.cssText = `
                    color: #00ff00;
                    margin: 10px 0;
                    font-size: 16px;
                `;
                categoryDiv.appendChild(categoryTitle);

                for (const setting of settings) {
                    const settingDiv = this.createSettingControl(setting);
                    categoryDiv.appendChild(settingDiv);
                }

                this.container.appendChild(categoryDiv);
            }
        }

        createSettingControl(setting) {
            const div = document.createElement('div');
            div.style.cssText = `
                margin: 10px 0;
                padding: 10px;
                background: rgba(0, 255, 0, 0.05);
                border-radius: 4px;
            `;

            const label = document.createElement('label');
            label.style.cssText = `
                display: block;
                margin-bottom: 5px;
                color: #00ff00;
            `;

            const valueDisplay = document.createElement('span');
            valueDisplay.style.cssText = `
                float: right;
                color: #ffff00;
                font-weight: bold;
            `;

            const currentValue = setting.getValue();

            if (setting.type === 'checkbox') {
                // Checkbox layout
                valueDisplay.textContent = currentValue ? 'ON' : 'OFF';
                valueDisplay.style.color = currentValue ? '#00ff00' : '#ff0000';

                label.textContent = setting.label + ' ';
                label.appendChild(valueDisplay);
                div.appendChild(label);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = currentValue;
                checkbox.style.cssText = `
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                `;

                checkbox.onchange = (e) => {
                    const value = e.target.checked;
                    valueDisplay.textContent = value ? 'ON' : 'OFF';
                    valueDisplay.style.color = value ? '#00ff00' : '#ff0000';
                    setting.setValue(value);
                };

                div.appendChild(checkbox);
            } else if (setting.type === 'range') {
                // Range slider layout
                valueDisplay.textContent = currentValue.toFixed(setting.decimals || 0);

                label.textContent = setting.label + ' ';
                label.appendChild(valueDisplay);
                div.appendChild(label);

                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = setting.min;
                slider.max = setting.max;
                slider.step = setting.step || 1;
                slider.value = currentValue;
                slider.style.cssText = `
                    width: 100%;
                    cursor: pointer;
                `;

                slider.oninput = (e) => {
                    const value = parseFloat(e.target.value);
                    valueDisplay.textContent = value.toFixed(setting.decimals || 0);
                    setting.setValue(value);
                };

                div.appendChild(slider);
            }

            return div;
        }
    }

    // Create global instance
    global.TweakPanel = new TweakPanel();

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
