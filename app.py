#!/usr/bin/env python3
"""
Flask Weather Dashboard - Modern Web Implementation
FAS 2: VILLKORSSTYRD NETATMO-FUNKTIONALITET för oberoende drift
+ TRYCKTREND: API-stöd för trycktrend-funktionalitet
+ CONFIG.PY: Migrerad från JSON till Python config med riktiga kommentarer
+ INTELLIGENT DATAHANTERING: Automatisk fallback till SMHI-only läge
+ FAS 2: SMHI LUFTFUKTIGHET: Integration av luftfuktighetsdata från SMHI observations-API
+ WEATHEREFFECTS: FAS 2 - API-stöd för WeatherEffects-konfiguration och SMHI-integration
+ FAS 3: UV-INDEX - Integration av CAMS UV-data via ADS API
"""

__version__ = '3.2.0'

from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta, timezone
import json
import os
import secrets
import sys
import threading
import time
from typing import Dict, List, Optional

# Lägg till rätt data-katalog i Python path för import av API-klienter
sys.path.append(os.path.join(os.path.dirname(__file__), 'reference', 'data'))

try:
    from smhi_client import SMHIClient
    from netatmo_client import NetatmoClient
    from utils import SunCalculator, get_weather_icon_unicode_char, get_weather_description_short
    from cams_uv_client import CAMSUVClient  # FAS 3: UV-integration
except ImportError as e:
    print(f"❌ Import fel: {e}")
    print("🔧 Kontrollera att reference/data/ finns och innehåller smhi_client.py m.fl.")
    sys.exit(1)

# Flask app setup
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or secrets.token_hex(32)

def _read_asset_version():
    """Läs versionsnummer för cache-busting av statiska filer."""
    try:
        with open(os.path.join(os.path.dirname(__file__), 'VERSION'), 'r', encoding='utf-8') as f:
            return f.read().strip()
    except OSError:
        return __version__

ASSET_VERSION = _read_asset_version()

@app.context_processor
def inject_asset_version():
    return {'asset_version': ASSET_VERSION}

# Skyddar weather_state: tre uppdateringstrådar skriver samtidigt som
# Flask-routes läser från flera request-trådar
state_lock = threading.RLock()

def state_snapshot():
    """Konsistent ögonblicksbild av weather_state för läsning i routes."""
    with state_lock:
        return dict(weather_state)

# Global state för weather data
weather_state = {
    'smhi_data': None,
    'netatmo_data': None,
    'forecast_data': None,
    'daily_forecast_data': None,
    'sun_data': None,
    'last_update': None,
    'config': None,
    'status': 'Startar...',

    # FAS 2: Netatmo-state tracking
    'use_netatmo': True,        # Läses från config
    'netatmo_available': False, # Spårar om Netatmo faktiskt fungerar

    # FAS 2: WeatherEffects state tracking
    'weather_effects_enabled': False,  # Läses från config
    'weather_effects_config': None,     # Cachad WeatherEffects-konfiguration

    # FAS 3: UV-index state tracking
    'uv_enabled': False,        # Läses från config
    'uv_data': None            # Cachad UV-data från CAMS
}

# API clients (initialiseras villkorsstyrt i init_api_clients)
smhi_client = None
netatmo_client = None
sun_calculator = None
uv_client = None  # FAS 3: UV-client

def load_config():
    """Ladda konfiguration från config.py med riktiga Python-kommentarer."""
    try:
        # Lägg till reference-katalogen i Python path
        reference_path = os.path.join(os.path.dirname(__file__), 'reference')
        if reference_path not in sys.path:
            sys.path.insert(0, reference_path)

        # Importera CONFIG från config.py
        from config import CONFIG

        print(f"✅ Konfiguration laddad från config.py")
        print(f"📍 Plats: {CONFIG['display']['location_name']}")
        print(f"🌬️ Vindenheter: {CONFIG['ui']['wind_unit']}")
        print(f"🎨 Tema: {CONFIG['ui']['theme']}")

        # FAS 2: Läs use_netatmo från config
        use_netatmo = CONFIG.get('use_netatmo', True)
        weather_state['use_netatmo'] = use_netatmo
        print(f"🧠 FAS 2: Netatmo-läge: {'AKTIVT' if use_netatmo else 'INAKTIVT (SMHI-only)'}")

        # FAS 2: WeatherEffects config-läsning
        weather_effects_config = CONFIG.get('weather_effects', {})
        weather_effects_enabled = weather_effects_config.get('enabled', False)
        weather_state['weather_effects_enabled'] = weather_effects_enabled
        weather_state['weather_effects_config'] = weather_effects_config

        print(f"🌦️ FAS 2: WeatherEffects: {'AKTIVERAT' if weather_effects_enabled else 'INAKTIVERAT'}")
        if weather_effects_enabled:
            rain_count = weather_effects_config.get('rain_config', {}).get('droplet_count', 50)
            snow_count = weather_effects_config.get('snow_config', {}).get('flake_count', 25)
            intensity = weather_effects_config.get('intensity', 'auto')
            print(f"   🌧️ Regn: {rain_count} droppar, ❄️ Snö: {snow_count} flingor, 🎚️ Intensitet: {intensity}")

        # FAS 3: UV config-läsning
        uv_config = CONFIG.get('cams_uv', {})
        uv_enabled = uv_config.get('enabled', False)
        weather_state['uv_enabled'] = uv_enabled

        print(f"☀️ FAS 3: UV-index: {'AKTIVERAT' if uv_enabled else 'INAKTIVERAT'}")
        if uv_enabled:
            cache_dir = uv_config.get('cache_dir', 'cache')
            update_time = uv_config.get('update_time', '01:00')
            print(f"   💾 Cache: {cache_dir}/uv_cache.json | ⏰ Uppdatering: {update_time}")

        return CONFIG

    except ImportError as e:
        print(f"❌ Kunde inte importera config.py: {e}")
        print("🔧 Kontrollera att reference/config.py finns och har giltigt CONFIG dict")

        # Fallback till JSON om config.py inte finns
        print("🔄 Försöker fallback till config.json...")
        return load_config_json_fallback()

    except Exception as e:
        print(f"❌ Oväntat fel vid config.py-läsning: {e}")
        return None

