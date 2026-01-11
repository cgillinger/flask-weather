/**
 * @file color-manager.js
 * @version 1.0.0
 * @lastModified 2025-01-10
 * @description Centraliserad färghantering som läser CSS-variabler från colors.css
 * @dependencies colors.css (måste laddas innan detta script)
 * @author Flask Weather Dashboard Team
 * 
 * SYFTE: Alla färgbeslut tas här - JavaScript-kod ska aldrig hårdkoda färger.
 * Detta möjliggör enkla tema-byten och centraliserad färghantering.
 */

/**
 * ColorManager - Centraliserad färghantering för hela appen
 * 
 * Läser CSS-variabler från colors.css och tillhandahåller färger baserat på:
 * - Temperatur (5-nivå termisk skala)
 * - Vindstyrka (Beaufort-skala)
 * - UV-risk (WHO/WMO-standard)
 * - Vädersymboler (färgglada ikoner)
 * - Luftkvalitet (3-nivå indikator)
 */
class ColorManager {
    
    /**
     * Läs en CSS-variabel från :root
     * @param {string} varName - Variabelnamn utan '--' prefix (t.ex. 'temp-freezing')
     * @returns {string} Färgkod (t.ex. '#3b82f6') eller tom sträng om variabeln inte finns
     */
    static getCSSVariable(varName) {
        // Lägg till '--' prefix om det saknas
        const cssVar = varName.startsWith('--') ? varName : `--${varName}`;
        
        // Läs från document root och trimma whitespace
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
     * Få färg baserat på temperatur (termisk skala)
     * @param {number} temp - Temperatur i Celsius
     * @returns {string} Hex-färgkod
     */
    static getTemperatureColor(temp) {
        if (typeof temp !== 'number' || isNaN(temp)) {
            console.warn('⚠️ ColorManager: Ogiltig temperatur:', temp);
            return this.getCSSVariable('text-primary'); // Fallback till vit
        }
        
        // Termisk färgskala: isblå → cyan → grön → gul → röd
        if (temp < 0) {
            return this.getCSSVariable('temp-freezing');  // < 0°C - Isblå
        } else if (temp < 10) {
            return this.getCSSVariable('temp-cold');      // 0-10°C - Cyan
        } else if (temp < 20) {
            return this.getCSSVariable('temp-cool');      // 10-20°C - Grön
        } else if (temp < 25) {
            return this.getCSSVariable('temp-mild');      // 20-25°C - Gul/Amber
        } else {
            return this.getCSSVariable('temp-warm');      // >25°C - Röd
        }
    }
    
    /**
     * Få färg baserat på vindstyrka (Beaufort-skala)
     * Används för att färgkoda Beaufort-ikonen, INTE vindstyrka-texten
     * @param {number} beaufortOrWindSpeed - Beaufort-nummer (0-12) eller m/s (konverteras automatiskt)
     * @param {boolean} isBeaufort - True om input är Beaufort-nummer, false om m/s (default: false)
     * @returns {string} Hex-färgkod
     */
    static getWindColor(beaufortOrWindSpeed, isBeaufort = false) {
        let beaufort;
        
        if (isBeaufort) {
            beaufort = beaufortOrWindSpeed;
        } else {
            // Konvertera m/s till Beaufort (förenklad mapping)
            const windSpeed = beaufortOrWindSpeed;
            if (windSpeed < 0.5) beaufort = 0;
            else if (windSpeed < 1.6) beaufort = 1;
            else if (windSpeed < 3.4) beaufort = 2;
            else if (windSpeed < 5.5) beaufort = 3;
            else if (windSpeed < 8.0) beaufort = 4;
            else if (windSpeed < 10.8) beaufort = 5;
            else if (windSpeed < 13.9) beaufort = 6;
            else if (windSpeed < 17.2) beaufort = 7;
            else if (windSpeed < 20.8) beaufort = 8;
            else if (windSpeed < 24.5) beaufort = 9;
            else if (windSpeed < 28.5) beaufort = 10;
            else if (windSpeed < 32.7) beaufort = 11;
            else beaufort = 12;
        }
        
        // Beaufort-färgskala: grön → gul → orange → röd
        if (beaufort <= 3) {
            return this.getCSSVariable('wind-calm');      // 0-3: Stiltje-Lätt bris
        } else if (beaufort <= 6) {
            return this.getCSSVariable('wind-moderate');  // 4-6: Måttlig-Stark bris
        } else if (beaufort <= 9) {
            return this.getCSSVariable('wind-strong');    // 7-9: Hård bris-Kuling
        } else {
            return this.getCSSVariable('wind-storm');     // 10-12: Storm-Orkan
        }
    }
    
    /**
     * Få färg baserat på UV-risk (WHO/WMO-standard)
     * @param {string} risk - UV-risknivå: 'low', 'moderate', 'high', 'very_high', 'extreme'
     * @returns {string} Hex-färgkod
     */
    static getUVColor(risk) {
        const riskLower = (risk || '').toLowerCase().replace('-', '_');
        
        const uvColorMap = {
            'low': 'uv-low',           // Grön
            'moderate': 'uv-moderate', // Gul
            'high': 'uv-high',         // Orange
            'very_high': 'uv-very-high', // Röd
            'extreme': 'uv-extreme'    // Lila
        };
        
        const cssVar = uvColorMap[riskLower];
        if (!cssVar) {
            console.warn('⚠️ ColorManager: Okänd UV-risk:', risk);
            return this.getCSSVariable('text-secondary'); // Fallback
        }
        
        return this.getCSSVariable(cssVar);
    }
    
    /**
     * Få färg baserat på SMHI vädersymbol (för färgglada ikoner)
     * @param {number} symbol - SMHI vädersymbol (1-27)
     * @returns {string} Hex-färgkod
     */
    static getWeatherIconColor(symbol) {
        const numSymbol = parseInt(symbol);
        
        if (isNaN(numSymbol) || numSymbol < 1 || numSymbol > 27) {
            console.warn('⚠️ ColorManager: Ogiltig vädersymbol:', symbol);
            return this.getCSSVariable('text-primary');
        }
        
        // SMHI-symbol mapping till färgkategorier
        if (numSymbol === 1) {
            return this.getCSSVariable('weather-sun');           // Klart sol
        } else if ([2, 3, 4].includes(numSymbol)) {
            return this.getCSSVariable('weather-partly-cloudy'); // Halvklart
        } else if ([5, 6, 7].includes(numSymbol)) {
            return this.getCSSVariable('weather-cloudy');        // Molnigt
        } else if ([8, 9, 10, 18, 19, 20].includes(numSymbol)) {
            return this.getCSSVariable('weather-rain');          // Regn
        } else if ([11, 21].includes(numSymbol)) {
            return this.getCSSVariable('weather-thunder');       // Åska
        } else if ([15, 16, 17, 25, 26, 27].includes(numSymbol)) {
            return this.getCSSVariable('weather-snow');          // Snö
        } else if ([12, 13, 14, 22, 23, 24].includes(numSymbol)) {
            return this.getCSSVariable('weather-sleet');         // Snöblandat
        }
        
        // Fallback till neutral färg
        return this.getCSSVariable('text-primary');
    }
    
    /**
     * Få färg baserat på luftkvalitetsnivå (CO2 ppm)
     * @param {string|number} level - Nivå som sträng ('good', 'moderate', 'poor') eller CO2 ppm-värde
     * @returns {string} Hex-färgkod
     */
    static getAirQualityColor(level) {
        let qualityLevel;
        
        // Om numeriskt värde (CO2 ppm), konvertera till nivå
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
            'good': 'air-good',       // Grön (< 800 ppm)
            'moderate': 'air-moderate', // Gul (800-1500 ppm)
            'poor': 'air-poor'        // Röd (> 1500 ppm)
        };
        
        const cssVar = airColorMap[qualityLevel];
        if (!cssVar) {
            console.warn('⚠️ ColorManager: Okänd luftkvalitetsnivå:', level);
            return this.getCSSVariable('air-good'); // Fallback till grön
        }
        
        return this.getCSSVariable(cssVar);
    }
    
