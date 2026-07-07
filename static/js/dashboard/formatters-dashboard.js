/**
 * Dashboard Formatters - STEG 1 REFAKTORERING
 * Grundläggande formatering och beskrivningsfunktioner
 * Extraherat från dashboard.js för modulär struktur
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

// === VÄDER- OCH VINDBESKRIVNINGAR ===

function getWeatherDescription(symbol) {
    // SPRÅK: texterna bor i static/translations/<språk>.js (WEATHER_1-27)
    const numSymbol = parseInt(symbol);
    if (isNaN(numSymbol) || numSymbol < 1 || numSymbol > 27) return t('UNKNOWN');
    return t(`WEATHER_${numSymbol}`);
}

function getWindDirection(degrees) {
    if (degrees === null || degrees === undefined || isNaN(degrees)) {
        return "N/A";
    }
    
    const directions = [
        "N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO",
        "S", "SSV", "SV", "VSV", "V", "VNV", "NV", "NNV"
    ];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

console.log('✅ STEG 1: Dashboard Formatters laddat - 6 funktioner extraherade!');
