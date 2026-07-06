#!/usr/bin/env python3
"""
Hjälpfunktioner och utilities för SMHI + Netatmo Weather Dashboard
FAS 4: Komplett Weather Icons implementation med font-rendering för Tkinter
Inkluderar soluppgång/solnedgång-beräkningar med API-stöd och fallback
"""

import math
import json
import requests
from datetime import datetime, date, timedelta
from typing import Dict, Optional, Tuple
import os
import time


# === WEATHER ICONS UNICODE MAPPNINGAR FÖR FAS 4 ===

# Weather Icons Unicode mappningar för Tkinter font-rendering
WEATHER_ICONS_UNICODE = {
    # Dag-ikoner
    "wi-day-sunny": "\uf00d",
    "wi-day-cloudy": "\uf002",
    "wi-day-cloudy-gusts": "\uf000",
    "wi-day-cloudy-windy": "\uf001",
    "wi-day-fog": "\uf003",
    "wi-day-hail": "\uf004",
    "wi-day-haze": "\uf0b6",
    "wi-day-lightning": "\uf005",
    "wi-day-rain": "\uf008",
    "wi-day-rain-mix": "\uf006",
    "wi-day-rain-wind": "\uf007",
    "wi-day-showers": "\uf009",
    "wi-day-sleet": "\uf0b2",
    "wi-day-sleet-storm": "\uf068",
    "wi-day-snow": "\uf00a",
    "wi-day-snow-thunderstorm": "\uf06b",
    "wi-day-snow-wind": "\uf065",
    "wi-day-sprinkle": "\uf00b",
    "wi-day-storm-showers": "\uf00e",
    "wi-day-sunny-overcast": "\uf00c",
    "wi-day-thunderstorm": "\uf010",
    "wi-day-windy": "\uf085",
    "wi-day-cloudy-high": "\uf07d",
    
    # Natt-ikoner
    "wi-night-clear": "\uf02e",
    "wi-night-cloudy": "\uf031",
    "wi-night-cloudy-gusts": "\uf02d",
    "wi-night-cloudy-windy": "\uf02c",
    "wi-night-fog": "\uf04a",
    "wi-night-hail": "\uf026",
    "wi-night-lightning": "\uf025",
    "wi-night-partly-cloudy": "\uf083",
    "wi-night-rain": "\uf036",
    "wi-night-rain-mix": "\uf034",
    "wi-night-rain-wind": "\uf035",
    "wi-night-showers": "\uf037",
    "wi-night-sleet": "\uf0b4",
    "wi-night-sleet-storm": "\uf069",
    "wi-night-snow": "\uf038",
    "wi-night-snow-thunderstorm": "\uf06c",
    "wi-night-snow-wind": "\uf066",
    "wi-night-sprinkle": "\uf039",
    "wi-night-storm-showers": "\uf03a",
    "wi-night-thunderstorm": "\uf03b",
    "wi-night-cloudy-high": "\uf07e",
    "wi-night-alt-cloudy": "\uf086",
    
    # Allmänna ikoner
    "wi-cloudy": "\uf013",
    "wi-cloud": "\uf041",
    "wi-fog": "\uf014",
    "wi-rain": "\uf019",
    "wi-rain-mix": "\uf017",
    "wi-sleet": "\uf0b5",
    "wi-snow": "\uf01b",
    "wi-thunderstorm": "\uf01e",
    "wi-windy": "\uf021",
    
    # Vind-ikoner
    "wi-wind-default": "\uf0b1",
    "wi-direction-up": "\uf058",
    "wi-direction-down": "\uf044",
    "wi-minus": "\uf056",
    
    # Fallback
    "wi-na": "\uf07b"
}

