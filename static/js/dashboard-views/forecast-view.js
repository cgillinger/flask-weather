/**
 * @file forecast-view.js
 * @version 1.2.0
 * @lastModified 2025-01-11 (v1.2.0)
 * @description Prognos-funktioner för tim- och dagsprognoser
 * @dependencies ColorManager (color-manager.js), WeatherIconRenderer, formatters-dashboard.js, wind-calculations.js
 * @author Flask Weather Dashboard Team
 * 
 * STEG 12 REFAKTORERING: Extraherat från dashboard.js
 * v1.1.0: Integrerad med ColorManager för temperatur- och ikon-färgkodning
 * v1.1.1: Vindikonsfärg nu dynamisk via ColorManager (grön/gul/orange/röd)
 * v1.1.2: Opacity borttagen från vindikoner för full färgmättnad
 * v1.2.0: Förenklad prognos-färgskala för läsbarhet (VIT standard, ISBLÅ/LJUSRÖD extremer)
 */

// === HOURLY FORECAST FUNCTIONS ===

/**
 * Uppdatera timprognos-visning
 * @param {array} forecastData - Array med timprognos-data
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
 * Skapa ett timprognos-kort
 * @param {object} forecast - Enskild timprognos-data
 * @returns {HTMLElement} Färdigt prognos-kort
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

    // POSITION 4+5 LOGIK: Visa vind ALLTID, och nederbörd UNDER om >2mm
    let windContent = '';
    let precipContent = '';

    // VIND (alltid synlig)
    if (forecast.wind_speed) {
        const windKmh = Math.round(forecast.wind_speed * 3.6);
        const windData = convertWindSpeed(windKmh, dashboardState.windUnit);
        const windColor = ColorManager.getWindColor(forecast.wind_speed);

        // Enkel enradstext — ta bara första raden (t.ex. "Måttlig")
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

    // NEDERBÖRD (bara om >2mm)
    const hasSignificantRain = forecast.precipitation && forecast.precipitation > 2;
    if (hasSignificantRain) {
        precipContent = `<div class="forecast-precipitation">
            <i class="wi wi-raindrops" style="font-size: clamp(0.8rem, 1vw, 1.3rem); color: #4fc3f7;"></i>
            <span style="font-size: clamp(0.7rem, 0.9vw, 1.1rem); font-weight: 600;">${forecast.precipitation.toFixed(1)} mm</span>
        </div>`;
    }
    
    const iconId = `forecast-icon-${Math.random().toString(36).substr(2, 9)}`;
    const tempDegree = formatTemperatureInteger(forecast.temperature);
    
    // FÖRENKLAD PROGNOS-FÄRGSKALA v1.2.0: Använd getForecastTemperatureColor för läsbarhet
    const tempColor = ColorManager.getForecastTemperatureColor(forecast.temperature);
    
    card.innerHTML = `
        <div class="forecast-time">${forecast.local_time}</div>
        <div class="forecast-icon" id="${iconId}"></div>
        <div class="forecast-temp" style="font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.4); color: ${tempColor};">${tempDegree}</div>
        ${windContent}
        ${precipContent}
    `;
    
    const iconContainer = card.querySelector(`#${iconId}`);
    
    // IKONPAKET + CENTRALISERAD FÄRGKODNING (färgen påverkar bara font-ikoner)
    const weatherIcon = WeatherIconRenderer.createWeatherIcon(forecast.weather_symbol, isDay, ['forecast-weather-icon']);
    const iconColor = ColorManager.getWeatherIconColor(forecast.weather_symbol);
    weatherIcon.style.color = iconColor;
    
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
 * Skapa en dagsprognos-rad
 * @param {object} day - Enskild dagsprognos-data
 * @returns {HTMLElement} Färdig dagsprognos-rad
 */
function createDailyForecastItem(day) {
    const item = document.createElement('div');
    item.className = 'daily-forecast-item';
    
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
        // Använd original om parsning misslyckas
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
    
    // IKONPAKET + CENTRALISERAD FÄRGKODNING (färgen påverkar bara font-ikoner)
    const weatherIcon = WeatherIconRenderer.createWeatherIcon(day.weather_symbol, true, ['daily-weather-icon']);
    const iconColor = ColorManager.getWeatherIconColor(day.weather_symbol);
    weatherIcon.style.color = iconColor;
    
    iconContainer.appendChild(weatherIcon);
    
    // FÖRENKLAD PROGNOS-FÄRGSKALA v1.2.0: Använd getForecastTemperatureColor för läsbarhet
    const tempElement = item.querySelector('.daily-temp');
    if (tempElement) {
        // Använd max-temp för färg (högsta är viktigast för läsbarhet)
        const tempColor = ColorManager.getForecastTemperatureColor(day.temp_max);
        tempElement.style.color = tempColor;
    }
    
    return item;
}

console.log('✅ Forecast View v1.2.0 laddat - Förenklad prognos-färgskala för läsbarhet!');
