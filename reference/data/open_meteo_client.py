#!/usr/bin/env python3
"""
Open-Meteo Client - global vaderdata fran open-meteo.com

PROJEKT WEATHERPROVIDER: andra alternativa leverantoren (efter YR).
Valjs med 'weather_provider': 'open-meteo' i reference/config.py.

Open-Meteo ar gratis for icke-kommersiellt bruk, kraver ingen API-nyckel
och har global tackning med data fran flera nationella vaderinstitut
(DWD, NOAA, Meteo-France, ECMWF m.fl. - basta modellen valjs per plats).

Designen foljer samma vag A som YRClient: svaret oversatts till SMHI:s
timeSeries-struktur och WMO-vaderkoderna mappas till SMHI-skalan 1-27,
sa all arvd logik och hela API-kontraktet mot frontend ar oforandrat.
Arver YRClient (inte SMHIClient direkt) for att aterbruka beteendet
att luftfuktighet tas ur prognosen istallet for observationsstationer.

API-dokumentation: https://open-meteo.com/en/docs
"""

import requests
from typing import Dict, Optional

from yr_client import YRClient


class OpenMeteoClient(YRClient):
    """Open-Meteo-leverantor med SMHIClients publika granssnitt."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    DATA_SOURCE = "Open-Meteo"

    # Timserieparametrar vi behover (m/s for vind sa enheterna matchar
    # SMHI/YR; tider i UTC sa det arvda tidpunktsurvalet fungerar)
    HOURLY_PARAMS = ",".join([
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "wind_direction_10m",
        "precipitation",
        "pressure_msl",
        "weather_code",
    ])

    # WMO weather interpretation codes (WW) -> SMHI-symbol 1-27.
    # Skurkoder (80-86) skiljs fran kontinuerlig nederbord precis som
    # i SMHI-skalan; dagg/underkylt mappas till narmaste snoblandat.
    WMO_SYMBOL_MAP = {
        0: 1,    # Klart
        1: 2,    # Mestadels klart
        2: 4,    # Halvklart
        3: 6,    # Mulet
        45: 7,   # Dimma
        48: 7,   # Underkyld dimma
        51: 18,  # Duggregn (latt)
        53: 18,  # Duggregn (mattligt)
        55: 19,  # Duggregn (tatt)
        56: 22,  # Underkylt duggregn (latt) -> latt snoblandat
        57: 23,  # Underkylt duggregn (tatt) -> snoblandat
        61: 18,  # Regn (latt)
        63: 19,  # Regn (mattligt)
        65: 20,  # Regn (kraftigt)
        66: 22,  # Underkylt regn (latt) -> latt snoblandat
        67: 24,  # Underkylt regn (kraftigt) -> kraftigt snoblandat
        71: 25,  # Snofall (latt)
        73: 26,  # Snofall (mattligt)
        75: 27,  # Snofall (kraftigt)
        77: 26,  # Snokorn
        80: 8,   # Regnskurar (latta)
        81: 9,   # Regnskurar (mattliga)
        82: 10,  # Regnskurar (kraftiga)
        85: 15,  # Snobyar (latta)
        86: 17,  # Snobyar (kraftiga)
        95: 21,  # Aska
        96: 21,  # Aska med hagel (latt)
        99: 21,  # Aska med hagel (kraftigt)
    }

    def get_forecast_url(self) -> str:
        return (f"{self.BASE_URL}"
                f"?latitude={round(self.latitude, 4)}&longitude={round(self.longitude, 4)}"
                f"&hourly={self.HOURLY_PARAMS}"
                f"&wind_speed_unit=ms&timezone=UTC&forecast_days=7")

    def fetch_raw_data(self) -> Optional[Dict]:
        """Hamta Open-Meteo-prognos och oversatt till SMHI-formad timeSeries."""
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
        """Oversatt Open-Meteos kolumnformat till SNOW1gv1-struktur."""
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
                # Timupplost -> redan mm/h
                entry_data['precipitation_amount_mean'] = prec
                entry_data['precipitation_amount_max'] = prec

            entry_data = {k: v for k, v in entry_data.items() if v is not None}

            entries.append({
                # timezone=UTC ger tider utan Z-suffix - lagg pa det sa
                # att det arvda tidpunktsurvalet (tz-medvetet) fungerar
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
        """Mappa WMO-vaderkod -> SMHI-symbol 1-27."""
        symbol = self.WMO_SYMBOL_MAP.get(code)
        if symbol is None:
            print(f"⚠️ Okänd WMO-kod {code} - använder molnigt (5)")
            return 5
        return symbol
