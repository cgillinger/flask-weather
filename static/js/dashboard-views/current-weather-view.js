/**
 * Current Weather View - STEG 11 REFAKTORERING
 * Nuvarande vÃ¤der-funktioner extraherat frÃ¥n dashboard.js
 * Hanterar huvudkortet, temperatur, vind, luftfuktighet och ikoner
 * + NETATMO RAIN PRIORITY: Netatmo-regnmÃ¤tare Ã¤r sanningen fÃ¶r weather effects
 */

// === CURRENT WEATHER FUNCTIONS ===

/**
 * Uppdatera nuvarande vÃ¤der (huvudfunktion)
 * @param {object} data - Komplett vÃ¤derdata frÃ¥n API
 */
function updateCurrentWeather(data) {
    removeWindDetailItems();
    
    // SMHI Data
    if (data.smhi) {
        const smhi = data.smhi;
        
        // SMHI Temperatur
        updateElementHTML('smhi-temperature', smhi.temperature ? formatTemperature(smhi.temperature) : '--.-Â°');
        
        // SMHI VÃ¤der-ikon
        if (smhi.weather_symbol) {
            const iconElement = document.getElementById('smhi-weather-icon');
            const isDay = isDaytime();
            // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
            const iconName = WeatherIconRenderer.getIconName(smhi.weather_symbol, isDay);
            
            if (iconElement) {
                iconElement.innerHTML = '';
                iconElement.className = 'weather-icon';
                
                // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
                const weatherIcon = WeatherIconRenderer.createIcon(iconName, ['weather-main-icon']);
                iconElement.appendChild(weatherIcon);
                
                console.log(`ðŸŽ¨ Main weather icon: ${iconName} for symbol ${smhi.weather_symbol}`);
                
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
    
    // HUMIDITY FIX: INTELLIGENT DATAHANTERING FÃ–R LUFTFUKTIGHET
    // STEG 8: AnvÃ¤nd Intelligent Data Source istÃ¤llet fÃ¶r lokal funktion
    const humidityData = formatDataWithSource(
        data.netatmo?.humidity || data.smhi?.humidity, 
        'humidity'
    );
    
    if (humidityData.shouldShow) {
        updateHumidityDisplay(humidityData.formatted);
        console.log(`ðŸ’§ HUMIDITY FIX: ${humidityData.debug}`);
    } else {
        // HUMIDITY FIX: DÃ¶lj luftfuktighet helt nÃ¤r ingen data finns
        console.log('ðŸ™ˆ HUMIDITY FIX: DÃ¶ljer luftfuktighet - ingen data tillgÃ¤nglig');
        // Element dÃ¶ljs av adaptHumiditySection() som kallas av applyUIAdaptations()
    }
    
    // Netatmo Data (Villkorsstyrd med FAS 3 UI-anpassningar)
    if (data.netatmo && isNetatmoAvailable()) {
        const netatmo = data.netatmo;
        
        // Netatmo Faktisk Temperatur (FAS 3: Bara om sektionen visas)
        // STEG 8: AnvÃ¤nd Intelligent Data Source istÃ¤llet fÃ¶r lokal funktion
        const tempData = formatDataWithSource(netatmo.temperature, 'temperature_actual');
        if (tempData.shouldShow) {
            const tempElement = document.getElementById('netatmo-temperature-small');
            if (tempElement && !document.querySelector('#netatmo-temperature-section.netatmo-hidden')) {
                tempElement.innerHTML = formatTemperature(tempData.value);
                
                let tempColor = '#4285f4';
                if (tempData.value < 0) tempColor = '#3b82f6';
                else if (tempData.value < 10) tempColor = '#06b6d4';
                else if (tempData.value < 20) tempColor = '#10b981';
                else if (tempData.value < 25) tempColor = '#f59e0b';
                else tempColor = '#ef4444';
                
                tempElement.style.color = tempColor;
                console.log(tempData.debug);
            }
        }
        
        // CO2/Luftkvalitet - FAS 3: Villkorsstyrd visning
        // STEG 8: AnvÃ¤nd Intelligent Data Source istÃ¤llet fÃ¶r lokal funktion
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
                
                // STEG 5: AnvÃ¤nd FontAwesomeRenderer istÃ¤llet fÃ¶r FontAwesomeManager
                const leafIcon = FontAwesomeRenderer.createLeafIcon(iconClass);
                airQualityContainer.insertBefore(leafIcon, airQualityElement);
                
                console.log(`ðŸƒ ${co2Data.debug} - SEPARERAD FÃ„RGKODNING: ${iconClass}`);
            }
        }
        
        // BAROMETER UPDATE med smart kÃ¤lla
        const pressureTrend = netatmo.pressure_trend;
        // STEG 8: AnvÃ¤nd Intelligent Data Source istÃ¤llet fÃ¶r lokal funktion
        const pressureData = formatDataWithSource(netatmo.pressure || data.smhi?.pressure, 'pressure');
        
        // STEG 7: AnvÃ¤nd BarometerDisplay istÃ¤llet fÃ¶r BarometerManager
        BarometerDisplay.updateBarometerDetail(pressureTrend, pressureData.value);
        
        // FÃ–RSTÃ„RKT VINDDATA UNDER FAKTISK (FAS 3: Bara om sektionen visas)
        if (data.smhi && data.smhi.wind_speed !== null && data.smhi.wind_speed !== undefined) {
            updateWindUnderFaktisk(data.smhi);
        }
    } else {
        // FAS 3: SMHI-ONLY MODE - Fallback hantering med UI-anpassningar
        console.log('ðŸ“Š FAS 3: SMHI-only mode med UI-degradering + HUMIDITY FIX');
        
        // AnvÃ¤nd SMHI fÃ¶r barometer med fallback
        // STEG 8: AnvÃ¤nd Intelligent Data Source istÃ¤llet fÃ¶r lokal funktion
        const fallbackPressureTrend = createSmhiPressureTrendFallback(data.smhi);
        const pressureData = formatDataWithSource(data.smhi?.pressure, 'pressure');
        
        // STEG 7: AnvÃ¤nd BarometerDisplay istÃ¤llet fÃ¶r BarometerManager
        BarometerDisplay.updateBarometerDetail(fallbackPressureTrend, pressureData.value);
        
        console.log('ðŸ”„ FAS 3: FAKTISK temperatur, luftfuktighet och CO2 Ã¤r dolda via UI-anpassningar');
    }
    
    // SOL-TIDER (OfÃ¶rÃ¤ndrade)
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
            console.error('âŒ Fel vid parsning av soltider:', error);
        }
    }
    
    setTimeout(() => {
        removeWindDetailItems();
    }, 100);
}

