/**
 * Fetch API Client - STEP 10 REFACTORING + PHASE 4 UV integration
 * API handling extracted from dashboard.js
 * Handles data fetching, timeout and theme control
 */

// === API CONSTANTS ===
const API_TIMEOUT = 10000; // 10 sekunder
const STALE_AFTER_FAILURES = 3; // Visa varning efter 3 misslyckade uppdateringar i rad

// Re-entrance guard: setInterval keeps ticking every 30 seconds even if a
// previous update has hung - without the guard, calls stack up on each other
let updateInFlight = false;
let consecutiveFailures = 0;

// === CORE API FUNCTIONS ===

/**
 * Fetch with timeout and error handling
 * @param {string} url - API endpoint URL
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<object>} JSON response from API
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
 * Update all weather data from APIs + PHASE 4: UV data
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
        
        // PHASE 2: Update Netatmo-intelligence state
        if (currentData.config) {
            // LANGUAGE: set active language BEFORE views render (ui.language)
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

            // ICON PACKAGE: Activate selected package before views render icons.
            // With rotation active (ui.icon_pack_rotation) the package is selected
            // deterministically from the date - re-evaluated each poll cycle so
            // the switch happens automatically at day/week/month boundaries.
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

            // ICON ANIMATIONS: Set animation mode (ui.icon_animations) -
            // 'auto' gives Safari/iPad hero-only due to WebKit performance
            if (window.IconRegistry && currentData.config.icon_animations) {
                IconRegistry.setAnimationMode(currentData.config.icon_animations);
            }

            console.log(`🧠 PHASE 2: Netatmo mode: ${dashboardState.useNetatmo ? 'ACTIVE' : 'INACTIVE'}`);
        }

        // STEP 8: Use Intelligent Data Source instead of local function
        updateDataAvailability(currentData);

        // STEP 9: Use UI Adaptation Engine instead of local functions
        applyUIAdaptations();
        
        updateCurrentWeather(currentData);
        updateHourlyForecast(forecastData.forecast);
        updateDailyForecast(dailyData.daily_forecast);
        updateStatus(currentData.status);
        
        if (currentData.theme !== dashboardState.currentTheme) {
            updateTheme(currentData.theme);
        }

        // STEP 9: Use UI Adaptation Engine instead of local function
        adaptElementVisibility();

        // PHASE 4: Update UV data (if UVDisplay is available)
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
 * Visible staleness indicator: the kiosk screen should not be able to show hours
 * old data without it being visible. Shown after repeated fetch errors or
 * when backend itself reports update errors.
 * @param {string|null} backendStatus - Status from /api/current, null on fetch error
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
 * Check theme updates from API
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
