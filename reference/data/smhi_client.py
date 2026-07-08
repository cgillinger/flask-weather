#!/usr/bin/env python3
"""
SMHI API client for weather data
Fetches forecasts and current weather from SMHI's open API.
+ WEATHER ANIMATIONS INTEGRATION: animation triggers for the frontend
+ PHASE 1: SMHI HUMIDITY: meteorological observations API integration

API documentation: https://opendata.smhi.se/apidocs/metfcst/index.html
Observations API: https://opendata.smhi.se/apidocs/metobs/index.html
"""

import requests
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import time
import math


class SMHIClient:
    """Client fetching weather data from SMHI's API, with weather-animation support and humidity."""

    # SMHI API constants - WEATHER FORECAST
    BASE_URL = "https://opendata-download-metfcst.smhi.se/api"
    CATEGORY = "snow1g"  # Meteorological forecasts
    VERSION = "1"

    # Label in API responses (subclasses/other providers set their own)
    DATA_SOURCE = "SMHI"

    # SMHI API constants - METEOROLOGICAL OBSERVATIONS (PHASE 1)
    METOBS_BASE_URL = "https://opendata-download-metobs.smhi.se/api"
    METOBS_VERSION = "1.0"
    HUMIDITY_PARAMETER = "6"  # Relative humidity (%)

    # Weather parameters we are interested in
    PARAMETERS = {
        'air_temperature': 'temperature',                    # Temperature
        'symbol_code': 'weather_symbol',                     # Weather symbol (1-27)
        'wind_speed': 'wind_speed',                          # Wind speed (m/s)
        'wind_from_direction': 'wind_direction',             # Wind direction (degrees)
        'precipitation_amount_mean': 'precipitation',        # Mean estimated precipitation (mm)
        'precipitation_amount_max': 'precipitation_max',     # Max precipitation (mm/h)
        'air_pressure_at_mean_sea_level': 'pressure'         # Air pressure (hPa)
    }

    # Timeout for API calls
    REQUEST_TIMEOUT = 10

    # PHASE 1: Fallback stations for humidity (well-known active stations)
    HUMIDITY_FALLBACK_STATIONS = [98210, 71420, 52350]  # Stockholm, Gothenburg, Malmo

    # WEATHER ANIMATIONS: SMHI symbol mapping (1-27)
    ANIMATION_MAPPING = {
        # Rain and rain showers
        'rain': [8, 9, 10, 18, 19, 20],
        # Snow showers and snowfall
        'snow': [15, 16, 17, 25, 26, 27],
        # Sleet (showers and continuous)
        'sleet': [12, 13, 14, 22, 23, 24],
        # Thunder (may be combined with rain)
        'thunder': [11, 21],
        # Clear/cloudy/fog (no animation)
        'clear': [1, 2, 3, 4, 5, 6, 7]
    }
    
    def __init__(self, latitude: float, longitude: float):
        """
        Initialize the SMHI client.

        Args:
            latitude: Latitude (decimal degrees)
            longitude: Longitude (decimal degrees)
        """
        self.latitude = latitude
        self.longitude = longitude
        self.last_fetch_time = None
        self.cached_data = None
        self.cache_duration = 300  # Cache for 5 minutes

        # PHASE 1: Humidity cache and station tracking
        self.humidity_cache = None
        self.humidity_cache_time = None
        self.humidity_cache_duration = 600  # 10-minute cache (observations update less often)
        self.nearest_humidity_station = None
        
        print(f"ðŸŒ SMHI-klient initierad fÃ¶r position: {latitude}, {longitude}")
    
    # === PHASE 1: HUMIDITY METHODS ===

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the Haversine distance between two coordinates.

        Args:
            lat1, lon1: First coordinate
            lat2, lon2: Second coordinate

        Returns:
            Distance in kilometers
        """
        # Convert to radians
        lat1_r = math.radians(lat1)
        lon1_r = math.radians(lon1)
        lat2_r = math.radians(lat2)
        lon2_r = math.radians(lon2)
        
        # Haversine formula
        dlat = lat2_r - lat1_r
        dlon = lon2_r - lon1_r

        a = (math.sin(dlat/2)**2 +
             math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon/2)**2)
        c = 2 * math.asin(math.sqrt(a))

        # Earth's radius in km
        r = 6371
        
        return c * r
    
    def find_nearest_humidity_station(self) -> Optional[int]:
        """
        Find the nearest station with humidity data based on the configured coordinates.

        Returns:
            station_id (int) of the nearest station, or None on error
        """
        # Use the cached station if we have already found one
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
            
            # Find the nearest active station
            nearest_station = None
            min_distance = float('inf')
            
            for station in stations:
                # Check that the station is active (has from/to dates)
                if not station.get('active', True):
                    continue
                
                # Check that we have coordinates
                if 'latitude' not in station or 'longitude' not in station:
                    continue
                
                try:
                    station_lat = float(station['latitude'])
                    station_lon = float(station['longitude'])
                    station_id = int(station['id'])
                    
                    # Calculate distance
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
        Return a fallback station based on position.

        Returns:
            Station ID of the nearest fallback station
        """
        # Pick fallback based on approximate position in Sweden
        if self.latitude >= 58.5:  # Northern/central Sweden
            fallback = self.HUMIDITY_FALLBACK_STATIONS[0]  # Stockholm
        elif self.latitude >= 56.5:  # Western Sweden
            fallback = self.HUMIDITY_FALLBACK_STATIONS[1]  # Gothenburg
        else:  # Southern Sweden
            fallback = self.HUMIDITY_FALLBACK_STATIONS[2]  # Malmo
        
        print(f"ðŸ”„ AnvÃ¤nder fallback-station: {fallback}")
        return fallback
    
    def get_station_humidity(self, station_id: Optional[int] = None) -> Optional[Dict]:
        """
        Fetch humidity from SMHI's meteorological observations API.

        Args:
            station_id: Specific station (None = auto-detect nearest)

        Returns:
            Dict with {'value': float, 'timestamp': str, 'station_name': str, 'data_age_minutes': int}
            or None on error
        """
        # Check cache first
        if (self.humidity_cache and 
            self.humidity_cache_time and 
            time.time() - self.humidity_cache_time < self.humidity_cache_duration):
            print("ðŸ’¾ AnvÃ¤nder cachad luftfuktighetsdata")
            return self.humidity_cache
        
        # Determine station
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
            
            # Take the latest value
            latest_value = data['value'][-1]
            
            humidity_value = float(latest_value['value'])
            timestamp_raw = latest_value['date']
            
            # Convert timestamp and compute age - handle both unix timestamp and ISO format
            try:
                if isinstance(timestamp_raw, int):
                    # Unix timestamp (observations API)
                    timestamp = datetime.fromtimestamp(timestamp_raw / 1000, tz=timezone.utc)
                    timestamp_str = timestamp.isoformat()
                elif isinstance(timestamp_raw, str):
                    # ISO format (other API)
                    timestamp_str = timestamp_raw
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                else:
                    raise ValueError(f"OkÃ¤nt timestamp-format: {type(timestamp_raw)}")
                
                now = datetime.now(timezone.utc)
                age_minutes = int((now - timestamp).total_seconds() / 60)
                
                # Validate data age (max 2 hours)
                if age_minutes > 120:
                    print(f"âš ï¸ Luftfuktighetsdata fÃ¶r gammal: {age_minutes} minuter")
                    return None
                
            except (ValueError, TypeError) as e:
                print(f"âš ï¸ Fel vid parsning av timestamp {timestamp_raw}: {e}")
                # Use the current time as fallback
                timestamp_str = datetime.now(timezone.utc).isoformat()
                age_minutes = 0
            
            # Build result
            result = {
                'value': humidity_value,
                'timestamp': timestamp_str,
                'station_id': station_id,
                'station_name': f"SMHI Station {station_id}",
                'data_age_minutes': age_minutes
            }
            
            # Cache the result
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
        Extended version of get_current_weather() that includes humidity.

        Returns:
            Existing weather data + 'humidity', 'humidity_timestamp', 'humidity_station'
            or None on error
        """
        # Fetch standard weather data
        weather_data = self.get_current_weather()
        if not weather_data:
            print("âŒ Ingen grundlÃ¤ggande vÃ¤derdata tillgÃ¤nglig")
            return None
        
        # Try to fetch humidity
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
    
    # === PRE-EXISTING METHODS (UNCHANGED) ===

    def get_forecast_url(self) -> str:
        """Build the URL for the SMHI API call."""
        return (
            f"{self.BASE_URL}/category/{self.CATEGORY}/version/{self.VERSION}/"
            f"geotype/point/lon/{self.longitude}/lat/{self.latitude}/data.json"
        )
    
    def fetch_raw_data(self) -> Optional[Dict]:
        """
        Fetch raw data from the SMHI API.

        Returns:
            Dict with raw SMHI data, or None on error
        """
        url = self.get_forecast_url()
        
        try:
            print(f"ðŸ“¡ HÃ¤mtar data frÃ¥n SMHI: {url}")
            
            response = requests.get(url, timeout=self.REQUEST_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            # Check that we got the expected data structure
            if 'timeSeries' not in data:
                print("âŒ Ogiltig data-struktur frÃ¥n SMHI API")
                return None
            
            print(f"âœ… SMHI data hÃ¤mtad - {len(data['timeSeries'])} tidpunkter")
            
            # Cache the data
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
    
    # === WEIGHTED DAILY FORECAST: HELPER METHODS ===

    def _get_time_of_day_weight(self, hour: int) -> float:
        """
        Return a time weight based on when people are outdoors.

        Args:
            hour: Hour of day (0-23)

        Returns:
            Weight factor for the hour
        """
        if 0 <= hour < 6: return 0.2   # Night - most people asleep
        if 6 <= hour < 9: return 3.0   # Morning commute
        if 9 <= hour < 12: return 2.0  # Active morning
        if 12 <= hour < 15: return 2.5 # Lunch/active day
        if 15 <= hour < 18: return 3.0 # Commute home/leisure
        if 18 <= hour < 21: return 1.5 # Evening activity
        return 0.5                      # Late evening

    def _get_weather_priority(self, symbol: int) -> float:
        """
        Return the weather priority for a symbol based on a granular model.
        Higher value = more severe/noticeable weather.

        Args:
            symbol: SMHI weather symbol (1-27)

        Returns:
            Priority value for the symbol
        """
        if symbol is None:
            return 2.0

        # Granular priority model for Swedish climate.
        # Comments state the official Wsymb2 meaning of each symbol
        # (see SMHI_SYMBOL_MAPPING.md). NOTE: the priority VALUES look
        # mis-scaled for several symbols (they were written against wrong
        # symbol meanings) and are pending review - do not trust them as
        # a severity ranking yet.
        PRIORITY = {
            1: 1.0,   # clear sky
            2: 1.2,   # nearly clear sky
            3: 1.5,   # variable cloudiness
            4: 1.7,   # halfclear sky
            5: 2.0,   # cloudy sky
            6: 3.0,   # overcast
            7: 3.0,   # fog
            8: 3.5,   # light rain showers
            9: 4.0,   # moderate rain showers
            10: 5.0,  # heavy rain showers
            11: 5.0,  # thunderstorm
            12: 3.5,  # light sleet showers
            13: 4.0,  # moderate sleet showers
            14: 5.0,  # heavy sleet showers
            15: 4.0,  # light snow showers
            16: 4.5,  # moderate snow showers
            17: 5.0,  # heavy snow showers
            18: 4.0,  # light rain
            19: 4.5,  # moderate rain
            20: 5.0,  # heavy rain
            21: 4.2,  # thunder
            22: 4.7,  # light sleet
            23: 5.0,  # moderate sleet
            24: 5.0,  # heavy sleet
            25: 5.0,  # light snowfall
            26: 5.0,  # moderate snowfall
            27: 2.0   # heavy snowfall
        }

        return PRIORITY.get(symbol, 2.0)

    # === MAIN METHODS ===
    
    def get_data(self, force_refresh: bool = False) -> Optional[Dict]:
        """
        Fetch SMHI data with cache support.

        Args:
            force_refresh: Force a refresh even if the cache is valid

        Returns:
            Dict with SMHI data, or None
        """
        # Check cache
        if (not force_refresh and 
            self.cached_data and 
            self.last_fetch_time and 
            time.time() - self.last_fetch_time < self.cache_duration):
            
            print("ðŸ’¾ AnvÃ¤nder cachad SMHI-data")
            return self.cached_data
        
        # Fetch fresh data
        return self.fetch_raw_data()
    
    def parse_parameters(self, time_entry: Dict) -> Dict:
        """
        Parse parameters from one time point in the SMHI data.

        Args:
            time_entry: A time point from the timeSeries array

        Returns:
            Dict with parsed parameters
        """
        result = {}

        # SNOW1g/v1: data is a flat dict instead of parameters array
        data = time_entry.get('data')
        if not data:
            return result

        for api_name, friendly_name in self.PARAMETERS.items():
            value = data.get(api_name)
            # SNOW1gv1: all parameters use 9999 as the missing value
            if value is not None and value != 9999:
                result[friendly_name] = value

        return result
    
    def _get_animation_trigger(self, weather_symbol: int, precipitation: float, wind_direction: float = None) -> Dict:
        """
        WEATHER ANIMATIONS: Map an SMHI weather symbol to animation trigger data

        Args:
            weather_symbol: SMHI weather symbol (1-27)
            precipitation: Precipitation in mm/h
            wind_direction: Wind direction in degrees (0-360)

        Returns:
            Dict with animation trigger information
        """
        if not weather_symbol:
            return {'type': 'clear'}
        
        try:
            symbol = int(weather_symbol)
        except (ValueError, TypeError):
            print(f"âš ï¸ Invalid weather symbol: {weather_symbol}")
            return {'type': 'clear'}
        
        # Determine animation type based on SMHI symbol
        animation_type = None
        for anim_type, symbols in self.ANIMATION_MAPPING.items():
            if symbol in symbols:
                animation_type = anim_type
                break
        
        if not animation_type or animation_type == 'clear':
            return {'type': 'clear'}
        
        # Calculate intensity based on precipitation
        intensity = self._calculate_animation_intensity(precipitation)

        # Build animation trigger data
        trigger_data = {
            'type': animation_type,
            'intensity': intensity,
            'symbol': symbol,
            'precipitation': precipitation or 0
        }
        
        # Add wind data if available
        if wind_direction is not None:
            trigger_data['wind_direction'] = wind_direction

        # Special handling for thunder
        if animation_type == 'thunder':
            # Thunder can be combined with rain
            if symbol in [11]:  # Wsymb2 11 = thunderstorm (showers with thunder)
                trigger_data['type'] = 'rain'  # Use the rain animation
                trigger_data['thunder'] = True
            else:
                # Code assumes thunder without precipitation here; note that
                # Wsymb2 21 = thunder (overcast, rain with thunder risk)
                trigger_data['type'] = 'clear'
        
        print(f"ðŸŒ¦ï¸ Animation trigger: Symbol {symbol} â†’ {trigger_data['type']} ({intensity})")
        return trigger_data
    
    def _calculate_animation_intensity(self, precipitation: float) -> str:
        """
        Calculate animation intensity based on precipitation

        Args:
            precipitation: Precipitation in mm/h

        Returns:
            Intensity level as a string
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
        Fetch current weather data (nearest time point) with animation trigger support.

        Returns:
            Dict with current weather data incl. animation_trigger, or None
        """
        data = self.get_data()
        
        if not data or 'timeSeries' not in data:
            return None
        
        now = datetime.now(timezone.utc)
        best_entry = None
        min_time_diff = float('inf')
        
        # Find the nearest time point
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
        
        # Parse parameters
        weather = self.parse_parameters(best_entry)

        # Add metadata
        weather['valid_time'] = best_entry.get('time')
        weather['time_diff_minutes'] = int(min_time_diff / 60)
        weather['data_source'] = self.DATA_SOURCE
        weather['coordinates'] = {'lat': self.latitude, 'lon': self.longitude}
        
        # Add grid coordinates from the response
        # SNOW1gv1: geometry.coordinates is [lon, lat] (flat list, not nested)
        try:
            if 'geometry' in data and 'coordinates' in data['geometry']:
                coords = data['geometry']['coordinates']  # [lon, lat]
                weather['grid_coordinates'] = {'lon': coords[0], 'lat': coords[1]}
        except (IndexError, KeyError, TypeError):
            pass
        
        # WEATHER ANIMATIONS: Add animation trigger
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
        Fetch a 12-hour forecast optimized for GUI display.
        Returns forecasts every 3 hours for the coming 12 hours.

        Returns:
            List of 4 forecast points (+3h, +6h, +9h, +12h from now)
        """
        data = self.get_data()
        
        if not data or 'timeSeries' not in data:
            print("âŒ Ingen SMHI-data tillgÃ¤nglig fÃ¶r 12h-prognos")
            return []
        
        now = datetime.now(timezone.utc)
        forecast_points = []
        target_intervals = [3, 6, 9, 12]  # Hours from now
        
        print(f"ðŸ“Š Skapar 12h-prognos frÃ¥n {len(data['timeSeries'])} datapunkter")
        
        for target_hour in target_intervals:
            target_time = now.timestamp() + (target_hour * 3600)  # Unix timestamp
            best_entry = None
            min_time_diff = float('inf')
            
            # Find the nearest data point for target_time
            for entry in data['timeSeries']:
                valid_time_str = entry.get('time')
                if not valid_time_str:
                    continue
                
                try:
                    valid_time = datetime.fromisoformat(valid_time_str.replace('Z', '+00:00'))
                    entry_timestamp = valid_time.timestamp()
                    
                    # Future time points only
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
                # Parse weather data for this time point
                weather = self.parse_parameters(best_entry)

                # Add time info
                valid_time = datetime.fromisoformat(best_entry['time'].replace('Z', '+00:00'))
                weather['valid_time'] = best_entry['time']
                weather['local_time'] = valid_time.strftime('%H:%M')
                weather['hours_from_now'] = target_hour
                weather['date_time'] = valid_time.isoformat()
                
                # Add formatted temperature
                if 'temperature' in weather:
                    weather['temp_formatted'] = f"{weather['temperature']:.1f}Â°C"

                # WEATHER ANIMATIONS: Add animation trigger for forecasts
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
    
    def get_daily_forecast(self, days: int = 5) -> List[Dict]:
        """
        Fetch a daily forecast for the coming days with weighted symbol calculation.

        Algorithm:
        - Starts with TOMORROW (excludes today)
        - Shows exactly 'days' number of days
        - Each day gets ONE symbol based on a weighted algorithm:
          * Time weight: when people are typically outdoors
          * Weather priority: how severe the weather is

        Args:
            days: Number of days ahead (default 5)

        Returns:
            List of weather data per day with weighted weather_symbol
        """
        data = self.get_data()
        
        if not data or 'timeSeries' not in data:
            return []
        
        # Group data by day
        daily_data = {}
        now = datetime.now(timezone.utc)
        
        for entry in data['timeSeries']:
            valid_time_str = entry.get('time')
            if not valid_time_str:
                continue
            
            try:
                valid_time = datetime.fromisoformat(valid_time_str.replace('Z', '+00:00'))
                
                # CRITICAL: exclude today's date, start with tomorrow
                if valid_time <= now:
                    continue
                
                # Calculate days from today
                days_from_today = (valid_time.date() - now.date()).days
                
                # Filter: only days 1 through 'days' (tomorrow = day 1)
                if days_from_today < 1 or days_from_today > days:
                    continue
                
                date_key = valid_time.date()
                
                # Extended data structure for the weighted calculation
                if date_key not in daily_data:
                    daily_data[date_key] = {
                        'date': date_key,
                        'temperatures': [],
                        'weather_symbols': [],
                        'weather_symbols_with_time': [],
                        'hourly_entries': [],  # NEW: for the weighted algorithm
                        'wind_speeds': [],
                        'precipitations': [],
                        'animation_triggers': []
                    }
                
                weather = self.parse_parameters(entry)
                
                # Convert to local time for the time-of-day weight
                local_time = valid_time.astimezone()
                
                # Collect data for the day
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
                    
                    # Store hour info for the weighted algorithm
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
        
        # Calculate daily summaries with weighted symbol
        daily_forecast = []
        
        for date_key in sorted(daily_data.keys()):
            day_data = daily_data[date_key]
            
            summary = {
                'date': date_key.isoformat(),
                'weekday': date_key.strftime('%A'),
                'day_of_month': date_key.day
            }
            
            # Temperature min/max
            temps = day_data['temperatures']
            if temps:
                summary['temp_min'] = min(temps)
                summary['temp_max'] = max(temps)
                summary['temp_avg'] = sum(temps) / len(temps)
            
            # === WEIGHTED SYMBOL CALCULATION ===
            hourly_entries = day_data.get('hourly_entries', [])
            
            if hourly_entries:
                symbol_scores = {}
                
                for entry in hourly_entries:
                    symbol = entry['weather_symbol']
                    hour = entry['hour']
                    precip = entry['precipitation']
                    
                    # Calculate weighted score
                    time_w = self._get_time_of_day_weight(hour)
                    prio = self._get_weather_priority(symbol)
                    
                    score = time_w * prio
                    
                    # Amplify for heavy precipitation
                    if precip >= 5.0:
                        score *= 1.5
                    
                    # Sum scores per symbol
                    symbol_scores[symbol] = symbol_scores.get(symbol, 0) + score
                
                # Choose the symbol with the highest weighted score
                summary['weather_symbol'] = max(symbol_scores, key=symbol_scores.get)
            
            else:
                # Fallback: most common symbol (if hourly_entries is missing)
                symbols = day_data['weather_symbols']
                if symbols:
                    summary['weather_symbol'] = max(set(symbols), key=symbols.count)
            
            # Average wind speed
            winds = day_data['wind_speeds']
            if winds:
                summary['wind_speed_avg'] = sum(winds) / len(winds)
                summary['wind_speed_max'] = max(winds)
            
            # Total precipitation
            precips = day_data['precipitations']
            if precips:
                summary['precipitation_total'] = sum(precips)
                summary['precipitation_max'] = max(precips)
            
            # Dominant animation trigger for the day
            triggers = day_data['animation_triggers']
            if triggers:
                # Find the most common animation type
                trigger_types = [t['type'] for t in triggers if t['type'] != 'clear']
                if trigger_types:
                    dominant_type = max(set(trigger_types), key=trigger_types.count)
                    # Use the first instance of the dominant type for full trigger data
                    for trigger in triggers:
                        if trigger['type'] == dominant_type:
                            summary['animation_trigger'] = trigger
                            break
                else:
                    summary['animation_trigger'] = {'type': 'clear'}
            
            daily_forecast.append(summary)
        
        return daily_forecast


# Test functions for development
def test_smhi_client():
    """Test of the SMHI client with Stockholm coordinates and animation triggers."""
    print("ðŸ§ª Testar SMHI-klient med WEATHER ANIMATIONS integration...")
    
    # Stockholm coordinates
    client = SMHIClient(59.3293, 18.0686)
    
    # Test current weather
    current = client.get_current_weather()
    if current:
        print("\nðŸ“Š Aktuellt vÃ¤der:")
        for key, value in current.items():
            if key == 'animation_trigger':
                print(f"  ðŸŽ¬ {key}: {value}")
            else:
                print(f"  {key}: {value}")
    
    # Test 12h forecast (with animation triggers)
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
    
    # Test daily forecast
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
    """PHASE 1: test of the new humidity functions."""
    print("\nðŸ§ª === FAS 1: TESTER LUFTFUKTIGHET ===")
    
    # Stockholm coordinates
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