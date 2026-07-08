/**
 * Wind Calculations - STEP 2 REFACTORING
 * Wind system and scale conversion extracted from dashboard.js
 * Handles Beaufort, sea and land wind scales and layout formatting
 */

// === WIND SCALE CONVERSION SYSTEM ===

// LANGUAGE: value/name are translation keys (static/translations/) and
// translated with t() in convertWindSpeed - sole accessor to the tables
const WIND_SCALES = {
    beaufort: [
        { max: 1, value: 0, name: 'WIND_BEAUFORT_CALM', icon: 'wi-wind-beaufort-0' },
        { max: 5, value: 1, name: 'WIND_LAND_WEAK', icon: 'wi-wind-beaufort-1' },
        { max: 11, value: 2, name: 'WIND_LAND_WEAK', icon: 'wi-wind-beaufort-2' },
        { max: 19, value: 3, name: 'WIND_LAND_MODERATE', icon: 'wi-wind-beaufort-3' },
        { max: 28, value: 4, name: 'WIND_LAND_MODERATE', icon: 'wi-wind-beaufort-4' },
        { max: 38, value: 5, name: 'WIND_LAND_FRESH', icon: 'wi-wind-beaufort-5' },
        { max: 49, value: 6, name: 'WIND_LAND_FRESH', icon: 'wi-wind-beaufort-6' },
        { max: 61, value: 7, name: 'WIND_LAND_STRONG', icon: 'wi-wind-beaufort-7' },
        { max: 74, value: 8, name: 'WIND_LAND_STRONG', icon: 'wi-wind-beaufort-8' },
        { max: 88, value: 9, name: 'WIND_LAND_STRONG', icon: 'wi-wind-beaufort-9' },
        { max: 102, value: 10, name: 'WIND_LAND_STORM', icon: 'wi-wind-beaufort-10' },
        { max: 117, value: 11, name: 'WIND_LAND_STORM', icon: 'wi-wind-beaufort-11' },
        { max: Infinity, value: 12, name: 'WIND_LAND_HURRICANE', icon: 'wi-wind-beaufort-12' }
    ],
    sjo: [
        { max: 1, value: 'WIND_SEA_CALM', icon: 'wi-strong-wind' },
        { max: 5, value: 'WIND_SEA_BREEZE', icon: 'wi-strong-wind' },
        { max: 11, value: 'WIND_SEA_BREEZE', icon: 'wi-strong-wind' },
        { max: 19, value: 'WIND_SEA_BREEZE', icon: 'wi-strong-wind' },
        { max: 28, value: 'WIND_SEA_BREEZE', icon: 'wi-strong-wind' },
        { max: 38, value: 'WIND_SEA_BREEZE', icon: 'wi-strong-wind' },
        { max: 49, value: 'WIND_SEA_BREEZE', icon: 'wi-strong-wind' },
        { max: 61, value: 'WIND_SEA_GALE', icon: 'wi-strong-wind' },
        { max: 74, value: 'WIND_SEA_GALE', icon: 'wi-strong-wind' },
        { max: 88, value: 'WIND_SEA_GALE', icon: 'wi-strong-wind' },
        { max: 102, value: 'WIND_SEA_STORM', icon: 'wi-strong-wind' },
        { max: 117, value: 'WIND_SEA_STORM', icon: 'wi-strong-wind' },
        { max: Infinity, value: 'WIND_SEA_HURRICANE', icon: 'wi-strong-wind' }
    ],
    land: [
        { max: 1, value: 'WIND_LAND_CALM', icon: 'wi-strong-wind' },
        { max: 5, value: 'WIND_LAND_WEAK', icon: 'wi-strong-wind' },
        { max: 11, value: 'WIND_LAND_WEAK', icon: 'wi-strong-wind' },
        { max: 19, value: 'WIND_LAND_MODERATE', icon: 'wi-strong-wind' },
        { max: 28, value: 'WIND_LAND_MODERATE', icon: 'wi-strong-wind' },
        { max: 38, value: 'WIND_LAND_FRESH', icon: 'wi-strong-wind' },
        { max: 49, value: 'WIND_LAND_FRESH', icon: 'wi-strong-wind' },
        { max: 61, value: 'WIND_LAND_STRONG', icon: 'wi-strong-wind' },
        { max: 74, value: 'WIND_LAND_STRONG', icon: 'wi-strong-wind' },
        { max: 88, value: 'WIND_LAND_STRONG', icon: 'wi-strong-wind' },
        { max: 102, value: 'WIND_LAND_STORM', icon: 'wi-strong-wind' },
        { max: 117, value: 'WIND_LAND_STORM', icon: 'wi-strong-wind' },
        { max: Infinity, value: 'WIND_LAND_HURRICANE', icon: 'wi-strong-wind' }
    ]
};

/**
 * Convert wind speed between different units and scales
 * @param {number} speedKmh - Wind speed in km/h
 * @param {string} targetUnit - Target unit: 'beaufort', 'ms', 'kmh', 'sjo', 'land'
 * @returns {object} { value, unit, icon, name? }
 */
function convertWindSpeed(speedKmh, targetUnit) {
    if (!speedKmh || speedKmh === 0) {
        const defaultIcon = targetUnit === 'beaufort' ? 'wi-wind-beaufort-0' : 'wi-strong-wind';
        return { value: '0', unit: targetUnit, icon: defaultIcon };
    }
    
    const scale = WIND_SCALES[targetUnit] || WIND_SCALES.land;
    const data = scale.find(scale => speedKmh <= scale.max);
    
    switch (targetUnit) {
        case 'beaufort':
            return {
                value: data.value.toString(),
                unit: 'Beaufort',
                icon: data.icon,
                name: t(data.name)
            };
        case 'ms':
            const ms = (speedKmh / 3.6).toFixed(1);
            return { value: `${ms} m/s`, unit: 'm/s', icon: 'wi-strong-wind' };
        case 'kmh':
            return { value: `${Math.round(speedKmh)} km/h`, unit: 'km/h', icon: 'wi-strong-wind' };
        default:
            // 'land'/'sjo': value is a translation key
            return { value: t(data.value), unit: targetUnit, icon: 'wi-strong-wind' };
    }
}

/**
 * SMART WIND TEXT FORMATTING FOR CONSISTENT LAYOUT
 * Split wind text into two rows for consistent layout in forecasts
 * @param {string} windText - Wind text to split
 * @returns {object} { line1: string, line2: string }
 */
function formatWindTextForTwoLines(windText) {
    if (!windText || windText === '0') {
        return { line1: t('WIND_LAND_CALM'), line2: '' };
    }
    
    // Split compound wind terms
    const windParts = windText.trim().split(' ');

    if (windParts.length === 1) {
        // Simple terms: "Storm", "Hurricane", "Calm"
        return { line1: windParts[0], line2: '' };
    } else if (windParts.length === 2) {
        // Compound terms: "Moderate wind", "Weak wind", "Fresh wind"
        return { line1: windParts[0], line2: windParts[1] };
    } else {
        // Fallback for unusual cases
        return { line1: windParts[0], line2: windParts.slice(1).join(' ') };
    }
}

console.log('✅ STEP 2: Wind Calculations loaded - 3 functions extracted!');