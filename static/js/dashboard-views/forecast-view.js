/**
 * Forecast View - STEG 12 REFAKTORERING
 * Prognos-funktioner extraherat frÃ¥n dashboard.js
 * Hanterar tim- och dagsprognoser med ikoner, temperaturer och vind
 */

// === HOURLY FORECAST FUNCTIONS ===

/**
 * Uppdatera timprognos-visning
 * @param {array} forecastData - Array med timprognos-data
 */
function updateHourlyForecast(forecastData) {
    const container = document.getElementById('hourly-forecast');
    
    if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
        container.innerHTML = '<div class="forecast-placeholder">âš ï¸ Ingen prognos tillgÃ¤nglig</div>';
        return;
    }
    
    container.innerHTML = '';
    
    forecastData.forEach(forecast => {
        const card = createForecastCard(forecast);
        container.appendChild(card);
    });
    
    console.log(`ðŸ“ˆ ${forecastData.length} timprognos-kort uppdaterade`);
}

/**
 * Skapa ett timprognos-kort
 * @param {object} forecast - Enskild timprognos-data
 * @returns {HTMLElement} FÃ¤rdigt prognos-kort
 */
function createForecastCard(forecast) {
    const card = document.createElement('div');
    
    const hour = parseInt(forecast.local_time.split(':')[0]);
    let timeClass = 'time-day';
    
    if (hour >= 6 && hour < 12) timeClass = 'time-dawn';
    else if (hour >= 12 && hour < 18) timeClass = 'time-day';
    else if (hour >= 18 && hour < 21) timeClass = 'time-evening';
    else timeClass = 'time-night';
    
    card.className = `forecast-card ${timeClass}`;
    
    const isDay = hour >= 6 && hour <= 20;
    // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
    const iconName = WeatherIconRenderer.getIconName(forecast.weather_symbol, isDay);
    
    // POSITION 4 LOGIK: Visa ANTINGEN vind ELLER nederbörd (aldrig båda)
    let position4Content = '';
    
    // Kolla om vi har betydande nederbörd (> 2mm)
    const hasSignificantRain = forecast.precipitation && forecast.precipitation > 2;
    
    if (hasSignificantRain) {
        // NEDERBÖRD > 2MM → Visa nederbörd (ersätter vind)
        position4Content = `<div class="forecast-precipitation">
            <i class="wi wi-raindrops" style="font-size: clamp(1.2rem, 1.6vw, 2rem); color: #4fc3f7;"></i>
            <span style="font-size: clamp(0.95rem, 1.3vw, 1.6rem); font-weight: 600;">${forecast.precipitation.toFixed(1)} mm</span>
        </div>`;
        /* ↑ ÄNDRA HÄR FÖR NEDERBÖRD STORLEK:
         * Text: clamp(0.95rem, 1.3vw, 1.6rem) - Samma som 5-dagars weekday
         * Ikon: clamp(1.2rem, 1.6vw, 2rem) - Lite större än text för harmoni
         * Font-weight: 600 - Samma som 5-dagars weekday
         */
    } else if (forecast.wind_speed) {
        // DEFAULT → Visa vind
        const windKmh = Math.round(forecast.wind_speed * 3.6);
        const windData = convertWindSpeed(windKmh, dashboardState.windUnit);
        
        // KONSISTENT VINDLAYOUT: Dela upp i tvÃ¥ rader
        const windLines = formatWindTextForTwoLines(windData.value);
        
        let windArrow = '';
        if (forecast.wind_direction !== null && forecast.wind_direction !== undefined) {
            const arrowRotation = forecast.wind_direction + 180;
            windArrow = `<i class="wi wi-direction-up" style="
                transform: rotate(${arrowRotation}deg); 
                color: #4A9EFF; 
                font-size: clamp(1.3rem, 1.7vw, 2rem);  
                margin-left: 3px; 
                font-family: 'weathericons', 'Weather Icons', sans-serif;
            "></i>`;
        }
        
        position4Content = `<div class="forecast-wind forecast-wind-consistent">
            <div class="forecast-wind-header">
                <i class="wi ${windData.icon}" style="font-size: clamp(1.1rem, 1.5vw, 1.8rem); opacity: 0.9; color: #4A9EFF; margin-right: 2px; font-family: 'weathericons', 'Weather Icons', sans-serif;"></i>
                ${windArrow}
            </div>
            <div class="forecast-wind-text">
                <div class="wind-line1">${windLines.line1}</div>
                <div class="wind-line2">${windLines.line2}</div>
            </div>
        </div>`;
    }
    
    const iconId = `forecast-icon-${Math.random().toString(36).substr(2, 9)}`;
    const tempDegree = formatTemperatureInteger(forecast.temperature);
    
    card.innerHTML = `
        <div class="forecast-time">${forecast.local_time}</div>
        <div class="forecast-icon" id="${iconId}"></div>
        <div class="forecast-temp" style="font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">${tempDegree}</div>
        ${position4Content}
    `;
    
    const iconContainer = card.querySelector(`#${iconId}`);
    
    // Få färgklass från WeatherIconRenderer
    const colorClass = WeatherIconRenderer.getColorClass(forecast.weather_symbol);
    
    // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
    const weatherIcon = WeatherIconRenderer.createIcon(iconName, ['forecast-weather-icon', colorClass]);
    iconContainer.appendChild(weatherIcon);
    
    return card;
}

