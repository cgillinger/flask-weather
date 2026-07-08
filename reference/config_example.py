# config_example.py - Weather Dashboard configuration template with WeatherEffects
# =============================================================================
# 🔒 SECURITY: This file contains NO real tokens/keys
# 📁 SETUP: Copy it to config.py and fill in your real values
# 🚫 WARNING: NEVER add config.py to Git - it contains secrets!
# ✨ NEW IN PHASE 2: WeatherEffects configuration added for MagicMirror compatibility
# =============================================================================

CONFIG = {
    # ⚡ MAIN SETTING: Choose between forecast-only or forecast+Netatmo
    # 📊 False = forecast-only (DEFAULT) - Weather forecast from your chosen provider only
    # 🏠 True = forecast+Netatmo - Forecast plus live readings from your own weather station
    'use_netatmo': False,  # ← CHANGE TO True IF you own a Netatmo weather station

    # WEATHER PROVIDER - who supplies the forecast data (PROJECT WEATHERPROVIDER)
    # 'yr'         = YR/met.no (Norway, global coverage - default on installation)
    # 'smhi'       = SMHI (Sweden, covers the Nordics only)
    # 'open-meteo' = Open-Meteo (global coverage, picks the best model per location:
    #                DWD/NOAA/Meteo-France/ECMWF etc.)
    # All providers are normalized to SMHI's symbol scale 1-27, so icons,
    # WeatherEffects and the frontend work identically regardless of choice.
    # The coordinates below (the 'smhi' block) are used by every provider.
    # None of the providers requires an API key. For YR/Open-Meteo the
    # humidity is taken from the forecast instead of SMHI's observation stations.
    'weather_provider': 'yr',

    'smhi': {
        # 📍 PUBLIC COORDINATES - Stockholm by default
        'latitude': 59.3293,    # Stockholm coordinates (public information)
        'longitude': 18.0686,   # Other cities: Täby/Ellagård 59.4644,18.0698 | Gothenburg 57.7089,11.9746 | Malmö 55.6050,13.0038 | Uppsala 59.8586,17.6389
        # 💡 TIP: Täby/Ellagård (59.4644, 18.0698) may give more representative data for Netatmo comparisons
    },

    'netatmo': {
        # 🔐 SENSITIVE NETATMO API CREDENTIALS - Only needed if use_netatmo=True
        # ⚠️  Leave them as-is if you only want forecast data (use_netatmo=False)
        'client_id': 'YOUR_NETATMO_CLIENT_ID_HERE',              # From https://dev.netatmo.com/apps
        'client_secret': 'YOUR_NETATMO_CLIENT_SECRET_HERE',      # From https://dev.netatmo.com/apps
        'refresh_token': 'YOUR_NETATMO_REFRESH_TOKEN_HERE',      # From the initial OAuth authentication
        'preferred_station': 'Utomhus',  # Which station is preferred for display (smart blending uses all of them)
        'comment': 'Konfiguration för Netatmo-väderstation. Ignoreras helt om use_netatmo=False.'
    },

    'ipgeolocation': {
        # 🔐 SENSITIVE API KEY - Fill in your real key (OPTIONAL)
        'api_key': 'YOUR_IPGEOLOCATION_API_KEY_HERE',           # Free from https://ipgeolocation.io/
        'comment': 'Hämta gratis API-nyckel från https://ipgeolocation.io/ för exakta soltider. Om tom används förenklad beräkning.'
    },

    'display': {
        # 📍 PUBLIC LOCATION-NAME SETTING
        'location_name': 'Stockholm',  # Location name shown on screen
        'comment': 'Namn på ort som visas på skärmen - hjälper användaren förstå var data kommer ifrån'
    },

    # === 🍃 AIR QUALITY ===
    # Outdoor air quality (European AQI) is fetched from the nearest SMHI
    # measurement station in Sweden, with a global fallback to
    # Open-Meteo/CAMS. No API key required.
    'air_quality': {
        # 'indoor'  = indoor Netatmo CO2 only (requires use_netatmo=True)
        # 'outdoor' = outdoor AQI only (works without Netatmo, anywhere in the world)
        # 'both'    = show both. Without Netatmo only outdoor is shown automatically.
        'mode': 'outdoor',
    },

    'ui': {
        # 🎛️ PUBLIC UI SETTINGS - Adjust as needed
        'fullscreen': True,                      # True/False - Fullscreen mode for kiosk use
        'refresh_interval_minutes': 15,         # 5-60 minutes - forecast data refresh (recommended: 15)
        'netatmo_refresh_interval_minutes': 10, # 5-30 minutes - Netatmo fast refresh (ignored if use_netatmo=False)

        # WIND UNITS - ACTIVE: 'land' (Swedish land terminology)
        'wind_unit': 'land',    # OPTIONS: 'sjo', 'land', 'beaufort', 'ms', 'kmh' (see guide below)

        # PRESSURE DISPLAY - how the barometer is shown
        # 'words'   = descriptive words like a physical barometer (Storm/Rain/Changeable/Fair/Very dry)
        #             plus the number and a trend arrow on line 2. Good for viewers
        #             with no feel for hPa values.
        # 'numeric' = numeric value + text trend only (classic mode)
        'pressure_display': 'words',

        # ICON PACK - which weather icon set is used
        # 'weather-icons'      = the Weather Icons font (classic mode, colorized automatically)
        # 'amcharts'           = animated color SVGs with day/night variants
        # 'meteocons'          = animated color SVGs, fill style (MIT, most modern)
        # 'amedia-meteo'       = static color SVGs, complete day/night set
        #                        NOTE: CC BY-NC-SA 4.0 - non-commercial use ONLY!
        # 'open-weather-icons' = font, OpenWeatherMap symbols (colorized automatically)
        # 'kickstand-weather'  = font, minimalist (12 glyphs, colorized automatically)
        # Licenses: see "Icon pack licenses" in the readme + the license file in each icon folder.
        # New packs are added in static/js/utils/icon-packs.js
        'icon_pack': 'weather-icons',

        # ICON ANIMATIONS - which weather icons animate (applies to SVG packs like 'amcharts')
        # Safari, and every browser on iPad/iPhone, renders animated SVG icons
        # on the CPU and stutters when ~10 icons animate at once - so 'auto'
        # gives those clients an animated hero icon only. Chromium kiosks are unaffected.
        # 'auto' = animate everything, except Safari/iPad which only animate the hero icon (recommended)
        # 'all'  = animate every icon on every client
        # 'hero' = animate only the hero icon (current weather), forecast icons static
        # 'none' = all icons static
        'icon_animations': 'auto',

        # LANGUAGE - UI language for the dashboard (LANGUAGE PROJECT)
        # 'sv' Swedish | 'nb'/'no' Norwegian | 'da' Danish | 'fi' Finnish
        # 'de' German | 'fr' French | 'es' Spanish | 'en' English
        # 'en' is the default on installation. An unknown language falls back
        # to Swedish. Dates/weekdays follow the language automatically
        # (the browser's Intl). The wind terminology per language follows each
        # country's weather institute (SMHI/YR/DMI/FMI/DWD/
        # Météo-France/AEMET/Met Office).
        'language': 'en',

        # ICON PACK ROTATION - rotate automatically between icon packs.
        # When enabled=True the 'icon_pack' setting above is ignored. The
        # rotation covers ALL packs in static/js/utils/icon-packs.js (never a
        # hardcoded list - new packs are included automatically), minus those
        # listed in 'exclude'. The pack is chosen deterministically from the
        # date, so every client (kiosk, iPad, ...) shows the same pack with no
        # syncing. Switches happen at local midnight / Monday / the turn of
        # the month depending on the interval.
        # 'interval': 'day' | 'week' | 'month'
        # 'exclude':  pack names to skip, e.g. ['kickstand-weather']
        'icon_pack_rotation': {
            'enabled': False,
            'interval': 'week',
            'exclude': [],
        },

        # THEME - ACTIVE: 'dark' (the only production-ready theme)
        'theme': 'dark',        # OPTIONS: 'light' (NOT production-ready!), 'dark', 'auto'

        # Automatic theme switching (used when theme='auto')
        'auto_theme': {
            'day_theme': 'light',     # Theme for daytime
            'night_theme': 'dark',    # Theme for nighttime
            'night_start': '21:00',   # When the night theme starts (HH:MM)
            'night_end': '06:00'      # When the night theme ends (HH:MM)
        },

        # Window settings (not used in kiosk mode)
        'window_width': 1000,    # 800-1920 pixels
        'window_height': 700,    # 600-1080 pixels

        # Sun features
        'show_sun_times': True,  # True/False - Show sunrise/sunset
        'sun_cache_hours': 24    # 1-168 hours - How long sun times are cached
    },

    # =============================================================================
    # ✨ PHASE 2: WEATHEREFFECTS CONFIGURATION - MagicMirror-compatible
    # =============================================================================

    'weather_effects': {
        # 🌦️ MAIN SETTING: Enable/disable weather effects
        'enabled': False,  # EXAMPLE: False = disabled, change to True to enable rain/snow animations

        # 🎚️ INTENSITY: Automatic or manual intensity control
        'intensity': 'auto',  # 'auto' = based on forecast precipitation, 'light', 'medium', 'heavy'

        # ☔ RAIN CONFIGURATION (MagicMirror default settings)
        'rain_config': {
            'droplet_count': 50,        # 10-100: Number of raindrops (MM default: 50)
            'droplet_speed': 2.0,       # 0.5-5.0: Speed in seconds (MM default: 2.0)
            'wind_direction': 'none',   # 'none', 'left-to-right', 'right-to-left'
            'enable_splashes': False,   # True/False: Splash effects on ground impact (MM default: False)
            'comment': 'Regn-animationer baserade på SMHI symbols 8-10, 18-20 (regnskurar/regn) + 11,21 (åska)'
        },

        # ❄️ SNOW CONFIGURATION (MagicMirror default settings)
        'snow_config': {
            'flake_count': 25,          # 10-50: Number of snowflakes (MM default: 25)
            'characters': ['*', '+'],   # List of characters used as snowflakes (MM default: ['*', '+'])
            'sparkle_enabled': False,   # True/False: Sparkling snowflakes (MM default: False)
            'min_size': 0.8,           # 0.5-2.0: Smallest size in em (MM default: 0.8)
            'max_size': 1.5,           # 1.0-3.0: Largest size in em (MM default: 1.5)
            'speed': 1.0,              # 0.5-2.0: Speed multiplier (MM default: 1.0)
            'comment': 'Snö-animationer baserade på SMHI symbols 15-17, 25-27 (snöbyar/snöfall) + 12-14, 22-24 (snöblandat)'
        },

        # ⚙️ ADVANCED SETTINGS
        'transition_duration': 1000,   # 500-3000: Transition time in ms (MM default: 1000)
        'debug_logging': False,        # True/False: Detailed console logging for troubleshooting
        'fallback_enabled': True,      # True/False: Graceful fallbacks on API errors

        # 🎯 LP156WH4 OPTIMIZATIONS (1366×768 LED LCD panel)
        'lp156wh4_optimizations': {
            'enabled': True,           # True/False: Enable LP156WH4-specific optimizations
            'contrast_boost': 1.1,     # 1.0-1.3: Contrast boost for LED LCD (default: 1.1)
            'brightness_boost': 1.1,   # 1.0-1.3: Brightness boost (default: 1.1)
            'gpu_acceleration': True,  # True/False: GPU acceleration for Pi5 (default: True)
            'target_fps': 60,         # 30/60: Target frame rate for animations (default: 60)
            'comment': 'Optimeringar för LP156WH4 panel och Pi5 GPU-prestanda'
        },

        # 📊 SMHI SYMBOL MAPPING (read-only reference)
        'smhi_mapping_reference': {
            'rain': [8, 9, 10, 18, 19, 20],      # Rain showers and rain
            'snow': [15, 16, 17, 25, 26, 27],    # Snow showers and snowfall
            'sleet': [12, 13, 14, 22, 23, 24],   # Sleet (treated as snow)
            'thunder': [11, 21],                 # Thunder (treated as intense rain)
            'clear': [1, 2, 3, 4, 5, 6, 7],     # Clear weather (no effect)
            'comment': 'SMHI weather symbols → WeatherEffects mapping (används automatiskt av systemet)'
        },

        'comment': 'WeatherEffects ger MagicMirror-kompatibla regn/snö-animationer baserade på SMHI-data'
    }
}

