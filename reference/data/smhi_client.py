#!/usr/bin/env python3
"""
SMHI API-klient fÃ¶r vÃ¤derdata
HÃ¤mtar prognoser och aktuell vÃ¤derdata frÃ¥n SMHI:s Ã¶ppna API.
+ WEATHER ANIMATIONS INTEGRATION: Animation triggers fÃ¶r frontend
+ FAS 1: SMHI LUFTFUKTIGHET: Meteorologiska observations-API integration

API-dokumentation: https://opendata.smhi.se/apidocs/metfcst/index.html
Observations API: https://opendata.smhi.se/apidocs/metobs/index.html
"""

import requests
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import time
import math


class SMHIClient:
    """Klient fÃ¶r att hÃ¤mta vÃ¤derdata frÃ¥n SMHI:s API med weather animations support och luftfuktighet."""
    
    # SMHI API konstanter - VÃ„DERPROGNOS
    BASE_URL = "https://opendata-download-metfcst.smhi.se/api"
    CATEGORY = "snow1g"  # Meteorological forecasts
    VERSION = "1"

    # Etikett i API-svar (subklasser/andra leverantörer sätter sin egen)
    DATA_SOURCE = "SMHI"
    
    # SMHI API konstanter - METEOROLOGISKA OBSERVATIONER (FAS 1)
    METOBS_BASE_URL = "https://opendata-download-metobs.smhi.se/api"
    METOBS_VERSION = "1.0"
    HUMIDITY_PARAMETER = "6"  # Relativ luftfuktighet (%)
    
    # VÃ¤derparametrar vi Ã¤r intresserade av
    PARAMETERS = {
        'air_temperature': 'temperature',                    # Temperatur
        'symbol_code': 'weather_symbol',                     # Vädersymbol (1-27)
        'wind_speed': 'wind_speed',                          # Vindstyrka (m/s)
        'wind_from_direction': 'wind_direction',             # Vindriktning (grader)
        'precipitation_amount_mean': 'precipitation',        # Medelskattad nederbörd (mm)
        'precipitation_amount_max': 'precipitation_max',     # Nederbörd max (mm/h)
        'air_pressure_at_mean_sea_level': 'pressure'         # Lufttryck (hPa)
    }
    
    # Timeout fÃ¶r API-anrop
    REQUEST_TIMEOUT = 10
    
    # FAS 1: Fallback-stationer fÃ¶r luftfuktighet (vÃ¤lkÃ¤nda aktiva stationer)
    HUMIDITY_FALLBACK_STATIONS = [98210, 71420, 52350]  # Stockholm, GÃ¶teborg, MalmÃ¶
    
    # WEATHER ANIMATIONS: SMHI Symbol Mapping (1-27)
    ANIMATION_MAPPING = {
        # Regn och regnskurar
        'rain': [8, 9, 10, 18, 19, 20],
        # SnÃ¶ och snÃ¶byar  
        'snow': [15, 16, 17, 25, 26, 27],
        # SnÃ¶blandat regn
        'sleet': [12, 13, 14, 22, 23, 24],
        # Ã…ska (kan kombineras med regn)
        'thunder': [11, 21],
        # Klart vÃ¤der (ingen animation)
        'clear': [1, 2, 3, 4, 5, 6, 7]
    }
    
    def __init__(self, latitude: float, longitude: float):
        """
        Initialisera SMHI-klient.
        
        Args:
            latitude: Latitud (decimal grader)
            longitude: Longitud (decimal grader)
        """
        self.latitude = latitude
        self.longitude = longitude
        self.last_fetch_time = None
        self.cached_data = None
        self.cache_duration = 300  # Cache i 5 minuter
        
        # FAS 1: Luftfuktighet cache och station tracking
        self.humidity_cache = None
        self.humidity_cache_time = None
        self.humidity_cache_duration = 600  # 10 minuters cache (observationer uppdateras mindre ofta)
        self.nearest_humidity_station = None
        
        print(f"ðŸŒ SMHI-klient initierad fÃ¶r position: {latitude}, {longitude}")
    
    # === FAS 1: LUFTFUKTIGHET METODER ===
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        BerÃ¤kna Haversine-avstÃ¥nd mellan tvÃ¥ koordinater.
        
        Args:
            lat1, lon1: FÃ¶rsta koordinaten
            lat2, lon2: Andra koordinaten
            
        Returns:
            AvstÃ¥nd i kilometer
        """
        # Konvertera till radianer
        lat1_r = math.radians(lat1)
        lon1_r = math.radians(lon1)
        lat2_r = math.radians(lat2)
        lon2_r = math.radians(lon2)
        
        # Haversine-formel
        dlat = lat2_r - lat1_r
        dlon = lon2_r - lon1_r
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        # Jordens radie i km
        r = 6371
        
        return c * r
    
    def find_nearest_humidity_station(self) -> Optional[int]:
        """
        Hitta nÃ¤rmaste station med luftfuktighetsdata baserat pÃ¥ config-koordinater.
        
        Returns:
            station_id (int) fÃ¶r nÃ¤rmaste station eller None vid fel
        """
        # AnvÃ¤nd cachad station om vi redan hittat en
        if self.nearest_humidity_station:
            print(f"ðŸ’¾ AnvÃ¤nder cachad nÃ¤rmaste station: {self.nearest_humidity_station}")
            return self.nearest_humidity_station
        
        url = f"{self.METOBS_BASE_URL}/version/{self.METOBS_VERSION}/parameter/{self.HUMIDITY_PARAMETER}.json"
        
        try:
            print(f"ðŸ” SÃ¶ker nÃ¤rmaste luftfuktighetsstation: {url}")
            
            response = requests.get(url, timeout=self.REQUEST_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            if 'station' not in data:
                print("âŒ Ingen station-data frÃ¥n SMHI observations API")
                return self._get_fallback_station()
            
            stations = data['station']
            print(f"ðŸ“ Hittade {len(stations)} luftfuktighetsstationer")
            
            # Hitta nÃ¤rmaste aktiva station
            nearest_station = None
            min_distance = float('inf')
            
            for station in stations:
                # Kontrollera att stationen Ã¤r aktiv (har from/to datum)
                if not station.get('active', True):
                    continue
                
                # Kontrollera att vi har koordinater
                if 'latitude' not in station or 'longitude' not in station:
                    continue
                
                try:
                    station_lat = float(station['latitude'])
                    station_lon = float(station['longitude'])
                    station_id = int(station['id'])
                    
                    # BerÃ¤kna avstÃ¥nd
                    distance = self._calculate_distance(
                        self.latitude, self.longitude,
                        station_lat, station_lon
                    )
                    
                    if distance < min_distance:
                        min_distance = distance
                        nearest_station = station_id
                        
                except (ValueError, TypeError) as e:
                    print(f"âš ï¸ Fel vid parsning av station {station.get('id', 'N/A')}: {e}")
                    continue
            
            if nearest_station:
                self.nearest_humidity_station = nearest_station
                print(f"âœ… NÃ¤rmaste luftfuktighetsstation: {nearest_station} (avstÃ¥nd: {min_distance:.1f} km)")
                return nearest_station
            else:
                print("âŒ Ingen giltig nÃ¤rmaste station hittad")
                return self._get_fallback_station()
                
        except requests.exceptions.Timeout:
            print(f"â° Timeout vid sÃ¶kning av nÃ¤rmaste station ({self.REQUEST_TIMEOUT}s)")
            return self._get_fallback_station()
        except requests.exceptions.RequestException as e:
            print(f"ðŸŒ NÃ¤tverksfel vid stationssÃ¶kning: {e}")
            return self._get_fallback_station()
        except Exception as e:
            print(f"âŒ OvÃ¤ntat fel vid stationssÃ¶kning: {e}")
            return self._get_fallback_station()
    
    def _get_fallback_station(self) -> int:
        """
        Returnera fallback-station baserat pÃ¥ position.
        
        Returns:
            Station ID fÃ¶r nÃ¤rmaste fallback-station
        """
        # VÃ¤lj fallback baserat pÃ¥ ungefÃ¤rlig position i Sverige
        if self.latitude >= 58.5:  # Norra/mellersta Sverige
            fallback = self.HUMIDITY_FALLBACK_STATIONS[0]  # Stockholm
        elif self.latitude >= 56.5:  # VÃ¤stra Sverige
            fallback = self.HUMIDITY_FALLBACK_STATIONS[1]  # GÃ¶teborg
        else:  # SÃ¶dra Sverige
            fallback = self.HUMIDITY_FALLBACK_STATIONS[2]  # MalmÃ¶
        
        print(f"ðŸ”„ AnvÃ¤nder fallback-station: {fallback}")
        return fallback
    
    def get_station_humidity(self, station_id: Optional[int] = None) -> Optional[Dict]:
        """
        HÃ¤mta luftfuktighet frÃ¥n SMHI meteorologiska observations-API.
        
        Args:
            station_id: Specifik station (None = auto-detect nÃ¤rmaste)
            
        Returns:
            Dict med {'value': float, 'timestamp': str, 'station_name': str, 'data_age_minutes': int}
            eller None vid fel
        """
        # Kontrollera cache fÃ¶rst
        if (self.humidity_cache and 
            self.humidity_cache_time and 
            time.time() - self.humidity_cache_time < self.humidity_cache_duration):
            print("ðŸ’¾ AnvÃ¤nder cachad luftfuktighetsdata")
            return self.humidity_cache
        
        # BestÃ¤m station
        if station_id is None:
            station_id = self.find_nearest_humidity_station()
            if station_id is None:
                print("âŒ Ingen luftfuktighetsstation tillgÃ¤nglig")
                return None
        
        url = (f"{self.METOBS_BASE_URL}/version/{self.METOBS_VERSION}/"
               f"parameter/{self.HUMIDITY_PARAMETER}/station/{station_id}/"
               f"period/latest-hour/data.json")
        
        try:
            print(f"ðŸ’§ HÃ¤mtar luftfuktighet frÃ¥n station {station_id}: {url}")
            
            response = requests.get(url, timeout=self.REQUEST_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            if 'value' not in data or not data['value']:
                print(f"âŒ Ingen luftfuktighetsdata fÃ¶r station {station_id}")
                return None
            
            # Ta senaste vÃ¤rdet
            latest_value = data['value'][-1]
            
            humidity_value = float(latest_value['value'])
            timestamp_raw = latest_value['date']
            
            # Konvertera timestamp och berÃ¤kna Ã¥lder - hantera bÃ¥de unix timestamp och ISO-format
            try:
                if isinstance(timestamp_raw, int):
                    # Unix timestamp (observations API)
                    timestamp = datetime.fromtimestamp(timestamp_raw / 1000, tz=timezone.utc)
                    timestamp_str = timestamp.isoformat()
                elif isinstance(timestamp_raw, str):
                    # ISO format (annat API)
                    timestamp_str = timestamp_raw
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                else:
                    raise ValueError(f"OkÃ¤nt timestamp-format: {type(timestamp_raw)}")
                
                now = datetime.now(timezone.utc)
                age_minutes = int((now - timestamp).total_seconds() / 60)
                
                # Validera data-Ã¥lder (max 2 timmar)
                if age_minutes > 120:
                    print(f"âš ï¸ Luftfuktighetsdata fÃ¶r gammal: {age_minutes} minuter")
                    return None
                
            except (ValueError, TypeError) as e:
                print(f"âš ï¸ Fel vid parsning av timestamp {timestamp_raw}: {e}")
                # AnvÃ¤nd aktuell tid som fallback
                timestamp_str = datetime.now(timezone.utc).isoformat()
                age_minutes = 0
            
            # Bygg resultat
            result = {
                'value': humidity_value,
                'timestamp': timestamp_str,
                'station_id': station_id,
                'station_name': f"SMHI Station {station_id}",
                'data_age_minutes': age_minutes
            }
            
            # Cache resultat
            self.humidity_cache = result
            self.humidity_cache_time = time.time()
            
            print(f"âœ… Luftfuktighet: {humidity_value}% (Ã¥lder: {age_minutes} min)")
            return result
            
        except requests.exceptions.Timeout:
            print(f"â° Timeout vid hÃ¤mtning av luftfuktighet frÃ¥n station {station_id}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"ðŸŒ NÃ¤tverksfel vid luftfuktighetshÃ¤mtning: {e}")
            return None
        except (ValueError, TypeError) as e:
            print(f"ðŸ“‹ Fel vid parsning av luftfuktighetsdata: {e}")
            return None
        except Exception as e:
            print(f"âŒ OvÃ¤ntat fel vid luftfuktighetshÃ¤mtning: {e}")
            return None
    
    def get_current_weather_with_humidity(self) -> Optional[Dict]:
        """
        UtÃ¶kad version av get_current_weather() som inkluderar luftfuktighet.
        
        Returns:
            Befintlig vÃ¤derdata + 'humidity', 'humidity_timestamp', 'humidity_station'
            eller None vid fel
        """
        # HÃ¤mta standard vÃ¤derdata
        weather_data = self.get_current_weather()
        if not weather_data:
            print("âŒ Ingen grundlÃ¤ggande vÃ¤derdata tillgÃ¤nglig")
            return None
        
        # FÃ¶rsÃ¶k hÃ¤mta luftfuktighet
        humidity_data = self.get_station_humidity()
        if humidity_data:
            weather_data['humidity'] = humidity_data['value']
            weather_data['humidity_timestamp'] = humidity_data['timestamp']
            weather_data['humidity_station'] = humidity_data['station_name']
            weather_data['humidity_age_minutes'] = humidity_data['data_age_minutes']
            print(f"âœ… VÃ¤derdata utÃ¶kad med luftfuktighet: {humidity_data['value']}%")
        else:
            print("âš ï¸ Luftfuktighet ej tillgÃ¤nglig - returnerar vÃ¤derdata utan humidity")
            weather_data['humidity'] = None
            weather_data['humidity_timestamp'] = None
            weather_data['humidity_station'] = None
            weather_data['humidity_age_minutes'] = None
        
        return weather_data
    
    # === BEFINTLIGA METODER (INGA Ã„NDRINGAR) ===
    
    def get_forecast_url(self) -> str:
        """Bygg URL fÃ¶r SMHI API-anrop."""
        return (
            f"{self.BASE_URL}/category/{self.CATEGORY}/version/{self.VERSION}/"
            f"geotype/point/lon/{self.longitude}/lat/{self.latitude}/data.json"
        )
    
    def fetch_raw_data(self) -> Optional[Dict]:
        """
        HÃ¤mta rÃ¥data frÃ¥n SMHI API.
        
        Returns:
            Dict med rÃ¥data frÃ¥n SMHI eller None vid fel
        """
        url = self.get_forecast_url()
        
        try:
            print(f"ðŸ“¡ HÃ¤mtar data frÃ¥n SMHI: {url}")
            
            response = requests.get(url, timeout=self.REQUEST_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            # Kontrollera att vi har korrekt data-struktur
            if 'timeSeries' not in data:
                print("âŒ Ogiltig data-struktur frÃ¥n SMHI API")
                return None
            
            print(f"âœ… SMHI data hÃ¤mtad - {len(data['timeSeries'])} tidpunkter")
            
            # Cache data
            self.cached_data = data
            self.last_fetch_time = time.time()
            
            return data
            
        except requests.exceptions.Timeout:
            print(f"â° Timeout vid anrop till SMHI API ({self.REQUEST_TIMEOUT}s)")
            return None
        except requests.exceptions.ConnectionError:
            print("ðŸŒ NÃ¤tverksfel - kan inte nÃ¥ SMHI API")
            return None
        except requests.exceptions.HTTPError as e:
            print(f"ðŸš« HTTP-fel frÃ¥n SMHI API: {e}")
            return None
        except json.JSONDecodeError:
            print("ðŸ“‹ Fel vid parsning av JSON frÃ¥n SMHI API")
            return None
        except Exception as e:
            print(f"âŒ OvÃ¤ntat fel vid SMHI API-anrop: {e}")
            return None
    
    # === VIKTAD DAGSPROGNOS: HJÄLPMETODER ===
    
    def _get_time_of_day_weight(self, hour: int) -> float:
        """
        Returnera tidsvikt baserat på när människor är utomhus.
        
        Args:
            hour: Timme på dygnet (0-23)
            
        Returns:
            Viktfaktor för tidpunkten
        """
        if 0 <= hour < 6: return 0.2   # Natt - de flesta sover
        if 6 <= hour < 9: return 3.0   # Morgonpendling
        if 9 <= hour < 12: return 2.0  # Aktiv förmiddag
        if 12 <= hour < 15: return 2.5 # Lunch/aktiv dag
        if 15 <= hour < 18: return 3.0 # Hemresa/fritid
        if 18 <= hour < 21: return 1.5 # Kvällsaktivitet
        return 0.5                      # Sen kväll
    
    def _get_weather_priority(self, symbol: int) -> float:
        """
        Returnera väderprioriteten för en symbol baserat på granulär modell.
        Högre värde = mer allvarligt/märkbart väder.
        
        Args:
            symbol: SMHI vädersymbol (1-27)
            
        Returns:
            Prioritetsvärde för symbolen
        """
        if symbol is None:
            return 2.0
        
        # Granulär prioritetsmodell för svenskt klimat
        PRIORITY = {
            1: 1.0,   # klart
            2: 1.2,   # nästan klart
            3: 1.5,   # lätt molnighet
            4: 1.7,   # halvklart
            5: 2.0,   # mulet
            6: 3.0,   # dimma
            7: 3.0,   # dimma
            8: 3.5,   # lätt regnskur
            9: 4.0,   # regnskur
            10: 5.0,  # kraftig regnskur
            11: 5.0,  # åska
            12: 3.5,  # lätt regn
            13: 4.0,  # regn
            14: 5.0,  # kraftigt regn
            15: 4.0,  # lätt snöblandat
            16: 4.5,  # snöblandat
            17: 5.0,  # kraftigt snöblandat
            18: 4.0,  # lätt snöfall
            19: 4.5,  # snöfall
            20: 5.0,  # tungt snöfall
            21: 4.2,  # lätt snöby
            22: 4.7,  # snöby
            23: 5.0,  # kraftig snöby
            24: 5.0,  # lätt åskskur
            25: 5.0,  # åskskur
            26: 5.0,  # kraftig åskskur
            27: 2.0   # oklar symbol
        }
        
        return PRIORITY.get(symbol, 2.0)
    
    # === HUVUDMETODER ===
    
    def get_data(self, force_refresh: bool = False) -> Optional[Dict]:
        """
        Hämta SMHI-data med cache-stöd.
        
        Args:
            force_refresh: Tvinga uppdatering även om cache är giltig
            
        Returns:
            Dict med SMHI-data eller None
        """
        # Kontrollera cache
        if (not force_refresh and 
            self.cached_data and 
            self.last_fetch_time and 
            time.time() - self.last_fetch_time < self.cache_duration):
            
            print("ðŸ’¾ AnvÃ¤nder cachad SMHI-data")
            return self.cached_data
        
        # HÃ¤mta ny data
        return self.fetch_raw_data()
    
    def parse_parameters(self, time_entry: Dict) -> Dict:
        """
        Tolka parametrar frÃ¥n en tidpunkt i SMHI-data.
        
        Args:
            time_entry: En tidpunkt frÃ¥n timeSeries-array
            
        Returns:
            Dict med tolkade parametrar
        """
        result = {}

        # SNOW1g/v1: data is a flat dict instead of parameters array
        data = time_entry.get('data')
        if not data:
            return result

        for api_name, friendly_name in self.PARAMETERS.items():
            value = data.get(api_name)
            # SNOW1gv1: alla parametrar anvÃ¤nder 9999 som missing value
            if value is not None and value != 9999:
                result[friendly_name] = value

        return result
    
    def _get_animation_trigger(self, weather_symbol: int, precipitation: float, wind_direction: float = None) -> Dict:
        """
        WEATHER ANIMATIONS: Mappa SMHI weather symbol till animation trigger data
        
        Args:
            weather_symbol: SMHI weather symbol (1-27)
            precipitation: NederbÃ¶rd i mm/h
            wind_direction: Vindriktning i grader (0-360)
            
        Returns:
            Dict med animation trigger information
        """
        if not weather_symbol:
            return {'type': 'clear'}
        
        try:
            symbol = int(weather_symbol)
        except (ValueError, TypeError):
            print(f"âš ï¸ Invalid weather symbol: {weather_symbol}")
            return {'type': 'clear'}
        
        # BestÃ¤m animation type baserat pÃ¥ SMHI symbol
        animation_type = None
        for anim_type, symbols in self.ANIMATION_MAPPING.items():
            if symbol in symbols:
                animation_type = anim_type
                break
        
        if not animation_type or animation_type == 'clear':
            return {'type': 'clear'}
        
        # BerÃ¤kna intensity baserat pÃ¥ nederbÃ¶rd
        intensity = self._calculate_animation_intensity(precipitation)
        
        # Skapa animation trigger data
        trigger_data = {
            'type': animation_type,
            'intensity': intensity,
            'symbol': symbol,
            'precipitation': precipitation or 0
        }
        
        # LÃ¤gg till vinddata om tillgÃ¤ngligt
        if wind_direction is not None:
            trigger_data['wind_direction'] = wind_direction
        
        # Special handling fÃ¶r Ã¥ska
        if animation_type == 'thunder':
            # Ã…ska kan kombineras med regn
            if symbol in [11]:  # Ã…ska med regn
                trigger_data['type'] = 'rain'  # AnvÃ¤nd regn-animation
                trigger_data['thunder'] = True
            else:
                trigger_data['type'] = 'clear'  # Bara Ã¥ska utan nederbÃ¶rd
        
        print(f"ðŸŒ¦ï¸ Animation trigger: Symbol {symbol} â†’ {trigger_data['type']} ({intensity})")
        return trigger_data
    
    def _calculate_animation_intensity(self, precipitation: float) -> str:
        """
        BerÃ¤kna animation intensity baserat pÃ¥ nederbÃ¶rd
        
        Args:
            precipitation: NederbÃ¶rd i mm/h
            
        Returns:
            Intensity level som strÃ¤ng
        """
        if not precipitation or precipitation < 0.1:
            return 'light'
        elif precipitation < 2.0:
            return 'medium'
        elif precipitation < 5.0:
            return 'heavy'
        else:
            return 'extreme'
    
    def get_current_weather(self) -> Optional[Dict]:
        """
        HÃ¤mta aktuell vÃ¤derdata (nÃ¤rmaste tidpunkt) med animation trigger support.
        
        Returns:
            Dict med aktuell vÃ¤derdata inkl. animation_trigger eller None
        """
        data = self.get_data()
        
        if not data or 'timeSeries' not in data:
            return None
        
        now = datetime.now(timezone.utc)
        best_entry = None
        min_time_diff = float('inf')
        
        # Hitta nÃ¤rmaste tidpunkt
        for entry in data['timeSeries']:
            valid_time_str = entry.get('time')
            if not valid_time_str:
                continue
            
            try:
                valid_time = datetime.fromisoformat(valid_time_str.replace('Z', '+00:00'))
                time_diff = abs((now - valid_time).total_seconds())
                
                if time_diff < min_time_diff:
                    min_time_diff = time_diff
                    best_entry = entry
                    
            except (ValueError, TypeError):
                continue
        
        if not best_entry:
            print("âš ï¸ Ingen giltig tidpunkt hittades i SMHI-data")
            return None
        
        # Tolka parametrar
        weather = self.parse_parameters(best_entry)
        
        # LÃ¤gg till metadata
        weather['valid_time'] = best_entry.get('time')
        weather['time_diff_minutes'] = int(min_time_diff / 60)
        weather['data_source'] = self.DATA_SOURCE
        weather['coordinates'] = {'lat': self.latitude, 'lon': self.longitude}
        
        # LÃ¤gg till grid-koordinater frÃ¥n response
        # SNOW1gv1: geometry.coordinates Ã¤r [lon, lat] (platt lista, inte nested)
        try:
            if 'geometry' in data and 'coordinates' in data['geometry']:
                coords = data['geometry']['coordinates']  # [lon, lat]
                weather['grid_coordinates'] = {'lon': coords[0], 'lat': coords[1]}
        except (IndexError, KeyError, TypeError):
            pass
        
        # WEATHER ANIMATIONS: LÃ¤gg till animation trigger
        if weather.get('weather_symbol'):
            weather['animation_trigger'] = self._get_animation_trigger(
                weather['weather_symbol'],
                weather.get('precipitation', 0),
                weather.get('wind_direction')
            )
            
            print(f"ðŸŽ¬ Animation trigger genererad: {weather['animation_trigger']['type']}")
        else:
            weather['animation_trigger'] = {'type': 'clear'}
            print("ðŸŽ¬ No weather symbol - clear animation trigger")
        
        return weather
    
    def get_12h_forecast(self) -> List[Dict]:
        """
        HÃ¤mta 12-timmarsprognos optimerad fÃ¶r GUI-visning.
        Returnerar prognoser var 3:e timme fÃ¶r de kommande 12 timmarna.
        
        Returns:
            Lista med 4 prognospunkter (0h, 3h, 6h, 9h, 12h frÃ¥n nu)
        """
        data = self.get_data()
        
        if not data or 'timeSeries' not in data:
            print("âŒ Ingen SMHI-data tillgÃ¤nglig fÃ¶r 12h-prognos")
            return []
        
        now = datetime.now(timezone.utc)
        forecast_points = []
        target_intervals = [3, 6, 9, 12]  # Timmar frÃ¥n nu
        
        print(f"ðŸ“Š Skapar 12h-prognos frÃ¥n {len(data['timeSeries'])} datapunkter")
        
        for target_hour in target_intervals:
            target_time = now.timestamp() + (target_hour * 3600)  # Unix timestamp
            best_entry = None
            min_time_diff = float('inf')
            
            # Hitta nÃ¤rmaste datapunkt fÃ¶r target_time
            for entry in data['timeSeries']:
                valid_time_str = entry.get('time')
                if not valid_time_str:
                    continue
                
                try:
                    valid_time = datetime.fromisoformat(valid_time_str.replace('Z', '+00:00'))
                    entry_timestamp = valid_time.timestamp()
                    
                    # Endast framtida tidpunkter
                    if entry_timestamp <= now.timestamp():
                        continue
                    
                    time_diff = abs(entry_timestamp - target_time)
                    
                    if time_diff < min_time_diff:
                        min_time_diff = time_diff
                        best_entry = entry
                        
                except (ValueError, TypeError) as e:
                    print(f"âš ï¸ Fel vid parsning av tid {valid_time_str}: {e}")
                    continue
            
            if best_entry:
                # Tolka vÃ¤derdata fÃ¶r denna tidpunkt
                weather = self.parse_parameters(best_entry)
                
                # LÃ¤gg till tidsinfo
                valid_time = datetime.fromisoformat(best_entry['time'].replace('Z', '+00:00'))
                weather['valid_time'] = best_entry['time']
                weather['local_time'] = valid_time.strftime('%H:%M')
                weather['hours_from_now'] = target_hour
                weather['date_time'] = valid_time.isoformat()
                
                # LÃ¤gg till formaterad temperatur
                if 'temperature' in weather:
                    weather['temp_formatted'] = f"{weather['temperature']:.1f}Â°C"
                
                # WEATHER ANIMATIONS: LÃ¤gg till animation trigger fÃ¶r prognoser
                if weather.get('weather_symbol'):
                    weather['animation_trigger'] = self._get_animation_trigger(
                        weather['weather_symbol'],
                        weather.get('precipitation', 0),
                        weather.get('wind_direction')
                    )
                
                forecast_points.append(weather)
                print(f"  âœ… {target_hour}h: {weather.get('local_time')} - {weather.get('temp_formatted', 'N/A')}")
            else:
                print(f"  âŒ Ingen data hittad fÃ¶r +{target_hour}h")
        
        print(f"ðŸ“ˆ 12h-prognos klar: {len(forecast_points)} prognoser med animation triggers")
        return forecast_points
    
    def get_hourly_forecast(self, hours: int = 12) -> List[Dict]:
        """
        HÃ¤mta timprognos fÃ¶r kommande timmar (legacy-metod fÃ¶r bakÃ¥tkompatibilitet).
        
        Args:
            hours: Antal timmar framÃ¥t
            
        Returns:
            Lista med vÃ¤derdata per timme
        """
        data = self.get_data()
        
        if not data or 'timeSeries' not in data:
            return []
        
        now = datetime.now(timezone.utc)
        forecast = []
        
        for entry in data['timeSeries']:
            valid_time_str = entry.get('time')
            if not valid_time_str:
                continue
            
            try:
                valid_time = datetime.fromisoformat(valid_time_str.replace('Z', '+00:00'))
                
                # Endast framtida tidpunkter
                if valid_time <= now:
                    continue
                
                # BegrÃ¤nsa till antal timmar
                hours_diff = (valid_time - now).total_seconds() / 3600
                if hours_diff > hours:
                    break
                
                weather = self.parse_parameters(entry)
                weather['valid_time'] = valid_time_str
                weather['hours_from_now'] = int(hours_diff)
                
                # LÃ¤gg till animation trigger
                if weather.get('weather_symbol'):
                    weather['animation_trigger'] = self._get_animation_trigger(
                        weather['weather_symbol'],
                        weather.get('precipitation', 0),
                        weather.get('wind_direction')
                    )
                
                forecast.append(weather)
                
            except (ValueError, TypeError):
                continue
        
        return forecast
    
    def get_daily_forecast(self, days: int = 5) -> List[Dict]:
        """
        Hämta dagsprognos för kommande dagar med viktad symbolberäkning.
        
        Algoritm:
        - Börjar med IMORGON (exkluderar idag)
        - Visar exakt 'days' antal dagar
        - Varje dag får EN symbol baserad på viktad algoritm:
          * Tidsvikt: när människor är utomhus
          * Väderprioritering: hur allvarligt vädret är
        
        Args:
            days: Antal dagar framåt (default 5)
            
        Returns:
            Lista med väderdata per dag med viktad weather_symbol
        """
        data = self.get_data()
        
        if not data or 'timeSeries' not in data:
            return []
        
        # Gruppera data per dag
        daily_data = {}
        now = datetime.now(timezone.utc)
        
        for entry in data['timeSeries']:
            valid_time_str = entry.get('time')
            if not valid_time_str:
                continue
            
            try:
                valid_time = datetime.fromisoformat(valid_time_str.replace('Z', '+00:00'))
                
                # KRITISKT: Exkludera dagens datum, börja med imorgon
                if valid_time <= now:
                    continue
                
                # Beräkna dagar från idag
                days_from_today = (valid_time.date() - now.date()).days
                
                # Filtrera: endast dagar 1 till 'days' (imorgon = dag 1)
                if days_from_today < 1 or days_from_today > days:
                    continue
                
                date_key = valid_time.date()
                
                # Utökad datastruktur för viktad beräkning
                if date_key not in daily_data:
                    daily_data[date_key] = {
                        'date': date_key,
                        'temperatures': [],
                        'weather_symbols': [],
                        'weather_symbols_with_time': [],
                        'hourly_entries': [],  # NY: För viktad algoritm
                        'wind_speeds': [],
                        'precipitations': [],
                        'animation_triggers': []
                    }
                
                weather = self.parse_parameters(entry)
                
                # Konvertera till lokal tid för timvikt
                local_time = valid_time.astimezone()
                
                # Samla data för dagen
                if 'temperature' in weather:
                    daily_data[date_key]['temperatures'].append(weather['temperature'])
                
                if 'weather_symbol' in weather:
                    daily_data[date_key]['weather_symbols'].append(weather['weather_symbol'])
                    daily_data[date_key]['weather_symbols_with_time'].append((valid_time, weather['weather_symbol']))
                    
                    # Animation trigger
                    trigger = self._get_animation_trigger(
                        weather['weather_symbol'],
                        weather.get('precipitation', 0),
                        weather.get('wind_direction')
                    )
                    daily_data[date_key]['animation_triggers'].append(trigger)
                    
                    # NY: Spara timinfo för viktad algoritm
                    entry_info = {
                        'hour': local_time.hour,
                        'weather_symbol': weather['weather_symbol'],
                        'precipitation': weather.get('precipitation', 0)
                    }
                    daily_data[date_key]['hourly_entries'].append(entry_info)
                
                if 'wind_speed' in weather:
                    daily_data[date_key]['wind_speeds'].append(weather['wind_speed'])
                if 'precipitation' in weather:
                    daily_data[date_key]['precipitations'].append(weather['precipitation'])
                
            except (ValueError, TypeError):
                continue
        
        # Beräkna dagliga sammandrag med viktad symbol
        daily_forecast = []
        
        for date_key in sorted(daily_data.keys()):
            day_data = daily_data[date_key]
            
            summary = {
                'date': date_key.isoformat(),
                'weekday': date_key.strftime('%A'),
                'day_of_month': date_key.day
            }
            
            # Temperatur min/max
            temps = day_data['temperatures']
            if temps:
                summary['temp_min'] = min(temps)
                summary['temp_max'] = max(temps)
                summary['temp_avg'] = sum(temps) / len(temps)
            
            # === VIKTAD SYMBOLBERÄKNING ===
            hourly_entries = day_data.get('hourly_entries', [])
            
            if hourly_entries:
                symbol_scores = {}
                
                for entry in hourly_entries:
                    symbol = entry['weather_symbol']
                    hour = entry['hour']
                    precip = entry['precipitation']
                    
                    # Beräkna viktad score
                    time_w = self._get_time_of_day_weight(hour)
                    prio = self._get_weather_priority(symbol)
                    
                    score = time_w * prio
                    
                    # Förstärk vid kraftig nederbörd
                    if precip >= 5.0:
                        score *= 1.5
                    
                    # Summera scores per symbol
                    symbol_scores[symbol] = symbol_scores.get(symbol, 0) + score
                
                # Välj symbolen med högst viktad score
                summary['weather_symbol'] = max(symbol_scores, key=symbol_scores.get)
            
            else:
                # Fallback: Vanligaste symbolen (om hourly_entries saknas)
                symbols = day_data['weather_symbols']
                if symbols:
                    summary['weather_symbol'] = max(set(symbols), key=symbols.count)
            
            # Genomsnittlig vindstyrka
            winds = day_data['wind_speeds']
            if winds:
                summary['wind_speed_avg'] = sum(winds) / len(winds)
                summary['wind_speed_max'] = max(winds)
            
            # Total nederbörd
            precips = day_data['precipitations']
            if precips:
                summary['precipitation_total'] = sum(precips)
                summary['precipitation_max'] = max(precips)
            
            # Dominant animation trigger för dagen
            triggers = day_data['animation_triggers']
            if triggers:
                # Hitta vanligaste animation type
                trigger_types = [t['type'] for t in triggers if t['type'] != 'clear']
                if trigger_types:
                    dominant_type = max(set(trigger_types), key=trigger_types.count)
                    # Använd första instansen av dominant type för full trigger data
                    for trigger in triggers:
                        if trigger['type'] == dominant_type:
                            summary['animation_trigger'] = trigger
                            break
                else:
                    summary['animation_trigger'] = {'type': 'clear'}
            
            daily_forecast.append(summary)
        
        return daily_forecast


# Test-funktioner fÃ¶r utveckling
def test_smhi_client():
    """Test av SMHI-klient med Stockholm-koordinater och animation triggers."""
    print("ðŸ§ª Testar SMHI-klient med WEATHER ANIMATIONS integration...")
    
    # Stockholm koordinater
    client = SMHIClient(59.3293, 18.0686)
    
    # Test aktuellt vÃ¤der
    current = client.get_current_weather()
    if current:
        print("\nðŸ“Š Aktuellt vÃ¤der:")
        for key, value in current.items():
            if key == 'animation_trigger':
                print(f"  ðŸŽ¬ {key}: {value}")
            else:
                print(f"  {key}: {value}")
    
    # Test 12h-prognos (med animation triggers)
    forecast_12h = client.get_12h_forecast()
    if forecast_12h:
        print(f"\nðŸ“ˆ 12h-prognos ({len(forecast_12h)} prognoser med animations):")
        for forecast in forecast_12h:
            temp = forecast.get('temp_formatted', 'N/A')
            time_str = forecast.get('local_time', 'N/A')
            hours = forecast.get('hours_from_now', 'N/A')
            symbol = forecast.get('weather_symbol', 'N/A')
            animation = forecast.get('animation_trigger', {}).get('type', 'none')
            print(f"  +{hours}h ({time_str}): {temp}, symbol: {symbol}, animation: {animation}")
    
    # Test dagsprognos
    daily = client.get_daily_forecast(3)
    if daily:
        print(f"\nðŸ“… Dagsprognos ({len(daily)} dagar med animations):")
        for day in daily:
            date = day.get('date', 'N/A')
            temp_min = day.get('temp_min', 'N/A')
            temp_max = day.get('temp_max', 'N/A')
            animation = day.get('animation_trigger', {}).get('type', 'none')
            print(f"  {date}: {temp_min}Â°C - {temp_max}Â°C, animation: {animation}")


def test_humidity_functionality():
    """FAS 1: Test av nya luftfuktighets-funktioner."""
    print("\nðŸ§ª === FAS 1: TESTER LUFTFUKTIGHET ===")
    
    # Stockholm koordinater
    client = SMHIClient(59.3293, 18.0686)
    
    print("\nðŸ” Test 1: Hitta nÃ¤rmaste luftfuktighetsstation")
    station_id = client.find_nearest_humidity_station()
    if station_id:
        print(f"âœ… NÃ¤rmaste station: {station_id}")
    else:
        print("âŒ Ingen station hittad")
    
    print("\nðŸ’§ Test 2: HÃ¤mta luftfuktighetsdata")
    humidity_data = client.get_station_humidity()
    if humidity_data:
        print(f"âœ… Luftfuktighet: {humidity_data}")
    else:
        print("âŒ Ingen luftfuktighetsdata")
    
    print("\nðŸŒ¦ï¸ Test 3: VÃ¤der med luftfuktighet")
    weather_with_humidity = client.get_current_weather_with_humidity()
    if weather_with_humidity:
        print("âœ… VÃ¤der med luftfuktighet:")
        for key, value in weather_with_humidity.items():
            if 'humidity' in key.lower():
                print(f"  ðŸ’§ {key}: {value}")
            elif key == 'temperature':
                print(f"  ðŸŒ¡ï¸ {key}: {value}")
            elif key == 'data_source':
                print(f"  ðŸ“¡ {key}: {value}")
    else:
        print("âŒ Ingen vÃ¤derdata med luftfuktighet")


if __name__ == "__main__":
    test_smhi_client()
    test_humidity_functionality()