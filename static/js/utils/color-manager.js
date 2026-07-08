/**
 * @file color-manager.js
 * @version 1.3.0
 * @lastModified 2025-01-11
 * @description Centralized color management that reads CSS variables from colors.css
 * @dependencies colors.css (must be loaded before this script)
 * @author Flask Weather Dashboard Team
 *
 * PURPOSE: All color decisions are made here - JavaScript code should never hardcode colors.
 * This enables easy theme switching and centralized color management.
 *
 * v1.3.0 CHANGES:
 * - New getForecastTemperatureColor() for forecasts with simplified 3-level scale
 * - Focus on readability: WHITE standard, ICE BLUE for cold (<-5°C), LIGHT RED for warmth (>25°C)
 * - getTemperatureColor() retained for Netatmo actual temp (5-level scale)
 */

/**
 * ColorManager - Centralized color management for the entire app
 *
 * Reads CSS variables from colors.css and provides colors based on:
 * - Temperature (5-level thermal scale for actual temp, 3-level for forecasts)
 * - Wind strength (SMHI Beaufort scale)
 * - UV risk (WHO/WMO standard)
 * - Weather symbols (colorful icons - consistent UV yellow for sun)
 * - Air quality (3-level indicator)
 */
class ColorManager {
    
    /**
     * Read a CSS variable from :root
     * @param {string} varName - Variable name without '--' prefix (e.g. 'temp-freezing')
     * @returns {string} Color code (e.g. '#3b82f6') or empty string if variable doesn't exist
     */
    static getCSSVariable(varName) {
        // Add '--' prefix if missing
        const cssVar = varName.startsWith('--') ? varName : `--${varName}`;

        // Read from document root and trim whitespace
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue(cssVar)
            .trim();
        
        if (!value) {
            console.warn(`⚠️ ColorManager: CSS-variabel '${cssVar}' hittades inte`);
            return '';
        }
        
        return value;
    }
    
    /**
     * Get color based on temperature (thermal scale - 5 levels)
     * USED FOR: Netatmo actual temperature (small blue number)
     *
     * @param {number} temp - Temperature in Celsius
     * @returns {string} Hex color code
     */
    static getTemperatureColor(temp) {
        if (typeof temp !== 'number' || isNaN(temp)) {
            console.warn('⚠️ ColorManager: Ogiltig temperatur:', temp);
            return this.getCSSVariable('text-primary'); // Fallback to white
        }

        // Thermal color scale: ice blue → cyan → green → yellow → red
        if (temp < 0) {
            return this.getCSSVariable('temp-freezing');  // < 0°C - Ice blue
        } else if (temp < 10) {
            return this.getCSSVariable('temp-cold');      // 0-10°C - Cyan
        } else if (temp < 20) {
            return this.getCSSVariable('temp-cool');      // 10-20°C - Green
        } else if (temp < 25) {
            return this.getCSSVariable('temp-mild');      // 20-25°C - Yellow/Amber
        } else {
            return this.getCSSVariable('temp-warm');      // >25°C - Red
        }
    }
    
    /**
     * Get color for FORECAST temperatures (simplified 3-level scale)
     * USED FOR: 12-hour forecast and 5-day forecast
     * FOCUS: Readability - WHITE standard, extreme values in color
     *
     * @param {number} temp - Temperature in Celsius
     * @returns {string} Hex color code
     *
     * COLOR SCALE (v1.3.0 - simplified for readability):
     * - < -5°C:  ICE BLUE #b3e0ff (light blue approaching white)
     * - -5 to 25°C: WHITE #ffffff (neutral, readable standard)
     * - > 25°C:  LIGHT RED #ff9999 (warm, readable)
     */
    static getForecastTemperatureColor(temp) {
        if (typeof temp !== 'number' || isNaN(temp)) {
            console.warn('⚠️ ColorManager: Ogiltig prognos-temperatur:', temp);
            return '#ffffff'; // Fallback to white
        }

        // Simplified color scale for forecasts (readability focus)
        if (temp < -5) {
            return '#b3e0ff';  // < -5°C - ICE BLUE (light blue → white)
        } else if (temp > 25) {
            return '#ff9999';  // > 25°C - LIGHT RED (readable)
        } else {
            return '#ffffff';  // -5 to 25°C - WHITE (standard)
        }
    }
    