# SMHI symbol mappningar (samma som tidigare men nu med Unicode-rendering)
SMHI_TO_WEATHER_ICONS = {
    1: {"day": "wi-day-sunny", "night": "wi-night-clear"},                    # Klart
    2: {"day": "wi-day-sunny-overcast", "night": "wi-night-partly-cloudy"},  # Nästan klart
    3: {"day": "wi-day-cloudy", "night": "wi-night-alt-cloudy"},             # Växlande molnighet
    4: {"day": "wi-day-cloudy-high", "night": "wi-night-cloudy-high"},       # Halvklart
    5: {"day": "wi-cloudy", "night": "wi-cloudy"},                           # Molnigt
    6: {"day": "wi-cloud", "night": "wi-cloud"},                             # Mulet
    7: {"day": "wi-fog", "night": "wi-fog"},                                 # Dimma
    8: {"day": "wi-day-showers", "night": "wi-night-showers"},               # Lätta regnskurar
    9: {"day": "wi-day-rain", "night": "wi-night-rain"},                     # Måttliga regnskurar
    10: {"day": "wi-rain", "night": "wi-rain"},                              # Kraftiga regnskurar
    11: {"day": "wi-day-thunderstorm", "night": "wi-night-thunderstorm"},    # Åskväder
    12: {"day": "wi-day-rain-mix", "night": "wi-night-rain-mix"},            # Lätta snöblandade regnskurar
    13: {"day": "wi-rain-mix", "night": "wi-rain-mix"},                      # Måttliga snöblandade regnskurar
    14: {"day": "wi-rain-mix", "night": "wi-rain-mix"},                      # Kraftiga snöblandade regnskurar
    15: {"day": "wi-day-snow", "night": "wi-night-snow"},                    # Lätta snöbyar
    16: {"day": "wi-snow", "night": "wi-snow"},                              # Måttliga snöbyar
    17: {"day": "wi-snow", "night": "wi-snow"},                              # Kraftiga snöbyar
    18: {"day": "wi-day-rain", "night": "wi-night-rain"},                    # Lätt regn
    19: {"day": "wi-rain", "night": "wi-rain"},                              # Måttligt regn
    20: {"day": "wi-rain", "night": "wi-rain"},                              # Kraftigt regn
    21: {"day": "wi-thunderstorm", "night": "wi-thunderstorm"},              # Åska
    22: {"day": "wi-day-sleet", "night": "wi-night-sleet"},                  # Lätt snöblandat regn
    23: {"day": "wi-sleet", "night": "wi-sleet"},                            # Måttligt snöblandat regn
    24: {"day": "wi-sleet", "night": "wi-sleet"},                            # Kraftigt snöblandat regn
    25: {"day": "wi-day-snow", "night": "wi-night-snow"},                    # Lätt snöfall
    26: {"day": "wi-snow", "night": "wi-snow"},                              # Måttligt snöfall
    27: {"day": "wi-snow", "night": "wi-snow"}                               # Kraftigt snöfall
}

# amCharts SVG mappningar för animerade ikoner (bevarad för framtida användning)
SMHI_TO_AMCHARTS_SVG = {
    1: {"day": "day/sunny.svg", "night": "night/clear.svg"},                 # Klart
    2: {"day": "day/partly-cloudy.svg", "night": "night/partly-cloudy.svg"}, # Nästan klart
    3: {"day": "day/cloudy.svg", "night": "night/cloudy.svg"},               # Växlande molnighet
    4: {"day": "day/overcast.svg", "night": "night/overcast.svg"},           # Halvklart
    5: {"day": "day/cloudy.svg", "night": "night/cloudy.svg"},               # Molnigt
    6: {"day": "day/overcast.svg", "night": "night/overcast.svg"},           # Mulet
    7: {"day": "day/fog.svg", "night": "night/fog.svg"},                     # Dimma
    8: {"day": "day/rain.svg", "night": "night/rain.svg"},                   # Lätta regnskurar
    9: {"day": "day/rain.svg", "night": "night/rain.svg"},                   # Måttliga regnskurar
    10: {"day": "day/rain.svg", "night": "night/rain.svg"},                  # Kraftiga regnskurar
    11: {"day": "day/thunderstorm.svg", "night": "night/thunderstorm.svg"},  # Åskväder
    12: {"day": "day/sleet.svg", "night": "night/sleet.svg"},                # Lätta snöblandade regnskurar
    13: {"day": "day/sleet.svg", "night": "night/sleet.svg"},                # Måttliga snöblandade regnskurar
    14: {"day": "day/sleet.svg", "night": "night/sleet.svg"},                # Kraftiga snöblandade regnskurar
    15: {"day": "day/snow.svg", "night": "night/snow.svg"},                  # Lätta snöbyar
    16: {"day": "day/snow.svg", "night": "night/snow.svg"},                  # Måttliga snöbyar
    17: {"day": "day/snow.svg", "night": "night/snow.svg"},                  # Kraftiga snöbyar
    18: {"day": "day/rain.svg", "night": "night/rain.svg"},                  # Lätt regn
    19: {"day": "day/rain.svg", "night": "night/rain.svg"},                  # Måttligt regn
    20: {"day": "day/rain.svg", "night": "night/rain.svg"},                  # Kraftigt regn
    21: {"day": "day/thunderstorm.svg", "night": "night/thunderstorm.svg"},  # Åska
    22: {"day": "day/sleet.svg", "night": "night/sleet.svg"},                # Lätt snöblandat regn
    23: {"day": "day/sleet.svg", "night": "night/sleet.svg"},                # Måttligt snöblandat regn
    24: {"day": "day/sleet.svg", "night": "night/sleet.svg"},                # Kraftigt snöblandat regn
    25: {"day": "day/snow.svg", "night": "night/snow.svg"},                  # Lätt snöfall
    26: {"day": "day/snow.svg", "night": "night/snow.svg"},                  # Måttligt snöfall
    27: {"day": "day/snow.svg", "night": "night/snow.svg"}                   # Kraftigt snöfall
}