# =============================================================================
# 🎯 IMPORTANT: UNDERSTAND THE DIFFERENCE BETWEEN THE MODES
# =============================================================================

# 📊 FORECAST-ONLY MODE (use_netatmo = False) - DEFAULT & RECOMMENDED FOR BEGINNERS
# ✅ Works out of the box with no extra setup
# ✅ Shows the weather forecast from your chosen provider
# ✅ Shows humidity (from SMHI observations, or from the forecast for YR/Open-Meteo)
# ✅ Shows air pressure from the forecast
# ✅ Simple pressure trend based on forecast data
# ✅ WeatherEffects (rain/snow animations) driven by the weather symbols
# ❌ No actual temperature measured at your location
# ❌ No CO2 measurement or noise level

# 🏠 FORECAST+NETATMO MODE (use_netatmo = True) - FOR ADVANCED USERS WITH A WEATHER STATION
# ✅ Everything from forecast-only mode PLUS:
# ✅ Actual temperature from your Netatmo weather station
# ✅ CO2 measurement and air quality
# ✅ Noise-level measurement
# ✅ Advanced pressure trend based on Netatmo history
# ✅ Smart data blending across multiple stations
# ✅ WeatherEffects keep working (driven by the weather symbols)
# ❌ Requires a Netatmo weather station and API setup

