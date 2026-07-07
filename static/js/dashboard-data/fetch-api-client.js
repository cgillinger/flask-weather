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
            // SPRÅK: sätt aktivt språk INNAN vyerna renderar (ui.language)
            if (window.I18n && currentData.config.language) {
                I18n.setLanguage(currentData.config.language);
            }

            dashboardState.useNetatmo = currentData.config.use_netatmo || false;
            dashboardState.config = currentData.config;
            
            if (currentData.config.wind_unit) {
                dashboardState.windUnit = currentData.config.wind_unit;
            }

            if (currentData.config.pressure_display) {
                dashboardState.pressureDisplay = currentData.config.pressure_display;
            }

            // IKONPAKET: Aktivera valt paket innan vyerna renderar ikoner.
            // Med rotation aktiv (ui.icon_pack_rotation) väljs paketet
            // deterministiskt ur datumet - omvärderas varje pollcykel så
            // bytet sker automatiskt vid dygns-/vecko-/månadsskifte.
            if (window.IconRegistry) {
                const rotation = currentData.config.icon_pack_rotation;
                const rotated = (rotation && rotation.enabled)
                    ? IconRegistry.resolveRotationPack(rotation)
                    : null;
                const pack = rotated || currentData.config.icon_pack;
                if (pack) {
                    IconRegistry.setActivePack(pack);
                }
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
            ? new Date(dashboardState.lastUpdate).toLocaleTimeString(I18n.locale(), { hour: '2-digit', minute: '2-digit' })
            : null;
        indicator.textContent = since
            ? t('STALE_SINCE', {time: since})
            : t('STALE_UNAVAILABLE');
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
