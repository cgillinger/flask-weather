/**
 * @file current-weather-view.js
 * @version 1.2.0
 * @lastModified 2026-07-09 (v1.2.0)
 * @description Current-weather functions for main card, temperature, wind and icons
 * @dependencies ColorManager (color-manager.js), WeatherIconRenderer, FontAwesomeRenderer
 * @author Flask Weather Dashboard Team
 *
 * STEP 11 REFACTORING: Extracted from dashboard.js
 * + NETATMO RAIN PRIORITY: the Netatmo rain gauge is the source of truth for weather effects
 * v1.1.0: Integrated with ColorManager for temperature color coding
 * v1.2.0: NETATMO RAIN PRIORITY also for the hero icon + description (getEffectiveWeatherSymbol)
 */

// === CURRENT WEATHER FUNCTIONS ===

/**
 * Update current weather (main function)
 * @param {object} data - Complete weather data from the API
 */
function updateCurrentWeather(data) {
    // SMHI Data
    if (data.smhi) {
        const smhi = data.smhi;

        // SMHI temperature (!= null, not truthy: 0.0°C is a valid reading)
        updateElementHTML('smhi-temperature', smhi.temperature != null ? formatTemperature(smhi.temperature) : '--.-°');

        // Weather provider under the PROGNOS label (data_source: SMHI/YR/Open-Meteo)
        const providerEl = document.getElementById('smhi-provider');
        if (providerEl) {
            providerEl.textContent = smhi.data_source ? `(${smhi.data_source})` : '';
        }

        // SMHI weather icon
        if (smhi.weather_symbol) {
            // NETATMO RAIN PRIORITY (hero): measured rain may override a dry forecast symbol
            const effectiveSymbol = getEffectiveWeatherSymbol(data);
            const iconElement = document.getElementById('smhi-weather-icon');
            const isDay = isDaytime();

            if (iconElement) {
                iconElement.innerHTML = '';
                iconElement.className = 'weather-icon';

                // ICON PACK: rendered with the active pack (ui.icon_pack in config)
                const weatherIcon = WeatherIconRenderer.createWeatherIcon(effectiveSymbol, isDay, ['weather-main-icon']);

                // CENTRALIZED COLOR CODING v1.1.0: Use ColorManager for the main icon
                // (only affects font icons; SVG packs have their own colors)
                const iconColor = ColorManager.getWeatherIconColor(effectiveSymbol);
                weatherIcon.style.color = iconColor;

                iconElement.appendChild(weatherIcon);

                console.log(`🎨 Main weather icon: symbol ${effectiveSymbol} (${isDay ? 'dag' : 'natt'}) - color: ${iconColor}`);
                
                // NETATMO RAIN PRIORITY: WeatherEffects update with Netatmo priority
                if (window.weatherEffectsManager) {
                    try {
                        updateWeatherEffects(data);
                    } catch (error) {
                        console.warn("WeatherEffects update failed:", error);
                    }
                }
            }
            
            updateElement('smhi-description', getWeatherDescription(effectiveSymbol));
        }
    }
    
    // HUMIDITY FIX: INTELLIGENT DATA HANDLING FOR HUMIDITY
    // STEP 8: Use Intelligent Data Source instead of a local function
    const humidityData = formatDataWithSource(
        data.netatmo?.humidity || data.smhi?.humidity,
        'humidity'
    );

    if (humidityData.shouldShow) {
        updateHumidityDisplay(humidityData.formatted);
        console.log(`💧 HUMIDITY FIX: ${humidityData.debug}`);
    } else {
        // HUMIDITY FIX: Hide humidity entirely when no data exists
        console.log('🙈 HUMIDITY FIX: Döljer luftfuktighet - ingen data tillgänglig');
        // The element is hidden by adaptHumiditySection(), called from applyUIAdaptations()
    }

    // Netatmo data (conditional, with PHASE 3 UI adaptations)
    if (data.netatmo && isNetatmoAvailable()) {
        const netatmo = data.netatmo;

        // Netatmo actual temperature (PHASE 3: only if the section is shown)
        // STEP 8: Use Intelligent Data Source instead of a local function
        const tempData = formatDataWithSource(netatmo.temperature, 'temperature_actual');
        if (tempData.shouldShow) {
            const tempElement = document.getElementById('netatmo-temperature-small');
            if (tempElement && !document.querySelector('#netatmo-temperature-section.netatmo-hidden')) {
                tempElement.innerHTML = formatTemperature(tempData.value);

                // CENTRALIZED COLOR CODING: Use ColorManager instead of hardcoded values
                tempElement.style.color = ColorManager.getTemperatureColor(tempData.value);
                console.log(tempData.debug);
            }
        }

        // Air quality is handled uniformly by AirQualityDisplay further down (indoor + outdoor)

        // BAROMETER UPDATE with smart source
        const pressureTrend = netatmo.pressure_trend;
        // STEP 8: Use Intelligent Data Source instead of a local function
        const pressureData = formatDataWithSource(netatmo.pressure || data.smhi?.pressure, 'pressure');

        // STEP 7: Use BarometerDisplay instead of BarometerManager
        BarometerDisplay.updateBarometerDetail(pressureTrend, pressureData.value);
    } else {
        // PHASE 3: SMHI-ONLY MODE - fallback handling with UI adaptations
        console.log('📊 FAS 3: SMHI-only mode med UI-degradering + HUMIDITY FIX');

        // SWAPPED: show SMHI temp in the primary (large) position
        // (!= null, not truthy: at exactly 0.0°C the display froze on the old value)
        if (data.smhi && data.smhi.temperature != null) {
            const primaryTempElement = document.getElementById('netatmo-temperature-small');
            if (primaryTempElement) {
                primaryTempElement.innerHTML = formatTemperature(data.smhi.temperature);
                primaryTempElement.style.color = ColorManager.getTemperatureColor(data.smhi.temperature);
                console.log('🌡️ SMHI-only: SMHI-temperatur visas i primär (stor) position');
            }
        }

        // Use SMHI for the barometer, with fallback
        const fallbackPressureTrend = createSmhiPressureTrendFallback(data.smhi);
        const pressureData = formatDataWithSource(data.smhi?.pressure, 'pressure');

        // STEP 7: Use BarometerDisplay instead of BarometerManager
        BarometerDisplay.updateBarometerDetail(fallbackPressureTrend, pressureData.value);

        console.log('🔄 FAS 3: Prognos-kolumn och CO2 dolda via UI-anpassningar');
    }

    // WIND under the provider temperature (both modes - see updateWindUnderTemp)
    if (data.smhi && data.smhi.wind_speed !== null && data.smhi.wind_speed !== undefined) {
        updateWindUnderTemp(data.smhi);
    }

    // AIR QUALITY: indoor CO2 (Netatmo) and/or outdoor AQI (SMHI→CAMS) per air_quality.mode.
    // Runs after applyUIAdaptations() so this component owns the panel's visibility.
    try { AirQualityDisplay.update(data); } catch (e) { console.warn('AirQuality update failed:', e); }

    // SUN TIMES (unchanged)
    if (data.sun) {
        try {
            if (data.sun.sunrise) {
                const sunrise = new Date(data.sun.sunrise);
                const sunriseTime = sunrise.toLocaleTimeString('sv-SE', {hour: '2-digit', minute: '2-digit'});
                updateSunTimeOptimized('sunrise-time', sunriseTime);
            }
            
            if (data.sun.sunset) {
                const sunset = new Date(data.sun.sunset);
                const sunsetTime = sunset.toLocaleTimeString('sv-SE', {hour: '2-digit', minute: '2-digit'});
                updateSunTimeOptimized('sunset-time', sunsetTime);
            }
        } catch (error) {
            console.error('❌ Fel vid parsning av soltider:', error);
        }
    }
    
}