# 💡 RECOMMENDATION: Start with use_netatmo=False, upgrade later if you get a weather station

# =============================================================================
# 🚀 QUICK SETUP GUIDE FOR BEGINNERS
# =============================================================================

# 🎯 STEP 1: BASIC SETUP (FORECAST-ONLY)
#    1. Copy this file: cp reference/config_example.py reference/config.py
#    2. Open config.py in a text editor
#    3. Change the coordinates if you don't live in Stockholm (see cities below)
#    4. Change location_name to your own location
#    5. Save the file and run: python3 app.py
#    ✅ DONE! You have a working weather dashboard

# 🌦️ STEP 2: ENABLE WEATHEREFFECTS (OPTIONAL - RECOMMENDED)
#    1. Open config.py
#    2. Change weather_effects.enabled from False to True
#    3. Save the file and restart: python3 app.py
#    4. Reload the browser page
#    ✅ DONE! Rain/snow animations now appear in bad weather

# 🏠 STEP 3: ADD NETATMO (OPTIONAL - ADVANCED)
#    1. Get a Netatmo weather station
#    2. Go to https://dev.netatmo.com/apps
#    3. Create a new app or use an existing one
#    4. Note down the Client ID and Client Secret
#    5. Complete the OAuth flow to obtain a refresh_token
#    6. Open config.py and set use_netatmo = True
#    7. Replace every 'YOUR_NETATMO_*_HERE' with real values
#    8. Restart: python3 app.py