def load_config_json_fallback():
    """Fallback för att läsa config.json om config.py inte fungerar."""
    config_path = os.path.join(os.path.dirname(__file__), 'reference', 'config.json')

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        print(f"⚠️ Fallback: Konfiguration laddad från {config_path}")
        print("💡 TIP: Skapa reference/config.py för bättre kommentarer!")

        # FAS 2: Fallback till False för weather_effects om det saknas i JSON
        weather_state['use_netatmo'] = config.get('use_netatmo', True)
        weather_state['weather_effects_enabled'] = config.get('weather_effects', {}).get('enabled', False)
        weather_state['weather_effects_config'] = config.get('weather_effects', {})

        # FAS 3: Fallback för UV
        weather_state['uv_enabled'] = config.get('cams_uv', {}).get('enabled', False)

        print(f"🧠 FAS 2: Netatmo-läge (fallback): {'AKTIVT' if weather_state['use_netatmo'] else 'INAKTIVT'}")
        print(f"🌦️ FAS 2: WeatherEffects (fallback): {'AKTIVERAT' if weather_state['weather_effects_enabled'] else 'INAKTIVERAT'}")
        print(f"☀️ FAS 3: UV-index (fallback): {'AKTIVERAT' if weather_state['uv_enabled'] else 'INAKTIVERAT'}")

        return config

    except FileNotFoundError:
        print(f"❌ Varken config.py eller config.json hittades!")
        print(f"🔧 Skapa antingen reference/config.py eller {config_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ JSON-fel i fallback config.json: {e}")
        return None

def validate_weather_effects_config(config_data):
    """
    FAS 2: Validera WeatherEffects-konfiguration med robust error handling.

    Args:
        config_data (dict): WeatherEffects-konfiguration från config.py

    Returns:
        dict: Validerad konfiguration med fallback-värden
    """
    # Default-konfiguration (MagicMirror-kompatibel)
    default_config = {
        'enabled': False,
        'intensity': 'auto',
        'rain_config': {
            'droplet_count': 50,
            'droplet_speed': 2.0,
            'wind_direction': 'none',
            'enable_splashes': False
        },
        'snow_config': {
            'flake_count': 25,
            'characters': ['*', '+'],
            'sparkle_enabled': False,
            'min_size': 0.8,
            'max_size': 1.5,
            'speed': 1.0
        },
        'transition_duration': 1000,
        'debug_logging': False,
        'fallback_enabled': True,
        'lp156wh4_optimizations': {
            'enabled': True,
            'contrast_boost': 1.1,
            'brightness_boost': 1.1,
            'gpu_acceleration': True,
            'target_fps': 60
        }
    }

    if not config_data or not isinstance(config_data, dict):
        print("⚠️ Ogiltig WeatherEffects-config, använder default")
        return default_config

    # Deep merge med default config
    validated_config = default_config.copy()

    # Validera top-level properties
    for key, default_value in default_config.items():
        if key in config_data:
            if isinstance(default_value, dict):
                # Deep merge för nested objects
                validated_config[key] = {**default_value, **config_data.get(key, {})}
            else:
                validated_config[key] = config_data[key]

    # Validera specifika värden
    try:
        # Intensitet
        valid_intensities = ['auto', 'light', 'medium', 'heavy']
        if validated_config['intensity'] not in valid_intensities:
            print(f"⚠️ Ogiltig intensitet '{validated_config['intensity']}', använder 'auto'")
            validated_config['intensity'] = 'auto'

        # Rain config validering
        rain_config = validated_config['rain_config']
        rain_config['droplet_count'] = max(10, min(100, int(rain_config.get('droplet_count', 50))))
        rain_config['droplet_speed'] = max(0.5, min(5.0, float(rain_config.get('droplet_speed', 2.0))))

        valid_wind_directions = ['none', 'left-to-right', 'right-to-left']
        if rain_config.get('wind_direction') not in valid_wind_directions:
            rain_config['wind_direction'] = 'none'

        # Snow config validering
        snow_config = validated_config['snow_config']
        snow_config['flake_count'] = max(10, min(50, int(snow_config.get('flake_count', 25))))
        snow_config['min_size'] = max(0.5, min(2.0, float(snow_config.get('min_size', 0.8))))
        snow_config['max_size'] = max(1.0, min(3.0, float(snow_config.get('max_size', 1.5))))
        snow_config['speed'] = max(0.5, min(2.0, float(snow_config.get('speed', 1.0))))

        # Säkerställ att max_size >= min_size
        if snow_config['max_size'] < snow_config['min_size']:
            snow_config['max_size'] = snow_config['min_size'] + 0.5

        # Characters validering
        if not isinstance(snow_config.get('characters'), list) or len(snow_config['characters']) == 0:
            snow_config['characters'] = ['*', '+']

        # Transition duration
        validated_config['transition_duration'] = max(500, min(3000, int(validated_config.get('transition_duration', 1000))))

        print("✅ WeatherEffects-konfiguration validerad")

    except (ValueError, TypeError) as e:
        print(f"⚠️ Fel vid WeatherEffects config-validering: {e}")
        print("🔄 Använder säkra default-värden")

    return validated_config

def get_smhi_weather_effect_type(weather_symbol):
    """
    FAS 2: Konvertera SMHI weather symbol till WeatherEffects-typ.

    Args:
        weather_symbol (int): SMHI vädersymbol (1-27)

    Returns:
        str: WeatherEffects-typ ('rain', 'snow', 'sleet', 'thunder', 'clear')
    """
    if not isinstance(weather_symbol, (int, float)) or weather_symbol < 1 or weather_symbol > 27:
        return 'clear'

    symbol = int(weather_symbol)

    # SMHI symbol mapping
    if symbol in [8, 9, 10, 18, 19, 20]:          # Regnskurar och regn
        return 'rain'
    elif symbol in [15, 16, 17, 25, 26, 27]:      # Snöbyar och snöfall
        return 'snow'
    elif symbol in [12, 13, 14, 22, 23, 24]:      # Snöblandat regn
        return 'sleet'
    elif symbol in [11, 21]:                      # Åska
        return 'thunder'
    else:                                         # Klart väder (1-7)
        return 'clear'