# Beaufort-skala vindstyrka till Weather Icons (för när vindstyrka får ikoner)
BEAUFORT_TO_WEATHER_ICONS = {
    0: "wi-wind-beaufort-0",    # 0-0.5 m/s: Stiltje
    1: "wi-wind-beaufort-1",    # 0.5-1.5 m/s: Lätt luftdrag
    2: "wi-wind-beaufort-2",    # 1.5-3.3 m/s: Lätt bris
    3: "wi-wind-beaufort-3",    # 3.3-5.5 m/s: Lätt bris
    4: "wi-wind-beaufort-4",    # 5.5-7.9 m/s: Måttlig bris
    5: "wi-wind-beaufort-5",    # 7.9-10.7 m/s: Frisk bris
    6: "wi-wind-beaufort-6",    # 10.7-13.8 m/s: Stark bris
    7: "wi-wind-beaufort-7",    # 13.8-17.1 m/s: Hård bris
    8: "wi-wind-beaufort-8",    # 17.1-20.7 m/s: Kuling
    9: "wi-wind-beaufort-9",    # 20.7-24.4 m/s: Hård kuling
    10: "wi-wind-beaufort-10",  # 24.4-28.4 m/s: Storm
    11: "wi-wind-beaufort-11",  # 28.4-32.6 m/s: Hård storm
    12: "wi-wind-beaufort-12"   # 32.6+ m/s: Orkan
}


