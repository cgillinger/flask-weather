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
const PRESSURE_BANDS = [
    { max: 980,      label: 'Storm' },
    { max: 1000,     label: 'Regn' },
    { max: 1013,     label: 'Ostadigt' },
    { max: 1040,     label: 'Vackert' },
    { max: Infinity, label: 'Mycket torrt' }
];

/**
 * Trend-metadata, femgradig skala enligt pressure-descriptions.md.
 * 'arrow'/'word' används i ordläget (rad 2 = nålen på skalan), 'text' i det numeriska
 * läget ("Trend: ..."), 'cls' styr ikonens färgklass. Snabbt-stegen får dubbelpil (⇈/⇊)
 * och en kraftigare färgklass — displayens markör för en snabb väderomställning.
 * Nyckel = backend-fältet 'trend5'; tregradiga 'trend' funkar som fallback (utan snabbt).
 */
const TREND_META = {
    rising_fast:  { arrow: '⇈', word: 'stiger snabbt', text: 'Stigande snabbt', cls: 'rising-fast' },
    rising:       { arrow: '↗', word: 'stiger',        text: 'Stigande',        cls: 'rising' },
    stable:       { arrow: '→', word: 'stabilt',       text: 'Stabilt',         cls: 'stable' },
    falling:      { arrow: '↘', word: 'faller',        text: 'Fallande',        cls: 'falling' },
    falling_fast: { arrow: '⇊', word: 'faller snabbt', text: 'Fallande snabbt', cls: 'falling-fast' }
};

class BarometerDisplay {
    /**
     * Översätt absolut tryck (hPa) till beskrivande ord.
     * @param {number} hPa - Lufttryck i hPa
     * @returns {string} Nivåord, t.ex. "Vackert"
     */
    static describePressureLevel(hPa) {
        return PRESSURE_BANDS.find(band => hPa < band.max).label;
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
                const word = trend ? ` · ${trend.word}` : '';
                barometerTrendLine.textContent = `${arrow}${roundedPressure} hPa${word}`;
            } else {
                barometerPressureLine.textContent = '--';
                barometerTrendLine.textContent = trend ? `${trend.arrow} ${trend.word}` : 'Samlar data...';
            }
        } else {
            // NUMERISKT LÄGE (klassiskt): siffra + texttrend
            barometerPressureLine.textContent = hasPressure ? `${roundedPressure} hPa` : '-- hPa';
            barometerTrendLine.textContent = `Trend: ${trend ? trend.text : 'Okänt'}`;
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
        trendElement.textContent = 'Trend: Samlar data...';
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