# 🌅 STEP 4: IMPROVE SUN TIMES (OPTIONAL)
#    1. Go to https://ipgeolocation.io/
#    2. Sign up for a free account (1000 calls/month)
#    3. Copy your API key
#    4. Replace 'YOUR_IPGEOLOCATION_API_KEY_HERE' with your key
#    (If you skip this, a simplified sun calculation is used)

# =============================================================================
# 🌦️ WEATHEREFFECTS QUICK GUIDE - NEW IN PHASE 2
# =============================================================================

# 🚀 QUICK ACTIVATION:
#    1. Set weather_effects.enabled = True in config.py
#    2. Restart the Flask server: python3 app.py
#    3. WeatherEffects activate automatically when the forecast shows rain/snow
#    ✅ DONE! Animations are now driven by the weather data

# 🎚️ INTENSITY SETTINGS:
# - 'auto': Automatic, based on forecast precipitation (RECOMMENDED)
# - 'light': Few particles, slow animations (good for low-end hardware)
# - 'medium': Default particle count and speed
# - 'heavy': Many particles, fast animations (needs decent performance)

# ☔ RAIN TWEAKS:
# - droplet_count: 30 = light rain, 50 = medium, 80 = heavy rain
# - droplet_speed: 3.0 = fast rain, 2.0 = medium, 1.0 = slow rain
# - wind_direction: 'left-to-right' for wind-blown rain