class SunCalculator:
    """Klass för beräkning av soluppgång och solnedgång."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialisera solkalkylator.
        
        Args:
            api_key: API-nyckel för ipgeolocation.io (None för fallback-beräkning)
        """
        self.api_key = api_key
        self.api_base_url = "https://api.ipgeolocation.io/astronomy"
        self.cache_file = "sun_cache.json"
        self.cache_duration_hours = 24  # Cache i 24 timmar
        
        print(f"🌅 SunCalculator initierad. API: {'Ja' if api_key else 'Fallback-beräkning'}")
    
    def get_sun_times(self, latitude: float, longitude: float, target_date: Optional[date] = None) -> Dict:
        """
        Hämta soluppgång och solnedgång för given plats och datum.
        
        Args:
            latitude: Latitud i decimal grader
            longitude: Longitud i decimal grader  
            target_date: Datum att beräkna för (None = idag)
            
        Returns:
            Dict med 'sunrise', 'sunset', 'source', 'cached' nycklar
        """
        if target_date is None:
            target_date = date.today()
        
        # Försök läsa från cache först
        cached_data = self._get_from_cache(latitude, longitude, target_date)
        if cached_data:
            print(f"☀️ Använder cachad soldata för {target_date}")
            cached_data['cached'] = True
            return cached_data
        
        # Hämta ny data
        if self.api_key:
            sun_data = self._fetch_from_api(latitude, longitude, target_date)
        else:
            sun_data = self._calculate_fallback(latitude, longitude, target_date)
        
        # Cache resultatet
        self._save_to_cache(latitude, longitude, target_date, sun_data)
        sun_data['cached'] = False
        
        return sun_data
    
    def _get_cache_key(self, latitude: float, longitude: float, target_date: date) -> str:
        """Skapa cache-nyckel för plats och datum."""
        return f"{latitude:.3f}_{longitude:.3f}_{target_date.isoformat()}"
    
    def _get_from_cache(self, latitude: float, longitude: float, target_date: date) -> Optional[Dict]:
        """Försök hämta soldata från cache."""
        if not os.path.exists(self.cache_file):
            return None
        
        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            cache_key = self._get_cache_key(latitude, longitude, target_date)
            
            if cache_key in cache_data:
                cached_entry = cache_data[cache_key]
                
                # Kontrollera cache-ålder
                cache_timestamp = cached_entry.get('timestamp', 0)
                cache_age_hours = (time.time() - cache_timestamp) / 3600
                
                if cache_age_hours < self.cache_duration_hours:
                    # Ta bort timestamp innan retur (inte del av soldata)
                    result = {k: v for k, v in cached_entry.items() if k != 'timestamp'}
                    return result
                else:
                    print(f"🗑️ Cache för {target_date} är för gammal ({cache_age_hours:.1f}h)")
            
        except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
            print(f"⚠️ Fel vid cache-läsning: {e}")
        
        return None
    
    def _save_to_cache(self, latitude: float, longitude: float, target_date: date, sun_data: Dict):
        """Spara soldata till cache."""
        try:
            # Läs befintlig cache
            cache_data = {}
            if os.path.exists(self.cache_file):
                try:
                    with open(self.cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                except (json.JSONDecodeError, FileNotFoundError):
                    cache_data = {}
            
            # Lägg till ny post
            cache_key = self._get_cache_key(latitude, longitude, target_date)
            cache_entry = sun_data.copy()
            cache_entry['timestamp'] = time.time()
            cache_data[cache_key] = cache_entry
            
            # Rensa gamla poster (äldre än 7 dagar)
            cutoff_date = date.today() - timedelta(days=7)
            keys_to_remove = []
            for key in cache_data:
                if '_' in key:
                    try:
                        date_part = key.split('_')[2]  # Extrahera datum-delen
                        entry_date = date.fromisoformat(date_part)
                        if entry_date < cutoff_date:
                            keys_to_remove.append(key)
                    except (ValueError, IndexError):
                        # Ogiltig nyckel-format, ta bort
                        keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del cache_data[key]
            
            # Spara uppdaterad cache (atomärt, mot korrupt fil vid krasch)
            tmp_path = self.cache_file + '.tmp'
            with open(tmp_path, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)
            os.replace(tmp_path, self.cache_file)
            
            print(f"💾 Soldata cachad för {target_date}")
            
        except Exception as e:
            print(f"⚠️ Fel vid cache-sparning: {e}")
    
    def _fetch_from_api(self, latitude: float, longitude: float, target_date: date) -> Dict:
        """Hämta soldata från ipgeolocation.io API."""
        try:
            print(f"🌐 Hämtar soldata från API för {target_date}")
            
            params = {
                'apiKey': self.api_key,
                'lat': latitude,
                'long': longitude
            }
            
            # Om inte idag, lägg till datum
            if target_date != date.today():
                params['date'] = target_date.isoformat()
            
            response = requests.get(self.api_base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Kontrollera att vi fick giltig data
            if 'sunrise' not in data or 'sunset' not in data:
                raise ValueError("API returnerade ogiltig data")
            
            # Konvertera tider till datetime-objekt
            sunrise_time = self._parse_time_string(data['sunrise'], target_date)
            sunset_time = self._parse_time_string(data['sunset'], target_date)
            
            result = {
                'sunrise': sunrise_time.isoformat(),
                'sunset': sunset_time.isoformat(),
                'source': 'ipgeolocation.io',
                'date': target_date.isoformat()
            }
            
            # Lägg till extra data om tillgängligt
            if 'moonrise' in data:
                result['moonrise'] = data['moonrise']
            if 'moonset' in data:
                result['moonset'] = data['moonset']
            
            print(f"✅ API-data: Soluppgång {data['sunrise']}, Solnedgång {data['sunset']}")
            return result
            
        except requests.RequestException as e:
            print(f"❌ Nätverksfel vid API-anrop: {e}")
            return self._calculate_fallback(latitude, longitude, target_date)
        except Exception as e:
            print(f"❌ Fel vid API-anrop: {e}")
            return self._calculate_fallback(latitude, longitude, target_date)
    
    def _parse_time_string(self, time_str: str, target_date: date) -> datetime:
        """
        Konvertera tidssträng (HH:MM) till datetime-objekt.
        
        Args:
            time_str: Tidssträng från API (t.ex. "06:30")
            target_date: Datum att kombinera med tiden
            
        Returns:
            datetime-objekt
        """
        try:
            time_parts = time_str.split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1])
            
            return datetime.combine(target_date, datetime.min.time().replace(hour=hour, minute=minute))
        except (ValueError, IndexError) as e:
            print(f"⚠️ Fel vid parsning av tid '{time_str}': {e}")
            # Fallback till en rimlig tid
            return datetime.combine(target_date, datetime.min.time().replace(hour=6, minute=0))
    
    def _calculate_fallback(self, latitude: float, longitude: float, target_date: date) -> Dict:
        """
        Förenklad beräkning av soluppgång/solnedgång utan API.
        Baserad på astronomiska algoritmer (approximation).
        
        Args:
            latitude: Latitud i decimal grader
            longitude: Longitud i decimal grader
            target_date: Datum att beräkna för
            
        Returns:
            Dict med soldata
        """
        print(f"🧮 Använder fallback-beräkning för {target_date}")
        
        # Beräkna solens deklination för datum
        day_of_year = target_date.timetuple().tm_yday
        solar_declination = 23.45 * math.sin(math.radians(360 * (284 + day_of_year) / 365))
        
        # Konvertera latitud till radianer
        lat_rad = math.radians(latitude)
        decl_rad = math.radians(solar_declination)
        
        # Beräkna timvinkel för soluppgång/solnedgång
        try:
            cos_hour_angle = -math.tan(lat_rad) * math.tan(decl_rad)
            
            # Kontrollera för polarnatt/midnattssol
            if cos_hour_angle > 1:
                # Polarnatt - solen går aldrig upp
                sunrise_hour = 12.0
                sunset_hour = 12.0
                print("🌑 Polarnatt - solen går inte upp")
            elif cos_hour_angle < -1:
                # Midnattssol - solen går aldrig ner
                sunrise_hour = 0.0
                sunset_hour = 23.99
                print("🌞 Midnattssol - solen går inte ner")
            else:
                hour_angle = math.degrees(math.acos(cos_hour_angle))
                
                # Beräkna lokala soltider
                sunrise_hour = 12 - hour_angle / 15
                sunset_hour = 12 + hour_angle / 15
                
                # Justera för longitud (grov korrektion för tidszon)
                time_correction = longitude / 15  # 15 grader per timme
                sunrise_hour -= time_correction
                sunset_hour -= time_correction
                
                # Normalisera timmar
                while sunrise_hour < 0:
                    sunrise_hour += 24
                while sunrise_hour >= 24:
                    sunrise_hour -= 24
                while sunset_hour < 0:
                    sunset_hour += 24
                while sunset_hour >= 24:
                    sunset_hour -= 24
        
        except (ValueError, ZeroDivisionError):
            # Fallback till säsongsbaserade tider för Sverige
            if 3 <= target_date.month <= 9:  # Sommar
                sunrise_hour = 5.0 + (60 - latitude) / 15
                sunset_hour = 20.0 - (60 - latitude) / 15
            else:  # Vinter
                sunrise_hour = 8.0 + (60 - latitude) / 12  
                sunset_hour = 16.0 - (60 - latitude) / 12
            
            # Begränsa värden
            sunrise_hour = max(0, min(23.99, sunrise_hour))
            sunset_hour = max(0, min(23.99, sunset_hour))
        
        # Konvertera till datetime-objekt
        sunrise_dt = datetime.combine(
            target_date, 
            datetime.min.time().replace(
                hour=int(sunrise_hour), 
                minute=int((sunrise_hour % 1) * 60)
            )
        )
        
        sunset_dt = datetime.combine(
            target_date,
            datetime.min.time().replace(
                hour=int(sunset_hour),
                minute=int((sunset_hour % 1) * 60)
            )
        )
        
        result = {
            'sunrise': sunrise_dt.isoformat(),
            'sunset': sunset_dt.isoformat(), 
            'source': 'fallback_calculation',
            'date': target_date.isoformat()
        }
        
        print(f"🧮 Fallback-resultat: Soluppgång {sunrise_dt.strftime('%H:%M')}, Solnedgång {sunset_dt.strftime('%H:%M')}")
        return result