// === DAILY FORECAST FUNCTIONS ===

/**
 * Uppdatera dagsprognos-visning
 * @param {array} dailyData - Array med dagsprognos-data
 */
function updateDailyForecast(dailyData) {
    const container = document.getElementById('daily-forecast');
    
    if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) {
        container.innerHTML = '<div class="forecast-placeholder">âš ï¸ Ingen 5-dagarsprognos tillgÃ¤nglig</div>';
        return;
    }
    
    container.innerHTML = '';
    
    // FORM: DAG NATT header borttagen - tar onÃ¶dig plats
    
    dailyData.forEach(day => {
        const item = createDailyForecastItem(day);
        container.appendChild(item);
    });
    
    console.log(`ðŸ“… ${dailyData.length} dagsprognos-rader uppdaterade`);
}

/**
 * Skapa en dagsprognos-rad
 * @param {object} day - Enskild dagsprognos-data
 * @returns {HTMLElement} FÃ¤rdig dagsprognos-rad
 */
function createDailyForecastItem(day) {
    const item = document.createElement('div');
    item.className = 'daily-forecast-item';
    
    // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
    const iconName = WeatherIconRenderer.getIconName(day.weather_symbol, true);
    
    const weekdays = {
        'Monday': 'Måndag', 'Tuesday': 'Tisdag', 'Wednesday': 'Onsdag',
        'Thursday': 'Torsdag', 'Friday': 'Fredag', 'Saturday': 'Lördag', 'Sunday': 'Söndag'
    };
    const weekdaySwedish = weekdays[day.weekday] || day.weekday;
    
    let dateDisplay = day.date;
    try {
        const dateObj = new Date(day.date);
        const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 
                       'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        dateDisplay = `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
    } catch (e) {
        // AnvÃ¤nd original om parsning misslyckas
    }
    
    const iconId = `daily-icon-${Math.random().toString(36).substr(2, 9)}`;
    
    const tempMaxFormatted = formatTemperatureDaily(day.temp_max);
    const tempMinFormatted = formatTemperatureDaily(day.temp_min);
    
    const maxTempColorClass = getTemperatureColorClass(day.temp_max);
    const minTempColorClass = getTemperatureColorClass(day.temp_min);
    const tempColorClass = maxTempColorClass || minTempColorClass;
    
    item.innerHTML = `
        <div class="daily-icon" id="${iconId}"></div>
        <div class="daily-temp ${tempColorClass}">${tempMaxFormatted}/${tempMinFormatted}</div>
        <div class="daily-weekday">${weekdaySwedish}</div>
        <div class="daily-date">${dateDisplay}</div>
    `;
    
    const iconContainer = item.querySelector(`#${iconId}`);
    // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
    const weatherIcon = WeatherIconRenderer.createIcon(iconName, ['daily-weather-icon']);
    
    // STEG 4: AnvÃ¤nd WeatherIconRenderer istÃ¤llet fÃ¶r WeatherIconManager
    const colorClass = WeatherIconRenderer.getColorClass(day.weather_symbol);
    weatherIcon.classList.add(colorClass);
    
    iconContainer.appendChild(weatherIcon);
    
    return item;
}

console.log('âœ… STEG 12: Forecast View laddat - 4 funktioner extraherade!');