/**
 * Fetch API Client - STEG 10 REFAKTORERING + FAS 4 UV-integration
 * API-hantering extraherat från dashboard.js
 * Hanterar datahämtning, timeout och tema-kontroll
 */

// === API CONSTANTS ===
const API_TIMEOUT = 10000; // 10 sekunder
const STALE_AFTER_FAILURES = 3; // Visa varning efter 3 misslyckade uppdateringar i rad

// Re-entransvakt: setInterval fortsätter ticka var 30:e sekund även om en
// tidigare uppdatering hängt sig - utan vakten staplas anrop på varandra
let updateInFlight = false;
let consecutiveFailures = 0;

// === CORE API FUNCTIONS ===

/**
 * Fetch med timeout och error handling
 * @param {string} url - API endpoint URL
 * @param {number} timeout - Timeout i millisekunder (default: 10000)
 * @returns {Promise<object>} JSON-respons från API
 */
async function fetchWithTimeout(url, timeout = API_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Uppdatera all väderdata från API:er + FAS 4: UV-data
 * @returns {Promise<void>}
 */
async function updateAllData() {
    if (updateInFlight) {
        console.warn('⏳ Föregående uppdatering pågår fortfarande - hoppar över denna cykel');
        return;
    }
    updateInFlight = true;

    try {
        const [currentData, forecastData, dailyData] = await Promise.all([
            fetchWithTimeout('/api/current'),
            fetchWithTimeout('/api/forecast'),
            fetchWithTimeout('/api/daily')
        ]);
        
        // FAS 2: Uppdatera Netatmo-intelligence state
        if (currentData.config) {
            dashboardState.useNetatmo = currentData.config.use_netatmo || false;
            dashboardState.config = currentData.config;
            
            if (currentData.config.wind_unit) {
                dashboardState.windUnit = currentData.config.wind_unit;
            }

            if (currentData.config.pressure_display) {
                dashboardState.pressureDisplay = currentData.config.pressure_display;
            }

            // IKONPAKET: Aktivera valt paket innan vyerna renderar ikoner
            if (window.IconRegistry && currentData.config.icon_pack) {
                IconRegistry.setActivePack(currentData.config.icon_pack);
            }

            // IKONANIMERINGAR: Sätt animeringsläge (ui.icon_animations) -
            // 'auto' ger Safari/iPad hero-only pga WebKit-prestanda
            if (window.IconRegistry && currentData.config.icon_animations) {
                IconRegistry.setAnimationMode(currentData.config.icon_animations);
            }

            console.log(`🧠 FAS 2: Netatmo-läge: ${dashboardState.useNetatmo ? 'AKTIVT' : 'INAKTIVT'}`);
        }
        
        // STEG 8: Använd Intelligent Data Source istället för lokal funktion
        updateDataAvailability(currentData);
        
        // STEG 9: Använd UI Adaptation Engine istället för lokala funktioner
        applyUIAdaptations();
        
        updateCurrentWeather(currentData);
        updateHourlyForecast(forecastData.forecast);
        updateDailyForecast(dailyData.daily_forecast);
        updateStatus(currentData.status);
        
        if (currentData.theme !== dashboardState.currentTheme) {
            updateTheme(currentData.theme);
        }
        
        // STEG 9: Använd UI Adaptation Engine istället för lokal funktion
        adaptElementVisibility();
        
        // FAS 4: Uppdatera UV-data (om UVDisplay är tillgängligt)
        if (typeof UVDisplay !== 'undefined' && UVDisplay.fetchAndUpdateUV) {
            await UVDisplay.fetchAndUpdateUV();
        }

        dashboardState.lastUpdate = new Date().toISOString();
        consecutiveFailures = 0;
        updateStaleIndicator(currentData.status);

    } catch (error) {
        console.error('❌ Fel vid datahämtning:', error);
        consecutiveFailures++;
        updateStaleIndicator(null);
        showError('Fel vid uppdatering av väderdata');
    } finally {
        updateInFlight = false;
    }
}

/**
 * Synlig staleness-indikator: kioskskärmen ska inte kunna visa timmar
 * gammal data utan att det syns. Visas efter upprepade fetch-fel eller
 * när backend själv rapporterar uppdateringsfel.
 * @param {string|null} backendStatus - Status från /api/current, null vid fetch-fel
 */
function updateStaleIndicator(backendStatus) {
    const indicator = document.getElementById('stale-indicator');
    if (!indicator) return;

    const fetchStale = consecutiveFailures >= STALE_AFTER_FAILURES;
    const backendError = typeof backendStatus === 'string' && backendStatus.startsWith('Fel');

    if (fetchStale || backendError) {
        const since = dashboardState.lastUpdate
            ? new Date(dashboardState.lastUpdate).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
            : null;
        indicator.textContent = since
            ? `⚠️ Data ej uppdaterad sedan ${since}`
            : '⚠️ Väderdata kan inte hämtas';
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

/**
 * Kontrollera tema-uppdateringar från API
 * @returns {Promise<void>}
 */
async function checkThemeUpdate() {
    try {
        const themeData = await fetchWithTimeout('/api/theme');
        
        if (themeData.theme !== dashboardState.currentTheme) {
            console.log(`🎨 Tema-ändring: ${dashboardState.currentTheme} → ${themeData.theme}`);
            updateTheme(themeData.theme);
        }
    } catch (error) {
        console.error('❌ Fel vid tema-kontroll:', error);
    }
}

console.log('✅ STEG 10: Fetch API Client laddat - 3 API-funktioner extraherade! + FAS 4: UV-integration');