    /**
     * Get color based on wind strength (SMHI Beaufort scale v1.2.0)
     * Follows exactly SMHI's Beaufort table boundaries for consistency between text and color
     *
     * @param {number} beaufortOrWindSpeed - Beaufort number (0-12) or m/s (converts automatically)
     * @param {boolean} isBeaufort - True if input is Beaufort number, false if m/s (default: false)
     * @returns {string} Hex color code
     *
     * SMHI-STANDARD COLOR BOUNDARIES (v1.2.0):
     * - Green:   B0-3  (0-5.4 m/s)    "Calm" → "Moderate wind"
     * - Yellow:  B4-6  (5.5-13.8 m/s) "Moderate wind" → "Fresh wind" [UV yellow #FDD835]
     * - Orange: B7-9  (13.9-24.4 m/s) "Strong wind"
     * - Red:    B10-12 (24.5+ m/s)    "Storm" → "Hurricane"
     */
    static getWindColor(beaufortOrWindSpeed, isBeaufort = false) {
        let beaufort;

        if (isBeaufort) {
            beaufort = beaufortOrWindSpeed;
        } else {
            // Convert m/s to Beaufort according to SMHI standard (exact boundaries)
            const ws = beaufortOrWindSpeed;
            
            if (ws <= 0.2) beaufort = 0;        // 0-0.2 m/s
            else if (ws <= 1.5) beaufort = 1;   // 0.3-1.5 m/s
            else if (ws <= 3.3) beaufort = 2;   // 1.6-3.3 m/s
            else if (ws <= 5.4) beaufort = 3;   // 3.4-5.4 m/s  ← Grön-gräns här!
            else if (ws <= 7.9) beaufort = 4;   // 5.5-7.9 m/s  ← Gul börjar här
            else if (ws <= 10.7) beaufort = 5;  // 8.0-10.7 m/s
            else if (ws <= 13.8) beaufort = 6;  // 10.8-13.8 m/s ← Gul-gräns här!
            else if (ws <= 17.1) beaufort = 7;  // 13.9-17.1 m/s ← Orange börjar här
            else if (ws <= 20.7) beaufort = 8;  // 17.2-20.7 m/s
            else if (ws <= 24.4) beaufort = 9;  // 20.8-24.4 m/s ← Orange-gräns här!
            else if (ws <= 28.4) beaufort = 10; // 24.5-28.4 m/s ← Röd börjar här
            else if (ws <= 32.6) beaufort = 11; // 28.5-32.6 m/s
            else beaufort = 12;                  // 32.7+ m/s
        }

        // SMHI Beaufort color scale (v1.2.0 - exact SMHI boundaries, UV yellow for moderate)
        if (beaufort <= 3) {
            return this.getCSSVariable('wind-calm');      // B0-3: Calm→Moderate (0-5.4 m/s)
        } else if (beaufort <= 6) {
            return this.getCSSVariable('wind-moderate');  // B4-6: Moderate→Fresh (5.5-13.8 m/s) [UV yellow]
        } else if (beaufort <= 9) {
            return this.getCSSVariable('wind-strong');    // B7-9: Strong wind (13.9-24.4 m/s)
        } else {
            return this.getCSSVariable('wind-storm');     // B10-12: Storm→Hurricane (24.5+ m/s)
        }
    }
    
    /**
     * Get color based on UV risk (WHO/WMO standard)
     * @param {string} risk - UV risk level: 'low', 'moderate', 'high', 'very_high', 'extreme'
     * @returns {string} Hex color code
     */
    static getUVColor(risk) {
        const riskLower = (risk || '').toLowerCase().replace('-', '_');

        const uvColorMap = {
            'low': 'uv-low',           // Green
            'moderate': 'uv-moderate', // Yellow (#FDD835)
            'high': 'uv-high',         // Orange
            'very_high': 'uv-very-high', // Red
            'extreme': 'uv-extreme'    // Purple
        };
        
        const cssVar = uvColorMap[riskLower];
        if (!cssVar) {
            console.warn('⚠️ ColorManager: Okänd UV-risk:', risk);
            return this.getCSSVariable('text-secondary'); // Fallback
        }
        
        return this.getCSSVariable(cssVar);
    }
    
