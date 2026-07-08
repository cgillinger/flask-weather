#!/usr/bin/env python3
"""
YR Client - weather data from YR/met.no (Norwegian Meteorological Institute)

PROJECT WEATHERPROVIDER: first alternative provider besides SMHI.
Selected with 'weather_provider': 'yr' in reference/config.py.

Design principle (approach A): YRClient inherits SMHIClient and translates
the locationforecast response into the same timeSeries structure as SMHI's
SNOW1gv1 format, with symbol_code mapped onto SMHI's symbol scale 1-27.
This leaves ALL inherited logic untouched: caching, time-point selection,
12h/five-day forecasts, animation triggers and five-day weighting - and the
API contract towards the frontend (weather_symbol 1-27) is unchanged, so
icon packs, rotation and WeatherEffects work without modification.

API documentation: https://api.met.no/weatherapi/locationforecast/2.0/documentation
Terms of service:  https://developer.yr.no/doc/TermsOfService/
- Requires an identifying User-Agent (site/repo + contact)
- Max one update per 10 min for the same position (the inherited SMHI cache
  is 5 min, but the app's poll cycle is 15 min so the limit holds in
  practice; cache_duration is still raised to 10 min here to be polite)
"""

import requests
from typing import Dict, Optional

from smhi_client import SMHIClient


