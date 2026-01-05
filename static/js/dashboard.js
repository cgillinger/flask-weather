/**
 * Modern Weather Dashboard - Main Orchestrator
 * FAS 3: GRACIÖS UI-DEGRADERING för Netatmo-oberoende drift
 * 
 * 🎯 REFAKTORERING SLUTFÖRD: STEG 1-12 extraherade till separata moduler
 * 📊 DENNA FIL: Endast global state, initialisering och koordinering
 * 
 * IMPORTERADE MODULER:
 * - STEG 1: formatters-dashboard.js (formatTemperature, getWeatherDescription, etc.)
 * - STEG 2: wind-calculations.js (WIND_SCALES, convertWindSpeed, formatWindTextForTwoLines)
 * - STEG 3: dom-helpers.js (updateElement, updateElementHTML, updateSunTimeOptimized, isDaytime)  
 * - STEG 4: weather-icon-renderer.js (WeatherIconRenderer)
 * - STEG 5: fontawesome-renderer.js (FontAwesomeRenderer)
 * - STEG 6: circular-clock.js (CircularClock)
 * - STEG 7: barometer-display.js (BarometerDisplay)
 * - STEG 8: intelligent-data-source.js (getDataSource, formatDataWithSource, etc.)
 * - STEG 9: ui-adaptation-engine.js (applyUIAdaptations, adaptHumiditySection, etc.)
 * - STEG 10: fetch-api-client.js (fetchWithTimeout, updateAllData, checkThemeUpdate)
 * - STEG 11: current-weather-view.js (updateCurrentWeather, updateWindUnderFaktisk, etc.)
 * - STEG 12: forecast-view.js (updateHourlyForecast, createForecastCard, updateDailyForecast, createDailyForecastItem)
 */

// === GLOBAL STATE ===
let dashboardState = {
    lastUpdate: null,
    currentTheme: 'light',
    updateInterval: null,
    clockInterval: null,
    isLoading: true,
    windUnit: 'land',
    pressureDisplay: 'numeric',
    config: null,
    
    // FAS 2: Netatmo-intelligens state
    useNetatmo: true,           // Detekteras från API
    dataAvailability: {         // Spårar tillgänglig data
        netatmoTemperature: false,
        netatmoHumidity: false,
        netatmoPressure: false,
        netatmoCO2: false,
        netatmoNoise: false,
        netatmoPressureTrend: false,
        smhiHumidity: false,
        smhiPressure: false
    }
};

// === CONSTANTS ===
const UPDATE_INTERVAL = 30000; // 30 sekunder
const THEME_CHECK_INTERVAL = 60000; // 1 minut

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Weather Dashboard FAS 3: Graciös UI-degradering aktiverad med HUMIDITY FIX');
    initializeDashboard();
    startDataUpdates();
    startThemeCheck();
});

// === MAIN ORCHESTRATION FUNCTIONS ===

async function initializeDashboard() {
    try {
        console.log('📊 FAS 3: Initialiserar graciös dashboard med HUMIDITY FIX...');
        
        // STEG 11: Initialisera ikoner från current-weather-view.js
        initializeRobustIcons();
        
        // STEG 6: Initialisera cirkulär klocka från circular-clock.js  
        CircularClock.initializeCircularClock(dashboardState);
        
        // STEG 10: Uppdatera data från fetch-api-client.js
        await updateAllData();
        
        hideLoadingOverlay();
        
        // WeatherEffects initialization
        if (dashboardState.config?.weather_effects_enabled) {
            initializeWeatherEffects().catch(error => {
                console.warn("WeatherEffects initialization failed:", error);
            });
        }
        
        console.log('✅ FAS 3: Graciös Dashboard med HUMIDITY FIX initialiserat!');
    } catch (error) {
        console.error('❌ Fel vid initialisering:', error);
        showError('Kunde inte ladda väderdata');
    }
}

function startDataUpdates() {
    dashboardState.updateInterval = setInterval(async () => {
        try {
            // STEG 10: Använd updateAllData från fetch-api-client.js
            await updateAllData();
        } catch (error) {
            console.error('❌ Fel vid data-uppdatering:', error);
        }
    }, UPDATE_INTERVAL);
    
    console.log(`🔄 Data-uppdateringar startade (var ${UPDATE_INTERVAL/1000}s)`);
}

function startThemeCheck() {
    dashboardState.themeInterval = setInterval(async () => {
        try {
            // STEG 10: Använd checkThemeUpdate från fetch-api-client.js
            await checkThemeUpdate();
        } catch (error) {
            console.error('❌ Fel vid tema-kontroll:', error);
        }
    }, THEME_CHECK_INTERVAL);
}

// === UTILITY FUNCTIONS ===

function updateTheme(newTheme) {
    const body = document.body;
    body.className = body.className.replace(/theme-\w+/, `theme-${newTheme}`);
    dashboardState.currentTheme = newTheme;
    console.log(`🎨 Tema uppdaterat till: ${newTheme}`);
}

function updateStatus(statusText) {
    // STEG 3: Använd updateElement från dom-helpers.js
    updateElement('status-text', statusText || t('STATUS_UPDATED'));
}

function showError(message) {
    updateStatus(`⚠️ ${message}`);
    console.error('🔴 Frontend error:', message);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
    dashboardState.isLoading = false;
}

// === ERROR HANDLING ===

window.addEventListener('error', function(event) {
    console.error('🔴 JavaScript error:', event.error);
    showError('Ett oväntat fel inträffade');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🔴 Unhandled promise rejection:', event.reason);
    showError('Fel vid data-hämtning');
});

// === CLEANUP ===

window.addEventListener('beforeunload', function() {
    if (dashboardState.updateInterval) {
        clearInterval(dashboardState.updateInterval);
    }
    if (dashboardState.clockInterval) {
        clearInterval(dashboardState.clockInterval);
    }
    if (dashboardState.themeInterval) {
        clearInterval(dashboardState.themeInterval);
    }
});

// === 🎉 REFAKTORERING SLUTFÖRD ===
console.log('✅ FAS 3: Weather Dashboard REFAKTORERING SLUTFÖRD! 💧🎨🚀 | STEG 1-13: Alla funktioner uppdelade i 12 modulära komponenter - Dashboard.js reducerat från ~1400 till ~200 rader!');