    /**
     * Get color based on SMHI weather symbol (for colorful icons)
     * v1.2.0: Sun and partly-clear use UV yellow (#FDD835) for consistency
     *
     * @param {number} symbol - SMHI weather symbol (1-27)
     * @returns {string} Hex color code
     */
    static getWeatherIconColor(symbol) {
        const numSymbol = parseInt(symbol);

        if (isNaN(numSymbol) || numSymbol < 1 || numSymbol > 27) {
            console.warn('⚠️ ColorManager: Ogiltig vädersymbol:', symbol);
            return this.getCSSVariable('text-primary');
        }

        // SMHI symbol mapping to color categories (v1.2.0 - UV yellow for sun)
        if (numSymbol === 1) {
            return this.getCSSVariable('weather-sun');           // Clear sun (v1.2.0: #FDD835 UV yellow)
        } else if ([2, 3, 4].includes(numSymbol)) {
            return this.getCSSVariable('weather-partly-cloudy'); // Partly-clear (v1.2.0: #FDD835 UV yellow)
        } else if ([5, 6, 7].includes(numSymbol)) {
            return this.getCSSVariable('weather-cloudy');        // Cloudy
        } else if ([8, 9, 10, 18, 19, 20].includes(numSymbol)) {
            return this.getCSSVariable('weather-rain');          // Rain
        } else if ([11, 21].includes(numSymbol)) {
            return this.getCSSVariable('weather-thunder');       // Thunder
        } else if ([15, 16, 17, 25, 26, 27].includes(numSymbol)) {
            return this.getCSSVariable('weather-snow');          // Snow
        } else if ([12, 13, 14, 22, 23, 24].includes(numSymbol)) {
            return this.getCSSVariable('weather-sleet');         // Sleet
        }

        // Fallback to neutral color
        return this.getCSSVariable('text-primary');
    }
    
    /**
     * Get color based on air quality level (CO2 ppm)
     * @param {string|number} level - Level as string ('good', 'moderate', 'poor') or CO2 ppm value
     * @returns {string} Hex color code
     */
    static getAirQualityColor(level) {
        let qualityLevel;

        // If numeric value (CO2 ppm), convert to level
        if (typeof level === 'number') {
            if (level <= 800) {
                qualityLevel = 'good';
            } else if (level <= 1500) {
                qualityLevel = 'moderate';
            } else {
                qualityLevel = 'poor';
            }
        } else {
            qualityLevel = (level || '').toLowerCase();
        }

        const airColorMap = {
            'good': 'air-good',       // Green (< 800 ppm)
            'moderate': 'air-moderate', // Yellow (800-1500 ppm) [UV yellow #FDD835]
            'poor': 'air-poor'        // Red (> 1500 ppm)
        };
        
        const cssVar = airColorMap[qualityLevel];
        if (!cssVar) {
            console.warn('⚠️ ColorManager: Okänd luftkvalitetsnivå:', level);
            return this.getCSSVariable('air-good'); // Fallback till grön
        }
        
        return this.getCSSVariable(cssVar);
    }
    
    /**
     * Get CSS class for temperature color coding (used in HTML)
     * @param {number} temp - Temperature in Celsius
     * @returns {string} CSS class name (e.g. 'temp-freezing')
     */
    static getTemperatureClass(temp) {
        if (temp < 0) return 'temp-freezing';
        else if (temp < 10) return 'temp-cold';
        else if (temp < 20) return 'temp-cool';
        else if (temp < 25) return 'temp-mild';
        else return 'temp-warm';
    }
    
    /**
     * Get CSS class for wind strength color coding (used in HTML)
     * SMHI standard v1.2.0 with exact Beaufort boundaries
     *
     * @param {number} beaufortOrWindSpeed - Beaufort number or m/s
     * @param {boolean} isBeaufort - True if input is Beaufort number
     * @returns {string} CSS class name (e.g. 'wind-calm')
     */
    static getWindClass(beaufortOrWindSpeed, isBeaufort = false) {
        let beaufort;

        if (isBeaufort) {
            beaufort = beaufortOrWindSpeed;
        } else {
            const ws = beaufortOrWindSpeed;
            // Simplified mapping for CSS classes (use exact boundaries)
            if (ws <= 5.4) beaufort = 3;
            else if (ws <= 13.8) beaufort = 6;
            else if (ws <= 24.4) beaufort = 9;
            else beaufort = 12;
        }
        
        if (beaufort <= 3) return 'wind-calm';
        else if (beaufort <= 6) return 'wind-moderate';
        else if (beaufort <= 9) return 'wind-strong';
        else return 'wind-storm';
    }
}

// Export for testing (if ES6 modules used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorManager;
}

// Global availability for browser
if (typeof window !== 'undefined') {
    window.ColorManager = ColorManager;
}

console.log('✅ ColorManager v1.3.0 laddad - Förenklad prognos-färgskala för läsbarhet!');
