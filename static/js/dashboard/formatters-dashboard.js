/**
 * Dashboard Formatters - STEP 1 REFACTORING
 * Basic formatting and description functions
 * Extracted from dashboard.js for modular structure
 */

// === TEMPERATURSYMBOL FORMATTING (ENDAST GRADSYMBOL) ===

function formatTemperature(temperature) {
    if (temperature === null || temperature === undefined || isNaN(temperature)) {
        return '--.-°';
    }
    return `${temperature.toFixed(1)}°`;
}

function formatTemperatureDaily(temperature) {
    if (temperature === null || temperature === undefined || isNaN(temperature)) {
        return '--°';
    }
    const roundedTemp = Math.round(temperature);
    return `${roundedTemp}°`;
}

function formatTemperatureInteger(temperature) {
    if (temperature === null || temperature === undefined || isNaN(temperature)) {
        return '--°';
    }
    return `${Math.round(temperature)}°`;
}

function getTemperatureColorClass(temperature) {
    if (temperature === null || temperature === undefined || isNaN(temperature)) {
        return '';
    }
    const roundedTemp = Math.round(temperature);
    if (roundedTemp > 25) {
        return 'temp-hot';
    }
    return '';
}

// === WEATHER AND WIND DESCRIPTIONS ===

function getWeatherDescription(symbol) {
    // LANGUAGE: texts live in static/translations/<language>.js (WEATHER_1-27)
    const numSymbol = parseInt(symbol);
    if (isNaN(numSymbol) || numSymbol < 1 || numSymbol > 27) return t('UNKNOWN');
    return t(`WEATHER_${numSymbol}`);
}

function getWindDirection(degrees) {
    if (degrees === null || degrees === undefined || isNaN(degrees)) {
        return "N/A";
    }
    
    // LANGUAGE: compass letters differ per language (sv V/O, en W/E, ...)
    const directions = t('COMPASS').split(',');
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

console.log('✅ STEG 1: Dashboard Formatters laddat - 6 funktioner extraherade!');
