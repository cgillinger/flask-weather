/**
 * WeatherEffects for Flask Weather Dashboard
 * FAS 6: Optimerad för N156HCA-E5B (1920×1080 IPS)
 *
 * OPTIMERAD FÖR: N156HCA-E5B (1920×1080 IPS) + Pi5 + Chromium kiosk-läge
 * BASERAD PÅ: MagicMirror MMM-WeatherEffects modul
 * ARKITEKTUR: Modulär klass-baserad struktur med robust error handling
 *
 * 🛠️ KRITISK FIX: clearEffects() metoden helt omskriven för att stoppa effekt-staplingar
 * ❄️ NY: Utökad Unicode-snöflingskollektion för bättre visuell variation
 */

// === SMHI WEATHER SYMBOL MAPPING ===
const SMHI_WEATHER_MAPPING = {
    // Regn och regnskurar
    rain: [8, 9, 10, 18, 19, 20],
    // Snö och snöbyar
    snow: [15, 16, 17, 25, 26, 27],
    // Snöblandat regn (behandlas som snö med regn-hastighet)
    sleet: [12, 13, 14, 22, 23, 24],
    // Åska (behandlas som intensivt regn)
    thunder: [11, 21],
    // Klart väder (ingen animation)
    clear: [1, 2, 3, 4, 5, 6, 7]
};

// === DEFAULT KONFIGURATION (Optimerad för 1920×1080) ===
const DEFAULT_CONFIG = {
    enabled: true,
    intensity: 'auto',  // auto, light, medium, heavy

    // Rain configuration - Optimerad för 1920×1080 IPS
    rain_config: {
        droplet_count: 100,       // +100% från 768p (70→100) för FullHD
        droplet_speed: 2.0,       // Standard hastighet
        wind_direction: 'none',   // none, left-to-right, right-to-left
        enable_splashes: false    // Standard setting
    },

    // Snow configuration - Optimerad för 1920×1080 IPS med Unicode
    snow_config: {
        flake_count: 50,          // +100% från 768p (35→50) för FullHD
        characters: ['❄', '❆', '❇', '❈', '❄', '✱'],  // Kuraterad snöflingskollektion (utan ✨)
        sparkle_enabled: false,   // IPS kräver mindre effekter
        min_size: 1.2,            // +50% från 768p (0.8→1.2) för bättre synlighet
        max_size: 2.4,            // +50% från 768p (1.6→2.4) för bättre synlighet
        speed: 0.9                // Lite långsammare för IPS smoothness
    },

    // Transition settings
    transition_duration: 1000,   // Standard timing

    // Error handling & logging
    debug_logging: false,        // För felsökning
    fallback_enabled: true       // Graceful fallbacks
};

// === HUVUDKLASS: WEATHEREFFECTSMANAGER ===
class WeatherEffectsManager {
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
        this.currentEffect = null;
        this.effectContainer = null;
        this.initialized = false;

        // 🛠️ FIX: Global timeout tracking för fullständig rensning
        this.globalTimeouts = new Set();
        this.globalIntervals = new Set();