class YRClient(SMHIClient):
    """YR/met.no provider exposing SMHIClient's public interface."""

    BASE_URL = "https://api.met.no/weatherapi/locationforecast/2.0"
    DATA_SOURCE = "YR"

    # met.no's terms require an identifying User-Agent
    USER_AGENT = "flask-weather/3.x https://github.com/cgillinger/flask-weather"

    # YR provides relative humidity directly in the forecast (SMHI fetches
    # it from observation stations) - add it to the parameter parsing
    PARAMETERS = {
        **SMHIClient.PARAMETERS,
        'relative_humidity': 'humidity',
    }

    # YR symbol_code (base name without _day/_night/_polartwilight) -> SMHI 1-27.
    # Both institutes use similar vocabularies; shower variants are kept
    # distinct from continuous precipitation, just like in the SMHI scale.
    SYMBOL_MAP = {
        'clearsky': 1,
        'fair': 2,
        'partlycloudy': 4,
        'cloudy': 5,
        'fog': 7,
        'lightrainshowers': 8,
        'rainshowers': 9,
        'heavyrainshowers': 10,
        'lightrainshowersandthunder': 11,
        'rainshowersandthunder': 11,
        'heavyrainshowersandthunder': 11,
        'lightsleetshowersandthunder': 11,
        'sleetshowersandthunder': 11,
        'heavysleetshowersandthunder': 11,
        'lightssnowshowersandthunder': 11,  # (sic - spelling as published by met.no)
        'snowshowersandthunder': 11,
        'heavysnowshowersandthunder': 11,
        'lightsleetshowers': 12,
        'sleetshowers': 13,
        'heavysleetshowers': 14,
        'lightsnowshowers': 15,
        'snowshowers': 16,
        'heavysnowshowers': 17,
        'lightrain': 18,
        'rain': 19,
        'heavyrain': 20,
        'lightrainandthunder': 21,
        'rainandthunder': 21,
        'heavyrainandthunder': 21,
        'lightsleetandthunder': 21,
        'sleetandthunder': 21,
        'heavysleetandthunder': 21,
        'lightsnowandthunder': 21,
        'snowandthunder': 21,
        'heavysnowandthunder': 21,
        'lightsleet': 22,
        'sleet': 23,
        'heavysleet': 24,
        'lightsnow': 25,
        'snow': 26,
        'heavysnow': 27,
    }

    def __init__(self, latitude: float, longitude: float):
        super().__init__(latitude, longitude)
        # Courtesy towards met.no: extend the cache to their 10-minute limit
        self.cache_duration = 600
        print(f"🌍 YR-klient (met.no) initierad för position: {latitude}, {longitude}")

    def get_forecast_url(self) -> str:
        # met.no wants at most 4 decimals in coordinates
        return (f"{self.BASE_URL}/compact"
                f"?lat={round(self.latitude, 4)}&lon={round(self.longitude, 4)}")

    def fetch_raw_data(self) -> Optional[Dict]:
        """Fetch the YR forecast and translate it to an SMHI-shaped timeSeries."""
        import time as _time
        url = self.get_forecast_url()

        try:
            print(f"🌐 Hämtar YR-data från: {url}")
            response = requests.get(
                url,
                timeout=self.REQUEST_TIMEOUT,
                headers={'User-Agent': self.USER_AGENT}
            )
            response.raise_for_status()
            raw = response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ YR API-fel: {e}")
            return None
        except ValueError as e:
            print(f"❌ Ogiltig JSON från YR: {e}")
            return None

        data = self._transform_to_smhi_format(raw)
        if data:
            self.cached_data = data
            self.last_fetch_time = _time.time()
            print(f"✅ YR-data hämtad: {len(data['timeSeries'])} tidpunkter")
        return data

    def _transform_to_smhi_format(self, raw: Dict) -> Optional[Dict]:
        """Translate met.no locationforecast JSON into the SNOW1gv1 structure."""
        try:
            timeseries = raw['properties']['timeseries']
        except (KeyError, TypeError):
            print("❌ Oväntat YR-svarsformat (saknar properties.timeseries)")
            return None

        entries = []
        for point in timeseries:
            details = point.get('data', {}).get('instant', {}).get('details', {})
            if not details:
                continue

            # The nearest upcoming period carries symbol and precipitation:
            # the 1h block exists for the first ~2 days, then 6h - take the
            # first one available
            period = (point['data'].get('next_1_hours')
                      or point['data'].get('next_6_hours')
                      or point['data'].get('next_12_hours'))

            entry_data = {
                'air_temperature': details.get('air_temperature'),
                'wind_speed': details.get('wind_speed'),
                'wind_from_direction': details.get('wind_from_direction'),
                'air_pressure_at_mean_sea_level': details.get('air_pressure_at_sea_level'),
                'relative_humidity': details.get('relative_humidity'),
            }

            if period:
                symbol_code = period.get('summary', {}).get('symbol_code', '')
                entry_data['symbol_code'] = self._map_symbol(symbol_code)

                amount = period.get('details', {}).get('precipitation_amount')
                if amount is not None:
                    # Normalize to mm/h so intensity is comparable with
                    # SMHI regardless of period length
                    hours = 6 if 'next_6_hours' in point['data'] and not point['data'].get('next_1_hours') else 1
                    if 'next_12_hours' in point['data'] and not point['data'].get('next_1_hours') and not point['data'].get('next_6_hours'):
                        hours = 12
                    entry_data['precipitation_amount_mean'] = round(amount / hours, 2)
                    entry_data['precipitation_amount_max'] = round(amount / hours, 2)

            # Strip None values (the SMHI path filters on 9999; here it is
            # enough to omit the key so parse_parameters skips it)
            entry_data = {k: v for k, v in entry_data.items() if v is not None}

            entries.append({
                'time': point.get('time'),
                'data': entry_data
            })

        if not entries:
            print("❌ Inga användbara tidpunkter i YR-svaret")
            return None

        result = {'timeSeries': entries}

        # Grid coordinates (geometry is [lon, lat, alt] at met.no)
        try:
            coords = raw['geometry']['coordinates']
            result['geometry'] = {'coordinates': [coords[0], coords[1]]}
        except (KeyError, IndexError, TypeError):
            pass

        return result

    def _map_symbol(self, symbol_code: str) -> int:
        """Map a YR symbol_code -> SMHI symbol 1-27."""
        base = symbol_code.split('_')[0] if symbol_code else ''
        symbol = self.SYMBOL_MAP.get(base)
        if symbol is None:
            print(f"⚠️ Okänd YR-symbol '{symbol_code}' - använder molnigt (5)")
            return 5
        return symbol

    def get_current_weather_with_humidity(self) -> Optional[Dict]:
        """
        YR includes humidity directly in the forecast - no observation
        station is needed (the SMHI path fetches it from the metobs API).
        """
        weather_data = self.get_current_weather()
        if not weather_data:
            print("❌ Ingen grundläggande väderdata tillgänglig")
            return None

        humidity = weather_data.get('humidity')
        weather_data['humidity'] = humidity
        weather_data['humidity_timestamp'] = weather_data.get('valid_time')
        # The DATA_SOURCE label keeps this line correct for subclasses too (Open-Meteo)
        weather_data['humidity_station'] = f'{self.DATA_SOURCE}-prognos' if humidity is not None else None
        weather_data['humidity_age_minutes'] = 0 if humidity is not None else None
        if humidity is not None:
            print(f"✅ Väderdata med luftfuktighet från {self.DATA_SOURCE}-prognos: {humidity}%")
        return weather_data
