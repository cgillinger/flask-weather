/**
 * Intelligent Data Source - STEG 8 REFAKTORERING
 * Intelligent datahantering extraherat från dashboard.js
 * Hanterar Netatmo/SMHI-växling, datakälla-logik och fallback-system
 */

// === INTELLIGENT DATA SOURCE SYSTEM ===

/**
 * Kontrollera om Netatmo är tillgängligt baserat på config och data
 * @returns {boolean} True om Netatmo är aktivt och tillgängligt
 */
function isNetatmoAvailable() {
    return dashboardState.useNetatmo && dashboardState.config && dashboardState.config.use_netatmo;
}

/**
 * Hämta datakälla för specifik datatyp
 * @param {string} dataType - 'temperature', 'humidity', 'pressure', 'pressure_trend', 'co2', 'noise'
 * @returns {object} { source: 'netatmo'|'smhi'|'none', available: boolean, fallback: string|null }
 */
function getDataSource(dataType) {
    const netatmoAvailable = isNetatmoAvailable();
    
    switch (dataType) {
        case 'temperature_actual':
            return {
                source: netatmoAvailable ? 'netatmo' : 'none',
                available: netatmoAvailable && dashboardState.dataAvailability.netatmoTemperature,
                fallback: null,
                description: 'Faktisk temperatur'
            };
            
        case 'humidity':
            if (netatmoAvailable && dashboardState.dataAvailability.netatmoHumidity) {
                return {
                    source: 'netatmo',
                    available: true,
                    fallback: null,
                    description: 'Luftfuktighet (Netatmo)'
                };
            } else if (dashboardState.dataAvailability.smhiHumidity) {
                return {
                    source: 'smhi',
                    available: true,
                    fallback: 'netatmo',
                    description: 'Luftfuktighet (SMHI prognos)'
                };
            }
            return { source: 'none', available: false, fallback: null, description: 'Luftfuktighet ej tillgänglig' };
            
        case 'pressure':
            if (netatmoAvailable && dashboardState.dataAvailability.netatmoPressure) {
                return {
                    source: 'netatmo',
                    available: true,
                    fallback: null,
                    description: 'Lufttryck (Netatmo)'
                };
            } else if (dashboardState.dataAvailability.smhiPressure) {
                return {
                    source: 'smhi',
                    available: true,
                    fallback: 'netatmo',
                    description: 'Lufttryck (SMHI prognos)'
                };
            }
            return { source: 'none', available: false, fallback: null, description: 'Lufttryck ej tillgängligt' };
            
        case 'pressure_trend':
            if (netatmoAvailable && dashboardState.dataAvailability.netatmoPressureTrend) {
                return {
                    source: 'netatmo',
                    available: true,
                    fallback: null,
                    description: 'Trycktrend (Netatmo historik)'
                };
            }
            return {
                source: 'smhi',
                available: true,
                fallback: 'netatmo',
                description: 'Trycktrend (SMHI prognos)'
            };
            
        case 'co2':
            return {
                source: netatmoAvailable ? 'netatmo' : 'none',
                available: netatmoAvailable && dashboardState.dataAvailability.netatmoCO2,
                fallback: null,
                description: 'Luftkvalitet (CO2)'
            };
            
        case 'noise':
            return {
                source: netatmoAvailable ? 'netatmo' : 'none',
                available: netatmoAvailable && dashboardState.dataAvailability.netatmoNoise,
                fallback: null,
                description: 'Ljudnivå'
            };
            
        default:
            return { source: 'none', available: false, fallback: null, description: 'Okänd datatyp' };
    }
}

/**
 * Formatera data med källinformation för debugging
 * @param {any} value - Datavärdet
 * @param {string} dataType - Typ av data
 * @returns {object} { value, source, formatted, debug }
 */