def get_intelligent_weather_effect_type(weather_symbol, netatmo_data=None, smhi_temperature=None):
    """
    SMART WEATHEREFFECTS: Intelligent beslut baserat på Netatmo-mätning + SMHI-prognos.

    Logik:
    - REGN: Bara om Netatmo faktiskt mäter nederbörd (ground truth)
    - SNÖ: Lita på SMHI + temperaturkontroll (Netatmo kan inte mäta snö)
    - SMHI-only: Använd SMHI-prognos som fallback

    Args:
        weather_symbol (int): SMHI vädersymbol (1-27)
        netatmo_data (dict): Netatmo-data med regnmätning
        smhi_temperature (float): Aktuell temperatur för snökontroll

    Returns:
        str: WeatherEffects-typ ('rain', 'snow', 'sleet', 'thunder', 'clear')
    """
    # Hämta SMHI-baserad effekttyp
    smhi_effect = get_smhi_weather_effect_type(weather_symbol)

    # === SNÖ-LOGIK: Lita på SMHI (Netatmo kan inte mäta snö) ===
    if smhi_effect in ['snow', 'sleet']:
        # Kontrollera temperatur för att verifiera snö
        if smhi_temperature is not None and smhi_temperature < 2.0:
            print(f"❄️ Snö-effekt aktiverad: SMHI säger snö, temp {smhi_temperature}°C (Netatmo kan inte mäta)")
            return smhi_effect
        else:
            temp_str = f"{smhi_temperature}°C" if smhi_temperature else "okänd"
            print(f"⚠️ SMHI säger snö men temp {temp_str} - för varmt, använder 'clear'")
            return 'clear'

    # === ÅSKA-LOGIK: Lita på SMHI (Netatmo har inte åskdetektor) ===
    if smhi_effect == 'thunder':
        print(f"⚡ Åsk-effekt aktiverad: SMHI säger åska")
        return 'thunder'

    # === REGN-LOGIK: Netatmo är ground truth ===
    if smhi_effect == 'rain':
        # Kontrollera om vi har Netatmo-data
        if netatmo_data is None:
            # SMHI-only läge: Lita på SMHI-prognos
            print(f"🌧️ Regn-effekt aktiverad: SMHI-only läge (ingen Netatmo)")
            return 'rain'

        # Netatmo tillgänglig: Kontrollera faktisk nederbörd
        rain_measured = netatmo_data.get('rain', 0) or 0
        rain_1h = netatmo_data.get('rain_sum_1', 0) or 0

        if rain_measured > 0 or rain_1h > 0:
            # FAKTISKT REGN mätt av Netatmo
            print(f"🌧️ Regn-effekt aktiverad: Netatmo mäter {rain_measured} mm (1h: {rain_1h} mm)")
            return 'rain'
        else:
            # INGET REGN enligt Netatmo trots SMHI-prognos
            print(f"⛅ Regn-effekt INAKTIVERAD: SMHI säger regn men Netatmo mäter 0 mm (ground truth)")
            return 'clear'

    # === KLART VÄDER ===
    print(f"☀️ Ingen vädereffekt: SMHI symbol {weather_symbol} → '{smhi_effect}'")
    return 'clear'


def init_api_clients(config):
    """FAS 2+3: Villkorsstyrd initialisering av API-klienter."""
    global smhi_client, netatmo_client, sun_calculator, uv_client

    use_netatmo = weather_state['use_netatmo']
    use_uv = weather_state['uv_enabled']  # FAS 3

    try:
        # SMHI Client (alltid obligatorisk)
        smhi_lat = config['smhi']['latitude']
        smhi_lon = config['smhi']['longitude']
        smhi_client = SMHIClient(smhi_lat, smhi_lon)
        print(f"✅ SMHI-klient initierad för {smhi_lat}, {smhi_lon}")

        # FAS 2: Villkorsstyrd Netatmo Client
        if use_netatmo:
            try:
                netatmo_config = config['netatmo']
                netatmo_client = NetatmoClient(
                    netatmo_config['client_id'],
                    netatmo_config['client_secret'],
                    netatmo_config['refresh_token'],
                    netatmo_config.get('preferred_station')
                )
                weather_state['netatmo_available'] = True
                print("✅ FAS 2: Netatmo-klient initierad med trycktrend-stöd")
            except Exception as e:
                print(f"❌ FAS 2: Netatmo-initialisering misslyckades: {e}")
                print("🔄 FAS 2: Fortsätter i SMHI-only läge")
                netatmo_client = None
                weather_state['netatmo_available'] = False
                # Behåll use_netatmo=True men markera som otillgänglig
        else:
            netatmo_client = None
            weather_state['netatmo_available'] = False
            print("📊 FAS 2: Netatmo INAKTIVERAT i config - kör SMHI-only läge")

        # Sun Calculator (alltid obligatorisk)
        api_key = config.get('ipgeolocation', {}).get('api_key', '').strip() or None
        sun_calculator = SunCalculator(api_key)
        print(f"✅ Sol-kalkylator initierad ({'API' if api_key else 'Fallback'})")

        # FAS 3: Villkorsstyrd UV Client
        if use_uv:
            try:
                uv_config = config.get('cams_uv', {})
                cache_dir = uv_config.get('cache_dir', 'cache')
                uv_client = CAMSUVClient(smhi_lat, smhi_lon, cache_dir=cache_dir)
                print(f"✅ FAS 3: UV-klient initierad (CAMS via ADS API)")
            except Exception as e:
                print(f"❌ FAS 3: UV-initialisering misslyckades: {e}")
                print("🔄 FAS 3: Fortsätter utan UV-funktionalitet")
                uv_client = None
        else:
            uv_client = None
            print("📊 FAS 3: UV-index INAKTIVERAT i config (cams_uv.enabled=False)")

        # FAS 2: WeatherEffects sammanfattning
        if weather_state['weather_effects_enabled']:
            effect_config = weather_state['weather_effects_config']
            rain_count = effect_config.get('rain_config', {}).get('droplet_count', 50)
            snow_count = effect_config.get('snow_config', {}).get('flake_count', 25)
            print(f"🌦️ WeatherEffects aktiverat - Regn: {rain_count}, Snö: {snow_count}")

        # FAS 2+3: Sammanfattning av initialiserat läge
        mode_summary = "SMHI + Netatmo" if weather_state['netatmo_available'] else "SMHI-only"
        effects_summary = " + WeatherEffects" if weather_state['weather_effects_enabled'] else ""
        uv_summary = " + UV" if use_uv and uv_client else ""
        print(f"🎯 FAS 2+3: Systemläge - {mode_summary}{effects_summary}{uv_summary}")

        return True

    except Exception as e:
        print(f"❌ Fel vid initialisering av API-klienter: {e}")
        return False