# ❄️ SNOW TWEAKS:
# - flake_count: 15 = light snowfall, 25 = medium, 40 = heavy snowfall
# - characters: ['❄', '❅', '❆'] for Unicode snowflakes (requires font support)
# - sparkle_enabled: True for sparkling snowflakes (more GPU-intensive)

# 🔧 PERFORMANCE TUNING FOR PI3B/PI5:
# - Reduce droplet_count/flake_count if animations stutter
# - Set target_fps to 30 if 60 fps is too demanding
# - Disable gpu_acceleration if it causes problems

# 🐛 TROUBLESHOOTING WEATHEREFFECTS:
# - Set debug_logging = True for detailed console output
# - Check the browser developer tools for JavaScript errors
# - Verify that /api/weather-effects-config returns valid JSON
# - Check that both the CSS and JS for WeatherEffects load

# 🚫 DISABLE WEATHEREFFECTS:
#    1. Set weather_effects.enabled = False in config.py
#    2. Restart the Flask server: python3 app.py
#    3. No rain/snow animations are shown (static weather data only)

# =============================================================================
# WIND UNITS GUIDE - Complete list of available options
# =============================================================================

# ACTIVE: 'land' = Swedish land terminology per the Beaufort scale
# 0: Lugnt (<1 km/h)
# 1-2: Svag vind (1-11 km/h)
# 3-4: Måttlig vind (12-28 km/h)
# 5-6: Frisk vind (29-49 km/h)
# 7-9: Hård vind (50-88 km/h)
# 10-11: Storm (89-117 km/h)
# 12: Orkan (118+ km/h)

# OPTIONS:
# 'sjo'     = Sea terminology: Stiltje, Bris, Kuling, Storm, Orkan
# 'beaufort'= Beaufort 0-12 with Swedish names (Lugnt, Svag vind, etc.)
# 'ms'      = X.X m/s (decimals) - technical measurement
# 'kmh'     = XX km/h (integer) - everyday format

# =============================================================================
# THEME GUIDE
# =============================================================================

# ACTIVE: 'dark' = dark theme (the only fully developed theme)
# WARNING: 'light' = light theme (NOT production-ready - very ugly!)
# 'auto' = switches automatically according to the auto_theme times

# =============================================================================
# REFRESH INTERVAL GUIDE
# =============================================================================

# CURRENT:  15/10 minutes (balanced for a Pi3B)
# Fast:     5/5 minutes (more CPU load)
# Standard: 15/10 minutes (recommended)
# Frugal:   30/20 minutes (low CPU load)

# =============================================================================
# COORDINATES FOR SWEDISH CITIES
# =============================================================================

