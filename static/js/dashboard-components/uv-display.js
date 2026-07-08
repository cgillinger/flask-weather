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
        const text = document.getElementById('uv-index-text');
        
        if (!container || !icon || !text) {
            console.warn('☀️ UV-element saknas i DOM');
            return;
        }
        
        // Visa container
        container.style.display = 'flex';
        
        // Format UV value
        const uvValue = uvData.uv_index.toFixed(1);

        // Format text with two-line layout (UV value + smaller risk text on line below)
        // LANGUAGE: translate via risk_level key; backend text is fallback
        const riskText = uvData.risk_level ? t(`UV_RISK_${uvData.risk_level}`) : uvData.risk_text;
        text.innerHTML = `UV ${uvValue}<br><span class="uv-risk-text">${riskText}</span>`;
        
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
