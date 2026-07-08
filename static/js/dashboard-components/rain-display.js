// rain-display.js - Module for displaying precipitation from the Netatmo rain module (NAModule3)
//
// DELIBERATELY NOT WIRED IN (decision by Christian, 2026-07-08): rain is already
// communicated by the hero weather icon and the WeatherEffects rain animation, so
// this panel would be redundant and crowd the data-point row. The component is kept
// complete and working (update()/hide()) in case a dedicated rain readout is wanted
// later — see #rain-data-container in templates/index.html. The rain FIELDS in
// /api/current stay live and drive the rain effect via updateWeatherEffects().

const RainDisplay = (function() {
    'use strict';

    // DOM elements
    let rainContainer = null;
    let rainDataSpan = null;

    /**
     * Initialize the rain data display
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
     * Format rain data with sensible units
     * @param {number} rain - Current precipitation (mm)
     * @param {number} sum1h - 1h total (mm)
     * @param {number} sum24h - 24h total (mm)
     * @returns {string} Formatted string
     */
    function formatRainData(rain, sum1h, sum24h) {
        // Prioritize the most relevant data
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
     * Update the rain data display
     * @param {object} netatmoData - Netatmo weather data with rain info
     */
    function update(netatmoData) {
        if (!rainContainer || !rainDataSpan) {
            console.warn('⚠️ RainDisplay: Inte initierad');
            return;
        }

        // Check whether any rain data exists
        const hasRainData = netatmoData && (
            netatmoData.rain !== null && netatmoData.rain !== undefined ||
            netatmoData.rain_sum_1 !== null && netatmoData.rain_sum_1 !== undefined ||
            netatmoData.rain_sum_24 !== null && netatmoData.rain_sum_24 !== undefined
        );

        if (hasRainData) {
            // Format and show rain data
            const rainText = formatRainData(
                netatmoData.rain,
                netatmoData.rain_sum_1,
                netatmoData.rain_sum_24
            );

            rainDataSpan.textContent = rainText;

            // Show container if it was hidden
            if (rainContainer.style.display === 'none') {
                rainContainer.style.display = '';
                rainContainer.classList.remove('netatmo-hidden');
            }

            // Log data source if available
            if (netatmoData.data_sources && netatmoData.data_sources.rain) {
                console.log(`🌧️ Nederbörd: ${rainText} från ${netatmoData.data_sources.rain}`);
            } else {
                console.log(`🌧️ Nederbörd: ${rainText}`);
            }
        } else {
            // Hide container when there is no rain data
            rainContainer.style.display = 'none';
            rainContainer.classList.add('netatmo-hidden');
            console.log('📊 Ingen regndata tillgänglig');
        }
    }

    /**
     * Hide the rain data display (for SMHI-only mode)
     */
    function hide() {
        if (rainContainer) {
            rainContainer.style.display = 'none';
            rainContainer.classList.add('netatmo-hidden');
            console.log('🌧️ Regndata-display dold (SMHI-only)');
        }
    }

    // Public API
    return {
        init: init,
        update: update,
        hide: hide
    };
})();

// Auto-initialize on DOMContentLoaded if not already done
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        RainDisplay.init();
    });
} else {
    RainDisplay.init();
}