// NETATMO RAIN PRIORITY (hero icon): the override lingers this long after the last
// measured rain, so the icon doesn't flicker between Netatmo's ~10 min updates and
// glides back to the forecast symbol once the rain has stopped.
const HERO_RAIN_HOLD_MS = 15 * 60 * 1000;
let lastHeroRain = null; // { time: epoch ms, mm: latest measured intensity }

/**
 * NETATMO RAIN PRIORITY (hero icon): effective Wsymb2 symbol for hero icon + description.
 * When the rain gauge measures rain and the forecast symbol is dry (1-7), a rain
 * symbol is shown instead. Forecast precipitation (8-27) is never overridden:
 * thunder is the more important information, and the gauge also registers
 * melting snow/sleet that SMHI classifies better.
 * @param {object} data - Complete weather data from the API
 * @returns {number} SMHI symbol, possibly replaced by a measured-rain symbol
 */
function getEffectiveWeatherSymbol(data) {
    const smhiSymbol = data.smhi?.weather_symbol;

    const rainNow = data.netatmo?.rain;
    if (typeof rainNow === 'number' && rainNow > 0) {
        lastHeroRain = { time: Date.now(), mm: rainNow };
    }

    const holdActive = lastHeroRain && (Date.now() - lastHeroRain.time) <= HERO_RAIN_HOLD_MS;
    if (!holdActive || smhiSymbol >= 8) {
        return smhiSymbol;
    }

    // Same intensity thresholds as the rain animation (calculateIntensity)
    const mm = lastHeroRain.mm;
    const rainSymbol = mm < 0.5 ? 18 : mm < 2.0 ? 19 : 20;
    console.log(`🌧️ NETATMO RAIN PRIORITY: Heroikon ${smhiSymbol} → ${rainSymbol} (${mm.toFixed(2)} mm uppmätt)`);
    return rainSymbol;
}

