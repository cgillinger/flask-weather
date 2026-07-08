/**
 * UV Display Module - PHASE 4
 * Handles UV index display in weather-details-grid
 *
 * Responsibilities:
 * - Fetch UV data from /api/uv
 * - Show UV index with color-coded icon (SSM scale)
 * - Hide/show based on availability
 * - Update risk level colors dynamically
 */

const UVDisplay = {
    /**
     * Update UV display with data from API
     *
     * @param {Object} uvData - UV data from /api/uv
     * @param {number} uvData.uv_index - UV index value
     * @param {string} uvData.risk_level - Risk level (low, moderate, high, very_high, extreme)
     * @param {string} uvData.risk_text - Swedish risk level text
     * @param {number} [uvData.peak_hour] - Peak hour (0-23)
     */
    updateUVDisplay(uvData) {
        const container = document.getElementById('uv-index-container');
        const icon = document.getElementById('uv-icon');
        const valueLine = document.getElementById('uv-value');
        const riskLine = document.getElementById('uv-risk-text');

        if (!container || !icon || !valueLine || !riskLine) {
            console.warn('☀️ UV-element saknas i DOM');
            return;
        }

        // Visa container
        container.style.display = 'flex';

        // Format UV value
        const uvValue = uvData.uv_index.toFixed(1);

        // Value + risk text on separate lines (unified tile anatomy, see styles.css)
        // LANGUAGE: translate via risk_level key; backend text is fallback
        const riskText = uvData.risk_level ? t(`UV_RISK_${uvData.risk_level}`) : uvData.risk_text;
        valueLine.textContent = `UV ${uvValue}`;
        riskLine.textContent = riskText;
        
        // Ta bort alla gamla risk-klasser
        icon.classList.remove('uv-low', 'uv-moderate', 'uv-high', 'uv-very_high', 'uv-extreme');
        
        // Apply new color class based on risk level
        const riskClass = `uv-${uvData.risk_level}`;
        icon.classList.add(riskClass);
        
        console.log(`☀️ UV-display uppdaterad: UV ${uvValue} (${uvData.risk_level})`);
    },
    
    /**
     * Hide UV display if data is not available
     */
    hideUVDisplay() {
        const container = document.getElementById('uv-index-container');
        if (container) {
            container.style.display = 'none';
            console.log('🙈 UV-display dold - ingen data tillgänglig');
        }
    },
    
    /**
     * Fetch and update UV data from API
     * Called from dashboard.js updateAllData()
     */
    async fetchAndUpdateUV() {
        // DEV: ?uv_mock=<value> forces the tile with mock data, so the design can be
        // reviewed without daylight/CAMS data. Never present on the kiosk URL.
        const mock = new URLSearchParams(window.location.search).get('uv_mock');
        if (mock !== null) {
            const uv = parseFloat(mock) || 0;
            const level = uv < 3 ? 'low' : uv < 6 ? 'moderate' : uv < 8 ? 'high' : uv < 11 ? 'very_high' : 'extreme';
            this.updateUVDisplay({ uv_index: uv, risk_level: level });
            return;
        }

        try {
            // fetchWithTimeout (fetch-api-client.js): a hanging /api/uv call
            // must not block the entire update cycle on the kiosk
            const uvData = await fetchWithTimeout('/api/uv');

            // Check if UV data is available
            if (uvData && uvData.available) {
                this.updateUVDisplay(uvData);
            } else {
                const reason = uvData.reason || 'okänd anledning';
                console.log(`☀️ UV-data ej tillgänglig: ${reason}`);
                this.hideUVDisplay();
            }
            
        } catch (error) {
            console.warn('☀️ UV fetch-fel:', error.message);
            this.hideUVDisplay();
        }
    }
};

// Make available globally for dashboard.js
window.UVDisplay = UVDisplay;

console.log('✅ UV Display modul laddad');