    /**
     * Få CSS-klass för temperatur-färgkodning (används i HTML)
     * @param {number} temp - Temperatur i Celsius
     * @returns {string} CSS-klassnamn (t.ex. 'temp-freezing')
     */
    static getTemperatureClass(temp) {
        if (temp < 0) return 'temp-freezing';
        else if (temp < 10) return 'temp-cold';
        else if (temp < 20) return 'temp-cool';
        else if (temp < 25) return 'temp-mild';
        else return 'temp-warm';
    }
    
    /**
     * Få CSS-klass för vindstyrka-färgkodning (används i HTML)
     * @param {number} beaufortOrWindSpeed - Beaufort-nummer eller m/s
     * @param {boolean} isBeaufort - True om input är Beaufort-nummer
     * @returns {string} CSS-klassnamn (t.ex. 'wind-calm')
     */
    static getWindClass(beaufortOrWindSpeed, isBeaufort = false) {
        let beaufort;
        
        if (isBeaufort) {
            beaufort = beaufortOrWindSpeed;
        } else {
            const windSpeed = beaufortOrWindSpeed;
            if (windSpeed < 5.5) beaufort = 3;
            else if (windSpeed < 13.9) beaufort = 6;
            else if (windSpeed < 24.5) beaufort = 9;
            else beaufort = 12;
        }
        
        if (beaufort <= 3) return 'wind-calm';
        else if (beaufort <= 6) return 'wind-moderate';
        else if (beaufort <= 9) return 'wind-strong';
        else return 'wind-storm';
    }
}

// Exportera för testning (om ES6 modules används)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorManager;
}

// Global tillgänglighet för browser
if (typeof window !== 'undefined') {
    window.ColorManager = ColorManager;
}

console.log('✅ ColorManager v1.0.0 laddad - Centraliserad färghantering aktiverad!');