def update_weather_data():
    """FAS 2+3: Uppdatera väderdata med villkorsstyrd Netatmo-hantering + SMHI luftfuktighet + UV."""
    global weather_state

    try:
        print(f"🔄 FAS 2+3: Uppdaterar väderdata... ({datetime.now().strftime('%H:%M:%S')})")

        smhi_ok = False

        # FAS 2: SMHI data med luftfuktighet (alltid obligatorisk)
        if smhi_client:
            try:
                # FAS 2: KRITISK ÄNDRING - Använd get_current_weather_with_humidity() istället för get_current_weather()
                smhi_data = smhi_client.get_current_weather_with_humidity()
                forecast_data = smhi_client.get_12h_forecast()
                daily_forecast_data = smhi_client.get_daily_forecast(5)

                if smhi_data:
                    smhi_ok = True
                    with state_lock:
                        weather_state['smhi_data'] = smhi_data
                        weather_state['forecast_data'] = forecast_data
                        weather_state['daily_forecast_data'] = daily_forecast_data

                    humidity = smhi_data.get('humidity')
                    humidity_station = smhi_data.get('humidity_station')
                    humidity_age = smhi_data.get('humidity_age_minutes')

                    if humidity is not None:
                        print(f"✅ FAS 2: SMHI-data med luftfuktighet uppdaterad - {humidity}% från {humidity_station} (ålder: {humidity_age} min)")
                    else:
                        print("⚠️ FAS 2: SMHI-data uppdaterad men ingen luftfuktighet tillgänglig")

                    # FAS 2: WeatherEffects debugging
                    if weather_state['weather_effects_enabled'] and smhi_data.get('weather_symbol'):
                        weather_symbol = smhi_data['weather_symbol']
                        effect_type = get_smhi_weather_effect_type(weather_symbol)
                        precipitation = smhi_data.get('precipitation', 0)
                        print(f"🌦️ FAS 2: SMHI Symbol {weather_symbol} → WeatherEffect '{effect_type}' (precipitation: {precipitation}mm)")
                else:
                    print("❌ FAS 2: SMHI-data misslyckades")
            except Exception as e:
                print(f"❌ FAS 2: SMHI-uppdatering kraschade: {e}")
                import traceback
                traceback.print_exc()

        # FAS 2: Villkorsstyrd Netatmo-uppdatering
        if netatmo_client and weather_state['netatmo_available']:
            try:
                netatmo_data = netatmo_client.get_current_weather()
                with state_lock:
                    weather_state['netatmo_data'] = netatmo_data

                # Logga trycktrend om tillgänglig
                if netatmo_data and 'pressure_trend' in netatmo_data:
                    trend_data = netatmo_data['pressure_trend']
                    print(f"✅ FAS 2: Netatmo-data uppdaterad - Trycktrend: {trend_data.get('trend', 'n/a')} ({trend_data.get('analysis_quality', 'poor')})")
                else:
                    print("✅ FAS 2: Netatmo-data uppdaterad (ingen trycktrend)")
            except Exception as e:
                print(f"❌ FAS 2: Netatmo-uppdatering misslyckades: {e}")
                with state_lock:
                    weather_state['netatmo_available'] = False
        else:
            with state_lock:
                weather_state['netatmo_data'] = None
            if weather_state['use_netatmo']:
                print("📊 FAS 2: Netatmo ej tillgänglig - kör SMHI-only läge")

        # FAS 3: Villkorsstyrd UV-uppdatering
        if uv_client and weather_state['uv_enabled']:
            try:
                uv_data = uv_client.get_uv_index()
                with state_lock:
                    weather_state['uv_data'] = uv_data

                if uv_data:
                    uv_index = uv_data.get('uv_index', 0)
                    risk_level = uv_data.get('risk_level', 'low')
                    print(f"✅ FAS 3: UV-data uppdaterad - UV {uv_index} ({risk_level})")
                else:
                    print("⚠️ FAS 3: UV-data misslyckades (använder cache om tillgänglig)")
            except Exception as e:
                print(f"❌ FAS 3: UV-uppdatering misslyckades: {e}")
        else:
            with state_lock:
                weather_state['uv_data'] = None

        # Soltider
        if sun_calculator and smhi_client:
            sun_data = sun_calculator.get_sun_times(
                smhi_client.latitude,
                smhi_client.longitude
            )
            with state_lock:
                weather_state['sun_data'] = sun_data

        # Ärlig status: last_update bumpas bara när kärndatan (SMHI) faktiskt
        # hämtades, så att frontend kan upptäcka stale data
        with state_lock:
            if smhi_ok:
                weather_state['last_update'] = datetime.now().isoformat()
                weather_state['status'] = 'Uppdaterad'
            else:
                weather_state['status'] = 'Fel: SMHI-uppdatering misslyckades'

    except Exception as e:
        print(f"❌ Fel vid väderuppdatering: {e}")
        with state_lock:
            weather_state['status'] = f'Fel: {str(e)}'


def get_current_theme():
    """Hämta aktuellt tema baserat på config och tid."""
    if not weather_state['config']:
        return 'dark'

    theme_config = weather_state['config'].get('ui', {}).get('theme', 'dark')

    if theme_config == 'auto':
        auto_config = weather_state['config'].get('ui', {}).get('auto_theme', {})
        night_start = auto_config.get('night_start', '21:00')
        night_end = auto_config.get('night_end', '06:00')

        now = datetime.now()
        current_time = now.strftime('%H:%M')

        # Enkel tid-jämförelse
        if night_start <= current_time or current_time < night_end:
            return auto_config.get('night_theme', 'dark')
        else:
            return auto_config.get('day_theme', 'light')

    return theme_config


def create_smhi_pressure_trend_fallback(smhi_data):
    """
    FAS 2: Skapa SMHI-baserad trycktrend-fallback från prognosdata.

    Args:
        smhi_data (dict): SMHI väderdata

    Returns:
        dict: Förenkla trycktrend-data i Netatmo-format
    """
    if not smhi_data:
        return {
            'trend': 'n/a',
            'direction': 'steady',
            'change': 0,
            'analysis_quality': 'poor',
            'source': 'unavailable'
        }

    # Hämta tryckvärden från SMHI-prognos (om tillgängligt)
    current_pressure = smhi_data.get('pressure')

    if current_pressure is None:
        return {
            'trend': 'n/a',
            'direction': 'steady',
            'change': 0,
            'analysis_quality': 'poor',
            'source': 'smhi_fallback'
        }

    # Enkel trend-analys baserat på SMHI-symbol
    weather_symbol = smhi_data.get('weather_symbol', 1)

    # Approximation baserat på vädersymbol
    # Regn/moln (7-27) = fallande tryck
    # Klart (1-6) = stigande/stabilt tryck
    if weather_symbol >= 7:
        trend = 'falling'
        direction = 'down'
        change = -2  # Approximerad förändring
    else:
        trend = 'stable'
        direction = 'steady'
        change = 0

    return {
        'trend': trend,
        'direction': direction,
        'change': change,
        'analysis_quality': 'poor',
        'source': 'smhi_fallback'
    }


