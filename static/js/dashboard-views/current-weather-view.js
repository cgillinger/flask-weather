/**
 * @file current-weather-view.js
 * @version 1.1.1
 * @lastModified 2025-01-10 (v1.1.1)
 * @description Current-weather functions for main card, temperature, wind and icons
 * @dependencies ColorManager (color-manager.js), WeatherIconRenderer, FontAwesomeRenderer
 * @author Flask Weather Dashboard Team
 *
 * STEP 11 REFACTORING: Extracted from dashboard.js
 * + NETATMO RAIN PRIORITY: the Netatmo rain gauge is the source of truth for weather effects
 * v1.1.0: Integrated with ColorManager for temperature color coding
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

        // SMHI temperature
        updateElementHTML('smhi-temperature', smhi.temperature ? formatTemperature(smhi.temperature) : '--.-°');

        // Weather provider under the PROGNOS label (data_source: SMHI/YR/Open-Meteo)
        const providerEl = document.getElementById('smhi-provider');
        if (providerEl) {
            providerEl.textContent = smhi.data_source ? `(${smhi.data_source})` : '';
        }

        // SMHI weather icon
        if (smhi.weather_symbol) {
            const iconElement = document.getElementById('smhi-weather-icon');
            const isDay = isDaytime();

            if (iconElement) {
                iconElement.innerHTML = '';
                iconElement.className = 'weather-icon';

                // ICON PACK: rendered with the active pack (ui.icon_pack in config)
                const weatherIcon = WeatherIconRenderer.createWeatherIcon(smhi.weather_symbol, isDay, ['weather-main-icon']);

                // CENTRALIZED COLOR CODING v1.1.0: Use ColorManager for the main icon
                // (only affects font icons; SVG packs have their own colors)
                const iconColor = ColorManager.getWeatherIconColor(smhi.weather_symbol);
                weatherIcon.style.color = iconColor;

                iconElement.appendChild(weatherIcon);

                console.log(`🎨 Main weather icon: symbol ${smhi.weather_symbol} (${isDay ? 'dag' : 'natt'}) - color: ${iconColor}`);
                
                // NETATMO RAIN PRIORITY: WeatherEffects update with Netatmo priority
                if (window.weatherEffectsManager) {
                    try {
                        updateWeatherEffects(data);
                    } catch (error) {
                        console.warn("WeatherEffects update failed:", error);
                    }
                }
            }
            
            updateElement('smhi-description', getWeatherDescription(smhi.weather_symbol));
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

        // RAIN GAUGE: show Netatmo rain data (hides itself if no rain module exists)
        if (typeof RainDisplay !== 'undefined') {
            RainDisplay.update(netatmo);
        }

        // ENHANCED WIND DATA UNDER FAKTISK (PHASE 3: only if the section is shown)
        if (data.smhi && data.smhi.wind_speed !== null && data.smhi.wind_speed !== undefined) {
            updateWindUnderFaktisk(data.smhi);
        }
    } else {
        // PHASE 3: SMHI-ONLY MODE - fallback handling with UI adaptations
        console.log('📊 FAS 3: SMHI-only mode med UI-degradering + HUMIDITY FIX');

        // RAIN GAUGE: no Netatmo data - hide the rain panel
        if (typeof RainDisplay !== 'undefined') {
            RainDisplay.hide();
        }

        // SWAPPED: show SMHI temp in the primary (large) position
        if (data.smhi && data.smhi.temperature) {
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
 * Update wind data under the FAKTISK (actual) temperature
 * @param {object} smhiData - SMHI current weather data
 */
function updateWindUnderFaktisk(smhiData) {
    const netatmoSection = document.querySelector('#netatmo-temperature-section');
    if (!netatmoSection) return;

    // Remove existing wind data
    const existingWindElements = netatmoSection.querySelectorAll('.wind-under-faktisk');
    existingWindElements.forEach(element => element.remove());

    // PHASE 3: only add wind data if the Netatmo section is shown
    if (netatmoSection.classList.contains('netatmo-hidden')) {
        console.log('🙈 FAS 3: Vinddata skippas - FAKTISK sektion är dold');
        return;
    }

    // Add new wind data
    if (smhiData.wind_speed !== null && smhiData.wind_speed !== undefined) {
        const windKmh = smhiData.wind_speed * 3.6;
        const windData = convertWindSpeed(windKmh, dashboardState.windUnit);
        
        let windText = windData.value;
        let windArrowHTML = '';
        
        if (smhiData.wind_direction !== null && smhiData.wind_direction !== undefined) {
            const windDir = getWindDirection(smhiData.wind_direction);
            const windDegree = Math.round(smhiData.wind_direction);
            
            // ENLARGED WIND DIRECTION ARROW: 12px → 28px for LP156WH4 visibility
            windArrowHTML = ` <i class="wi wi-wind from-${windDegree}-deg" style="
                color: #4A9EFF; 
                font-size: 28px; 
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
        windElement.className = 'wind-under-faktisk';

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
        
        netatmoSection.appendChild(windElement);
        
        console.log(`💨 FÖRSTÄRKT vinddata under FAKTISK: ${windText} (pil: 28px)`);
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
    
    // STEP 4: Use WeatherIconRenderer instead of WeatherIconManager
    const humidityIcon = WeatherIconRenderer.createIcon('wi-humidity', ['pressure-icon']);
    humidityIcon.style.cssText = `
        color: #4A9EFF;
        font-size: clamp(16px, 1.6rem, 21px);
        margin-right: 7px;
        display: inline-block;
    `;
    
    humidityElement.appendChild(humidityIcon);
    humidityElement.insertAdjacentHTML('beforeend', `<span>${humidityText}</span>`);
    
    console.log(`💧 HUMIDITY FIX: Luftfuktighetsikon skapad: wi-humidity`);
}

console.log('✅ Current Weather View v1.1.0 laddat - ColorManager integration aktiverad!');
