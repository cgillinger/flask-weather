/**
 * UV Display Modul - FAS 4
 * Hanterar UV-index visning i weather-details-grid
 * 
 * Ansvar:
 * - Hämta UV-data från /api/uv
 * - Visa UV-index med färgkodad ikon (SSM-skala)
 * - Dölja/visa baserat på tillgänglighet
 * - Uppdatera risknivå-färger dynamiskt
 */

const UVDisplay = {
    /**
     * Uppdatera UV-display med data från API
     * 
     * @param {Object} uvData - UV-data från /api/uv
     * @param {number} uvData.uv_index - UV-index värde
     * @param {string} uvData.risk_level - Risknivå (low, moderate, high, very_high, extreme)
     * @param {string} uvData.risk_text - Svensk risknivå-text
     * @param {number} [uvData.peak_hour] - Topp-timme (0-23)
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
        
        // Formatera UV-värde
        const uvValue = uvData.uv_index.toFixed(1);
        
        // Formatera text med tvåradslayout (UV-värde + mindre risk-text på rad under)
        text.innerHTML = `UV ${uvValue}<br><span class="uv-risk-text">${uvData.risk_text}</span>`;
        
        // Ta bort alla gamla risk-klasser
        icon.classList.remove('uv-low', 'uv-moderate', 'uv-high', 'uv-very_high', 'uv-extreme');
        
        // Applicera ny färgklass baserat på risknivå
        const riskClass = `uv-${uvData.risk_level}`;
        icon.classList.add(riskClass);
        
        console.log(`☀️ UV-display uppdaterad: UV ${uvValue} (${uvData.risk_level})`);
    },
    
    /**
     * Dölj UV-display om data inte är tillgänglig
     */
    hideUVDisplay() {
        const container = document.getElementById('uv-index-container');
        if (container) {
            container.style.display = 'none';
            console.log('🙈 UV-display dold - ingen data tillgänglig');
        }
    },
    
    /**
     * Hämta och uppdatera UV-data från API
     * Anropas från dashboard.js updateAllData()
     */
    async fetchAndUpdateUV() {
        try {
            const response = await fetch('/api/uv');
            
            if (!response.ok) {
                console.warn(`☀️ UV API fel: ${response.status}`);
                this.hideUVDisplay();
                return;
            }
            
            const uvData = await response.json();
            
            // Kontrollera om UV-data är tillgänglig
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

// Gör tillgänglig globalt för dashboard.js
window.UVDisplay = UVDisplay;

console.log('✅ UV Display modul laddad');
