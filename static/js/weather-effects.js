/**
 * WeatherEffects for Flask Weather Dashboard
 * PHASE 6: Optimized for N156HCA-E5B (1920×1080 IPS)
 *
 * OPTIMIZED FOR: N156HCA-E5B (1920×1080 IPS) + Pi5 + Chromium kiosk mode
 * BASED ON: MagicMirror MMM-WeatherEffects module
 * ARCHITECTURE: Modular class-based structure with robust error handling
 *
 * 🛠️ CRITICAL FIX: clearEffects() completely rewritten to stop effect stacking
 * ❄️ NEW: Extended Unicode snowflake collection for better visual variation
 */

// === SMHI WEATHER SYMBOL MAPPING ===
const SMHI_WEATHER_MAPPING = {
    // Rain and rain showers
    rain: [8, 9, 10, 18, 19, 20],
    // Snow and snow showers
    snow: [15, 16, 17, 25, 26, 27],
    // Sleet (treated as snow at rain speed)
    sleet: [12, 13, 14, 22, 23, 24],
    // Thunder (treated as intense rain)
    thunder: [11, 21],
    // Clear weather (no animation)
    clear: [1, 2, 3, 4, 5, 6, 7]
};

// === DEFAULT CONFIGURATION (Optimized for 1920×1080) ===
const DEFAULT_CONFIG = {
    enabled: true,
    intensity: 'auto',  // auto, light, medium, heavy

    // Rain configuration - Optimized for 1920×1080 IPS
    rain_config: {
        droplet_count: 100,       // +100% vs 768p (70→100) for FullHD
        droplet_speed: 2.0,       // Standard speed
        wind_direction: 'none',   // none, left-to-right, right-to-left
        enable_splashes: false    // Standard setting
    },

    // Snow configuration - Optimized for 1920×1080 IPS with Unicode
    snow_config: {
        flake_count: 50,          // +100% vs 768p (35→50) for FullHD
        characters: ['❄', '❆', '❇', '❈', '❄', '✱'],  // Curated snowflake collection (without ✨)
        sparkle_enabled: false,   // IPS needs fewer effects
        min_size: 1.2,            // +50% vs 768p (0.8→1.2) for better visibility
        max_size: 2.4,            // +50% vs 768p (1.6→2.4) for better visibility
        speed: 0.9                // Slightly slower for IPS smoothness
    },

    // Transition settings
    transition_duration: 1000,   // Standard timing

    // Error handling & logging
    debug_logging: false,        // For troubleshooting
    fallback_enabled: true       // Graceful fallbacks
};

// === MAIN CLASS: WEATHEREFFECTSMANAGER ===
class WeatherEffectsManager {
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
        this.currentEffect = null;
        this.effectContainer = null;
        this.initialized = false;

        // 🛠️ FIX: Global timeout tracking for complete cleanup
        this.globalTimeouts = new Set();
        // Tracked transition timeouts: a rapid clear→start switch must not
        // let an old fade/cleanup callback hit the new effect
        this.pendingClearTimeout = null;
        this.fadeInTimeout = null;
        this.globalIntervals = new Set();

        // Bind methods for event handling
        this.updateFromSMHI = this.updateFromSMHI.bind(this);
        this.handleWeatherChange = this.handleWeatherChange.bind(this);

