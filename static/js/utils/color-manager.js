/**
 * @file color-manager.js
 * @version 1.3.0
 * @lastModified 2025-01-11
 * @description Centraliserad färghantering som läser CSS-variabler från colors.css
 * @dependencies colors.css (måste laddas innan detta script)
 * @author Flask Weather Dashboard Team
 * 
 * SYFTE: Alla färgbeslut tas här - JavaScript-kod ska aldrig hårdkoda färger.
 * Detta möjliggör enkla tema-byten och centraliserad färghantering.
 * 
 * v1.3.0 ÄNDRINGAR:
 * - Ny getForecastTemperatureColor() för prognoser med förenklad 3-nivå skala
 * - Fokus på läsbarhet: VIT standard, ISBLÅ för kyla (<-5°C), LJUSRÖD för värme (>25°C)
 * - getTemperatureColor() behålls för Netatmo faktisk temp (5-nivå skala)
 */

/**
 * ColorManager - Centraliserad färghantering för hela appen
 * 
 * Läser CSS-variabler från colors.css och tillhandahåller färger baserat på:
 * - Temperatur (5-nivå termisk skala för faktisk temp, 3-nivå för prognoser)
 * - Vindstyrka (SMHI Beaufort-skala)
 * - UV-risk (WHO/WMO-standard)
 * - Vädersymboler (färgglada ikoner - konsekvent UV-gul för sol)
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
     * Få färg baserat på temperatur (termisk skala - 5 nivåer)
     * ANVÄNDS FÖR: Netatmo faktisk temperatur (liten blå siffra)
     * 
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
     * Få färg för PROGNOS-temperaturer (förenklad 3-nivå skala)
     * ANVÄNDS FÖR: 12-timmarsprognos och 5-dagarsprognos
     * FOKUS: Läsbarhet - VIT standard, extremvärden i färg
     * 
     * @param {number} temp - Temperatur i Celsius
     * @returns {string} Hex-färgkod
     * 
     * FÄRGSKALA (v1.3.0 - förenklad för läsbarhet):
     * - < -5°C:  ISBLÅ #b3e0ff (ljusblå som drar åt vitt)
     * - -5 till 25°C: VIT #ffffff (neutral, läsbar standard)
     * - > 25°C:  LJUSRÖD #ff9999 (varm, läsbar)
     */
    static getForecastTemperatureColor(temp) {
        if (typeof temp !== 'number' || isNaN(temp)) {
            console.warn('⚠️ ColorManager: Ogiltig prognos-temperatur:', temp);
            return '#ffffff'; // Fallback till vit
        }
        
        // Förenklad färgskala för prognoser (läsbarhetsfokus)
        if (temp < -5) {
            return '#b3e0ff';  // < -5°C - ISBLÅ (ljusblå → vit)
        } else if (temp > 25) {
            return '#ff9999';  // > 25°C - LJUSRÖD (läsbar)
        } else {
            return '#ffffff';  // -5 till 25°C - VIT (standard)
        }
    }
    
    /**
     * Få färg baserat på vindstyrka (SMHI Beaufort-skala v1.2.0)
     * Följer exakt SMHI:s Beaufort-tabellgränser för konsistens mellan text och färg
     * 
     * @param {number} beaufortOrWindSpeed - Beaufort-nummer (0-12) eller m/s (konverteras automatiskt)
     * @param {boolean} isBeaufort - True om input är Beaufort-nummer, false om m/s (default: false)
     * @returns {string} Hex-färgkod
     * 
     * SMHI-STANDARD FÄRGGRÄNSER (v1.2.0):
     * - Grön:   B0-3  (0-5.4 m/s)    "Lugnt" → "Måttlig vind"
     * - Gul:    B4-6  (5.5-13.8 m/s) "Måttlig vind" → "Frisk vind" [UV-gul #FDD835]
     * - Orange: B7-9  (13.9-24.4 m/s) "Hård vind"
     * - Röd:    B10-12 (24.5+ m/s)    "Storm" → "Orkan"
     */
    static getWindColor(beaufortOrWindSpeed, isBeaufort = false) {
        let beaufort;
        
        if (isBeaufort) {
            beaufort = beaufortOrWindSpeed;
        } else {
            // Konvertera m/s till Beaufort enligt SMHI-standard (exakta gränser)
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
        
        // SMHI Beaufort-färgskala (v1.2.0 - exakta SMHI-gränser, UV-gul för måttlig)
        if (beaufort <= 3) {
            return this.getCSSVariable('wind-calm');      // B0-3: Lugnt→Måttlig (0-5.4 m/s)
        } else if (beaufort <= 6) {
            return this.getCSSVariable('wind-moderate');  // B4-6: Måttlig→Frisk (5.5-13.8 m/s) [UV-gul]
        } else if (beaufort <= 9) {
            return this.getCSSVariable('wind-strong');    // B7-9: Hård vind (13.9-24.4 m/s)
        } else {
            return this.getCSSVariable('wind-storm');     // B10-12: Storm→Orkan (24.5+ m/s)
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
            'moderate': 'uv-moderate', // Gul (#FDD835)
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
     * v1.2.0: Sol och halvklart använder UV-gul (#FDD835) för konsistens
     * 
     * @param {number} symbol - SMHI vädersymbol (1-27)
     * @returns {string} Hex-färgkod
     */
    static getWeatherIconColor(symbol) {
        const numSymbol = parseInt(symbol);
        
        if (isNaN(numSymbol) || numSymbol < 1 || numSymbol > 27) {
            console.warn('⚠️ ColorManager: Ogiltig vädersymbol:', symbol);
            return this.getCSSVariable('text-primary');
        }
        
        // SMHI-symbol mapping till färgkategorier (v1.2.0 - UV-gul för sol)
        if (numSymbol === 1) {
            return this.getCSSVariable('weather-sun');           // Klart sol (v1.2.0: #FDD835 UV-gul)
        } else if ([2, 3, 4].includes(numSymbol)) {
            return this.getCSSVariable('weather-partly-cloudy'); // Halvklart (v1.2.0: #FDD835 UV-gul)
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
            'moderate': 'air-moderate', // Gul (800-1500 ppm) [UV-gul #FDD835]
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
     * SMHI-standard v1.2.0 med exakta Beaufort-gränser
     * 
     * @param {number} beaufortOrWindSpeed - Beaufort-nummer eller m/s
     * @param {boolean} isBeaufort - True om input är Beaufort-nummer
     * @returns {string} CSS-klassnamn (t.ex. 'wind-calm')
     */
    static getWindClass(beaufortOrWindSpeed, isBeaufort = false) {
        let beaufort;
        
        if (isBeaufort) {
            beaufort = beaufortOrWindSpeed;
        } else {
            const ws = beaufortOrWindSpeed;
            // Förenklad mapping för CSS-klasser (använd exakta gränser)
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

// Exportera för testning (om ES6 modules används)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorManager;
}

// Global tillgänglighet för browser
if (typeof window !== 'undefined') {
    window.ColorManager = ColorManager;
}

console.log('✅ ColorManager v1.3.0 laddad - Förenklad prognos-färgskala för läsbarhet!');
