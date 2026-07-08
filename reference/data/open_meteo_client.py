#!/usr/bin/env python3
"""
Open-Meteo Client - global weather data from open-meteo.com

PROJECT WEATHERPROVIDER: second alternative provider (after YR).
Selected with 'weather_provider': 'open-meteo' in reference/config.py.

Open-Meteo is free for non-commercial use, requires no API key and has
global coverage with data from several national weather institutes
(DWD, NOAA, Meteo-France, ECMWF etc. - the best model is chosen per location).

The design follows the same approach A as YRClient: the response is
translated into SMHI's timeSeries structure and the WMO weather codes are
mapped onto the SMHI scale 1-27, so all inherited logic and the entire API
contract towards the frontend are unchanged.
Inherits YRClient (not SMHIClient directly) to reuse the behavior of
taking humidity from the forecast instead of observation stations.

API documentation: https://open-meteo.com/en/docs
"""

import requests
from typing import Dict, Optional

from yr_client import YRClient


class OpenMeteoClient(YRClient):
    """Open-Meteo provider exposing SMHIClient's public interface."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    DATA_SOURCE = "Open-Meteo"

    # Hourly parameters we need (m/s for wind so the units match SMHI/YR;
    # times in UTC so the inherited time-point selection works)
    HOURLY_PARAMS = ",".join([
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "wind_direction_10m",
        "precipitation",
        "pressure_msl",
        "weather_code",
    ])

    # WMO weather interpretation codes (WW) -> SMHI symbol 1-27.
    # Shower codes (80-86) are kept distinct from continuous precipitation,
    # just like in the SMHI scale; drizzle/freezing precipitation is mapped
    # to the nearest sleet symbol.
    WMO_SYMBOL_MAP = {
        0: 1,    # Clear sky
        1: 2,    # Mainly clear
        2: 4,    # Partly cloudy
        3: 6,    # Overcast
        45: 7,   # Fog
        48: 7,   # Depositing rime fog
        51: 18,  # Drizzle (light)
        53: 18,  # Drizzle (moderate)
        55: 19,  # Drizzle (dense)
        56: 22,  # Freezing drizzle (light) -> light sleet
        57: 23,  # Freezing drizzle (dense) -> sleet
        61: 18,  # Rain (light)
        63: 19,  # Rain (moderate)
        65: 20,  # Rain (heavy)
        66: 22,  # Freezing rain (light) -> light sleet
        67: 24,  # Freezing rain (heavy) -> heavy sleet
        71: 25,  # Snowfall (light)
        73: 26,  # Snowfall (moderate)
        75: 27,  # Snowfall (heavy)
        77: 26,  # Snow grains
        80: 8,   # Rain showers (light)
        81: 9,   # Rain showers (moderate)
        82: 10,  # Rain showers (heavy)
        85: 15,  # Snow showers (light)
        86: 17,  # Snow showers (heavy)
        95: 21,  # Thunderstorm
        96: 21,  # Thunderstorm with hail (light)
        99: 21,  # Thunderstorm with hail (heavy)
    }

    def get_forecast_url(self) -> str:
        return (f"{self.BASE_URL}"
                f"?latitude={round(self.latitude, 4)}&longitude={round(self.longitude, 4)}"
                f"&hourly={self.HOURLY_PARAMS}"
                f"&wind_speed_unit=ms&timezone=UTC&forecast_days=7")

    def fetch_raw_data(self) -> Optional[Dict]:
        """Fetch the Open-Meteo forecast and translate it to an SMHI-shaped timeSeries."""
        import time as _time
        url = self.get_forecast_url()

        try:
            print(f"🌐 Hämtar Open-Meteo-data från: {url}")
            response = requests.get(
                url,
                timeout=self.REQUEST_TIMEOUT,
                headers={'User-Agent': self.USER_AGENT}
            )
            response.raise_for_status()
            raw = response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Open-Meteo API-fel: {e}")
            return None
        except ValueError as e:
            print(f"❌ Ogiltig JSON från Open-Meteo: {e}")
            return None

        data = self._transform_to_smhi_format(raw)
        if data:
            self.cached_data = data
            self.last_fetch_time = _time.time()
            print(f"✅ Open-Meteo-data hämtad: {len(data['timeSeries'])} tidpunkter")
        return data

    def _transform_to_smhi_format(self, raw: Dict) -> Optional[Dict]:
        """Translate Open-Meteo's columnar format into the SNOW1gv1 structure."""
        hourly = raw.get('hourly')
        if not hourly or 'time' not in hourly:
            print("❌ Oväntat Open-Meteo-svarsformat (saknar hourly.time)")
            return None

        def col(name):
            return hourly.get(name) or []

        times = hourly['time']
        temps = col('temperature_2m')
        hums = col('relative_humidity_2m')
        winds = col('wind_speed_10m')
        wdirs = col('wind_direction_10m')
        precs = col('precipitation')
        press = col('pressure_msl')
        codes = col('weather_code')

        def pick(series, i):
            return series[i] if i < len(series) else None

        entries = []
        for i, t in enumerate(times):
            entry_data = {
                'air_temperature': pick(temps, i),
                'relative_humidity': pick(hums, i),
                'wind_speed': pick(winds, i),
                'wind_from_direction': pick(wdirs, i),
                'air_pressure_at_mean_sea_level': pick(press, i),
            }

            code = pick(codes, i)
            if code is not None:
                entry_data['symbol_code'] = self._map_wmo_symbol(int(code))

            prec = pick(precs, i)
            if prec is not None:
                # Hourly resolution -> already mm/h
                entry_data['precipitation_amount_mean'] = prec
                entry_data['precipitation_amount_max'] = prec

            entry_data = {k: v for k, v in entry_data.items() if v is not None}

            entries.append({
                # timezone=UTC yields times without a Z suffix - append it
                # so the inherited (tz-aware) time-point selection works
                'time': f"{t}Z" if t and not t.endswith('Z') else t,
                'data': entry_data
            })

        if not entries:
            print("❌ Inga användbara tidpunkter i Open-Meteo-svaret")
            return None

        result = {'timeSeries': entries}
        if 'longitude' in raw and 'latitude' in raw:
            result['geometry'] = {'coordinates': [raw['longitude'], raw['latitude']]}
        return result

    def _map_wmo_symbol(self, code: int) -> int:
        """Map a WMO weather code -> SMHI symbol 1-27."""
        symbol = self.WMO_SYMBOL_MAP.get(code)
        if symbol is None:
            print(f"⚠️ Okänd WMO-kod {code} - använder molnigt (5)")
            return 5
        return symbol