def format_api_response_with_pressure_trend(netatmo_data, smhi_data):
    """
    FAS 2: Formatera Netatmo-data för API-respons med intelligent trycktrend-hantering.

    Args:
        netatmo_data (dict): Netatmo väderdata
        smhi_data (dict): SMHI väderdata (för fallback)

    Returns:
        dict: Formaterad data med trycktrend
    """
    if not netatmo_data:
        return None

    # Kopiera all data
    formatted_data = netatmo_data.copy()

    # FAS 2: Intelligent trycktrend-hantering
    if 'pressure_trend' in netatmo_data and netatmo_data['pressure_trend']['trend'] != 'n/a':
        # Netatmo trycktrend är tillgänglig och valid
        formatted_trend = {
            'trend': netatmo_data['pressure_trend']['trend'],
            'trend5': netatmo_data['pressure_trend'].get('trend5', netatmo_data['pressure_trend']['trend']),
            'direction': netatmo_data['pressure_trend'].get('direction', 'steady'),
            'change': netatmo_data['pressure_trend'].get('change', 0),
            'pressure_change': netatmo_data['pressure_trend'].get('pressure_change', 0),
            'analysis_quality': netatmo_data['pressure_trend'].get('analysis_quality', 'poor'),
            'source': 'netatmo'
        }
        formatted_data['pressure_trend'] = formatted_trend
        print(f"📊 FAS 2: API - Netatmo trycktrend: {formatted_trend['trend']} ({formatted_trend['analysis_quality']})")
    else:
        # FAS 2: Använd SMHI-fallback om Netatmo-trend är n/a
        smhi_fallback = create_smhi_pressure_trend_fallback(smhi_data)
        formatted_data['pressure_trend'] = smhi_fallback
        print(f"📊 FAS 2: API - SMHI trycktrend-fallback: {smhi_fallback['trend']}")

    return formatted_data

# === FLASK ROUTES ===

@app.route('/')
def index():
    location_name = "Stockholm"
    if weather_state['config']:
        location_name = weather_state['config'].get('display', {}).get('location_name', 'Stockholm')

    current_theme = get_current_theme()

    # FAS 2+3: Tillhandahåll WeatherEffects och UV-status till template
    template_vars = {
        'location_name': location_name,
        'theme': current_theme,
        'weather_effects_enabled': weather_state['weather_effects_enabled'],
        'uv_enabled': weather_state['uv_enabled']  # FAS 3
    }

    return render_template('index.html', **template_vars)

@app.route('/api/current')
def api_current_weather():
    """FAS 2+3: API endpoint för aktuell väderdata med intelligent Netatmo-hantering och UV."""

    state = state_snapshot()

    # FAS 2: Villkorsstyrd Netatmo-formatering
    formatted_netatmo = None
    if state['netatmo_data'] and state['netatmo_available']:
        formatted_netatmo = format_api_response_with_pressure_trend(
            state['netatmo_data'],
            state['smhi_data']
        )

    # FAS 2+3: Utökad config för frontend-intelligens
    ui_config = None
    if state['config']:
        ui_config = {
            'wind_unit': state['config'].get('ui', {}).get('wind_unit', 'land'),
            'pressure_display': state['config'].get('ui', {}).get('pressure_display', 'numeric'),
            'icon_pack': state['config'].get('ui', {}).get('icon_pack', 'weather-icons'),  # IKONPAKET: väderikonuppsättning
            'use_netatmo': state['use_netatmo'],  # NYT: För frontend-detektering
            'netatmo_available': state['netatmo_available'],  # NYT: Faktisk tillgänglighet
            'weather_effects_enabled': state['weather_effects_enabled'],  # FAS 2: WeatherEffects-status
            'uv_enabled': state['uv_enabled']  # FAS 3: UV-status
        }

    response_data = {
        'smhi': state['smhi_data'],  # FAS 2: Nu innehåller humidity från get_current_weather_with_humidity()
        'netatmo': formatted_netatmo,  # Kan vara None i SMHI-only läge
        'sun': state['sun_data'],
        'last_update': state['last_update'],
        'theme': get_current_theme(),
        'status': state['status'],
        'config': ui_config
    }

    # FAS 2+3: Debug-logging för API-respons
    mode = "SMHI + Netatmo" if formatted_netatmo else "SMHI-only"
    effects = " + WeatherEffects" if state['weather_effects_enabled'] else ""
    uv = " + UV" if state['uv_enabled'] else ""
    smhi_humidity = state['smhi_data'].get('humidity') if state['smhi_data'] else None
    humidity_info = f" (humidity: {smhi_humidity}%)" if smhi_humidity is not None else " (no humidity)"
    print(f"🌐 FAS 2+3: API Response - {mode}{effects}{uv}{humidity_info}")

    return jsonify(response_data)

@app.route('/api/forecast')
def api_forecast():
    state = state_snapshot()
    return jsonify({
        'forecast': state['forecast_data'],
        'last_update': state['last_update']
    })

@app.route('/api/daily')
def api_daily_forecast():
    state = state_snapshot()
    return jsonify({
        'daily_forecast': state['daily_forecast_data'],
        'last_update': state['last_update']
    })

@app.route('/api/status')
def api_status():
    """FAS 2+3: API endpoint för systemstatus med Netatmo-info, WeatherEffects och UV."""
    state = state_snapshot()

    # FAS 2: Lägg till humidity-status
    smhi_humidity_available = (
        state['smhi_data'] is not None and
        state['smhi_data'].get('humidity') is not None
    )

    return jsonify({
        'status': state['status'],
        'last_update': state['last_update'],
        'theme': get_current_theme(),
        'config_loaded': state['config'] is not None,
        'smhi_active': smhi_client is not None,
        'smhi_humidity_available': smhi_humidity_available,  # FAS 2: NYT - SMHI luftfuktighet tillgänglig
        'netatmo_configured': state['use_netatmo'],  # FAS 2: Konfigurerat
        'netatmo_active': state['netatmo_available'],  # FAS 2: Faktiskt tillgängligt
        'sun_calc_active': sun_calculator is not None,
        'pressure_trend_available': (
            state['netatmo_data'] is not None and
            'pressure_trend' in state['netatmo_data'] and
            state['netatmo_data']['pressure_trend']['trend'] != 'n/a'
        ),
        'system_mode': 'SMHI + Netatmo' if state['netatmo_available'] else 'SMHI-only',  # FAS 2: Systemläge
        'weather_effects_enabled': state['weather_effects_enabled'],  # FAS 2: WeatherEffects-status
        'weather_effects_config_loaded': state['weather_effects_config'] is not None,  # FAS 2: Config-status
        'uv_enabled': state['uv_enabled'],  # FAS 3: UV-status
        'uv_available': state['uv_data'] is not None  # FAS 3: UV-data tillgänglig
    })

