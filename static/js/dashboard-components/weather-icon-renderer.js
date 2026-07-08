/**
 * @file weather-icon-renderer.js
 * @version 1.2.0
 * @lastModified 2025-01-11
 * @description Complete icon handling for Weather Icons with centralized color coding
 * @dependencies ColorManager (color-manager.js)
 * @author Flask Weather Dashboard Team
 *
 * STEP 4 REFACTORING: Extracted from dashboard.js
 * STEP 5: FontAwesome functionality moved to fontawesome-renderer.js
 * v1.2.0: Stronger snow icon (wi-snowflake-cold) for moderate/heavy snow showers and snowfall
 * v1.1.0: Integrated with ColorManager for weather icon color coding
 */

// === WEATHER ICONS SYSTEM - CENTRALIZED COLOR CODING ===

/**
 * Weather Icon Renderer for weather display with ColorManager integration
 */
class WeatherIconRenderer {
    /**
     * Create weather icon for an SMHI symbol with active icon package (ui.icon_pack).
     * This is the method views should use for weather symbol icons;
     * createIcon()/getIconName() below are font-specific building blocks.
     * @param {number} symbol - SMHI weather symbol (1-27)
     * @param {boolean} isDay - Day or night variant
     * @param {Array} extraClasses - Extra CSS classes
     * @returns {HTMLElement} Icon element (font-<i> or svg-<img>)
     */
    static createWeatherIcon(symbol, isDay = true, extraClasses = []) {
        return IconRegistry.createWeatherIcon(symbol, isDay, extraClasses);
    }

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
     * Get Weather Icons class name based on SMHI weather symbol
     * @param {number} symbol - SMHI weather symbol (1-27)
     * @param {boolean} isDay - Whether it is day or night
     * @returns {string} Weather Icons class name (e.g. 'wi-day-sunny')
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
            16: {day: "wi-snowflake-cold", night: "wi-snowflake-cold"},
            17: {day: "wi-snowflake-cold", night: "wi-snowflake-cold"},
            18: {day: "wi-day-rain", night: "wi-night-rain"},
            19: {day: "wi-rain", night: "wi-rain"},
            20: {day: "wi-rain", night: "wi-rain"},
            21: {day: "wi-thunderstorm", night: "wi-thunderstorm"},
            22: {day: "wi-day-sleet", night: "wi-night-sleet"},
            23: {day: "wi-sleet", night: "wi-sleet"},
            24: {day: "wi-sleet", night: "wi-sleet"},
            25: {day: "wi-day-snow", night: "wi-night-snow"},
            26: {day: "wi-snowflake-cold", night: "wi-snowflake-cold"},
            27: {day: "wi-snowflake-cold", night: "wi-snowflake-cold"}
        };
        
        const mapping = iconMap[numSymbol];
        if (!mapping) return "wi-na";
        
        return mapping[isDay ? 'day' : 'night'];
    }
    
    /**
     * NEW v1.1.0: Get color for weather icon via ColorManager
     * Used to directly set color on icons via JavaScript
     * @param {number} symbol - SMHI weather symbol (1-27)
     * @returns {string} Hex color code from ColorManager
     */
    static getWeatherIconColor(symbol) {
        return ColorManager.getWeatherIconColor(symbol);
    }
    
    /**
     * KEPT FOR BACKWARD COMPATIBILITY: Get CSS class for color coding
     * DEPRECATED: Still used in forecast-view.js (updated in PHASE 3D)
     * After PHASE 3D: Use getWeatherIconColor() instead
     *
     * @param {number} symbol - SMHI weather symbol (1-27)
     * @returns {string} CSS class name for color
     */
    static getColorClass(symbol) {
        const numSymbol = parseInt(symbol);
        if (isNaN(numSymbol)) return '';
        
        // NOTE: These CSS classes are defined in colors.css
        if (numSymbol === 1) return 'weather-sun-color';
        if ([2, 3, 4].includes(numSymbol)) return 'weather-partly-cloudy-color';
        if ([5, 6, 7].includes(numSymbol)) return 'weather-cloudy-color';
        if ([8, 9, 10, 18, 19, 20].includes(numSymbol)) return 'weather-rain-color';
        if ([15, 16, 17, 25, 26, 27].includes(numSymbol)) return 'weather-snow-color';
        if ([12, 13, 14, 22, 23, 24].includes(numSymbol)) return 'weather-sleet-color';
        if ([11, 21].includes(numSymbol)) return 'weather-thunder-color';
        
        return ''; // No color coding
    }
}

// Export for backward compatibility (keep old names)
const WeatherIconManager = WeatherIconRenderer;

console.log('✅ Weather Icon Renderer v1.2.0 laddat - Kraftigare snö-ikon för måttliga/kraftiga snöbyar/snöfall!');
