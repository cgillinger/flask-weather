/**
 * @file current-weather-view.js
 * @version 2.0.0
 * @lastModified 2026-02-11 (v2.0.0)
 * @description Nuvarande väder-funktioner med config-styrd temperatur-layout (plats-1/plats-2)
 * @dependencies ColorManager (color-manager.js), WeatherIconRenderer, FontAwesomeRenderer
 * @author Flask Weather Dashboard Team
 *
 * STEG 11 REFAKTORERING: Extraherat från dashboard.js
 * + NETATMO RAIN PRIORITY: Netatmo-regnmätare är sanningen för weather effects
 * v1.1.0: Integrerad med ColorManager för temperatur-färgkodning
 * v2.0.0: Config-styrd temperatur-layout (plats_1/plats_2) med automatisk fallback
 */

// === CURRENT WEATHER FUNCTIONS ===

/**
 * Bestäm temperatur-layout baserat på config och datatillgänglighet.
 * Returnerar vilken källa (smhi/netatmo) som ska visas på vilken plats.
 * Fallback: om plats_1-källan saknas → den andra källan tar plats_1.
 * @param {object} data - Komplett väderdata från API
 * @returns {object} { plats1: {source, temp, label}, plats2: {source, temp, label, available} }
 */
function getTemperatureLayout(data) {
    const layout = dashboardState.config?.temperature_layout || { plats_1: 'smhi', plats_2: 'netatmo' };
    const netatmoAvailable = isNetatmoAvailable() && !!data.netatmo;

    let plats1Source = layout.plats_1;
    let plats2Source = layout.plats_2;

    // Fallback: om plats_1-källan saknas, byt till den andra
    if (plats1Source === 'netatmo' && !netatmoAvailable) {
        plats1Source = 'smhi';
        plats2Source = 'netatmo';
    }

    const sourceLabels = { 'smhi': 'PROGNOS', 'netatmo': 'FAKTISK' };
    const sourceTemps = {
        'smhi': data.smhi?.temperature ?? null,
        'netatmo': data.netatmo?.temperature ?? null
    };

    const plats2Available = plats2Source === 'netatmo' ? netatmoAvailable : !!data.smhi;

    return {
        plats1: {
            source: plats1Source,
            temp: sourceTemps[plats1Source],
            label: sourceLabels[plats1Source] || 'TEMPERATUR'
        },
        plats2: {
            source: plats2Source,
            temp: sourceTemps[plats2Source],
            label: sourceLabels[plats2Source] || '',
            available: plats2Available
        }
    };
}

/**
 * Uppdatera nuvarande väder (huvudfunktion)
 * @param {object} data - Komplett väderdata från API
 */