@app.route('/api/theme')
def api_theme():
    return jsonify({
        'theme': get_current_theme(),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/pressure_trend')
def api_pressure_trend():
    """Dedikerad API endpoint för trycktrend-data (för debugging)."""
    state = state_snapshot()

    if not state['netatmo_data'] and not state['smhi_data']:
        return jsonify({
            'error': 'Ingen väderdata tillgänglig',
            'pressure_trend': None,
            'system_mode': 'No data'
        })

    # FAS 2: Intelligent trycktrend-respons
    if state['netatmo_data'] and state['netatmo_available']:
        pressure_trend = state['netatmo_data'].get('pressure_trend')
        current_pressure = state['netatmo_data'].get('pressure')
        source = 'netatmo'
    else:
        # FAS 2: SMHI-fallback
        pressure_trend = create_smhi_pressure_trend_fallback(state['smhi_data'])
        current_pressure = state['smhi_data'].get('pressure') if state['smhi_data'] else None
        source = 'smhi_fallback'

    return jsonify({
        'pressure_trend': pressure_trend,
        'current_pressure': current_pressure,
        'timestamp': state['last_update'],
        'source': source,
        'system_mode': 'SMHI + Netatmo' if state['netatmo_available'] else 'SMHI-only'
    })

# === FAS 3: NYT API ENDPOINT FÖR UV-INDEX ===

@app.route('/api/uv')
def api_uv():
    """
    FAS 3: API endpoint för UV-index data från CAMS.

    Returns:
        JSON: UV-index data med risknivå eller error
    """
    try:
        print("☀️ FAS 3: UV API anropat")

        state = state_snapshot()

        # Kontrollera om UV är aktiverat
        if not state['uv_enabled']:
            return jsonify({
                'available': False,
                'reason': 'UV-index inaktiverat i config'
            })

        # Kontrollera om UV-data finns
        if not state['uv_data']:
            return jsonify({
                'available': False,
                'reason': 'UV-data ej tillgänglig'
            })

        uv_data = state['uv_data']

        response = {
            'available': True,
            'uv_index': uv_data.get('uv_index', 0),
            'peak_hour': uv_data.get('peak_hour'),
            'risk_level': uv_data.get('risk_level', 'low'),
            'risk_text': uv_data.get('risk_text', 'Låg UV-risk'),
            'color': uv_data.get('color', 'green'),
            'updated': uv_data.get('timestamp'),
            'source': uv_data.get('source', 'CAMS ADS'),
            'coordinates': uv_data.get('coordinates', {})
        }

        print(f"✅ FAS 3: UV API Response - UV {response['uv_index']} ({response['risk_level']})")

        return jsonify(response)

    except Exception as e:
        print(f"❌ FAS 3: UV API fel: {e}")
        return jsonify({
            'available': False,
            'reason': f'Fel vid UV-hämtning: {str(e)}'
        })

# === FAS 2: NYT API ENDPOINT FÖR WEATHEREFFECTS ===

@app.route('/api/weather-effects-config')
def api_weather_effects_config():
    """
    FAS 2: API endpoint för WeatherEffects-konfiguration.

    Returns:
        JSON: Validerad WeatherEffects-konfiguration för frontend
    """
    try:
        print("🌦️ FAS 2: WeatherEffects config API anropat")

        # Kontrollera att config är laddad
        if not weather_state['config']:
            print("❌ FAS 2: Ingen huvudkonfiguration laddad")
            return jsonify({
                'error': 'Konfiguration ej tillgänglig',
                'enabled': False,
                'fallback_reason': 'main_config_missing'
            }), 500

        state = state_snapshot()

        # Hämta WeatherEffects-konfiguration
        raw_weather_effects_config = state.get('weather_effects_config', {})

        # Validera konfigurationen
        validated_config = validate_weather_effects_config(raw_weather_effects_config)

        # Lägg till SMHI-integration data om SMHI-data finns
        smhi_integration = {}
        if state['smhi_data']:
            weather_symbol = state['smhi_data'].get('weather_symbol')
            precipitation = state['smhi_data'].get('precipitation', 0)
            wind_direction = state['smhi_data'].get('wind_direction', 0)
            temperature = state['smhi_data'].get('temperature')

            if weather_symbol:
                # INTELLIGENT BESLUT: Ta hänsyn till Netatmo-mätning
                netatmo_data = state.get('netatmo_data') if state.get('netatmo_available') else None
                effect_type = get_intelligent_weather_effect_type(
                    weather_symbol,
                    netatmo_data=netatmo_data,
                    smhi_temperature=temperature
                )

                smhi_integration = {
                    'weather_symbol': weather_symbol,
                    'effect_type': effect_type,
                    'precipitation': precipitation,
                    'wind_direction': wind_direction,
                    'temperature': temperature,
                    'netatmo_used': netatmo_data is not None
                }

                print(f"🌦️ FAS 2: WeatherEffects config - Symbol {weather_symbol} → '{effect_type}' (Netatmo: {smhi_integration['netatmo_used']})")

        response_data = {
            **validated_config,
            'smhi_integration': smhi_integration,
            'timestamp': datetime.now().isoformat()
        }

        return jsonify(response_data)

    except Exception as e:
        print(f"❌ FAS 2: WeatherEffects config API fel: {e}")
        return jsonify({
            'error': f'Fel vid config-hämtning: {str(e)}',
            'enabled': False,
            'fallback_reason': 'api_error'
        }), 500

@app.route('/api/weather')
def api_weather():
    """Kombinerad API endpoint för all väderdata (inkl. WeatherEffects-info)."""
    state = state_snapshot()
    return jsonify({
        'current': state['smhi_data'],
        'netatmo': state['netatmo_data'],
        'forecast': state['forecast_data'],
        'daily_forecast': state['daily_forecast_data'],
        'sun': state['sun_data'],
        'last_update': state['last_update'],
        'theme': get_current_theme(),
        'status': state['status'],
        'weather_effects_enabled': state['weather_effects_enabled']
    })

@app.route('/api/weather-effects-debug')
def api_weather_effects_debug():
    """FAS 2: Debug endpoint för WeatherEffects troubleshooting."""
    state = state_snapshot()

    debug_info = {
        'enabled': state['weather_effects_enabled'],
        'config_loaded': state['weather_effects_config'] is not None,
        'smhi_data_available': state['smhi_data'] is not None,
        'netatmo_available': state['netatmo_available'],
        'timestamp': datetime.now().isoformat()
    }

    if state['smhi_data']:
        weather_symbol = state['smhi_data'].get('weather_symbol')
        precipitation = state['smhi_data'].get('precipitation', 0)
        temperature = state['smhi_data'].get('temperature')

        netatmo_data = state.get('netatmo_data') if state.get('netatmo_available') else None
        effect_type = get_intelligent_weather_effect_type(
            weather_symbol,
            netatmo_data=netatmo_data,
            smhi_temperature=temperature
        )

        debug_info['smhi_analysis'] = {
            'weather_symbol': weather_symbol,
            'effect_type_calculated': effect_type,
            'precipitation': precipitation,
            'temperature': temperature,
            'netatmo_used': netatmo_data is not None
        }

        if netatmo_data:
            rain_measured = netatmo_data.get('rain', 0) or 0
            rain_1h = netatmo_data.get('rain_sum_1', 0) or 0
            debug_info['netatmo_rain'] = {
                'current': rain_measured,
                'sum_1h': rain_1h
            }

    return jsonify(debug_info)

# ============================================================================
# Här slutar del ett
# ============================================================================
# ============================================================================
# Här börjar del två
# ============================================================================

# === BACKGROUND TASKS ===

def background_updater():
    """Huvudloop för väderuppdateringar."""
    if not weather_state['config']:
        return

    update_weather_data()

    refresh_interval = weather_state['config'].get('ui', {}).get('refresh_interval_minutes', 15)
    refresh_seconds = refresh_interval * 60

    while True:
        time.sleep(refresh_seconds)
        try:
            update_weather_data()
        except Exception as e:
            # Loopen får aldrig dö - då slutar all datauppdatering tyst
            print(f"❌ Oväntat fel i bakgrunds-uppdateraren: {e}")

def netatmo_updater():
    """FAS 2: Villkorsstyrd snabb loop för Netatmo-uppdateringar."""
    if not weather_state['config'] or not weather_state['use_netatmo']:
        print("🔄 FAS 2: Netatmo-uppdaterare inaktiverad (use_netatmo=False)")
        return

    netatmo_interval = weather_state['config'].get('ui', {}).get('netatmo_refresh_interval_minutes', 10)
    netatmo_seconds = netatmo_interval * 60

    while True:
        time.sleep(netatmo_seconds)

        # FAS 2: Kör bara om Netatmo är tillgängligt
        if netatmo_client and weather_state['netatmo_available']:
            try:
                netatmo_data = netatmo_client.get_current_weather()
                with state_lock:
                    weather_state['netatmo_data'] = netatmo_data

                # Logga trycktrend-uppdatering
                if netatmo_data and 'pressure_trend' in netatmo_data:
                    trend_data = netatmo_data['pressure_trend']
                    print(f"🔄 FAS 2: Netatmo snabb-uppdatering: {trend_data.get('trend', 'n/a')} - {trend_data.get('analysis_quality', 'poor')}")
                else:
                    print("🔄 FAS 2: Netatmo snabb-uppdatering: Ingen trycktrend-data")

            except Exception as e:
                print(f"❌ FAS 2: Netatmo snabb-uppdatering fel: {e}")
                # Behåll befintlig data men logga felet
        else:
            print("🔄 FAS 2: Netatmo snabb-uppdaterare vilar (klient ej tillgänglig)")

def uv_updater():
    """
    FAS 3: Daglig UV-uppdaterare som kör kl. 01:00.

    Uppdaterar UV-data från CAMS en gång per dygn.
    """
    if not weather_state['config'] or not weather_state['uv_enabled']:
        print("🔄 FAS 3: UV-uppdaterare inaktiverad (cams_uv.enabled=False)")
        return

    # Hämta uppdateringstid från config
    uv_config = weather_state['config'].get('cams_uv', {})
    update_time_str = uv_config.get('update_time', '01:00')  # Default: 01:00

    try:
        update_hour, update_minute = map(int, update_time_str.split(':'))
    except (ValueError, AttributeError):
        print(f"⚠️ FAS 3: Ogiltig update_time '{update_time_str}', använder 01:00")
        update_hour, update_minute = 1, 0

    print(f"✅ FAS 3: UV-uppdaterare startad (daglig uppdatering kl. {update_hour:02d}:{update_minute:02d})")

    # Initial hämtning om cache saknas - görs här i tråden (CAMS kan ta
    # 60-180 s) så att Flask hinner börja lyssna på porten direkt vid start
    cache_dir = uv_config.get('cache_dir', 'cache')
    cache_file = os.path.join(cache_dir, 'uv_cache.json')
    if uv_client and not os.path.exists(cache_file):
        try:
            print("☀️ FAS 3: Ingen UV-cache hittades - hämtar initial data i bakgrunden...")
            uv_data = uv_client.get_uv_index()
            with state_lock:
                weather_state['uv_data'] = uv_data
            if uv_data:
                print(f"✅ FAS 3: Initial UV-data hämtad - UV {uv_data.get('uv_index', 0)} ({uv_data.get('risk_level', 'low')})")
            else:
                print("⚠️ FAS 3: Initial UV-hämtning returnerade ingen data")
        except Exception as e:
            print(f"⚠️ FAS 3: Initial UV-hämtning misslyckades: {e}")

    while True:
        # Hela loopkroppen är skyddad: ett oväntat fel (t.ex. i tidsberäkningen)
        # får inte döda tråden - då slutar UV-uppdateringarna tyst för alltid
        try:
            now = datetime.now()

            # Beräkna nästa uppdateringstid
            next_update = now.replace(hour=update_hour, minute=update_minute, second=0, microsecond=0)

            # Om tiden har passerat idag, schemalägg för imorgon
            # (timedelta hanterar månads-/årsskiften korrekt)
            if now >= next_update:
                next_update = next_update + timedelta(days=1)

            # Beräkna väntetid
            wait_seconds = (next_update - now).total_seconds()

            print(f"⏰ FAS 3: Nästa UV-uppdatering: {next_update.strftime('%Y-%m-%d %H:%M:%S')} (om {wait_seconds/3600:.1f}h)")

            # Vänta till uppdateringstid
            time.sleep(wait_seconds)

            # Kör uppdatering
            if uv_client and weather_state['uv_enabled']:
                print(f"🔄 FAS 3: Daglig UV-uppdatering startar... ({datetime.now().strftime('%H:%M:%S')})")
                uv_data = uv_client.get_uv_index()
                with state_lock:
                    weather_state['uv_data'] = uv_data

                if uv_data:
                    uv_index = uv_data.get('uv_index', 0)
                    risk_level = uv_data.get('risk_level', 'low')
                    peak_hour = uv_data.get('peak_hour', 'N/A')
                    print(f"✅ FAS 3: UV-data uppdaterad - UV {uv_index} ({risk_level}), topp kl. {peak_hour:02d}:00" if isinstance(peak_hour, int) else f"✅ FAS 3: UV-data uppdaterad - UV {uv_index} ({risk_level})")
                else:
                    print("⚠️ FAS 3: UV-uppdatering returnerade ingen data")
            else:
                print("⚠️ FAS 3: UV-klient ej tillgänglig vid uppdateringstid")

        except Exception as e:
            print(f"❌ FAS 3: Fel i UV-uppdateraren: {e}")
            time.sleep(3600)  # Backa en timme och försök igen

# === APP INITIALIZATION ===

def initialize_app():
    print("🚀 FAS 2+3: Startar Flask Weather Dashboard med WeatherEffects och UV-stöd...")
    print("=" * 80)

    config = load_config()
    if not config:
        print("❌ Kan inte starta utan giltig konfiguration")
        return False

    weather_state['config'] = config

    # FAS 2+3: Fortsätt även om API-klienter delvis misslyckas
    api_clients_ok = init_api_clients(config)
    if not api_clients_ok:
        print("⚠️ FAS 2+3: Vissa API-klienter misslyckades - fortsätter ändå")

    # FAS 3: Initial UV-hämtning sker numera i uv_updater-tråden så att
    # webbservern kan börja lyssna direkt (CAMS-hämtning kan ta 60-180 s)

    # FAS 2: Starta bakgrundstrådar villkorsstyrt
    bg_thread = threading.Thread(target=background_updater, daemon=True)
    bg_thread.start()
    print("✅ Bakgrunds-uppdaterare startad")

    # FAS 2: Starta Netatmo-uppdaterare bara om aktiverat
    if weather_state['use_netatmo']:
        netatmo_thread = threading.Thread(target=netatmo_updater, daemon=True)
        netatmo_thread.start()
        print("✅ FAS 2: Netatmo-uppdaterare startad (villkorsstyrd)")
    else:
        print("📊 FAS 2: Netatmo-uppdaterare HOPPAS ÖVER (use_netatmo=False)")

    # FAS 3: Starta UV-uppdaterare bara om aktiverat
    if weather_state['uv_enabled']:
        uv_thread = threading.Thread(target=uv_updater, daemon=True)
        uv_thread.start()
        print("✅ FAS 3: UV-uppdaterare startad (daglig uppdatering)")
    else:
        print("📊 FAS 3: UV-uppdaterare HOPPAS ÖVER (cams_uv.enabled=False)")

    print("=" * 80)
    print("🌤️ FAS 2+3: Flask Weather Dashboard redo med WeatherEffects och UV!")
    print("📱 Öppna: http://localhost:8036")
    print("🖥️ Chrome Kiosk: chromium-browser --kiosk --disable-infobars http://localhost:8036")

    # FAS 2+3: Visa systemläge
    mode = "SMHI + Netatmo" if weather_state['netatmo_available'] else "SMHI-only"
    effects = " + WeatherEffects" if weather_state['weather_effects_enabled'] else ""
    uv = " + UV" if weather_state['uv_enabled'] else ""
    print(f"🎯 Systemläge: {mode}{effects}{uv}")

    # FAS 2: Visa WeatherEffects API endpoints
    if weather_state['weather_effects_enabled']:
        print(f"🌦️ WeatherEffects API: http://localhost:8036/api/weather-effects-config")
        effect_config = weather_state['weather_effects_config']
        rain_count = effect_config.get('rain_config', {}).get('droplet_count', 50)
        snow_count = effect_config.get('snow_config', {}).get('flake_count', 25)
        intensity = effect_config.get('intensity', 'auto')
        print(f"   🌧️ Regn: {rain_count} droppar | ❄️ Snö: {snow_count} flingor | 🎚️ Intensitet: {intensity}")

        # Debug endpoint om aktiverat
        if effect_config.get('debug_logging'):
            print(f"🔧 WeatherEffects Debug: http://localhost:8036/api/weather-effects-debug")
    else:
        print(f"📊 WeatherEffects: INAKTIVERAT (weather_effects.enabled=False)")

    # FAS 3: Visa UV API endpoints
    if weather_state['uv_enabled']:
        print(f"☀️ UV-index API: http://localhost:8036/api/uv")
        uv_config = weather_state['config'].get('cams_uv', {})
        update_time = uv_config.get('update_time', '01:00')
        cache_dir = uv_config.get('cache_dir', 'cache')
        print(f"   💾 Cache: {cache_dir}/uv_cache.json | ⏰ Uppdatering: {update_time}")
    else:
        print(f"📊 UV-index: INAKTIVERAT (cams_uv.enabled=False)")

    print(f"📊 Trycktrend API: http://localhost:8036/api/pressure_trend")
    print(f"🌬️ Vindenheter: {config['ui']['wind_unit']} (redigerbart i reference/config.py)")
    print(f"🎨 Tema: {config['ui']['theme']} (mörkt tema rekommenderat)")

    # FAS 2: Visa Netatmo-status
    if weather_state['use_netatmo']:
        if weather_state['netatmo_available']:
            print(f"✅ Netatmo: AKTIVT (med trycktrend)")
        else:
            print(f"⚠️ Netatmo: KONFIGURERAT men EJ TILLGÄNGLIGT (använder SMHI-fallback)")
    else:
        print(f"📊 Netatmo: INAKTIVERAT i config (use_netatmo=False)")

    # FAS 2: Visa SMHI luftfuktighets-status
    print(f"💧 SMHI Luftfuktighet: AKTIVERAT (FAS 2 implementerat)")
    print(f"🌐 API med humidity: http://localhost:8036/api/weather")

    print("=" * 80)

    return True

if __name__ == '__main__':
    if initialize_app():
        try:
            # Produktionsserver (Werkzeugs devserver är inte avsedd för 24/7-drift)
            from waitress import serve
            print("🚀 Startar med waitress (produktionsserver)")
            serve(app, host='0.0.0.0', port=8036, threads=8)
        except ImportError:
            print("⚠️ waitress ej installerat - faller tillbaka på Flasks devserver")
            app.run(
                host='0.0.0.0',
                port=8036,
                debug=False,
                threaded=True
            )
    else:
        print("❌ Kunde inte starta Flask-appen")
        sys.exit(1)

# ============================================================================
# Här slutar del två
# ============================================================================
