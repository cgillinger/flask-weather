// rain-display.js - Modul för att visa nederbörd från Netatmo regnmodul
// Prioriterad data från NAModule3 (Regnmätare)

const RainDisplay = (function() {
    'use strict';

    // DOM-element
    let rainContainer = null;
    let rainDataSpan = null;

    /**
     * Initialisera regndata-display
     */
    function init() {
        rainContainer = document.getElementById('rain-data-container');
        rainDataSpan = document.getElementById('rain-data');

        if (!rainContainer || !rainDataSpan) {
            console.error('❌ RainDisplay: Kunde inte hitta DOM-element');
            return false;
        }

        console.log('✅ RainDisplay initierad');
        return true;
    }

    /**
     * Formatera regndata med intelligenta enheter
     * @param {number} rain - Aktuell nederbörd (mm)
     * @param {number} sum1h - 1h total (mm)
     * @param {number} sum24h - 24h total (mm)
     * @returns {string} Formaterad sträng
     */
    function formatRainData(rain, sum1h, sum24h) {
        // Prioritera mest relevant data
        if (sum1h !== null && sum1h !== undefined && sum1h > 0) {
            return `${sum1h.toFixed(1)} mm (1h)`;
        } else if (sum24h !== null && sum24h !== undefined && sum24h > 0) {
            return `${sum24h.toFixed(1)} mm (24h)`;
        } else if (rain !== null && rain !== undefined) {
            if (rain === 0) {
                return 'Inget regn';
            }
            return `${rain.toFixed(1)} mm`;
        }
        return 'Ingen data';
    }

    /**
     * Uppdatera regndata-visning
     * @param {object} netatmoData - Netatmo väderdata med regninfo
     */
    function update(netatmoData) {
        if (!rainContainer || !rainDataSpan) {
            console.warn('⚠️ RainDisplay: Inte initierad');
            return;
        }

        // Kontrollera om det finns regndata
        const hasRainData = netatmoData && (
            netatmoData.rain !== null && netatmoData.rain !== undefined ||
            netatmoData.rain_sum_1 !== null && netatmoData.rain_sum_1 !== undefined ||
            netatmoData.rain_sum_24 !== null && netatmoData.rain_sum_24 !== undefined
        );

        if (hasRainData) {
            // Formatera och visa regndata
            const rainText = formatRainData(
                netatmoData.rain,
                netatmoData.rain_sum_1,
                netatmoData.rain_sum_24
            );

            rainDataSpan.textContent = rainText;
            
            // Visa container om den var dold
            if (rainContainer.style.display === 'none') {
                rainContainer.style.display = '';
                rainContainer.classList.remove('netatmo-hidden');
            }

            // Logga datakälla om tillgänglig
            if (netatmoData.data_sources && netatmoData.data_sources.rain) {
                console.log(`🌧️ Nederbörd: ${rainText} från ${netatmoData.data_sources.rain}`);
            } else {
                console.log(`🌧️ Nederbörd: ${rainText}`);
            }
        } else {
            // Dölj container om ingen regndata
            rainContainer.style.display = 'none';
            rainContainer.classList.add('netatmo-hidden');
            console.log('📊 Ingen regndata tillgänglig');
        }
    }

    /**
     * Dölj regndata-display (för SMHI-only läge)
     */
    function hide() {
        if (rainContainer) {
            rainContainer.style.display = 'none';
            rainContainer.classList.add('netatmo-hidden');
            console.log('🌧️ Regndata-display dold (SMHI-only)');
        }
    }

    /**
     * Visa detaljerad regnstatistik i console (för debugging)
     * @param {object} netatmoData - Netatmo väderdata
     */
    function logDetailedStats(netatmoData) {
        if (!netatmoData) return;

        console.group('🌧️ Detaljerad regnstatistik');
        
        if (netatmoData.rain !== null && netatmoData.rain !== undefined) {
            console.log(`Aktuell: ${netatmoData.rain.toFixed(2)} mm`);
        }
        
        if (netatmoData.rain_sum_1 !== null && netatmoData.rain_sum_1 !== undefined) {
            console.log(`1h total: ${netatmoData.rain_sum_1.toFixed(2)} mm`);
        }
        
        if (netatmoData.rain_sum_24 !== null && netatmoData.rain_sum_24 !== undefined) {
            console.log(`24h total: ${netatmoData.rain_sum_24.toFixed(2)} mm`);
        }

        if (netatmoData.data_sources) {
            if (netatmoData.data_sources.rain) {
                console.log(`Källa: ${netatmoData.data_sources.rain}`);
            }
            if (netatmoData.data_sources.rain_sum_1) {
                console.log(`1h källa: ${netatmoData.data_sources.rain_sum_1}`);
            }
            if (netatmoData.data_sources.rain_sum_24) {
                console.log(`24h källa: ${netatmoData.data_sources.rain_sum_24}`);
            }
        }
        
        console.groupEnd();
    }

    // Public API
    return {
        init: init,
        update: update,
        hide: hide,
        logDetailedStats: logDetailedStats
    };
})();

// Auto-initialisera vid DOMContentLoaded om inte redan gjort
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        RainDisplay.init();
    });
} else {
    RainDisplay.init();
}
