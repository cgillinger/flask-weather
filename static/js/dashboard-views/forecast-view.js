/**
 * @file forecast-view.js
 * @version 1.2.0
 * @lastModified 2025-01-11 (v1.2.0)
 * @description Forecast functions for hourly and daily forecasts
 * @dependencies ColorManager (color-manager.js), WeatherIconRenderer, formatters-dashboard.js, wind-calculations.js
 * @author Flask Weather Dashboard Team
 *
 * STEP 12 REFACTORING: Extracted from dashboard.js
 * v1.1.0: Integrated with ColorManager for temperature and icon color coding
 * v1.1.1: Wind icon color now dynamic via ColorManager (green/yellow/orange/red)
 * v1.1.2: Opacity removed from wind icons for full color saturation
 * v1.2.0: Simplified forecast color scale for readability (WHITE default, ICE BLUE/LIGHT RED extremes)
 */

// === HOURLY FORECAST FUNCTIONS ===

/**
 * Update hourly forecast display
 * @param {array} forecastData - Array with hourly forecast data
 */
function updateHourlyForecast(forecastData) {
    const container = document.getElementById('hourly-forecast');
    
    if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
        container.innerHTML = '<div class="forecast-placeholder">⚠️ Ingen prognos tillgänglig</div>';
        return;
    }
    
    container.innerHTML = '';
    
    forecastData.forEach(forecast => {
        const card = createForecastCard(forecast);
        container.appendChild(card);
    });
    
    console.log(`📈 ${forecastData.length} timprognos-kort uppdaterade`);
}

/**
 * Create an hourly forecast card
 * @param {object} forecast - Single hourly forecast data
 * @returns {HTMLElement} Ready forecast card
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

    // POSITION 4+5 LOGIC: Show wind ALWAYS, and precipitation BELOW if >2mm
    let windContent = '';
    let precipContent = '';

    // WIND (always visible)
    if (forecast.wind_speed) {
        const windKmh = Math.round(forecast.wind_speed * 3.6);
        const windData = convertWindSpeed(windKmh, dashboardState.windUnit);
        const windColor = ColorManager.getWindColor(forecast.wind_speed);

        // Simple single-line text — take only first line (e.g. "Moderate")
        const windLines = formatWindTextForTwoLines(windData.value);
        const windLabel = windLines.line1;

        let windArrow = '';
        if (forecast.wind_direction !== null && forecast.wind_direction !== undefined) {
            const arrowRotation = forecast.wind_direction + 180;
            windArrow = `<i class="wi wi-direction-up" style="
                transform: rotate(${arrowRotation}deg);
                color: ${windColor};
                font-size: clamp(1rem, 1.3vw, 1.6rem);
                font-family: 'weathericons', 'Weather Icons', sans-serif;
            "></i>`;
        }

        windContent = `<div class="forecast-wind forecast-wind-consistent">
            <div class="forecast-wind-header">
                <i class="wi ${windData.icon}" style="font-size: clamp(1rem, 1.3vw, 1.6rem); color: ${windColor}; font-family: 'weathericons', 'Weather Icons', sans-serif;"></i>
                ${windArrow}
            </div>
            <span class="forecast-wind-text">${windLabel}</span>
        </div>`;
    }

    // PRECIPITATION (only if >2mm)
    const hasSignificantRain = forecast.precipitation && forecast.precipitation > 2;
    if (hasSignificantRain) {
        precipContent = `<div class="forecast-precipitation">
            <i class="wi wi-raindrops" style="font-size: clamp(0.8rem, 1vw, 1.3rem); color: #4fc3f7;"></i>
            <span style="font-size: clamp(0.7rem, 0.9vw, 1.1rem); font-weight: 600;">${forecast.precipitation.toFixed(1)} mm</span>
        </div>`;
    }
    
    const iconId = `forecast-icon-${Math.random().toString(36).substr(2, 9)}`;
    const tempDegree = formatTemperatureInteger(forecast.temperature);
    
    // SIMPLIFIED FORECAST COLOR SCALE v1.2.0: Use getForecastTemperatureColor for readability
    const tempColor = ColorManager.getForecastTemperatureColor(forecast.temperature);

    card.innerHTML = `
        <div class="forecast-time">${forecast.local_time}</div>
        <div class="forecast-icon" id="${iconId}"></div>
        <div class="forecast-temp" style="font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.4); color: ${tempColor};">${tempDegree}</div>
        ${windContent}
        ${precipContent}
    `;

    const iconContainer = card.querySelector(`#${iconId}`);

    // ICON PACK + CENTRALIZED COLOR CODING (color affects only font icons)
    const weatherIcon = WeatherIconRenderer.createWeatherIcon(forecast.weather_symbol, isDay, ['forecast-weather-icon']);
    const iconColor = ColorManager.getWeatherIconColor(forecast.weather_symbol);
    weatherIcon.style.color = iconColor;
    
    iconContainer.appendChild(weatherIcon);
    
    return card;
}

// === DAILY FORECAST FUNCTIONS ===

/**
 * Update daily forecast display
 * @param {array} dailyData - Array with daily forecast data
 */