/**
 * NETATMO RAIN PRIORITY: Update weather effects with Netatmo priority for rain
 * @param {object} data - Complete weather data from the API
 */
function updateWeatherEffects(data) {
    if (!window.weatherEffectsManager) {
        return;
    }

    // Check whether Netatmo has rain data
    const hasNetatmoRain = data.netatmo && (
        (data.netatmo.rain_sum_1 !== null && data.netatmo.rain_sum_1 !== undefined && data.netatmo.rain_sum_1 > 0) ||
        (data.netatmo.rain !== null && data.netatmo.rain !== undefined && data.netatmo.rain > 0)
    );
    
    if (hasNetatmoRain) {
        // NETATMO RAIN PRIORITY: the Netatmo rain gauge is the source of truth
        const rainIntensity = data.netatmo.rain_sum_1 || data.netatmo.rain || 0;
        const windDirection = data.smhi?.wind_direction || 0;
        
        console.log(`🌧️ NETATMO RAIN PRIORITY: Triggat regn-effekt från Netatmo (${rainIntensity.toFixed(2)} mm)`);
        weatherEffectsManager.updateFromNetatmoRain(rainIntensity, windDirection);
    } else {
        // Fall back to SMHI for all weather types (rain, snow, sleet)
        if (data.smhi && data.smhi.weather_symbol) {
            weatherEffectsManager.updateFromSMHI(
                data.smhi.weather_symbol,
                data.smhi.precipitation || 0,
                data.smhi.wind_direction || 0
            );
        }
    }
}

/**
 * Update wind data under the provider temperature.
 * The wind is forecast data, so with Netatmo it lives in the PROGNOS column as a
 * freestanding row below the provider line. In SMHI-only mode the PROGNOS column
 * is hidden and the wind follows the temperature to the primary position,
 * inserted before the sun times.
 * @param {object} smhiData - SMHI current weather data
 */