function updateCurrentWeather(data) {
    removeWindDetailItems();

    // Beräkna config-styrd temperatur-layout
    const tempLayout = getTemperatureLayout(data);

    // PLATS 1: Primär temperatur (stor siffra)
    const plats1Element = document.getElementById('plats-1-temperature');
    const plats1Label = document.getElementById('plats-1-label');
    if (plats1Element) {
        plats1Element.innerHTML = tempLayout.plats1.temp != null
            ? formatTemperature(tempLayout.plats1.temp) : '--.-°';
        if (tempLayout.plats1.source === 'netatmo') {
            plats1Element.style.color = ColorManager.getTemperatureColor(tempLayout.plats1.temp);
        } else {
            plats1Element.style.color = '';
        }
    }
    if (plats1Label) {
        plats1Label.textContent = tempLayout.plats2.available
            ? tempLayout.plats1.label : 'TEMPERATUR';
    }

    // PLATS 2: Sekundär temperatur (liten siffra) — bara om källan är tillgänglig
    const plats2Element = document.getElementById('plats-2-temperature');
    const plats2Label = document.getElementById('plats-2-label');
    if (plats2Element && tempLayout.plats2.available) {
        const tempValue = tempLayout.plats2.temp;
        if (tempValue != null) {
            plats2Element.innerHTML = formatTemperature(tempValue);
            plats2Element.style.color = ColorManager.getTemperatureColor(tempValue);
        }
    }
    if (plats2Label && tempLayout.plats2.available) {
        plats2Label.textContent = tempLayout.plats2.label;
    }

    console.log(`🌡️ Layout: plats_1=${tempLayout.plats1.source} (${tempLayout.plats1.label}), plats_2=${tempLayout.plats2.source} (${tempLayout.plats2.available ? 'visas' : 'dold'})`);

    // SMHI Väder-ikon (oberoende av temperatur-layout)
    if (data.smhi && data.smhi.weather_symbol) {
        const iconElement = document.getElementById('smhi-weather-icon');
        const isDay = isDaytime();
        const iconName = WeatherIconRenderer.getIconName(data.smhi.weather_symbol, isDay);

        if (iconElement) {
            iconElement.innerHTML = '';
            iconElement.className = 'weather-icon';

            const weatherIcon = WeatherIconRenderer.createIcon(iconName, ['weather-main-icon']);
            const iconColor = ColorManager.getWeatherIconColor(data.smhi.weather_symbol);
            weatherIcon.style.color = iconColor;
            iconElement.appendChild(weatherIcon);

            console.log(`🎨 Main weather icon: ${iconName} for symbol ${data.smhi.weather_symbol} - color: ${iconColor}`);

            // NETATMO RAIN PRIORITY: WeatherEffects update med Netatmo-prioritering
            if (window.weatherEffectsManager) {
                try {
                    updateWeatherEffects(data);
                } catch (error) {
                    console.warn("WeatherEffects update failed:", error);
                }
            }
        }

        updateElement('smhi-description', getWeatherDescription(data.smhi.weather_symbol));
    }

    // HUMIDITY FIX: INTELLIGENT DATAHANTERING FÖR LUFTFUKTIGHET
    const humidityData = formatDataWithSource(
        data.netatmo?.humidity || data.smhi?.humidity,
        'humidity'
    );

    if (humidityData.shouldShow) {
        updateHumidityDisplay(humidityData.formatted);
        console.log(`💧 HUMIDITY FIX: ${humidityData.debug}`);
    } else {
        console.log('🙈 HUMIDITY FIX: Döljer luftfuktighet - ingen data tillgänglig');
    }

    // Netatmo-specifik data (CO2, barometer, vind) — oberoende av temperatur-layout
    if (data.netatmo && isNetatmoAvailable()) {
        const netatmo = data.netatmo;

        // CO2/Luftkvalitet
        const co2Data = formatDataWithSource(netatmo.co2, 'co2');
        if (co2Data.shouldShow) {
            const airQualityElement = document.getElementById('air-quality');
            const airQualityContainer = document.querySelector('.air-quality-container');

            if (airQualityElement && airQualityContainer && !airQualityContainer.classList.contains('netatmo-hidden')) {
                airQualityElement.textContent = co2Data.formatted;

                let iconClass = 'good';
                if (co2Data.value > 1500) {
                    iconClass = 'poor';
                } else if (co2Data.value > 800) {
                    iconClass = 'moderate';
                }

                const existingIcon = airQualityContainer.querySelector('.air-quality-fa-icon');
                if (existingIcon) {
                    existingIcon.remove();
                }

                const leafIcon = FontAwesomeRenderer.createLeafIcon(iconClass);
                airQualityContainer.insertBefore(leafIcon, airQualityElement);

                console.log(`🍃 ${co2Data.debug} - SEPARERAD FÄRGKODNING: ${iconClass}`);
            }
        }

        // BAROMETER UPDATE med smart källa
        const pressureTrend = netatmo.pressure_trend;
        const pressureData = formatDataWithSource(netatmo.pressure || data.smhi?.pressure, 'pressure');
        BarometerDisplay.updateBarometerDetail(pressureTrend, pressureData.value);

        // Vinddata under plats-2 (bara om plats-2 visas)
        if (tempLayout.plats2.available && data.smhi && data.smhi.wind_speed != null) {
            updateWindUnderPlats2(data.smhi);
        }
    } else {
        // SMHI-ONLY MODE - Fallback hantering
        console.log('📊 SMHI-only mode med UI-degradering');

        const fallbackPressureTrend = createSmhiPressureTrendFallback(data.smhi);
        const pressureData = formatDataWithSource(data.smhi?.pressure, 'pressure');
        BarometerDisplay.updateBarometerDetail(fallbackPressureTrend, pressureData.value);
    }

    // SOL-TIDER (Oförändrade)
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

    setTimeout(() => {
        removeWindDetailItems();
    }, 100);
}

/**
 * NETATMO RAIN PRIORITY: Uppdatera weather effects med Netatmo-prioritering för regn
 * @param {object} data - Komplett väderdata från API
 */