        this.log('WeatherEffectsManager initialiserad för 1920×1080 IPS');
    }

    /**
     * 🛠️ FIX: Global timeout/interval tracking
     */
    addTimeout(timeoutId) {
        this.globalTimeouts.add(timeoutId);
        return timeoutId;
    }

    addInterval(intervalId) {
        this.globalIntervals.add(intervalId);
        return intervalId;
    }

    removeTimeout(timeoutId) {
        this.globalTimeouts.delete(timeoutId);
        clearTimeout(timeoutId);
    }

    removeInterval(intervalId) {
        this.globalIntervals.delete(intervalId);
        clearInterval(intervalId);
    }

    /**
     * Initialize the WeatherEffects system
     */
    async initialize() {
        try {
            this.log('Initialiserar WeatherEffects...');

            // Load configuration from the Flask API
            await this.loadConfig();

            // Check whether effects are enabled
            if (!this.config.enabled) {
                this.log('WeatherEffects är inaktiverade i config');
                return false;
            }

            // Create the base container for effects
            this.createEffectContainer();

            this.initialized = true;
            this.log('WeatherEffects initialisering klar');
            return true;

        } catch (error) {
            this.logError('Fel vid initialisering:', error);

            if (this.config.fallback_enabled) {
                this.log('Använder fallback-konfiguration');
                this.createEffectContainer();
                this.initialized = true;
                return true;
            }

            return false;
        }
    }

    /**
     * Load configuration from the Flask API
     */
    async loadConfig() {
        try {
            const response = await fetch('/api/weather-effects-config', {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const configData = await response.json();

            // Validate and merge config
            this.config = this.validateConfig(configData);
            this.log('Konfiguration laddad från Flask API');

        } catch (error) {
            this.logError('Fel vid config-laddning:', error);

            if (this.config.fallback_enabled) {
                this.log('Använder default-konfiguration som fallback');
            } else {
                throw error;
            }
        }
    }

    /**
     * Validate and merge configuration data
     */
    validateConfig(configData) {
        if (!configData || typeof configData !== 'object') {
            this.log('Ogiltig config-data, använder default');
            return { ...DEFAULT_CONFIG };
        }

        // Deep merge with default config
        const mergedConfig = { ...DEFAULT_CONFIG };

        // Copy top-level properties
        Object.keys(DEFAULT_CONFIG).forEach(key => {
            if (configData.hasOwnProperty(key)) {
                if (typeof DEFAULT_CONFIG[key] === 'object' && !Array.isArray(DEFAULT_CONFIG[key])) {
                    // Deep merge for nested objects
                    mergedConfig[key] = { ...DEFAULT_CONFIG[key], ...configData[key] };
                } else {
                    mergedConfig[key] = configData[key];
                }
            }
        });

        this.log('Config validerad och mergad');
        return mergedConfig;
    }

    /**
     * Create the base container for all weather effects
     */
    createEffectContainer() {
        // Remove any existing container
        if (this.effectContainer) {
            this.effectContainer.remove();
        }

        // Create a new container with MM-compatible styling
        this.effectContainer = document.createElement('div');
        this.effectContainer.className = 'weather-effect-wrapper';
        this.effectContainer.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 99999999 !important;
            opacity: 0;
            transition: opacity ${this.config.transition_duration}ms ease-in-out;
        `;

        document.body.appendChild(this.effectContainer);
        this.log('Effect container skapad');
    }

    /**
     * Main method: update effects based on SMHI data
     */
    updateFromSMHI(weatherSymbol, precipitation = 0, windDirection = 0) {
        if (!this.initialized) {
            this.log('WeatherEffects ej initialiserat, hoppar över uppdatering');
            return;
        }

        try {
            // Determine weather type from SMHI symbol
            const weatherType = this.getWeatherTypeFromSMHI(weatherSymbol);
            this.log(`SMHI Symbol ${weatherSymbol} → ${weatherType}`);

            // Calculate intensity based on precipitation
            const intensity = this.calculateIntensity(precipitation, weatherType);
            this.log(`Beräknad intensitet: ${intensity} (precipitation: ${precipitation}mm)`);

            // Update the current effect
            this.handleWeatherChange(weatherType, intensity, windDirection);

        } catch (error) {
            this.logError('Fel vid SMHI-uppdatering:', error);
        }
    }

    /**
     * NETATMO RAIN PRIORITY: Update rain effect from Netatmo's rain gauge.
     * Called from current-weather-view.js when Netatmo actually measures precipitation
     * (ground truth) - then rain is shown regardless of what the SMHI forecast says.
     */
    updateFromNetatmoRain(rainMm = 0, windDirection = 0) {
        if (!this.initialized) {
            this.log('WeatherEffects ej initialiserat, hoppar över Netatmo-uppdatering');
            return;
        }

        try {
            let intensity = this.calculateIntensity(rainMm, 'rain');
            if (intensity === 'none') {
                intensity = 'light'; // Netatmo measures rain - show at least a light effect
            }
            this.log(`Netatmo-regn ${rainMm} mm → intensitet ${intensity}`);
            this.handleWeatherChange('rain', intensity, windDirection);

        } catch (error) {
            this.logError('Fel vid Netatmo-regnuppdatering:', error);
        }
    }

    /**
     * Determine weather type from SMHI symbol
     */
    getWeatherTypeFromSMHI(symbol) {
        const symbolNum = parseInt(symbol);

        for (const [weatherType, symbols] of Object.entries(SMHI_WEATHER_MAPPING)) {
            if (symbols.includes(symbolNum)) {
                return weatherType;
            }
        }

        return 'clear'; // Fallback
    }

    /**
     * Calculate intensity based on precipitation and weather type
     */
    calculateIntensity(precipitation, weatherType) {
        if (this.config.intensity !== 'auto') {
            return this.config.intensity; // Use manual setting
        }

        // Auto calculation based on SMHI data
        if (weatherType === 'clear') {
            return 'none';
        }

        if (weatherType === 'thunder') {
            return 'heavy'; // Thunder is always heavy
        }

        // Calculate for rain/snow/sleet based on precipitation
        if (precipitation < 0.5) {
            return 'light';
        } else if (precipitation < 2.0) {
            return 'medium';
        } else {
            return 'heavy';
        }
    }

    /**
     * Handle weather change and effect switching
     */
    handleWeatherChange(weatherType, intensity, windDirection = 0) {
        // If intensity is 'none', clear all effects
        if (intensity === 'none' || weatherType === 'clear') {
            this.clearEffects();
            return;
        }

        // If the same effect is already running, just update intensity
        if (this.currentEffect && this.currentEffect.weatherType === weatherType) {
            if (this.currentEffect.effect.updateIntensity) {
                this.currentEffect.effect.updateIntensity(intensity);
            }
            return;
        }

        // Otherwise, clear old effects and start a new one
        this.clearEffects();
        this.startEffect(weatherType, intensity, windDirection);
    }

    /**
     * Start a new weather effect
     */
    startEffect(weatherType, intensity, windDirection) {
        try {
            // Cancel any pending DOM cleanup from a previous clearEffects()
            // so it does not delete the new effect's particles
            if (this.pendingClearTimeout) {
                clearTimeout(this.pendingClearTimeout);
                this.pendingClearTimeout = null;
            }

            let effect = null;

            switch (weatherType) {
                case 'rain':
                case 'sleet':
                case 'thunder':
                    effect = new RainEffect(
                        this.effectContainer,
                        this.config.rain_config,
                        intensity,
                        this
                    );
                    break;

                case 'snow':
                    effect = new SnowEffect(
                        this.effectContainer,
                        this.config.snow_config,
                        intensity,
                        this
                    );
                    break;

                default:
                    this.log(`Okänd vädertyp: ${weatherType}`);
                    return;
            }

            if (effect) {
                // Start effect
                effect.start();

                // Save reference
                this.currentEffect = {
                    weatherType: weatherType,
                    intensity: intensity,
                    effect: effect
                };

                // Fade in container (tracked so clearEffects can cancel it)
                this.fadeInTimeout = setTimeout(() => {
                    this.fadeInTimeout = null;
                    if (this.effectContainer) {
                        this.effectContainer.style.opacity = '1';
                    }
                }, 50);

                this.log(`✓ Effekt startad: ${weatherType} (${intensity})`);
            }

        } catch (error) {
            this.logError('Fel vid start av effekt:', error);
        }
    }

    /**
     * 🛠️ IMPROVED: Clear all active effects
     */
    clearEffects() {
        this.log('🧹 clearEffects() körs - FÖRBÄTTRAD VERSION');

        try {
            // 1. Fade out container (and cancel any pending fade-in so it
            // does not set opacity back to 1 after the cleanup)
            if (this.fadeInTimeout) {
                clearTimeout(this.fadeInTimeout);
                this.fadeInTimeout = null;
            }
            if (this.effectContainer) {
                this.effectContainer.style.opacity = '0';
            }

            // 2. Stop the current effect if there is one
            if (this.currentEffect && this.currentEffect.effect) {
                this.log(`Stoppar ${this.currentEffect.weatherType} effekt...`);
                
                if (typeof this.currentEffect.effect.stop === 'function') {
                    this.currentEffect.effect.stop();
                }

                this.currentEffect = null;
            }

            // 3. Clear all global timeouts and intervals
            this.log(`Rensar ${this.globalTimeouts.size} timeouts och ${this.globalIntervals.size} intervals...`);
            
            this.globalTimeouts.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            this.globalTimeouts.clear();

            this.globalIntervals.forEach(intervalId => {
                clearInterval(intervalId);
            });
            this.globalIntervals.clear();

            // 4. Clear DOM content after a short delay for the fade-out
            // (tracked so startEffect can cancel it if a new effect starts first)
            if (this.pendingClearTimeout) {
                clearTimeout(this.pendingClearTimeout);
            }
            this.pendingClearTimeout = setTimeout(() => {
                this.pendingClearTimeout = null;
                if (this.effectContainer) {
                    while (this.effectContainer.firstChild) {
                        this.effectContainer.removeChild(this.effectContainer.firstChild);
                    }
                }
                this.log('✓ clearEffects() klar - alla effekter rensade');
            }, this.config.transition_duration);

        } catch (error) {
            this.logError('Fel vid rensning av effekter:', error);
        }
    }

    /**
     * Destroy the entire WeatherEffects system
     */
    destroy() {
        this.log('Förstör WeatherEffectsManager...');
        
        this.clearEffects();

        if (this.effectContainer) {
            this.effectContainer.remove();
            this.effectContainer = null;
        }

        this.initialized = false;
        this.log('WeatherEffectsManager förstört');
    }

    /**
     * Logging helpers
     */
    log(message) {
        if (this.config.debug_logging) {
            console.log(`[WeatherEffects] ${message}`);
        }
    }

    logError(message, error) {
        console.error(`[WeatherEffects] ${message}`, error);
    }
}

// === RAIN EFFECT CLASS (IMPROVED) ===
class RainEffect {
    constructor(container, config, intensity, manager) {
        this.container = container;
        this.config = config;
        this.intensity = intensity;
        this.manager = manager;
        this.particles = [];
        this.isActive = false;

        // Intensity multipliers optimized for 1920×1080
        this.intensityMultipliers = {
            light: 0.5,
            medium: 1.0,
            heavy: 2.0
        };
    }

    start() {
        this.isActive = true;
        this.createRainDroplets();
    }

    stop() {
        this.manager.log('🛑 RainEffect.stop() kallas...');
        this.isActive = false;

        // Robust particle cleanup
        this.particles.forEach((particle, index) => {
            try {
                if (particle.element && particle.element.parentNode) {
                    particle.element.style.animation = 'none';
                    particle.element.parentNode.removeChild(particle.element);
                }
                if (particle.timeoutId) {
                    this.manager.removeTimeout(particle.timeoutId);
                }
            } catch (error) {
                this.manager.logError(`Fel vid rensning av rain particle ${index}:`, error);
            }
        });

        this.particles = [];
        this.manager.log('🛑 RainEffect stoppat, alla partiklar rensade');
    }

    updateIntensity(newIntensity) {
        if (newIntensity !== this.intensity) {
            this.intensity = newIntensity;
            this.stop();
            this.start();
        }
    }

    createRainDroplets() {
        if (!this.isActive) return;

        const multiplier = this.intensityMultipliers[this.intensity] || 1.0;
        const dropletCount = Math.floor(this.config.droplet_count * multiplier);

        for (let i = 0; i < dropletCount; i++) {
            if (!this.isActive) break;
            this.createRainDroplet();
        }
    }

    createRainDroplet() {
        if (!this.isActive || !this.container) return;

        const droplet = document.createElement('div');
        droplet.className = 'rain-particle';

        // Optimized styling for 1920×1080 IPS
        const height = 15 + Math.random() * 15;
        const windOffset = this.getWindOffset();

        droplet.style.cssText = `
            position: absolute !important;
            background: linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
            width: 1.5px;
            height: ${height}px;
            left: ${Math.random() * 100}%;
            top: -${height}px;
            pointer-events: none;
            transform: translateX(${windOffset}px);
        `;

        const duration = (this.config.droplet_speed + Math.random()) * 1000;
        droplet.style.animation = `rain-fall ${duration}ms linear infinite`;
        droplet.style.animationDelay = `${Math.random() * 2000}ms`;

        this.container.appendChild(droplet);

        const timeoutId = this.manager.addTimeout(setTimeout(() => {
            if (!this.isActive) return;

            if (droplet.parentNode) {
                droplet.parentNode.removeChild(droplet);
            }

            const index = this.particles.findIndex(p => p.element === droplet);
            if (index > -1) {
                this.particles.splice(index, 1);
            }

            this.manager.removeTimeout(timeoutId);

            if (this.isActive && this.container) {
                this.createRainDroplet();
            }
        }, duration + 2000));

        this.particles.push({
            element: droplet,
            duration: duration,
            timeoutId: timeoutId
        });
    }

    getWindOffset() {
        switch (this.config.wind_direction) {
            case 'left-to-right':
                return 15;
            case 'right-to-left':
                return -15;
            default:
                return 0;
        }
    }
}

// === SNOW EFFECT CLASS (IMPROVED WITH UNICODE) ===
class SnowEffect {
    constructor(container, config, intensity, manager) {
        this.container = container;
        this.config = config;
        this.intensity = intensity;
        this.manager = manager;
        this.particles = [];
        this.isActive = false;

        // Intensity multipliers optimized for 1920×1080
        this.intensityMultipliers = {
            light: 0.5,
            medium: 1.0,
            heavy: 2.0
        };
    }

    start() {
        this.isActive = true;
        this.createSnowParticles();
    }

    stop() {
        this.manager.log('🛑 SnowEffect.stop() kallas...');
        this.isActive = false;

        this.particles.forEach((particle, index) => {
            try {
                if (particle.element && particle.element.parentNode) {
                    particle.element.style.animation = 'none';
                    particle.element.parentNode.removeChild(particle.element);
                }
                if (particle.timeoutId) {
                    this.manager.removeTimeout(particle.timeoutId);
                }
            } catch (error) {
                this.manager.logError(`Fel vid rensning av snow particle ${index}:`, error);
            }
        });

        this.particles = [];
        this.manager.log('🛑 SnowEffect stoppat, alla partiklar rensade');
    }

    updateIntensity(newIntensity) {
        if (newIntensity !== this.intensity) {
            this.intensity = newIntensity;
            this.stop();
            this.start();
        }
    }

    createSnowParticles() {
        if (!this.isActive) return;

        const multiplier = this.intensityMultipliers[this.intensity] || 1.0;
        const flakeCount = Math.floor(this.config.flake_count * multiplier);

        for (let i = 0; i < flakeCount; i++) {
            if (!this.isActive) break;
            this.createSnowFlake();
        }
    }

    createSnowFlake() {
        if (!this.isActive || !this.container) return;

        const flake = document.createElement('div');
        flake.className = 'snow-particle';

        // Pick a random Unicode character from the extended collection
        const character = this.config.characters[Math.floor(Math.random() * this.config.characters.length)];
        flake.textContent = character;

        // Optimized styling for 1920×1080 IPS
        const size = this.config.min_size + Math.random() * (this.config.max_size - this.config.min_size);

        // Randomized start position to avoid a visible "spawn line"
        const startTop = -50 - Math.random() * 150;  // -50px to -200px
        
        flake.style.cssText = `
            position: absolute !important;
            color: white;
            font-size: ${size}em;
            opacity: ${0.6 + Math.random() * 0.4};
            left: ${Math.random() * 100}%;
            top: ${startTop}px;
            pointer-events: none;
            user-select: none;
            text-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
        `;

        if (this.config.sparkle_enabled) {
            flake.classList.add('sparkle');
        }

        const duration = ((Math.random() * 2 + 3) / this.config.speed) * 1000;
        flake.style.animation = `snow-fall ${duration}ms linear infinite`;
        flake.style.animationDelay = `${Math.random() * 3000}ms`;

        this.container.appendChild(flake);

        const timeoutId = this.manager.addTimeout(setTimeout(() => {
            if (!this.isActive) return;

            if (flake.parentNode) {
                flake.parentNode.removeChild(flake);
            }

            const index = this.particles.findIndex(p => p.element === flake);
            if (index > -1) {
                this.particles.splice(index, 1);
            }

            this.manager.removeTimeout(timeoutId);

            if (this.isActive && this.container) {
                this.createSnowFlake();
            }
        }, duration + 3000));

        this.particles.push({
            element: flake,
            duration: duration,
            timeoutId: timeoutId
        });
    }
}

// === GLOBAL INITIALIZATION ===
let weatherEffectsManager = null;

async function initializeWeatherEffects() {
    try {
        console.log('[WeatherEffects] Initialiserar för 1920×1080 IPS med Unicode-snöflingor...');

        if (weatherEffectsManager) {
            weatherEffectsManager.destroy();
        }

        weatherEffectsManager = new WeatherEffectsManager();
        const success = await weatherEffectsManager.initialize();

        if (success) {
            window.weatherEffectsManager = weatherEffectsManager;
            console.log('[WeatherEffects] ✅ Initialisering lyckades (FAS 6)');
            return true;
        } else {
            console.warn('[WeatherEffects] Initialisering misslyckades');
            return false;
        }

    } catch (error) {
        console.error('[WeatherEffects] Fel vid initialisering:', error);
        return false;
    }
}

// === EXPORTS FOR MODULARITY ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WeatherEffectsManager,
        RainEffect,
        SnowEffect,
        initializeWeatherEffects,
        SMHI_WEATHER_MAPPING
    };
}

console.log('[WeatherEffects] ❄️ FAS 6 - Optimerad för 1920×1080 IPS med Unicode-snöflingor');
