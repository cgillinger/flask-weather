/**
 * @file current-weather-view.js
 * @version 1.1.1
 * @lastModified 2025-01-10 (v1.1.1)
 * @description Nuvarande väder-funktioner för huvudkort, temperatur, vind och ikoner
 * @dependencies ColorManager (color-manager.js), WeatherIconRenderer, FontAwesomeRenderer
 * @author Flask Weather Dashboard Team
 * 
 * STEG 11 REFAKTORERING: Extraherat från dashboard.js
 * + NETATMO RAIN PRIORITY: Netatmo-regnmätare är sanningen för weather effects
 * v1.1.0: Integrerad med ColorManager för temperatur-färgkodning
 */

// === CURRENT WEATHER FUNCTIONS ===

/**
 * Uppdatera nuvarande väder (huvudfunktion)
 * @param {object} data - Komplett väderdata från API
 */
function updateCurrentWeather(data) {
    // SMHI Data
    if (data.smhi) {
        const smhi = data.smhi;
        
        // SMHI Temperatur
        updateElementHTML('smhi-temperature', smhi.temperature ? formatTemperature(smhi.temperature) : '--.-°');

        // Väderleverantör under PROGNOS-etiketten (data_source: SMHI/YR/Open-Meteo)
        const providerEl = document.getElementById('smhi-provider');
        if (providerEl) {
            providerEl.textContent = smhi.data_source ? `(${smhi.data_source})` : '';
        }
        
        // SMHI Väder-ikon
        if (smhi.weather_symbol) {
            const iconElement = document.getElementById('smhi-weather-icon');
            const isDay = isDaytime();

            if (iconElement) {
                iconElement.innerHTML = '';
                iconElement.className = 'weather-icon';

                // IKONPAKET: Renderas med aktivt paket (ui.icon_pack i config)
                const weatherIcon = WeatherIconRenderer.createWeatherIcon(smhi.weather_symbol, isDay, ['weather-main-icon']);

                // CENTRALISERAD FÄRGKODNING v1.1.0: Använd ColorManager för huvudikon
                // (påverkar bara font-ikoner; SVG-paket har egna färger)
                const iconColor = ColorManager.getWeatherIconColor(smhi.weather_symbol);
                weatherIcon.style.color = iconColor;

                iconElement.appendChild(weatherIcon);

                console.log(`🎨 Main weather icon: symbol ${smhi.weather_symbol} (${isDay ? 'dag' : 'natt'}) - color: ${iconColor}`);
                
                // NETATMO RAIN PRIORITY: WeatherEffects update med Netatmo-prioritering
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
    
    // HUMIDITY FIX: INTELLIGENT DATAHANTERING FÖR LUFTFUKTIGHET
    // STEG 8: Använd Intelligent Data Source istället för lokal funktion
    const humidityData = formatDataWithSource(
        data.netatmo?.humidity || data.smhi?.humidity, 
        'humidity'
    );
    
    if (humidityData.shouldShow) {
        updateHumidityDisplay(humidityData.formatted);
        console.log(`💧 HUMIDITY FIX: ${humidityData.debug}`);
    } else {
        // HUMIDITY FIX: Dölj luftfuktighet helt när ingen data finns
        console.log('🙈 HUMIDITY FIX: Döljer luftfuktighet - ingen data tillgänglig');
        // Element döljs av adaptHumiditySection() som kallas av applyUIAdaptations()
    }
    
    // Netatmo Data (Villkorsstyrd med FAS 3 UI-anpassningar)
    if (data.netatmo && isNetatmoAvailable()) {
        const netatmo = data.netatmo;
        
        // Netatmo Faktisk Temperatur (FAS 3: Bara om sektionen visas)
        // STEG 8: Använd Intelligent Data Source istället för lokal funktion
        const tempData = formatDataWithSource(netatmo.temperature, 'temperature_actual');
        if (tempData.shouldShow) {
            const tempElement = document.getElementById('netatmo-temperature-small');
            if (tempElement && !document.querySelector('#netatmo-temperature-section.netatmo-hidden')) {
                tempElement.innerHTML = formatTemperature(tempData.value);
                
                // CENTRALISERAD FÄRGKODNING: Använd ColorManager istället för hårdkodade värden
                tempElement.style.color = ColorManager.getTemperatureColor(tempData.value);
                console.log(tempData.debug);
            }
        }
        
        // CO2/Luftkvalitet - FAS 3: Villkorsstyrd visning
        // STEG 8: Använd Intelligent Data Source istället för lokal funktion
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
                
                // STEG 5: Använd FontAwesomeRenderer istället för FontAwesomeManager
                const leafIcon = FontAwesomeRenderer.createLeafIcon(iconClass);
                airQualityContainer.insertBefore(leafIcon, airQualityElement);
                
                console.log(`🍃 ${co2Data.debug} - SEPARERAD FÄRGKODNING: ${iconClass}`);
            }
        }
        
        // BAROMETER UPDATE med smart källa
        const pressureTrend = netatmo.pressure_trend;
        // STEG 8: Använd Intelligent Data Source istället för lokal funktion
        const pressureData = formatDataWithSource(netatmo.pressure || data.smhi?.pressure, 'pressure');
        
        // STEG 7: Använd BarometerDisplay istället för BarometerManager
        BarometerDisplay.updateBarometerDetail(pressureTrend, pressureData.value);
        
        // FÖRSTÄRKT VINDDATA UNDER FAKTISK (FAS 3: Bara om sektionen visas)
        if (data.smhi && data.smhi.wind_speed !== null && data.smhi.wind_speed !== undefined) {
            updateWindUnderFaktisk(data.smhi);
        }
    } else {
        // FAS 3: SMHI-ONLY MODE - Fallback hantering med UI-anpassningar
        console.log('📊 FAS 3: SMHI-only mode med UI-degradering + HUMIDITY FIX');

        // SWAPPED: Visa SMHI-temp i den primära (stora) positionen
        if (data.smhi && data.smhi.temperature) {
            const primaryTempElement = document.getElementById('netatmo-temperature-small');
            if (primaryTempElement) {
                primaryTempElement.innerHTML = formatTemperature(data.smhi.temperature);
                primaryTempElement.style.color = ColorManager.getTemperatureColor(data.smhi.temperature);
                console.log('🌡️ SMHI-only: SMHI-temperatur visas i primär (stor) position');
            }
        }

        // Använd SMHI för barometer med fallback
        const fallbackPressureTrend = createSmhiPressureTrendFallback(data.smhi);
        const pressureData = formatDataWithSource(data.smhi?.pressure, 'pressure');

        // STEG 7: Använd BarometerDisplay istället för BarometerManager
        BarometerDisplay.updateBarometerDetail(fallbackPressureTrend, pressureData.value);

        console.log('🔄 FAS 3: Prognos-kolumn och CO2 dolda via UI-anpassningar');
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
 * Uppdatera vinddata under FAKTISK temperatur
 * @param {object} smhiData - SMHI current weather data
 */
function updateWindUnderFaktisk(smhiData) {
    const netatmoSection = document.querySelector('#netatmo-temperature-section');
    if (!netatmoSection) return;
    
    // Ta bort befintliga vinddata
    const existingWindElements = netatmoSection.querySelectorAll('.wind-under-faktisk');
    existingWindElements.forEach(element => element.remove());
    
    // FAS 3: Bara lägg till vinddata om Netatmo-sektionen visas
    if (netatmoSection.classList.contains('netatmo-hidden')) {
        console.log('🙈 FAS 3: Vinddata skippas - FAKTISK sektion är dold');
        return;
    }
    
    // Lägg till ny vinddata
    if (smhiData.wind_speed !== null && smhiData.wind_speed !== undefined) {
        const windKmh = smhiData.wind_speed * 3.6;
        const windData = convertWindSpeed(windKmh, dashboardState.windUnit);
        
        let windText = windData.value;
        let windArrowHTML = '';
        
        if (smhiData.wind_direction !== null && smhiData.wind_direction !== undefined) {
            const windDir = getWindDirection(smhiData.wind_direction);
            const windDegree = Math.round(smhiData.wind_direction);
            
            // FÖRSTÄRKT VÄDERRIKTNINGSPIL: 12px → 28px för LP156WH4-synlighet
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
        
        // Skapa vinddata-element
        const windElement = document.createElement('div');
        windElement.className = 'wind-under-faktisk';
        
        // STEG 4: Använd WeatherIconRenderer istället för WeatherIconManager
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

console.log('✅ Current Weather View v1.1.0 laddat - ColorManager integration aktiverad!');