# === FAS 4: WEATHER ICONS FUNKTIONER MED FÖRBÄTTRADE EMOJI ===

def get_weather_icon_enhanced(weather_symbol: int, is_daytime: bool = True) -> str:
    """
    FAS 4: Få förbättrade emoji-ikoner för väder med bättre mappning.
    
    Args:
        weather_symbol: SMHI vädersymbol (1-27)
        is_daytime: Om det är dag (True) eller natt (False)
        
    Returns:
        Förbättrad emoji för vädertypen
    """
    if weather_symbol is None:
        return "❓"
    
    # Förbättrade emoji-mappningar med bättre distinktion
    enhanced_weather_map = {
        1: "☀️" if is_daytime else "🌙",      # Klart
        2: "🌤️" if is_daytime else "🌙",      # Nästan klart  
        3: "⛅" if is_daytime else "☁️",       # Växlande molnighet
        4: "🌥️" if is_daytime else "☁️",      # Halvklart
        5: "☁️",                              # Molnigt
        6: "☁️",                              # Mulet
        7: "🌫️",                             # Dimma
        8: "🌦️",                             # Lätta regnskurar
        9: "🌧️",                             # Måttliga regnskurar
        10: "🌧️",                            # Kraftiga regnskurar
        11: "⛈️",                            # Åskväder
        12: "🌨️",                            # Lätta snöblandade regnskurar
        13: "🌨️",                            # Måttliga snöblandade regnskurar
        14: "🌨️",                            # Kraftiga snöblandade regnskurar
        15: "🌨️",                            # Lätta snöbyar
        16: "❄️",                            # Måttliga snöbyar
        17: "❄️",                            # Kraftiga snöbyar
        18: "🌧️",                            # Lätt regn
        19: "🌧️",                            # Måttligt regn
        20: "🌧️",                            # Kraftigt regn
        21: "⛈️",                            # Åska
        22: "🌨️",                            # Lätt snöblandat regn
        23: "🌨️",                            # Måttligt snöblandat regn
        24: "🌨️",                            # Kraftigt snöblandat regn
        25: "❄️",                            # Lätt snöfall
        26: "❄️",                            # Måttligt snöfall
        27: "❄️"                             # Kraftigt snöfall
    }
    
    return enhanced_weather_map.get(weather_symbol, "❓")


def get_weather_icon_unicode_char(weather_symbol: int, is_daytime: bool = True) -> str:
    """
    FAS 4: Alias för get_weather_icon_enhanced för bakåtkompatibilitet.
    
    Args:
        weather_symbol: SMHI vädersymbol (1-27)
        is_daytime: Om det är dag (True) eller natt (False)
        
    Returns:
        Förbättrad emoji för vädertypen
    """
    return get_weather_icon_enhanced(weather_symbol, is_daytime)


def get_weather_icon_class(weather_symbol: int, is_daytime: bool = True) -> str:
    """
    Konvertera SMHI väder-symbol till Weather Icons CSS-klass.
    
    Args:
        weather_symbol: SMHI vädersymbol (1-27)
        is_daytime: Om det är dag (True) eller natt (False)
        
    Returns:
        CSS-klass för Weather Icons (t.ex. "wi wi-day-sunny")
    """
    if weather_symbol is None or weather_symbol not in SMHI_TO_WEATHER_ICONS:
        return "wi wi-na"  # Weather Icons fallback för okänt väder
    
    icon_mapping = SMHI_TO_WEATHER_ICONS[weather_symbol]
    icon_class = icon_mapping["day"] if is_daytime else icon_mapping["night"]
    
    return f"wi {icon_class}"