function updateWindUnderTemp(smhiData) {
    // Remove existing wind rows from both possible hosts (mode can flip at runtime)
    document.querySelectorAll('.wind-under-temp').forEach(element => element.remove());

    // Host follows the visible column (netatmo-hidden is set by adaptTemperatureSection)
    const prognosColumn = document.querySelector('.prognos-column');
    const prognosVisible = prognosColumn && !prognosColumn.classList.contains('netatmo-hidden');
    const host = prognosVisible ? prognosColumn : document.querySelector('#netatmo-temperature-section');
    if (!host) return;

    // Add new wind data
    if (smhiData.wind_speed !== null && smhiData.wind_speed !== undefined) {
        const windKmh = smhiData.wind_speed * 3.6;
        const windData = convertWindSpeed(windKmh, dashboardState.windUnit);

        let windText = windData.value;
        let windArrowHTML = '';

        if (smhiData.wind_direction !== null && smhiData.wind_direction !== undefined) {
            const windDir = getWindDirection(smhiData.wind_direction);
            const windDegree = Math.round(smhiData.wind_direction);

            // Arrow size lives in CSS (.wind-under-temp .wi-wind): 28px in the
            // primary position (LP156WH4 visibility), smaller in the PROGNOS column
            windArrowHTML = ` <i class="wi wi-wind from-${windDegree}-deg" style="
                color: #4A9EFF;
                margin-left: 4px;
                font-family: 'weathericons', 'Weather Icons', sans-serif;
                display: inline-block;
                text-shadow: 0 0 1px currentColor;
                filter: drop-shadow(0 0 1px currentColor);
            "></i>`;
            windText += ` ${windDir}`;
        }

        // Create wind data element
        const windElement = document.createElement('div');
        windElement.className = 'wind-under-temp';

        // STEP 4: Use WeatherIconRenderer instead of WeatherIconManager
        const windIcon = WeatherIconRenderer.createIcon(windData.icon, []);
        windIcon.style.cssText = `
            color: #4A9EFF;
            font-size: 12px;
            margin-right: 4px;
            display: inline-block;
        `;

        windElement.appendChild(windIcon);
        windElement.insertAdjacentHTML('beforeend', `${windText}${windArrowHTML}`);

        if (prognosVisible) {
            host.appendChild(windElement);
        } else {
            // SMHI-only: keep the wind next to the temperature, above the sun times
            host.insertBefore(windElement, host.querySelector('.sun-times'));
        }

        console.log(`💨 Vinddata under ${prognosVisible ? 'PROGNOS' : 'primär temp (SMHI-only)'}: ${windText}`);
    }
}

/**
 * Initialize robust icons for the weather display
 */
function initializeRobustIcons() {
    console.log('🎨 FAS 3: Initialiserar graciös ikon-hantering med HUMIDITY FIX...');
    updateHumidityDisplay(t('FMT_HUMIDITY', {value: 50}));
    console.log('✅ FAS 3: Graciös ikon-hantering med HUMIDITY FIX initialiserad');
}

/**
 * Update the humidity display with an icon
 * @param {string} humidityText - Formatted humidity text
 */
function updateHumidityDisplay(humidityText) {
    const humidityElement = document.getElementById('smhi-humidity');
    if (!humidityElement) return;

    humidityElement.innerHTML = '';
    humidityElement.className = 'data-point'; // FIX: data-point instead of detail-item

    // Unified tile anatomy (see styles.css): icon column + title/value column
    const iconWrap = document.createElement('span');
    iconWrap.className = 'dp-icon';
    iconWrap.appendChild(WeatherIconRenderer.createIcon('wi-humidity', ['humidity-icon']));

    humidityElement.appendChild(iconWrap);
    humidityElement.insertAdjacentHTML('beforeend',
        `<div class="dp-info">` +
        `<div class="dp-title">${t('TITLE_HUMIDITY')}</div>` +
        `<div class="dp-value">${humidityText}</div>` +
        `</div>`);

    console.log(`💧 HUMIDITY FIX: Luftfuktighetsikon skapad: wi-humidity`);
}

console.log('✅ Current Weather View v1.1.0 laddat - ColorManager integration aktiverad!');