function formatDataWithSource(value, dataType) {
    const sourceInfo = getDataSource(dataType);
    
    if (!sourceInfo.available) {
        return {
            value: null,
            source: sourceInfo.source,
            formatted: null,
            debug: `❌ ${sourceInfo.description} - inte tillgänglig`,
            shouldShow: false
        };
    }
    
    let formatted = value;
    let shouldShow = true;
    
    // Datatyp-specifik formatering
    switch (dataType) {
        case 'humidity':
            formatted = value ? t('FMT_HUMIDITY', {value: Math.round(value)}) : null;
            break;
        case 'pressure':
            formatted = value ? `${Math.round(value)} hPa` : null;
            break;
        case 'co2':
            formatted = value ? t('FMT_AIR_QUALITY', {value: value}) : null;
            break;
        case 'noise':
            formatted = value ? t('FMT_NOISE', {value: value}) : null;
            break;
        case 'temperature_actual':
            formatted = value ? formatTemperature(value) : null;
            break;
    }
    
    if (!value && value !== 0) {
        shouldShow = false;
    }
    
    return {
        value: value,
        source: sourceInfo.source,
        formatted: formatted,
        debug: `✅ ${sourceInfo.description} - ${sourceInfo.source}`,
        shouldShow: shouldShow,
        fallback: sourceInfo.fallback
    };
}

/**
 * Uppdatera data-tillgänglighet baserat på API-respons
 * @param {object} apiData - Komplett API-respons
 */
function updateDataAvailability(apiData) {
    // Reset availability
    Object.keys(dashboardState.dataAvailability).forEach(key => {
        dashboardState.dataAvailability[key] = false;
    });
    
    // Kontrollera Netatmo-data
    if (apiData.netatmo) {
        const netatmo = apiData.netatmo;
        dashboardState.dataAvailability.netatmoTemperature = (netatmo.temperature !== null && netatmo.temperature !== undefined);
        dashboardState.dataAvailability.netatmoHumidity = (netatmo.humidity !== null && netatmo.humidity !== undefined);
        dashboardState.dataAvailability.netatmoPressure = (netatmo.pressure !== null && netatmo.pressure !== undefined);
        dashboardState.dataAvailability.netatmoCO2 = (netatmo.co2 !== null && netatmo.co2 !== undefined);
        dashboardState.dataAvailability.netatmoNoise = (netatmo.noise !== null && netatmo.noise !== undefined);
        dashboardState.dataAvailability.netatmoPressureTrend = (
            netatmo.pressure_trend && 
            netatmo.pressure_trend.trend !== 'n/a' && 
            netatmo.pressure_trend.trend !== null
        );
    }
    
    // HUMIDITY FIX: Kontrollera SMHI-data mer noggrant
    if (apiData.smhi) {
        const smhi = apiData.smhi;
        // SMHI current weather har normalt inte humidity, men vi kontrollerar ändå
        dashboardState.dataAvailability.smhiHumidity = (smhi.humidity !== null && smhi.humidity !== undefined);
        dashboardState.dataAvailability.smhiPressure = (smhi.pressure !== null && smhi.pressure !== undefined);
        
        console.log(`📊 HUMIDITY FIX: SMHI humidity tillgänglig: ${dashboardState.dataAvailability.smhiHumidity}`);
    }
    
    // Debug-loggning
    console.log('📊 FAS 2: Data-tillgänglighet uppdaterad:', dashboardState.dataAvailability);
}

/**
 * Skapa SMHI-baserad trycktrend som fallback
 * @param {object} smhiData - SMHI current weather data
 * @returns {object} Förenklad trycktrend-struktur
 */
function createSmhiPressureTrendFallback(smhiData) {
    // Förenklad trycktrend från SMHI (statisk för nu, kan förbättras med prognosdata)
    if (!smhiData || !smhiData.pressure) {
        return {
            trend: 'n/a',
            description: 'Trycktrend ej tillgänglig',
            icon: 'wi-na',
            data_hours: 0,
            pressure_change: 0,
            analysis_quality: 'poor',
            source: 'smhi_fallback'
        };
    }
    
    // Mycket förenklad "trend" baserat på absolut tryck
    const pressure = smhiData.pressure;
    let trend = 'stable';
    let description = 'Stabilt lufttryck (SMHI)';
    let icon = 'wi-minus';
    
    if (pressure > 1020) {
        trend = 'rising';
        description = 'Högtryck - stabilt väder (SMHI)';
        icon = 'wi-direction-up';
    } else if (pressure < 1000) {
        trend = 'falling';
        description = 'Lågtryck - instabilt väder (SMHI)';
        icon = 'wi-direction-down';
    }
    
    return {
        trend: trend,
        description: description,
        icon: icon,
        data_hours: 0,
        pressure_change: 0,
        analysis_quality: 'basic',
        source: 'smhi_fallback'
    };
}

console.log('✅ STEG 8: Intelligent Data Source laddat - 5 funktioner extraherade!');