def get_wind_direction_icon_class(wind_direction_degrees: float) -> str:
    """
    Konvertera vindriktning i grader till Weather Icons wind-klass.
    
    Args:
        wind_direction_degrees: Vindriktning i grader (0-360)
        
    Returns:
        CSS-klass för vindikon (t.ex. "wi wi-wind from-270-deg")
    """
    if wind_direction_degrees is None:
        return "wi wi-wind-default"
    
    # Normalisera grader till 0-359
    degrees = int(wind_direction_degrees) % 360
    
    return f"wi wi-wind from-{degrees}-deg"


def get_beaufort_icon_class(wind_speed_ms: float) -> str:
    """
    Konvertera vindstyrka i m/s till Beaufort-specifik Weather Icons klass.
    ENDAST för när vindstyrka ska få ikoner - använd Beaufort-specifika ikoner.
    
    Args:
        wind_speed_ms: Vindstyrka i m/s
        
    Returns:
        CSS-klass för Beaufort-ikon (t.ex. "wi wi-wind-beaufort-4")
    """
    if wind_speed_ms is None:
        return "wi wi-wind-beaufort-0"
    
    # Konvertera m/s till Beaufort-skala
    if wind_speed_ms < 0.5:
        beaufort = 0
    elif wind_speed_ms < 1.6:
        beaufort = 1
    elif wind_speed_ms < 3.4:
        beaufort = 2
    elif wind_speed_ms < 5.5:
        beaufort = 3
    elif wind_speed_ms < 8.0:
        beaufort = 4
    elif wind_speed_ms < 10.8:
        beaufort = 5
    elif wind_speed_ms < 13.9:
        beaufort = 6
    elif wind_speed_ms < 17.2:
        beaufort = 7
    elif wind_speed_ms < 20.8:
        beaufort = 8
    elif wind_speed_ms < 24.5:
        beaufort = 9
    elif wind_speed_ms < 28.5:
        beaufort = 10
    elif wind_speed_ms < 32.7:
        beaufort = 11
    else:
        beaufort = 12
    
    return f"wi {BEAUFORT_TO_WEATHER_ICONS[beaufort]}"


def get_pressure_trend_icon_class(trend: str) -> str:
    """
    Få ikon för lufttryckstrend från Netatmo.
    
    Args:
        trend: "up", "down", eller "stable"
        
    Returns:
        CSS-klass för trend-ikon (t.ex. "wi wi-direction-up")
    """
    trend_mapping = {
        "up": "wi wi-direction-up",
        "down": "wi wi-direction-down", 
        "stable": "wi wi-minus"
    }
    
    return trend_mapping.get(trend, "wi wi-minus")


def get_pressure_trend_unicode_char(trend: str) -> str:
    """
    FAS 4: Få Weather Icons Unicode-tecken för trycktrend.
    
    Args:
        trend: "up", "down", eller "stable"
        
    Returns:
        Unicode-tecken för Weather Icons font
    """
    trend_mapping = {
        "up": WEATHER_ICONS_UNICODE["wi-direction-up"],
        "down": WEATHER_ICONS_UNICODE["wi-direction-down"], 
        "stable": WEATHER_ICONS_UNICODE["wi-minus"]
    }
    
    return trend_mapping.get(trend, WEATHER_ICONS_UNICODE["wi-minus"])


def get_amcharts_svg_path(weather_symbol: int, is_daytime: bool = True) -> str:
    """
    Få sökväg till amCharts SVG-fil för väder-symbol.
    
    Args:
        weather_symbol: SMHI vädersymbol (1-27)
        is_daytime: Om det är dag eller natt
        
    Returns:
        Relativ sökväg till SVG-fil från assets/icons/amcharts-svg/
    """
    if weather_symbol is None or weather_symbol not in SMHI_TO_AMCHARTS_SVG:
        return "day/na.svg" if is_daytime else "night/na.svg"
    
    svg_mapping = SMHI_TO_AMCHARTS_SVG[weather_symbol]
    svg_path = svg_mapping["day"] if is_daytime else svg_mapping["night"]
    
    return svg_path


def get_beaufort_description(wind_speed_ms: float) -> str:
    """
    Få Beaufort-beskrivning för vindstyrka.
    
    Args:
        wind_speed_ms: Vindstyrka i m/s
        
    Returns:
        Beaufort-beskrivning på svenska
    """
    if wind_speed_ms is None:
        return "Okänt"
    
    beaufort_descriptions = {
        0: "Stiltje",
        1: "Lätt luftdrag", 
        2: "Lätt bris",
        3: "Lätt bris",
        4: "Måttlig bris",
        5: "Frisk bris",
        6: "Stark bris",
        7: "Hård bris",
        8: "Kuling",
        9: "Hård kuling",
        10: "Storm",
        11: "Hård storm",
        12: "Orkan"
    }
    
    # Använd samma logik som get_beaufort_icon_class för konsistens
    if wind_speed_ms < 0.5:
        beaufort = 0
    elif wind_speed_ms < 1.6:
        beaufort = 1
    elif wind_speed_ms < 3.4:
        beaufort = 2
    elif wind_speed_ms < 5.5:
        beaufort = 3
    elif wind_speed_ms < 8.0:
        beaufort = 4
    elif wind_speed_ms < 10.8:
        beaufort = 5
    elif wind_speed_ms < 13.9:
        beaufort = 6
    elif wind_speed_ms < 17.2:
        beaufort = 7
    elif wind_speed_ms < 20.8:
        beaufort = 8
    elif wind_speed_ms < 24.5:
        beaufort = 9
    elif wind_speed_ms < 28.5:
        beaufort = 10
    elif wind_speed_ms < 32.7:
        beaufort = 11
    else:
        beaufort = 12
    
    return beaufort_descriptions[beaufort]