# Stockholm: 59.3293, 18.0686  (DEFAULT)
# Täby/Ellagård: 59.4644, 18.0698  (ALTERNATIVE - closer to Netatmo stations)
# Gothenburg: 57.7089, 11.9746
# Malmö:     55.6050, 13.0038
# Uppsala:   59.8586, 17.6389
# Linköping: 58.4108, 15.6214
# Örebro:    59.2741, 15.2066
# Västerås:  59.6162, 16.5528

# =============================================================================
# TROUBLESHOOTING - COMMON PROBLEMS AND SOLUTIONS
# =============================================================================

# ❌ PROBLEM: "Import error for config"
# ✅ SOLUTION: Check that config.py exists (not just config_example.py)

# ❌ PROBLEM: "Cannot start without a valid configuration"
# ✅ SOLUTION: Check that config.py was copied correctly and has the right format

# ❌ PROBLEM: "Wrong coordinates/wrong weather"
# ✅ SOLUTION: Check latitude/longitude in config.py

# ❌ PROBLEM: "WeatherEffects don't work" (PHASE 2)
# ✅ SOLUTION: Check that weather_effects.enabled = True and restart the Flask server

# ❌ PROBLEM: "Animations stutter on Pi3B/Pi5" (PHASE 2)
# ✅ SOLUTION: Reduce droplet_count/flake_count or set target_fps to 30

# ❌ PROBLEM: "No effects despite rain/snow" (PHASE 2)
# ✅ SOLUTION: Enable debug_logging and check the console for the weather-symbol mapping

# ❌ PROBLEM: "JavaScript errors for WeatherEffects" (PHASE 2)
# ✅ SOLUTION: Check that /static/js/weather-effects.js loads correctly

# ❌ PROBLEM: "Netatmo authentication error" (ONLY if use_netatmo=True)
# ✅ SOLUTION: Check client_id, client_secret and refresh_token

# ❌ PROBLEM: "No sun times or strange times"
# ✅ SOLUTION: Check the ipgeolocation api_key, or rely on the fallback calculation

# ❌ PROBLEM: "Wind data displayed wrong"
# ✅ SOLUTION: Check the wind_unit setting

# ❌ PROBLEM: "Dashboard shows the wrong mode"
# ✅ SOLUTION: Check the use_netatmo setting (True/False)

# =============================================================================
# HOW TO SWITCH BETWEEN THE MODES
# =============================================================================

# 📊 TO RUN FORECAST-ONLY (DEFAULT):
#    1. Open config.py
#    2. Set: use_netatmo = False
#    3. Save the file
#    4. Restart: python3 app.py
#    → You only see the weather forecast (WeatherEffects keep working)

# 🌦️ TO ENABLE WEATHEREFFECTS:
#    1. Open config.py
#    2. Set: weather_effects.enabled = True
#    3. Save the file
#    4. Restart: python3 app.py
#    → You see rain/snow animations in bad weather

# 🏠 TO ADD NETATMO:
#    1. Set up the Netatmo API credentials first (see guide above)
#    2. Open config.py
#    3. Set: use_netatmo = True
#    4. Save the file
#    5. Restart: python3 app.py
#    → You see the forecast + live data from your weather station

# =============================================================================
# SECURITY AND BACKUP
# =============================================================================

# ⚠️  IMPORTANT: config.py contains sensitive API keys (if you use Netatmo)
# 🔒 NEVER add config.py to Git (it is excluded via .gitignore)
# 💾 BACK UP config.py before upgrades
# 🔄 Use environment variables in production for extra security

# =============================================================================
# SUPPORT AND HELP
# =============================================================================

# 📚 IF YOU NEED HELP:
#    1. Check that you followed the setup guide above
#    2. Read the troubleshooting section
#    3. Test forecast-only mode first (use_netatmo=False)
#    4. Enable WeatherEffects for a richer visual experience
#    5. Check the logs while running python3 app.py
