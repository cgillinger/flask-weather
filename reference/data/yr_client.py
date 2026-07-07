#!/usr/bin/env python3
"""
YR Client - vaderdata fran YR/met.no (Meteorologisk institutt, Norge)

PROJEKT WEATHERPROVIDER: forsta alternativa leverantoren till SMHI.
Valjs med 'weather_provider': 'yr' i reference/config.py.

Designprincip (vag A): YRClient arver SMHIClient och oversatter
locationforecast-svaret till samma timeSeries-struktur som SMHI:s
SNOW1gv1-format, med symbol_code mappad till SMHI:s symbolskala 1-27.
Darmed arvs ALL befintlig logik ororda: cache, tidpunktsurval,
12h/femdygnsprognoser, animation triggers och femdygnsvagning - och
API-kontraktet mot frontend (weather_symbol 1-27) ar oforandrat, sa
ikonpaket, rotation och WeatherEffects fungerar utan andringar.

API-dokumentation: https://api.met.no/weatherapi/locationforecast/2.0/documentation
Anvandarvillkor:   https://developer.yr.no/doc/TermsOfService/
- Kraver identifierande User-Agent (sajt/repo + kontakt)
- Max en uppdatering per 10 min for samma position (var cache ar 5 min,
  men appens pollcykel ar 15 min sa villkoret halls i praktiken;
  cache_duration hojs anda till 10 min har for att vara artig)
"""

import requests
from typing import Dict, Optional

from smhi_client import SMHIClient


class YRClient(SMHIClient):
    """YR/met.no-leverantor med SMHIClients publika granssnitt."""

    BASE_URL = "https://api.met.no/weatherapi/locationforecast/2.0"
    DATA_SOURCE = "YR"

    # met.no:s villkor kraver identifierande User-Agent
    USER_AGENT = "flask-weather/3.x https://github.com/cgillinger/flask-weather"

    # YR har relativ luftfuktighet direkt i prognosen (SMHI hamtar den
    # fran observationsstationer) - lagg till i parametertolkningen
    PARAMETERS = {
        **SMHIClient.PARAMETERS,
        'relative_humidity': 'humidity',
    }

    # YR symbol_code (basnamn utan _day/_night/_polartwilight) -> SMHI 1-27.
    # Bada instituten anvander snarlika vokabularer; skurvarianter skiljs
    # fran kontinuerlig nederbord precis som i SMHI-skalan.
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
        'lightssnowshowersandthunder': 11,  # (sic - stavning fran met.no)
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
        # Artighet mot met.no: forlang cachen till deras 10-minutersgrans
        self.cache_duration = 600
        print(f"🌍 YR-klient (met.no) initierad för position: {latitude}, {longitude}")

    def get_forecast_url(self) -> str:
        # met.no vill ha max 4 decimaler i koordinater
        return (f"{self.BASE_URL}/compact"
                f"?lat={round(self.latitude, 4)}&lon={round(self.longitude, 4)}")

    def fetch_raw_data(self) -> Optional[Dict]:
        """Hamta YR-prognos och oversatt till SMHI-formad timeSeries."""
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
        """Oversatt met.no locationforecast-JSON till SNOW1gv1-struktur."""
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

            # Narmast kommande period bar symbol och nederbord: 1h-blocket
            # finns de forsta ~2 dygnen, darefter 6h - ta det forsta som finns
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
                    # Normalisera till mm/h sa intensiteten ar jamforbar
                    # med SMHI oavsett periodlangd
                    hours = 6 if 'next_6_hours' in point['data'] and not point['data'].get('next_1_hours') else 1
                    if 'next_12_hours' in point['data'] and not point['data'].get('next_1_hours') and not point['data'].get('next_6_hours'):
                        hours = 12
                    entry_data['precipitation_amount_mean'] = round(amount / hours, 2)
                    entry_data['precipitation_amount_max'] = round(amount / hours, 2)

            # Rensa None-varden (SMHI-vagen filtrerar pa 9999; har racker
            # att utelamna nyckeln sa hoppar parse_parameters over den)
            entry_data = {k: v for k, v in entry_data.items() if v is not None}

            entries.append({
                'time': point.get('time'),
                'data': entry_data
            })

        if not entries:
            print("❌ Inga användbara tidpunkter i YR-svaret")
            return None

        result = {'timeSeries': entries}

        # Grid-koordinater (geometry ar [lon, lat, alt] hos met.no)
        try:
            coords = raw['geometry']['coordinates']
            result['geometry'] = {'coordinates': [coords[0], coords[1]]}
        except (KeyError, IndexError, TypeError):
            pass

        return result

    def _map_symbol(self, symbol_code: str) -> int:
        """Mappa YR symbol_code -> SMHI-symbol 1-27."""
        base = symbol_code.split('_')[0] if symbol_code else ''
        symbol = self.SYMBOL_MAP.get(base)
        if symbol is None:
            print(f"⚠️ Okänd YR-symbol '{symbol_code}' - använder molnigt (5)")
            return 5
        return symbol

    def get_current_weather_with_humidity(self) -> Optional[Dict]:
        """
        YR har luftfuktighet direkt i prognosen - ingen observations-
        station behovs (SMHI-vagen hamtar den fran metobs-API:t).
        """
        weather_data = self.get_current_weather()
        if not weather_data:
            print("❌ Ingen grundläggande väderdata tillgänglig")
            return None

        humidity = weather_data.get('humidity')
        weather_data['humidity'] = humidity
        weather_data['humidity_timestamp'] = weather_data.get('valid_time')
        weather_data['humidity_station'] = 'YR-prognos' if humidity is not None else None
        weather_data['humidity_age_minutes'] = 0 if humidity is not None else None
        if humidity is not None:
            print(f"✅ Väderdata med luftfuktighet från YR-prognos: {humidity}%")
        return weather_data