def get_weather_icons_font_path() -> str:
    """
    FAS 4: Hämta sökväg till Weather Icons TTF-font.
    
    Returns:
        Absolut sökväg till weathericons-regular-webfont.ttf
    """
    # Få projektets rotkatalog
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)  # Gå upp från data/ till projektrot
    
    font_path = os.path.join(
        project_root, 
        "assets", 
        "icons", 
        "weather-icons", 
        "fonts", 
        "weathericons-regular-webfont.ttf"
    )
    
    return font_path


# === BEFINTLIGA FUNKTIONER (BEVARADE) ===

def get_temperature_color(temperature: float, theme=None) -> str:
    """
    Få färg för temperatur baserat på värde och tema.
    
    Args:
        temperature: Temperatur i Celsius
        theme: Tema-objekt (om tillgängligt)
        
    Returns:
        Hex-färgkod
    """
    # Fallback-färger om inget tema
    if not theme:
        if temperature < 0:
            return "#4A90E2"      # Blå
        elif temperature < 10:
            return "#7B68EE"      # Ljusblå  
        elif temperature < 20:
            return "#50C878"      # Grön
        elif temperature < 25:
            return "#FFD700"      # Gul
        elif temperature < 30:
            return "#FF8C00"      # Orange
        else:
            return "#FF4500"      # Röd
    
    # Använd tema-färger om tillgängliga
    if hasattr(theme, 'temp_cold') and temperature < 0:
        return theme.temp_cold
    elif hasattr(theme, 'temp_cool') and temperature < 10:
        return theme.temp_cool
    elif hasattr(theme, 'temp_mild') and temperature < 20:
        return theme.temp_mild
    elif hasattr(theme, 'temp_warm') and temperature < 25:
        return theme.temp_warm
    elif hasattr(theme, 'temp_hot') and temperature < 30:
        return theme.temp_hot
    elif hasattr(theme, 'temp_extreme'):
        return theme.temp_extreme
    else:
        return "#333333"  # Default


def get_wind_direction_text(degrees: float) -> str:
    """
    Konvertera vindriktning i grader till kompassriktning.
    
    Args:
        degrees: Vindriktning i grader (0-360)
        
    Returns:
        Kompassriktning på svenska
    """
    if degrees is None:
        return "N/A"
    
    # Svenska kompassriktningar
    directions = [
        "N", "NNO", "NO", "ONO", 
        "O", "OSO", "SO", "SSO",
        "S", "SSV", "SV", "VSV", 
        "V", "VNV", "NV", "NNV"
    ]
    
    # Beräkna index (16 riktningar, 22.5 grader per riktning)
    index = round(degrees / 22.5) % 16
    return directions[index]


def format_time_difference(timestamp: float) -> str:
    """
    Formatera tidsskillnad till läsbar text.
    
    Args:
        timestamp: Unix timestamp
        
    Returns:
        Formaterad tidstext (t.ex. "5 min sedan")
    """
    if not timestamp:
        return "Okänd tid"
    
    now = time.time()
    diff_seconds = now - timestamp
    diff_minutes = int(diff_seconds / 60)
    
    if diff_minutes < 1:
        return "Nyss"
    elif diff_minutes < 60:
        return f"{diff_minutes} min sedan"
    else:
        diff_hours = int(diff_minutes / 60)
        if diff_hours < 24:
            return f"{diff_hours}h {diff_minutes % 60}min sedan"
        else:
            diff_days = int(diff_hours / 24)
            return f"{diff_days} dagar sedan"


def clean_station_name(name: str) -> str:
    """
    Rensa stations-namn från extra parenteser och text.
    
    Args:
        name: Rått stations-namn
        
    Returns:
        Rensat stations-namn
    """
    if not name:
        return "Okänd"
    
    # Ta bort parenteser och extra information
    clean_name = name.split(' (')[0].strip()
    
    # Ta bort vanliga suffix
    suffixes_to_remove = [
        ' Station',
        ' Väderstation', 
        ' - Automatic',
        ' AUTO'
    ]
    
    for suffix in suffixes_to_remove:
        if clean_name.endswith(suffix):
            clean_name = clean_name[:-len(suffix)].strip()
    
    return clean_name