function updateWeatherEffects(data) {
    if (!window.weatherEffectsManager) {
        return;
    }
    
    // Kontrollera om Netatmo har regndata
    const hasNetatmoRain = data.netatmo && (
        (data.netatmo.rain_sum_1 !== null && data.netatmo.rain_sum_1 !== undefined && data.netatmo.rain_sum_1 > 0) ||
        (data.netatmo.rain !== null && data.netatmo.rain !== undefined && data.netatmo.rain > 0)
    );
    
    if (hasNetatmoRain) {
        // NETATMO RAIN PRIORITY: Netatmo-regnmätaren är sanningen
        const rainIntensity = data.netatmo.rain_sum_1 || data.netatmo.rain || 0;
        const windDirection = data.smhi?.wind_direction || 0;
        
        console.log(`🌧️ NETATMO RAIN PRIORITY: Triggat regn-effekt från Netatmo (${rainIntensity.toFixed(2)} mm)`);
        weatherEffectsManager.updateFromNetatmoRain(rainIntensity, windDirection);
    } else {
        // Fallback till SMHI för alla vädertyper (regn, snö, sleet)
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
 * Uppdatera vinddata under plats-2 (sekundär temperatur)
 * @param {object} smhiData - SMHI current weather data
 */
function updateWindUnderPlats2(smhiData) {
    const plats2Section = document.getElementById('plats-2-section');
    if (!plats2Section) return;

    // Ta bort befintliga vinddata
    const existingWindElements = plats2Section.querySelectorAll('.wind-under-faktisk');
    existingWindElements.forEach(element => element.remove());

    // Bara lägg till vinddata om plats-2 visas
    if (plats2Section.classList.contains('netatmo-hidden')) {
        return;
    }

    if (smhiData.wind_speed != null) {
        const windKmh = smhiData.wind_speed * 3.6;
        const windData = convertWindSpeed(windKmh, dashboardState.windUnit);

        let windText = windData.value;
        let windArrowHTML = '';

        if (smhiData.wind_direction != null) {
            const windDir = getWindDirection(smhiData.wind_direction);
            const windDegree = Math.round(smhiData.wind_direction);

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

        const windElement = document.createElement('div');
        windElement.className = 'wind-under-faktisk';

        const windIcon = WeatherIconRenderer.createIcon(windData.icon, []);
        windIcon.style.cssText = `
            color: #4A9EFF;
            font-size: 12px;
            margin-right: 4px;
            display: inline-block;
        `;

        windElement.appendChild(windIcon);
        windElement.insertAdjacentHTML('beforeend', `${windText}${windArrowHTML}`);

        plats2Section.appendChild(windElement);

        console.log(`💨 Vinddata under plats-2: ${windText}`);
    }
}

/**
 * Ta bort vinddata från weather details grid
 */
function removeWindDetailItems() {
    const weatherDetailsGrid = document.querySelector('.weather-details-grid');
    if (!weatherDetailsGrid) return;
    
    const allDetailItems = weatherDetailsGrid.querySelectorAll('.detail-item');
    
    allDetailItems.forEach(item => {
        const text = item.textContent || '';
        
        if (text.includes('m/s') || 
            text.includes('Vind') || 
            text.includes('km/h') ||
            text.includes('Beaufort') ||
            item.classList.contains('wind-detail') ||
            item.id && item.id.includes('wind')) {
            
            console.log(`🗑️ Tar bort vind detail-item: ${text}`);
            item.remove();
        }
    });
}

/**
 * Initialisera robusta ikoner för väder-visning
 */
function initializeRobustIcons() {
    console.log('🎨 FAS 3: Initialiserar graciös ikon-hantering med HUMIDITY FIX...');
    updateHumidityDisplay('50% Luftfuktighet');
    console.log('✅ FAS 3: Graciös ikon-hantering med HUMIDITY FIX initialiserad');
}

/**
 * Uppdatera luftfuktighets-visning med ikon
 * @param {string} humidityText - Formaterad luftfuktighetstext
 */
function updateHumidityDisplay(humidityText) {
    const humidityElement = document.getElementById('smhi-humidity');
    if (!humidityElement) return;
    
    humidityElement.innerHTML = '';
    humidityElement.className = 'data-point'; // FIX: data-point instead of detail-item
    
    // STEG 4: Använd WeatherIconRenderer istället för WeatherIconManager
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

console.log('✅ Current Weather View v2.0.0 laddat - Config-styrd temperatur-layout (plats_1/plats_2)!');
