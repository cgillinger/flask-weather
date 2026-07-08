/**
 * Barometer Display - STEP 7 REFACTORING
 * Barometer system extracted from dashboard.js
 * Handles pressure display, trends and fallback logic
 */

// === BAROMETER SYSTEM ===

/**
 * Level bands following the digitized Huger precision barometer.
 * The word is determined by the ABSOLUTE pressure (like the needle on a physical dial).
 * Bounds in hPa (= mbar). Look up with: hPa < band.max.
 * See pressure-descriptions.md in the repo root.
 */
// LANGUAGE: label holds translation keys - resolved with t() in describePressureLevel
const PRESSURE_BANDS = [
    { max: 980,      label: 'BARO_STORM' },
    { max: 1000,     label: 'BARO_RAIN' },
    { max: 1013,     label: 'BARO_UNSTABLE' },
    { max: 1040,     label: 'BARO_FAIR' },
    { max: Infinity, label: 'BARO_VERY_DRY' }
];

/**
 * Trend metadata, five-step scale per pressure-descriptions.md.
 * 'arrow'/'word' are used in word mode (line 2 = the needle on the scale), 'text' in
 * numeric mode ("Trend: ..."), 'cls' sets the icon color class. The fast steps get a
 * double arrow (⇈/⇊) and a stronger color class — the display's marker for a rapid
 * weather shift. Key = backend field 'trend5'; the three-step 'trend' works as a
 * fallback (without fast steps).
 */
// LANGUAGE: word/text hold translation keys - resolved with t() at render time
const TREND_META = {
    rising_fast:  { arrow: '⇈', word: 'TREND_RISING_FAST_WORD',  text: 'TREND_RISING_FAST',  cls: 'rising-fast' },
    rising:       { arrow: '↗', word: 'TREND_RISING_WORD',       text: 'TREND_RISING',       cls: 'rising' },
    stable:       { arrow: '→', word: 'TREND_STABLE_WORD',       text: 'TREND_STABLE',       cls: 'stable' },
    falling:      { arrow: '↘', word: 'TREND_FALLING_WORD',      text: 'TREND_FALLING',      cls: 'falling' },
    falling_fast: { arrow: '⇊', word: 'TREND_FALLING_FAST_WORD', text: 'TREND_FALLING_FAST', cls: 'falling-fast' }
};

class BarometerDisplay {
    /**
     * Translate absolute pressure (hPa) into a descriptive word.
     * @param {number} hPa - Air pressure in hPa
     * @returns {string} Level word, e.g. "Vackert"
     */
    static describePressureLevel(hPa) {
        return t(PRESSURE_BANDS.find(band => hPa < band.max).label);
    }

    /**
     * Update barometer details with pressure and trend
     * @param {object} pressureTrend - Pressure trend object from Netatmo or fallback
     * @param {number} currentPressure - Current air pressure in hPa
     */
    static updateBarometerDetail(pressureTrend, currentPressure) {
        const barometerIcon = document.getElementById('barometer-icon');
        const barometerPressureLine = document.getElementById('barometer-pressure-line');
        const barometerTrendLine = document.getElementById('barometer-trend-line');

        if (!barometerIcon || !barometerPressureLine || !barometerTrendLine) {
            console.warn('⚠️ Barometer detail-element saknas i DOM');
            return;
        }

        // PHASE 2: Use intelligent data handling for pressure
        const pressureData = formatDataWithSource(currentPressure, 'pressure');
        const hasPressure = pressureData.shouldShow;
        const roundedPressure = hasPressure ? Math.round(pressureData.value) : null;
        if (hasPressure) {
            console.log(pressureData.debug);
        }

        // Handle pressure trend with fallback
        let finalPressureTrend = pressureTrend;

        if (!pressureTrend || pressureTrend.trend === 'n/a') {
            // PHASE 2: Use SMHI-based fallback when Netatmo is missing
            const smhiData = { pressure: currentPressure };
            finalPressureTrend = createSmhiPressureTrendFallback(smhiData);
            console.log('📊 FAS 2: Använder SMHI trycktrend-fallback');
        }

        // Five-step trend (trend5); fall back to the three-step 'trend' (e.g. the SMHI
        // fallback, which lacks a real Δ → never a fast step).
        const trendKey = finalPressureTrend.trend5 || finalPressureTrend.trend;
        const trend = TREND_META[trendKey];

        // Update barometer icon (the color carries the trend in both modes)
        this.updateBarometerIcon(barometerIcon, trendKey);

        const mode = (typeof dashboardState !== 'undefined' && dashboardState.pressureDisplay) || 'numeric';

        if (mode === 'words') {
            // WORD MODE - emulates the physical barometer:
            //   line 1 = the level word (the inner descriptive ring, from absolute pressure)
            //   line 2 = the needle on the numeric scale: arrow + number + trend word
            if (hasPressure) {
                barometerPressureLine.textContent = this.describePressureLevel(roundedPressure);
                const arrow = trend ? `${trend.arrow} ` : '';
                const word = trend ? ` · ${t(trend.word)}` : '';
                barometerTrendLine.textContent = `${arrow}${roundedPressure} hPa${word}`;
            } else {
                barometerPressureLine.textContent = '--';
                barometerTrendLine.textContent = trend ? `${trend.arrow} ${t(trend.word)}` : t('TREND_COLLECTING');
            }
        } else {
            // NUMERIC MODE (classic): number + textual trend
            barometerPressureLine.textContent = hasPressure ? `${roundedPressure} hPa` : '-- hPa';
            barometerTrendLine.textContent = `${t('TREND_PREFIX')}${trend ? t(trend.text) : t('UNKNOWN')}`;
        }

        console.log(`📊 FAS 2: Barometer uppdaterad (${mode}): ${finalPressureTrend.trend} (källa: ${finalPressureTrend.source || 'netatmo'})`);
    }

    /**
     * Update barometer icon based on trend
     * @param {HTMLElement} iconElement - Icon container element
     * @param {string} trend - Pressure trend: 'rising', 'falling', 'stable', 'n/a'
     */
    static updateBarometerIcon(iconElement, trend) {
        // Check whether the icon is already created
        let barometerIcon = iconElement.querySelector('.wi-barometer');

        if (!barometerIcon) {
            // Clear existing content
            iconElement.innerHTML = '';

            barometerIcon = WeatherIconRenderer.createIcon('wi-barometer', []);
            barometerIcon.style.cssText = `
                font-size: clamp(20px, 2rem, 26px);
                display: inline-block;
                line-height: 1;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1), 0 0 1px currentColor;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1)) drop-shadow(0 0 1px currentColor);
                transition: color 0.3s ease;
                margin-top: 2px;
            `;

            iconElement.appendChild(barometerIcon);
        }

        // Remove all trend classes
        barometerIcon.classList.remove('rising', 'falling', 'stable', 'na', 'rising-fast', 'falling-fast');

        // Add color class based on trend (five-step; the fast steps get their own class)
        const classMap = {
            'rising_fast': 'rising-fast',
            'rising': 'rising',
            'stable': 'stable',
            'falling': 'falling',
            'falling_fast': 'falling-fast',
            'n/a': 'na'
        };

        const cssClass = classMap[trend] || 'na';
        barometerIcon.classList.add(cssClass);

        console.log(`🎨 Barometer-ikon: ${trend} → ${cssClass}`);
    }
}

console.log('✅ STEG 7: Barometer Display laddat - 3 metoder extraherade!');