function updateDailyForecast(dailyData) {
    const container = document.getElementById('daily-forecast');
    
    if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) {
        container.innerHTML = '<div class="forecast-placeholder">⚠️ Ingen 5-dagarsprognos tillgänglig</div>';
        return;
    }
    
    container.innerHTML = '';
    
    dailyData.forEach(day => {
        const item = createDailyForecastItem(day);
        container.appendChild(item);
    });
    
    console.log(`📅 ${dailyData.length} dagsprognos-rader uppdaterade`);
}

/**
 * Create a daily forecast row
 * @param {object} day - Single daily forecast data
 * @returns {HTMLElement} Ready daily forecast row
 */
function createDailyForecastItem(day) {
    const item = document.createElement('div');
    item.className = 'daily-forecast-item';
    
    // LANGUAGE: day of week via Intl from ISO date (capital initial as before)
    let weekdaySwedish = day.weekday;
    if (day.date) {
        const wd = new Date(`${day.date}T12:00:00`).toLocaleDateString(I18n.locale(), { weekday: 'long' });
        weekdaySwedish = wd.charAt(0).toUpperCase() + wd.slice(1);
    }
    
    let dateDisplay = day.date;
    try {
        const dateObj = new Date(day.date);
        // LANGUAGE: month abbreviation via Intl with active language's locale
        const monthShort = dateObj.toLocaleDateString(I18n.locale(), { month: 'short' }).replace('.', '');
        dateDisplay = `${dateObj.getDate()} ${monthShort}`;
    } catch (e) {
        // Use original if parsing fails
    }
    
    const iconId = `daily-icon-${Math.random().toString(36).substr(2, 9)}`;

    const tempMaxFormatted = formatTemperatureDaily(day.temp_max);
    const tempMinFormatted = formatTemperatureDaily(day.temp_min);

    item.innerHTML = `
        <div class="daily-icon" id="${iconId}"></div>
        <div class="daily-temp">${tempMaxFormatted}/${tempMinFormatted}</div>
        <div class="daily-weekday">${weekdaySwedish}</div>
        <div class="daily-date">${dateDisplay}</div>
    `;

    const iconContainer = item.querySelector(`#${iconId}`);

    // ICON PACK + CENTRALIZED COLOR CODING (color affects only font icons)
    const weatherIcon = WeatherIconRenderer.createWeatherIcon(day.weather_symbol, true, ['daily-weather-icon']);
    const iconColor = ColorManager.getWeatherIconColor(day.weather_symbol);
    weatherIcon.style.color = iconColor;
    
    iconContainer.appendChild(weatherIcon);
    
    // SIMPLIFIED FORECAST COLOR SCALE v1.2.0: Use getForecastTemperatureColor for readability
    const tempElement = item.querySelector('.daily-temp');
    if (tempElement) {
        // Use max-temp for color (highest is most important for readability)
        const tempColor = ColorManager.getForecastTemperatureColor(day.temp_max);
        tempElement.style.color = tempColor;
    }
    
    return item;
}

console.log('✅ Forecast View v1.2.0 loaded - Simplified forecast color scale for readability!');
