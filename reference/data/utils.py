#!/usr/bin/env python3
"""
Helper functions and utilities for the SMHI + Netatmo Weather Dashboard
PHASE 4: Weather Icons implementation with font rendering
Includes sunrise/sunset calculations with API support and fallback
"""

import math
import json
import requests
from datetime import datetime, date, timedelta
from typing import Dict, Optional
import os
import time


# === WEATHER ICONS UNICODE MAPPINGS FOR PHASE 4 ===

# Weather Icons Unicode mappings for font rendering
WEATHER_ICONS_UNICODE = {
    # Day icons
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

    # Night icons
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

    # General icons
    "wi-cloudy": "\uf013",
    "wi-cloud": "\uf041",
    "wi-fog": "\uf014",
    "wi-rain": "\uf019",
    "wi-rain-mix": "\uf017",
    "wi-sleet": "\uf0b5",
    "wi-snow": "\uf01b",
    "wi-thunderstorm": "\uf01e",
    "wi-windy": "\uf021",

    # Wind icons
    "wi-wind-default": "\uf0b1",
    "wi-direction-up": "\uf058",
    "wi-direction-down": "\uf044",
    "wi-minus": "\uf056",

    # Fallback
    "wi-na": "\uf07b"
}


class SunCalculator:
    """Class for calculating sunrise and sunset times."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the sun calculator.

        Args:
            api_key: API key for ipgeolocation.io (None for fallback calculation)
        """
        self.api_key = api_key
        self.api_base_url = "https://api.ipgeolocation.io/astronomy"
        self.cache_file = "sun_cache.json"
        self.cache_duration_hours = 24  # Cache for 24 hours

        print(f"🌅 SunCalculator initierad. API: {'Ja' if api_key else 'Fallback-beräkning'}")

    def get_sun_times(self, latitude: float, longitude: float, target_date: Optional[date] = None) -> Dict:
        """
        Fetch sunrise and sunset for the given location and date.

        Args:
            latitude: Latitude in decimal degrees
            longitude: Longitude in decimal degrees
            target_date: Date to calculate for (None = today)

        Returns:
            Dict with 'sunrise', 'sunset', 'source', 'cached' keys
        """
        if target_date is None:
            target_date = date.today()

        # Try the cache first
        cached_data = self._get_from_cache(latitude, longitude, target_date)
        if cached_data:
            print(f"☀️ Använder cachad soldata för {target_date}")
            cached_data['cached'] = True
            return cached_data

        # Fetch fresh data
        if self.api_key:
            sun_data = self._fetch_from_api(latitude, longitude, target_date)
        else:
            sun_data = self._calculate_fallback(latitude, longitude, target_date)

        # Cache the result
        self._save_to_cache(latitude, longitude, target_date, sun_data)
        sun_data['cached'] = False

        return sun_data

    def _get_cache_key(self, latitude: float, longitude: float, target_date: date) -> str:
        """Build a cache key for location and date."""
        return f"{latitude:.3f}_{longitude:.3f}_{target_date.isoformat()}"

    def _get_from_cache(self, latitude: float, longitude: float, target_date: date) -> Optional[Dict]:
        """Try to fetch sun data from the cache."""
        if not os.path.exists(self.cache_file):
            return None

        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)

            cache_key = self._get_cache_key(latitude, longitude, target_date)

            if cache_key in cache_data:
                cached_entry = cache_data[cache_key]

                # Check cache age
                cache_timestamp = cached_entry.get('timestamp', 0)
                cache_age_hours = (time.time() - cache_timestamp) / 3600

                if cache_age_hours < self.cache_duration_hours:
                    # Strip the timestamp before returning (not part of the sun data)
                    result = {k: v for k, v in cached_entry.items() if k != 'timestamp'}
                    return result
                else:
                    print(f"🗑️ Cache för {target_date} är för gammal ({cache_age_hours:.1f}h)")

        except (json.JSONDecodeError, KeyError, FileNotFoundError) as e:
            print(f"⚠️ Fel vid cache-läsning: {e}")

        return None

    def _save_to_cache(self, latitude: float, longitude: float, target_date: date, sun_data: Dict):
        """Save sun data to the cache."""
        try:
            # Read the existing cache
            cache_data = {}
            if os.path.exists(self.cache_file):
                try:
                    with open(self.cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                except (json.JSONDecodeError, FileNotFoundError):
                    cache_data = {}

            # Add the new entry
            cache_key = self._get_cache_key(latitude, longitude, target_date)
            cache_entry = sun_data.copy()
            cache_entry['timestamp'] = time.time()
            cache_data[cache_key] = cache_entry

            # Prune old entries (older than 7 days)
            cutoff_date = date.today() - timedelta(days=7)
            keys_to_remove = []
            for key in cache_data:
                if '_' in key:
                    try:
                        date_part = key.split('_')[2]  # Extract the date part
                        entry_date = date.fromisoformat(date_part)
                        if entry_date < cutoff_date:
                            keys_to_remove.append(key)
                    except (ValueError, IndexError):
                        # Invalid key format, remove
                        keys_to_remove.append(key)

            for key in keys_to_remove:
                del cache_data[key]

            # Save the updated cache (atomically, to avoid a corrupt file on crash)
            tmp_path = self.cache_file + '.tmp'
            with open(tmp_path, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)
            os.replace(tmp_path, self.cache_file)

            print(f"💾 Soldata cachad för {target_date}")

        except Exception as e:
            print(f"⚠️ Fel vid cache-sparning: {e}")

    def _fetch_from_api(self, latitude: float, longitude: float, target_date: date) -> Dict:
        """Fetch sun data from the ipgeolocation.io API."""
        try:
            print(f"🌐 Hämtar soldata från API för {target_date}")

            params = {
                'apiKey': self.api_key,
                'lat': latitude,
                'long': longitude
            }

            # If not today, add the date
            if target_date != date.today():
                params['date'] = target_date.isoformat()

            response = requests.get(self.api_base_url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            # Verify that we got valid data
            if 'sunrise' not in data or 'sunset' not in data:
                raise ValueError("API returnerade ogiltig data")

            # Convert times to datetime objects
            sunrise_time = self._parse_time_string(data['sunrise'], target_date)
            sunset_time = self._parse_time_string(data['sunset'], target_date)

            result = {
                'sunrise': sunrise_time.isoformat(),
                'sunset': sunset_time.isoformat(),
                'source': 'ipgeolocation.io',
                'date': target_date.isoformat()
            }

            # Add extra data if available
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
        Convert a time string (HH:MM) to a datetime object.

        Args:
            time_str: Time string from the API (e.g. "06:30")
            target_date: Date to combine with the time

        Returns:
            datetime object
        """
        try:
            time_parts = time_str.split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1])

            return datetime.combine(target_date, datetime.min.time().replace(hour=hour, minute=minute))
        except (ValueError, IndexError) as e:
            print(f"⚠️ Fel vid parsning av tid '{time_str}': {e}")
            # Fall back to a reasonable time
            return datetime.combine(target_date, datetime.min.time().replace(hour=6, minute=0))

    def _calculate_fallback(self, latitude: float, longitude: float, target_date: date) -> Dict:
        """
        Simplified sunrise/sunset calculation without an API.
        Based on astronomical algorithms (approximation).

        Args:
            latitude: Latitude in decimal degrees
            longitude: Longitude in decimal degrees
            target_date: Date to calculate for

        Returns:
            Dict with sun data
        """
        print(f"🧮 Använder fallback-beräkning för {target_date}")

        # Calculate the solar declination for the date
        day_of_year = target_date.timetuple().tm_yday
        solar_declination = 23.45 * math.sin(math.radians(360 * (284 + day_of_year) / 365))

        # Convert latitude to radians
        lat_rad = math.radians(latitude)
        decl_rad = math.radians(solar_declination)

        # Calculate the hour angle for sunrise/sunset
        try:
            cos_hour_angle = -math.tan(lat_rad) * math.tan(decl_rad)

            # Check for polar night / midnight sun
            if cos_hour_angle > 1:
                # Polar night - the sun never rises
                sunrise_hour = 12.0
                sunset_hour = 12.0
                print("🌑 Polarnatt - solen går inte upp")
            elif cos_hour_angle < -1:
                # Midnight sun - the sun never sets
                sunrise_hour = 0.0
                sunset_hour = 23.99
                print("🌞 Midnattssol - solen går inte ner")
            else:
                hour_angle = math.degrees(math.acos(cos_hour_angle))

                # Calculate local solar times
                sunrise_hour = 12 - hour_angle / 15
                sunset_hour = 12 + hour_angle / 15

                # Solar time -> UTC (longitude correction, 15 degrees per hour)...
                time_correction = longitude / 15
                sunrise_hour -= time_correction
                sunset_hour -= time_correction

                # ...and UTC -> the LOCATION's local time via a longitude-based
                # timezone estimate (round(lon/15) = the standard timezone,
                # e.g. +7 for Jakarta, +1 for Stockholm). Without this the
                # fallback times were shown in raw UTC. Approximation:
                # daylight saving time and political zone borders are not
                # handled - for exact times, use the ipgeolocation API
                # (with a key).
                utc_offset = round(longitude / 15)
                sunrise_hour += utc_offset
                sunset_hour += utc_offset

                # Normalize hours
                while sunrise_hour < 0:
                    sunrise_hour += 24
                while sunrise_hour >= 24:
                    sunrise_hour -= 24
                while sunset_hour < 0:
                    sunset_hour += 24
                while sunset_hour >= 24:
                    sunset_hour -= 24

        except (ValueError, ZeroDivisionError):
            # Fall back to season-based times for Sweden
            if 3 <= target_date.month <= 9:  # Summer
                sunrise_hour = 5.0 + (60 - latitude) / 15
                sunset_hour = 20.0 - (60 - latitude) / 15
            else:  # Winter
                sunrise_hour = 8.0 + (60 - latitude) / 12
                sunset_hour = 16.0 - (60 - latitude) / 12

            # Clamp values
            sunrise_hour = max(0, min(23.99, sunrise_hour))
            sunset_hour = max(0, min(23.99, sunset_hour))

        # Convert to datetime objects
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


# === PHASE 4: WEATHER ICONS FUNCTIONS WITH ENHANCED EMOJI ===

def get_weather_icon_enhanced(weather_symbol: int, is_daytime: bool = True) -> str:
    """
    PHASE 4: Get enhanced emoji icons for weather with better mapping.

    Args:
        weather_symbol: SMHI weather symbol (1-27)
        is_daytime: Whether it is day (True) or night (False)

    Returns:
        Enhanced emoji for the weather type
    """
    if weather_symbol is None:
        return "❓"

    # Enhanced emoji mappings with better distinction
    enhanced_weather_map = {
        1: "☀️" if is_daytime else "🌙",      # Clear
        2: "🌤️" if is_daytime else "🌙",      # Nearly clear
        3: "⛅" if is_daytime else "☁️",       # Variable cloudiness
        4: "🌥️" if is_daytime else "☁️",      # Halfclear
        5: "☁️",                              # Cloudy
        6: "☁️",                              # Overcast
        7: "🌫️",                             # Fog
        8: "🌦️",                             # Light rain showers
        9: "🌧️",                             # Moderate rain showers
        10: "🌧️",                            # Heavy rain showers
        11: "⛈️",                            # Thunderstorm
        12: "🌨️",                            # Light sleet showers
        13: "🌨️",                            # Moderate sleet showers
        14: "🌨️",                            # Heavy sleet showers
        15: "🌨️",                            # Light snow showers
        16: "❄️",                            # Moderate snow showers
        17: "❄️",                            # Heavy snow showers
        18: "🌧️",                            # Light rain
        19: "🌧️",                            # Moderate rain
        20: "🌧️",                            # Heavy rain
        21: "⛈️",                            # Thunder
        22: "🌨️",                            # Light sleet
        23: "🌨️",                            # Moderate sleet
        24: "🌨️",                            # Heavy sleet
        25: "❄️",                            # Light snowfall
        26: "❄️",                            # Moderate snowfall
        27: "❄️"                             # Heavy snowfall
    }

    return enhanced_weather_map.get(weather_symbol, "❓")


def get_weather_icon_unicode_char(weather_symbol: int, is_daytime: bool = True) -> str:
    """
    PHASE 4: Alias for get_weather_icon_enhanced, kept for backwards compatibility.

    Args:
        weather_symbol: SMHI weather symbol (1-27)
        is_daytime: Whether it is day (True) or night (False)

    Returns:
        Enhanced emoji for the weather type
    """
    return get_weather_icon_enhanced(weather_symbol, is_daytime)


def get_pressure_trend_unicode_char(trend: str) -> str:
    """
    PHASE 4: Get the Weather Icons Unicode character for a pressure trend.

    Args:
        trend: "up", "down", or "stable"

    Returns:
        Unicode character for the Weather Icons font
    """
    trend_mapping = {
        "up": WEATHER_ICONS_UNICODE["wi-direction-up"],
        "down": WEATHER_ICONS_UNICODE["wi-direction-down"],
        "stable": WEATHER_ICONS_UNICODE["wi-minus"]
    }

    return trend_mapping.get(trend, WEATHER_ICONS_UNICODE["wi-minus"])


def get_weather_icons_font_path() -> str:
    """
    PHASE 4: Get the path to the Weather Icons TTF font.

    Returns:
        Absolute path to weathericons-regular-webfont.ttf
    """
    # Get the project root directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)  # Go up from data/ to the parent directory

    font_path = os.path.join(
        project_root,
        "assets",
        "icons",
        "weather-icons",
        "fonts",
        "weathericons-regular-webfont.ttf"
    )

    return font_path


# === EXISTING FUNCTIONS (PRESERVED) ===

def get_weather_description_short(weather_symbol: int) -> str:
    """
    Short weather description for an SMHI weather symbol.

    Args:
        weather_symbol: SMHI weather symbol (1-27)

    Returns:
        Short description in Swedish
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


# Test functions
def test_sun_calculator():
    """Test SunCalculator with Stockholm coordinates."""
    print("🧪 Testar SunCalculator...")

    # Test without an API key (fallback)
    calc_fallback = SunCalculator()
    stockholm_sun = calc_fallback.get_sun_times(59.3293, 18.0686)

    print(f"☀️ Stockholm soldata (fallback):")
    print(f"  Soluppgång: {stockholm_sun['sunrise']}")
    print(f"  Solnedgång: {stockholm_sun['sunset']}")
    print(f"  Källa: {stockholm_sun['source']}")
    print(f"  Cachad: {stockholm_sun.get('cached', False)}")


def test_weather_icons_unicode():
    """PHASE 4: Test Weather Icons Unicode rendering."""
    print("\n🧪 FAS 4: Testar Weather Icons Unicode-rendering...")

    # Test Weather Icons Unicode
    print(f"☀️ Klart väder (dag): '{get_weather_icon_unicode_char(1, True)}'")
    print(f"🌙 Klart väder (natt): '{get_weather_icon_unicode_char(1, False)}'")
    print(f"🌧️ Regn: '{get_weather_icon_unicode_char(18, True)}'")

    # Test the font path
    font_path = get_weather_icons_font_path()
    font_exists = os.path.exists(font_path)
    print(f"🔤 Weather Icons font: {'✅ Finns' if font_exists else '❌ Saknas'}")
    print(f"📁 Font-sökväg: {font_path}")

    # Test pressure trend
    print(f"📈 Tryck upp: '{get_pressure_trend_unicode_char('up')}'")
    print(f"📉 Tryck ner: '{get_pressure_trend_unicode_char('down')}'")


if __name__ == "__main__":
    test_sun_calculator()
    test_weather_icons_unicode()