def get_weather_icon_unicode(weather_symbol: int, is_daytime: bool = True) -> str:
    """
    Konvertera SMHI väder-symbol till Unicode-emoji.
    BEVARAD för bakåtkompatibilitet - använd get_weather_icon_unicode_char() för Weather Icons.
    
    Args:
        weather_symbol: SMHI vädersymbol (1-27)
        is_daytime: Om det är dag (True) eller natt (False)
        
    Returns:
        Unicode emoji för vädertypen
    """
    if weather_symbol is None:
        return "❓"
    
    # Mappning SMHI symbol -> emoji (enkel version)
    weather_map = {
        1: "☀️" if is_daytime else "🌙",  # Klart
        2: "🌤️" if is_daytime else "🌙",  # Nästan klart  
        3: "⛅",  # Växlande molnighet
        4: "🌥️",  # Halvklart
        5: "☁️",  # Molnigt
        6: "☁️",  # Mulet
        7: "🌫️",  # Dimma
        8: "🌦️",  # Lätta regnskurar
        9: "🌧️",  # Måttliga regnskurar
        10: "🌧️", # Kraftiga regnskurar
        11: "⛈️", # Åskväder
        12: "🌨️", # Lätta snöblandade regnskurar
        13: "🌨️", # Måttliga snöblandade regnskurar
        14: "🌨️", # Kraftiga snöblandade regnskurar
        15: "🌨️", # Lätta snöbyar
        16: "❄️", # Måttliga snöbyar
        17: "❄️", # Kraftiga snöbyar
        18: "🌧️", # Lätt regn
        19: "🌧️", # Måttligt regn
        20: "🌧️", # Kraftigt regn
        21: "⛈️", # Åska
        22: "🌨️", # Lätt snöblandat regn
        23: "🌨️", # Måttligt snöblandat regn
        24: "🌨️", # Kraftigt snöblandat regn
        25: "❄️", # Lätt snöfall
        26: "❄️", # Måttligt snöfall
        27: "❄️"  # Kraftigt snöfall
    }
    
    return weather_map.get(weather_symbol, "❓")


def get_weather_description_short(weather_symbol: int) -> str:
    """
    Kort väderbeskrivning för SMHI väder-symbol.
    
    Args:
        weather_symbol: SMHI vädersymbol (1-27)
        
    Returns:
        Kort beskrivning på svenska
    """
    if weather_symbol is None:
        return "Okänt"
    
    descriptions = {
        1: "Klart",
        2: "Nästan klart", 
        3: "Växlande",
        4: "Halvklart",
        5: "Molnigt",
        6: "Mulet",
        7: "Dimma",
        8: "Regnskurar",
        9: "Regnskurar",
        10: "Regnskurar",
        11: "Åska",
        12: "Snöblandat",
        13: "Snöblandat",
        14: "Snöblandat", 
        15: "Snöbyar",
        16: "Snöbyar",
        17: "Snöbyar",
        18: "Regn",
        19: "Regn",
        20: "Regn",
        21: "Åska",
        22: "Snöblandat",
        23: "Snöblandat",
        24: "Snöblandat",
        25: "Snöfall",
        26: "Snöfall",
        27: "Snöfall"
    }
    
    return descriptions.get(weather_symbol, "Okänt")


# Test-funktioner
def test_sun_calculator():
    """Test av SunCalculator med Stockholm-koordinater."""
    print("🧪 Testar SunCalculator...")
    
    # Test utan API-nyckel (fallback)
    calc_fallback = SunCalculator()
    stockholm_sun = calc_fallback.get_sun_times(59.3293, 18.0686)
    
    print(f"☀️ Stockholm soldata (fallback):")
    print(f"  Soluppgång: {stockholm_sun['sunrise']}")
    print(f"  Solnedgång: {stockholm_sun['sunset']}")
    print(f"  Källa: {stockholm_sun['source']}")
    print(f"  Cachad: {stockholm_sun.get('cached', False)}")


def test_weather_icons_unicode():
    """FAS 4: Test av Weather Icons Unicode-rendering."""
    print("\n🧪 FAS 4: Testar Weather Icons Unicode-rendering...")
    
    # Test Weather Icons Unicode
    print(f"☀️ Klart väder (dag): '{get_weather_icon_unicode_char(1, True)}'")
    print(f"🌙 Klart väder (natt): '{get_weather_icon_unicode_char(1, False)}'")
    print(f"🌧️ Regn: '{get_weather_icon_unicode_char(18, True)}'")
    
    # Test font-sökväg
    font_path = get_weather_icons_font_path()
    font_exists = os.path.exists(font_path)
    print(f"🔤 Weather Icons font: {'✅ Finns' if font_exists else '❌ Saknas'}")
    print(f"📁 Font-sökväg: {font_path}")
    
    # Test trycktrend
    print(f"📈 Tryck upp: '{get_pressure_trend_unicode_char('up')}'")
    print(f"📉 Tryck ner: '{get_pressure_trend_unicode_char('down')}'")


if __name__ == "__main__":
    test_sun_calculator()
    test_weather_icons_unicode()
