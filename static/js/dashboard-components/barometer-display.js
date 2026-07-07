/**
 * Barometer Display - STEG 7 REFAKTORERING
 * Barometersystem extraherat från dashboard.js
 * Hanterar tryckvisning, trender och fallback-logik
 */

// === BAROMETER SYSTEM ===

/**
 * Nivåband enligt den digitaliserade Huger-precisionsbarometern.
 * Ordet bestäms av det ABSOLUTA trycket (som nålen på en fysisk urtavla).
 * Gränser i hPa (= mbar). Slå upp med: hPa < band.max.
 * Se pressure-descriptions.md i roten.
 */
// SPRÅK: label är översättningsnycklar - slås upp med t() i describePressureLevel
const PRESSURE_BANDS = [
    { max: 980,      label: 'BARO_STORM' },
    { max: 1000,     label: 'BARO_RAIN' },
    { max: 1013,     label: 'BARO_UNSTABLE' },
    { max: 1040,     label: 'BARO_FAIR' },
    { max: Infinity, label: 'BARO_VERY_DRY' }
];

/**
 * Trend-metadata, femgradig skala enligt pressure-descriptions.md.
 * 'arrow'/'word' används i ordläget (rad 2 = nålen på skalan), 'text' i det numeriska
 * läget ("Trend: ..."), 'cls' styr ikonens färgklass. Snabbt-stegen får dubbelpil (⇈/⇊)
 * och en kraftigare färgklass — displayens markör för en snabb väderomställning.
 * Nyckel = backend-fältet 'trend5'; tregradiga 'trend' funkar som fallback (utan snabbt).
 */
// SPRÅK: word/text är översättningsnycklar - slås upp med t() vid rendering
const TREND_META = {
    rising_fast:  { arrow: '⇈', word: 'TREND_RISING_FAST_WORD',  text: 'TREND_RISING_FAST',  cls: 'rising-fast' },
    rising:       { arrow: '↗', word: 'TREND_RISING_WORD',       text: 'TREND_RISING',       cls: 'rising' },
    stable:       { arrow: '→', word: 'TREND_STABLE_WORD',       text: 'TREND_STABLE',       cls: 'stable' },
    falling:      { arrow: '↘', word: 'TREND_FALLING_WORD',      text: 'TREND_FALLING',      cls: 'falling' },
    falling_fast: { arrow: '⇊', word: 'TREND_FALLING_FAST_WORD', text: 'TREND_FALLING_FAST', cls: 'falling-fast' }
};

class BarometerDisplay {
    /**
     * Översätt absolut tryck (hPa) till beskrivande ord.
     * @param {number} hPa - Lufttryck i hPa
     * @returns {string} Nivåord, t.ex. "Vackert"
     */
    static describePressureLevel(hPa) {
        return t(PRESSURE_BANDS.find(band => hPa < band.max).label);
    }

    /**
     * Uppdatera barometer-detaljer med tryck och trend
     * @param {object} pressureTrend - Trycktrend-objekt från Netatmo eller fallback
     * @param {number} currentPressure - Aktuellt lufttryck i hPa
     */
    static updateBarometerDetail(pressureTrend, currentPressure) {
        const barometerIcon = document.getElementById('barometer-icon');
        const barometerPressureLine = document.getElementById('barometer-pressure-line');
        const barometerTrendLine = document.getElementById('barometer-trend-line');
        
        if (!barometerIcon || !barometerPressureLine || !barometerTrendLine) {
            console.warn('⚠️ Barometer detail-element saknas i DOM');
            return;
        }
        
        // FAS 2: Använd intelligent datahantering för tryck
        const pressureData = formatDataWithSource(currentPressure, 'pressure');
        const hasPressure = pressureData.shouldShow;
        const roundedPressure = hasPressure ? Math.round(pressureData.value) : null;
        if (hasPressure) {
            console.log(pressureData.debug);
        }

        // Hantera trycktrend med fallback
        let finalPressureTrend = pressureTrend;

        if (!pressureTrend || pressureTrend.trend === 'n/a') {
            // FAS 2: Använd SMHI-baserad fallback om Netatmo saknas
            const smhiData = { pressure: currentPressure };
            finalPressureTrend = createSmhiPressureTrendFallback(smhiData);
            console.log('📊 FAS 2: Använder SMHI trycktrend-fallback');
        }

        // Femgradig trend (trend5); fall tillbaka på tregradiga 'trend' (t.ex. SMHI-fallback
        // som saknar riktig Δ → aldrig snabbt-steg).
        const trendKey = finalPressureTrend.trend5 || finalPressureTrend.trend;
        const trend = TREND_META[trendKey];

        // Uppdatera barometer-ikon (färgen bär trenden i båda lägena)
        this.updateBarometerIcon(barometerIcon, trendKey);

        const mode = (typeof dashboardState !== 'undefined' && dashboardState.pressureDisplay) || 'numeric';

        if (mode === 'words') {
            // ORDLÄGE - emulerar den fysiska barometern:
            //   rad 1 = nivåordet (den inre beskrivande ringen, från absolut tryck)
            //   rad 2 = nålen på sifferskalan: pil + siffra + trendord
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
            // NUMERISKT LÄGE (klassiskt): siffra + texttrend
            barometerPressureLine.textContent = hasPressure ? `${roundedPressure} hPa` : '-- hPa';
            barometerTrendLine.textContent = `${t('TREND_PREFIX')}${trend ? t(trend.text) : t('UNKNOWN')}`;
        }

        console.log(`📊 FAS 2: Barometer uppdaterad (${mode}): ${finalPressureTrend.trend} (källa: ${finalPressureTrend.source || 'netatmo'})`);
    }
    
    /**
     * Sätt fallback-visning för barometer
     * @param {HTMLElement} iconElement - Ikon-element
     * @param {HTMLElement} trendElement - Trend-element
     */
    static setBarometerDetailFallback(iconElement, trendElement) {
        this.updateBarometerIcon(iconElement, 'n/a');
        trendElement.textContent = `${t('TREND_PREFIX')}${t('TREND_COLLECTING')}`;
    }
    
    /**
     * Uppdatera barometer-ikon baserat på trend
     * @param {HTMLElement} iconElement - Ikon-container element
     * @param {string} trend - Trycktrend: 'rising', 'falling', 'stable', 'n/a'
     */
    static updateBarometerIcon(iconElement, trend) {
        // Kontrollera om ikonen redan är skapad
        let barometerIcon = iconElement.querySelector('.wi-barometer');
        
        if (!barometerIcon) {
            // Rensa befintligt innehåll
            iconElement.innerHTML = '';
            
            // STEG 4: Använd WeatherIconRenderer istället för WeatherIconManager
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
        
        // Ta bort alla trend-klasser
        barometerIcon.classList.remove('rising', 'falling', 'stable', 'na', 'rising-fast', 'falling-fast');

        // Lägg till färgklass baserat på trend (femgradig; snabbt-stegen får egen klass)
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

// Exportera för backward compatibility (behåll gamla namn)
const BarometerManager = BarometerDisplay;

console.log('✅ STEG 7: Barometer Display laddat - 3 metoder extraherade!');