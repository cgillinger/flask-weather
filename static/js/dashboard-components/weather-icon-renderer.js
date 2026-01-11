/**
 * @file weather-icon-renderer.js
 * @version 1.1.0
 * @lastModified 2025-01-10
 * @description Komplett ikonhantering för Weather Icons med centraliserad färgkodning
 * @dependencies ColorManager (color-manager.js)
 * @author Flask Weather Dashboard Team
 * 
 * STEG 4 REFAKTORERING: Extraherat från dashboard.js
 * STEG 5: FontAwesome-funktionalitet flyttad till fontawesome-renderer.js
 * v1.1.0: Integrerad med ColorManager för väderikon-färgkodning
 */

// === WEATHER ICONS SYSTEM - CENTRALISERAD FÄRGKODNING ===

/**
 * Weather Icon Renderer för vädervisning med ColorManager-integration
 */
class WeatherIconRenderer {
    /**
     * Skapa Weather Icons ikon-element
     * @param {string} iconName - Weather Icons klassnamn (t.ex. 'wi-day-sunny')
     * @param {Array} extraClasses - Extra CSS-klasser att applicera
     * @returns {HTMLElement} Weather Icons ikon-element
     */
    static createIcon(iconName, extraClasses = []) {
        const icon = document.createElement('i');
        const validIconClass = iconName.startsWith('wi-') ? iconName : `wi-${iconName}`;
        
        icon.className = `wi ${validIconClass} ${extraClasses.join(' ')}`;
        icon.style.fontFamily = '"weathericons", "Weather Icons", sans-serif';
        icon.style.fontStyle = 'normal';
        icon.style.fontWeight = 'normal';
        icon.style.display = 'inline-block';
        
        return icon;
    }
    
    /**
     * Få Weather Icons klassnamn baserat på SMHI vädersymbol
     * @param {number} symbol - SMHI vädersymbol (1-27)
     * @param {boolean} isDay - Om det är dag eller natt
     * @returns {string} Weather Icons klassnamn (t.ex. 'wi-day-sunny')
     */
    static getIconName(symbol, isDay = true) {
        const numSymbol = parseInt(symbol);
        if (isNaN(numSymbol)) return "wi-na";
        
        const iconMap = {
            1: {day: "wi-day-sunny", night: "wi-night-clear"},
            2: {day: "wi-day-sunny-overcast", night: "wi-night-partly-cloudy"},
            3: {day: "wi-day-cloudy", night: "wi-night-alt-cloudy"},
            4: {day: "wi-day-cloudy-high", night: "wi-night-cloudy-high"},
            5: {day: "wi-cloudy", night: "wi-cloudy"},
            6: {day: "wi-cloud", night: "wi-cloud"},
            7: {day: "wi-fog", night: "wi-fog"},
            8: {day: "wi-day-showers", night: "wi-night-showers"},
            9: {day: "wi-day-rain", night: "wi-night-rain"},
            10: {day: "wi-rain", night: "wi-rain"},
            11: {day: "wi-day-thunderstorm", night: "wi-night-thunderstorm"},
            12: {day: "wi-day-rain-mix", night: "wi-night-rain-mix"},
            13: {day: "wi-rain-mix", night: "wi-rain-mix"},
            14: {day: "wi-rain-mix", night: "wi-rain-mix"},
            15: {day: "wi-day-snow", night: "wi-night-snow"},
            16: {day: "wi-snow", night: "wi-snow"},
            17: {day: "wi-snow", night: "wi-snow"},
            18: {day: "wi-day-rain", night: "wi-night-rain"},
            19: {day: "wi-rain", night: "wi-rain"},
            20: {day: "wi-rain", night: "wi-rain"},
            21: {day: "wi-thunderstorm", night: "wi-thunderstorm"},
            22: {day: "wi-day-sleet", night: "wi-night-sleet"},
            23: {day: "wi-sleet", night: "wi-sleet"},
            24: {day: "wi-sleet", night: "wi-sleet"},
            25: {day: "wi-day-snow", night: "wi-night-snow"},
            26: {day: "wi-snow", night: "wi-snow"},
            27: {day: "wi-snow", night: "wi-snow"}
        };
        
        const mapping = iconMap[numSymbol];
        if (!mapping) return "wi-na";
        
        return mapping[isDay ? 'day' : 'night'];
    }
    
    /**
     * NYTT v1.1.0: Få färg för väderikon via ColorManager
     * Används för att direkt sätta färg på ikoner via JavaScript
     * @param {number} symbol - SMHI vädersymbol (1-27)
     * @returns {string} Hex-färgkod från ColorManager
     */
    static getWeatherIconColor(symbol) {
        return ColorManager.getWeatherIconColor(symbol);
    }
    
    /**
     * BEHÅLLS FÖR BACKWARD COMPATIBILITY: Få CSS-klass för färgkodning
     * DEPRECATED: Används fortfarande i forecast-view.js (uppdateras i FAS 3D)
     * Efter FAS 3D: Använd getWeatherIconColor() istället
     * 
     * @param {number} symbol - SMHI vädersymbol (1-27)
     * @returns {string} CSS-klassnamn för färg
     */
    static getColorClass(symbol) {
        const numSymbol = parseInt(symbol);
        if (isNaN(numSymbol)) return '';
        
        // NOTERA: Dessa CSS-klasser definieras i colors.css
        if (numSymbol === 1) return 'weather-sun-color';
        if ([2, 3, 4].includes(numSymbol)) return 'weather-partly-cloudy-color';
        if ([5, 6, 7].includes(numSymbol)) return 'weather-cloudy-color';
        if ([8, 9, 10, 18, 19, 20].includes(numSymbol)) return 'weather-rain-color';
        if ([15, 16, 17, 25, 26, 27].includes(numSymbol)) return 'weather-snow-color';
        if ([12, 13, 14, 22, 23, 24].includes(numSymbol)) return 'weather-sleet-color';
        if ([11, 21].includes(numSymbol)) return 'weather-thunder-color';
        
        return ''; // Ingen färgkodning
    }
}

// Exportera för backward compatibility (behåll gamla namn)
const WeatherIconManager = WeatherIconRenderer;

console.log('✅ Weather Icon Renderer v1.1.0 laddat - ColorManager integration aktiverad!');