/**
 * NETATMO RAIN PRIORITY: Uppdatera weather effects med Netatmo-prioritering fÃ¶r regn
 * @param {object} data - Komplett vÃ¤derdata frÃ¥n API
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
        // NETATMO RAIN PRIORITY: Netatmo-regnmÃ¤taren Ã¤r sanningen
        const rainIntensity = data.netatmo.rain_sum_1 || data.netatmo.rain || 0;
        const windDirection = data.smhi?.wind_direction || 0;
        
        console.log(`ðŸŒ§ï¸ NETATMO RAIN PRIORITY: Triggat regn-effekt frÃ¥n Netatmo (${rainIntensity.toFixed(2)} mm)`);
        weatherEffectsManager.updateFromNetatmoRain(rainIntensity, windDirection);
    } else {
        // Fallback till SMHI fÃ¶r alla vÃ¤dertyper (regn, snÃ¶, sleet)
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
    
    // FAS 3: Bara lÃ¤gg till vinddata om Netatmo-sektionen visas
    if (netatmoSection.classList.contains('netatmo-hidden')) {
        console.log('ðŸ™ˆ FAS 3: Vinddata skippas - FAKTISK sektion Ã¤r dold');
        return;
    }
    
    // LÃ¤gg till ny vinddata
    if (smhiData.wind_speed !== null && smhiData.wind_speed !== undefined) {
        const windKmh = smhiData.wind_speed * 3.6;
        const windData = convertWindSpeed(windKmh, dashboardState.windUnit);
        
        let windText = windData.value;
        let windArrowHTML = '';
        
        if (smhiData.wind_direction !== null && smhiData.wind_direction !== undefined) {
            const windDir = getWindDirection(smhiData.wind_direction);
            const windDegree = Math.round(smhiData.wind_direction);
            
            // FÃ–RSTÃ„RKT VÃ„DERRIKTNINGSPIL: 12px â†’ 28px fÃ¶r LP156WH4-synlighet
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
        
        // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
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
        
        console.log(`ðŸ’¨ FÃ–RSTÃ„RKT vinddata under FAKTISK: ${windText} (pil: 28px)`);
    }
}

/**
 * Ta bort vinddata frÃ¥n weather details grid
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
            
            console.log(`ðŸ—‘ï¸ Tar bort vind detail-item: ${text}`);
            item.remove();
        }
    });
}

/**
 * Initialisera robusta ikoner fÃ¶r vÃ¤der-visning
 */
function initializeRobustIcons() {
    console.log('ðŸŽ¨ FAS 3: Initialiserar graciÃ¶s ikon-hantering med HUMIDITY FIX...');
    updateHumidityDisplay('50% Luftfuktighet');
    console.log('âœ… FAS 3: GraciÃ¶s ikon-hantering med HUMIDITY FIX initialiserad');
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
    
    // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
    const humidityIcon = WeatherIconRenderer.createIcon('wi-humidity', ['pressure-icon']);
    humidityIcon.style.cssText = `
        color: #4A9EFF;
        font-size: clamp(16px, 1.6rem, 21px);
        margin-right: 7px;
        display: inline-block;
    `;
    
    humidityElement.appendChild(humidityIcon);
    humidityElement.insertAdjacentHTML('beforeend', `<span>${humidityText}</span>`);
    
    console.log(`ðŸ’§ HUMIDITY FIX: Luftfuktighetsikon skapad: wi-humidity`);
}

console.log('âœ… STEG 11: Current Weather View laddat - 6 funktioner (+ NETATMO RAIN PRIORITY)!');