        // Bind methods för event handling
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
     * Initialisera WeatherEffects-systemet
     */
    async initialize() {
        try {
            this.log('Initialiserar WeatherEffects...');

            // Ladda konfiguration från Flask API
            await this.loadConfig();

            // Kontrollera om effects är aktiverade
            if (!this.config.enabled) {
                this.log('WeatherEffects är inaktiverade i config');
                return false;
            }

            // Skapa bas-container för effekter
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
     * Ladda konfiguration från Flask API
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

            // Validera och merga config
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
     * Validera och merga konfigurationsdata
     */
    validateConfig(configData) {
        if (!configData || typeof configData !== 'object') {
            this.log('Ogiltig config-data, använder default');
            return { ...DEFAULT_CONFIG };
        }

        // Deep merge med default config
        const mergedConfig = { ...DEFAULT_CONFIG };

        // Kopiera top-level properties
        Object.keys(DEFAULT_CONFIG).forEach(key => {
            if (configData.hasOwnProperty(key)) {
                if (typeof DEFAULT_CONFIG[key] === 'object' && !Array.isArray(DEFAULT_CONFIG[key])) {
                    // Deep merge för nested objects
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
     * Skapa bas-container för alla vädereffekter
     */
    createEffectContainer() {
        // Ta bort befintlig container om den finns
        if (this.effectContainer) {
            this.effectContainer.remove();
        }

        // Skapa ny container med MM-kompatibel styling
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
     * Huvudmetod: Uppdatera effekter baserat på SMHI-data
     */
    updateFromSMHI(weatherSymbol, precipitation = 0, windDirection = 0) {
        if (!this.initialized) {
            this.log('WeatherEffects ej initialiserat, hoppar över uppdatering');
            return;
        }

        try {
            // Bestäm vädertyp från SMHI symbol
            const weatherType = this.getWeatherTypeFromSMHI(weatherSymbol);
            this.log(`SMHI Symbol ${weatherSymbol} → ${weatherType}`);

            // Beräkna intensitet baserat på precipitation
            const intensity = this.calculateIntensity(precipitation, weatherType);
            this.log(`Beräknad intensitet: ${intensity} (precipitation: ${precipitation}mm)`);

            // Uppdatera aktuell effekt
            this.handleWeatherChange(weatherType, intensity, windDirection);

        } catch (error) {
            this.logError('Fel vid SMHI-uppdatering:', error);
        }
    }

    /**
     * Bestäm vädertyp från SMHI symbol
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
     * Beräkna intensitet baserat på nederbörd och vädertyp
     */
    calculateIntensity(precipitation, weatherType) {
        if (this.config.intensity !== 'auto') {
            return this.config.intensity; // Använd manuell setting
        }

        // Auto-beräkning baserat på SMHI-data
        if (weatherType === 'clear') {
            return 'none';
        }

        if (weatherType === 'thunder') {
            return 'heavy'; // Åska är alltid heavy
        }

        // Beräkna för regn/snö/sleet baserat på precipitation
        if (precipitation < 0.5) {
            return 'light';
        } else if (precipitation < 2.0) {
            return 'medium';
        } else {
            return 'heavy';
        }
    }

    /**
     * Hantera väderförändring och effektbyte
     */
    handleWeatherChange(weatherType, intensity, windDirection = 0) {
        // Om intensitet är 'none', rensa alla effekter
        if (intensity === 'none' || weatherType === 'clear') {
            this.clearEffects();
            return;
        }

        // Om samma effekt redan körs, uppdatera bara intensitet
        if (this.currentEffect && this.currentEffect.weatherType === weatherType) {
            if (this.currentEffect.effect.updateIntensity) {
                this.currentEffect.effect.updateIntensity(intensity);
            }
            return;
        }

        // Annars, rensa gamla effekter och starta nya
        this.clearEffects();
        this.startEffect(weatherType, intensity, windDirection);
    }

    /**
     * Starta ny vädereffekt
     */
    startEffect(weatherType, intensity, windDirection) {
        try {
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
                // Starta effekt
                effect.start();

                // Spara referens
                this.currentEffect = {
                    weatherType: weatherType,
                    intensity: intensity,
                    effect: effect
                };

                // Fade in container
                setTimeout(() => {
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
     * 🛠️ FÖRBÄTTRAD: Rensa alla aktiva effekter
     */
    clearEffects() {
        this.log('🧹 clearEffects() körs - FÖRBÄTTRAD VERSION');

        try {
            // 1. Fade ut container
            if (this.effectContainer) {
                this.effectContainer.style.opacity = '0';
            }

            // 2. Stoppa nuvarande effekt om den finns
            if (this.currentEffect && this.currentEffect.effect) {
                this.log(`Stoppar ${this.currentEffect.weatherType} effekt...`);
                
                if (typeof this.currentEffect.effect.stop === 'function') {
                    this.currentEffect.effect.stop();
                }

                this.currentEffect = null;
            }

            // 3. Rensa alla globala timeouts och intervals
            this.log(`Rensar ${this.globalTimeouts.size} timeouts och ${this.globalIntervals.size} intervals...`);
            
            this.globalTimeouts.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            this.globalTimeouts.clear();

            this.globalIntervals.forEach(intervalId => {
                clearInterval(intervalId);
            });
            this.globalIntervals.clear();

            // 4. Rensa DOM-innehåll efter en kort delay för fade-out
            setTimeout(() => {
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
     * Förstör hela WeatherEffects-systemet
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

// === REGNEFFEKT-KLASS (FÖRBÄTTRAD) ===
class RainEffect {
    constructor(container, config, intensity, manager) {
        this.container = container;
        this.config = config;
        this.intensity = intensity;
        this.manager = manager;
        this.particles = [];
        this.isActive = false;

        // Intensitetsmultiplikatorer optimerade för 1920×1080
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

        // Robust particle-rensning
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

        // Optimerad styling för 1920×1080 IPS
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

// === SNÖEFFEKT-KLASS (FÖRBÄTTRAD MED UNICODE) ===
class SnowEffect {
    constructor(container, config, intensity, manager) {
        this.container = container;
        this.config = config;
        this.intensity = intensity;
        this.manager = manager;
        this.particles = [];
        this.isActive = false;

        // Intensitetsmultiplikatorer optimerade för 1920×1080
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

        // Välj random Unicode-tecken från utökad kollektion
        const character = this.config.characters[Math.floor(Math.random() * this.config.characters.length)];
        flake.textContent = character;

        // Optimerad styling för 1920×1080 IPS
        const size = this.config.min_size + Math.random() * (this.config.max_size - this.config.min_size);
        
        // Randomiserad startposition för att undvika synlig "spawn line"
        const startTop = -50 - Math.random() * 150;  // -50px till -200px
        
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

// === EXPORTS FÖR MODULARITY ===
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
