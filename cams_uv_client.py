#!/usr/bin/env python3
"""
CAMS UV Client - Atmosphere Data Store integration (cdsapi-based)
Fetches the UV index from CAMS via the CDS API, with 24h caching

Dataset: cams-global-atmospheric-composition-forecasts
Variable: uv_biologically_effective_dose_clear_sky (clear sky, per SSM guidance)
Source: Copernicus Atmosphere Data Store (ADS)
API: cdsapi Python library

STRATEGY: fetch ALL hours (0-23) and report the day's MAX UV index
"""

import cdsapi
import json
import os
import netCDF4 as nc
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
import tempfile


class CAMSUVClient:
    """
    CAMS UV index client with 24h caching via the CDS API

    Responsibilities:
    - Fetch UV data from CAMS via the CDS API (all hours)
    - Compute the MAX UV index for the full day
    - Cache results in cache/uv_cache.json
    - Validate cache age (24h)
    - Return data formatted according to the SSM scale
    """

    # Dataset configuration
    DATASET_NAME = "cams-global-atmospheric-composition-forecasts"

    # UV risk levels from SSM (the Swedish Radiation Safety Authority)
    UV_RISK_LEVELS = {
        'low': {'max': 2, 'text': 'Låg UV-risk', 'color': 'green'},
        'moderate': {'max': 5, 'text': 'Måttlig UV-risk', 'color': 'yellow'},
        'high': {'max': 7, 'text': 'Hög UV-risk', 'color': 'orange'},
        'very_high': {'max': 10, 'text': 'Mycket hög UV-risk', 'color': 'red'},
        'extreme': {'max': float('inf'), 'text': 'Extrem UV-risk', 'color': 'purple'}
    }
    
    def __init__(self, latitude: float, longitude: float, cache_dir: str = "cache"):
        """
        Initialize the CAMS UV client

        Args:
            latitude: Latitude (decimal degrees)
            longitude: Longitude (decimal degrees)
            cache_dir: Directory for cache files (default: "cache")
        """
        self.latitude = latitude
        self.longitude = longitude
        self.cache_dir = cache_dir
        self.cache_file = os.path.join(cache_dir, "uv_cache.json")
        self.cache_duration = timedelta(hours=24)
        
        # Create the cache directory if it does not exist
        os.makedirs(cache_dir, exist_ok=True)

        # Initialize the CDS API client
        try:
            self.client = cdsapi.Client()
            print("✅ CAMS UV Client initierad (cdsapi)")
            print(f"📍 Position: {latitude}, {longitude}")
            print(f"💾 Cache: {self.cache_file}")
        except Exception as e:
            print(f"⚠️ Varning: CDS API-klient kunde inte initieras: {e}")
            print("📝 Kontrollera att ~/.cdsapirc finns och är korrekt konfigurerad")
            self.client = None
    
    def _is_cache_valid(self) -> bool:
        """
        Check whether the cache is valid (< 24h old)

        Returns:
            True if the cache is valid, False otherwise
        """
        if not os.path.exists(self.cache_file):
            return False
        
        try:
            with open(self.cache_file, 'r') as f:
                cache_data = json.load(f)
            
            cached_time_str = cache_data.get('timestamp')
            if not cached_time_str:
                return False
            
            cached_time = datetime.fromisoformat(cached_time_str)
            age = datetime.now(timezone.utc) - cached_time
            
            is_valid = age < self.cache_duration
            
            if is_valid:
                hours_old = age.total_seconds() / 3600
                print(f"✅ UV-cache giltig ({hours_old:.1f}h gammal)")
            else:
                print(f"⏰ UV-cache utgången ({age.total_seconds() / 3600:.1f}h gammal)")
            
            return is_valid
            
        except Exception as e:
            print(f"⚠️ Fel vid cache-validering: {e}")
            return False
    
    def _classify_uv_risk(self, uv_index: float) -> Dict[str, str]:
        """
        Classify a UV index according to SSM's risk levels

        Args:
            uv_index: UV index value

        Returns:
            Dict with risk_level and risk_text
        """
        for level, config in self.UV_RISK_LEVELS.items():
            if uv_index <= config['max']:
                return {
                    'risk_level': level,
                    'risk_text': config['text'],
                    'color': config['color']
                }
        
        # Fallback (should never be reached)
        return {
            'risk_level': 'extreme',
            'risk_text': 'Extrem UV-risk',
            'color': 'purple'
        }
    
    def _extract_uv_from_netcdf(self, netcdf_path: str) -> Optional[Dict]:
        """
        Extract the MAX UV index from a NetCDF file (all hours)
        Converts W/m² to UV index by multiplying by 40

        Args:
            netcdf_path: Path to the NetCDF file

        Returns:
            Dict with max_uv_index and peak_hour, or None on error
        """
        try:
            dataset = nc.Dataset(netcdf_path, 'r')
            
            print(f"📋 Tillgängliga variabler: {list(dataset.variables.keys())}")
            
            # Find the UV variable
            uv_var_names = ['uv_biologically_effective_dose_clear_sky', 
                           'uvbedcs', 
                           'uv_biologically_effective_dose',
                           'uvbed']
            uv_var = None
            
            for var_name in uv_var_names:
                if var_name in dataset.variables:
                    uv_var = dataset.variables[var_name]
                    print(f"📊 Hittade UV-variabel: {var_name}")
                    break
            
            if uv_var is None:
                print(f"⚠️ Kunde inte hitta UV-variabel i NetCDF")
                dataset.close()
                return None
            
            # Extract the UV data (W/m²)
            uv_data = uv_var[:]
            print(f"📊 UV data shape: {uv_data.shape}")
            print(f"📊 UV data units: {uv_var.units if hasattr(uv_var, 'units') else 'unknown'}")
            
            # Check whether the first dimension is time (24 hours)
            # Example shape: (24, 1, 4, 6) where 24 = hours
            if uv_data.ndim >= 1 and uv_data.shape[0] == 24:
                print(f"⏰ Tidsdimension detekterad: {uv_data.shape[0]} timmar")
                
                # Compute the UV index for every hour
                uv_values = []
                for i in range(24):
                    # Average over all other dimensions (lat/lon)
                    if uv_data.ndim == 1:
                        uv_wm2 = float(uv_data[i])
                    elif uv_data.ndim == 2:
                        uv_wm2 = float(uv_data[i, :].mean())
                    elif uv_data.ndim == 3:
                        uv_wm2 = float(uv_data[i, :, :].mean())
                    elif uv_data.ndim == 4:
                        uv_wm2 = float(uv_data[i, :, :, :].mean())
                    else:
                        uv_wm2 = float(uv_data[i].mean())
                    
                    uv_index = uv_wm2 * 40  # Convert W/m² to UV index
                    uv_values.append(uv_index)

                # Find the MAX UV and at what hour it occurs
                max_uv_index = max(uv_values)
                peak_hour = uv_values.index(max_uv_index)
                
                print(f"\n📊 UV-värden över dygnet:")
                print(f"  Min: {min(uv_values):.2f}")
                print(f"  Max: {max_uv_index:.2f} (kl {peak_hour:02d}:00)")
                print(f"  Medel: {sum(uv_values)/len(uv_values):.2f}")
                
                dataset.close()
                
                return {
                    'max_uv_index': max_uv_index,
                    'peak_hour': peak_hour,
                    'all_hours': uv_values  # For a possible future chart
                }
            
            else:
                # No time dimension - fall back to a simple mean
                print(f"⚠️ Oväntad data-shape: {uv_data.shape}, använder medelvärde")
                
                if uv_data.size > 1:
                    uv_wm2 = float(uv_data.mean())
                else:
                    uv_wm2 = float(uv_data.flatten()[0])
                
                uv_index = uv_wm2 * 40
                
                print(f"🌞 UV-strålning: {uv_wm2:.4f} W/m²")
                print(f"🌞 UV-index: {uv_index:.2f}")
                
                dataset.close()
                
                return {
                    'max_uv_index': uv_index,
                    'peak_hour': 12,  # Assume midday
                    'all_hours': []
                }
            
        except Exception as e:
            print(f"❌ Fel vid NetCDF-parsing: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _fetch_fresh_uv_data(self) -> Optional[Dict]:
        """
        Fetch fresh UV data from CAMS via the CDS API (all hours, for the MAX calculation)

        Returns:
            Dict with UV data or None on error
        """
        if self.client is None:
            print("❌ CDS API-klient inte tillgänglig")
            return None
        
        # Today's date
        today = datetime.now(timezone.utc)
        date_str = today.strftime("%Y-%m-%d")
        
        print(f"\n⏳ Hämtar UV-data från CAMS ADS...")
        print(f"📅 Datum: {date_str}")
        print(f"📍 Position: {self.latitude}, {self.longitude}")
        
        # Temporary file for the NetCDF download
        with tempfile.NamedTemporaryFile(suffix='.nc', delete=False) as tmp_file:
            tmp_path = tmp_file.name

        try:
            # Request ALL hours (0-23) for the MAX calculation
            request = {
                'variable': 'uv_biologically_effective_dose_clear_sky',
                'date': date_str,
                'time': '00:00',
                'leadtime_hour': [str(h) for h in range(24)],  # hours 0-23
                'type': 'forecast',
                'area': [
                    self.latitude + 0.7,   # North
                    self.longitude - 1.0,  # West
                    self.latitude - 0.7,   # South
                    self.longitude + 1.0   # East
                ],
                'format': 'netcdf'
            }
            
            print(f"📦 CDS API Request (MAX UV-strategi):")
            print(f"   variable: {request['variable']}")
            print(f"   date: {request['date']}")
            print(f"   time: {request['time']}")
            print(f"   leadtime_hour: 0-23 (alla timmar)")
            print(f"   area: [{request['area']}]")
            
            print("\n⏳ Skickar request (kan ta 60-180 sekunder för alla timmar)...")
            print("💡 Hämtar alla 24 timmar för att beräkna MAX UV-index")
            
            # Retrieve the data with cdsapi
            self.client.retrieve(
                self.DATASET_NAME,
                request,
                tmp_path
            )
            
            print(f"✅ Data nedladdad till: {tmp_path}")
            
            # Check the file size
            file_size = os.path.getsize(tmp_path)
            print(f"📦 Filstorlek: {file_size} bytes")
            
            if file_size == 0:
                print("⚠️ Tom NetCDF-fil mottagen")
                os.unlink(tmp_path)
                return None
            
            # Extract the MAX UV value from the NetCDF file
            uv_result = self._extract_uv_from_netcdf(tmp_path)

            # Remove the temporary file
            os.unlink(tmp_path)
            
            if uv_result is None:
                return None
            
            max_uv_index = uv_result['max_uv_index']
            peak_hour = uv_result['peak_hour']
            
            # Classify according to the SSM scale
            risk_info = self._classify_uv_risk(max_uv_index)

            # Build the result
            result = {
                'uv_index': round(max_uv_index, 1),
                'peak_hour': peak_hour,
                'risk_level': risk_info['risk_level'],
                'risk_text': risk_info['risk_text'],
                'color': risk_info['color'],
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'coordinates': {
                    'latitude': self.latitude,
                    'longitude': self.longitude
                },
                'source': 'CAMS ADS (max dygn, molnfri himmel)',
                'method': 'max_daily'
            }
            
            print(f"\n🌞 UV-data hämtad:")
            print(f"  MAX UV-index: {result['uv_index']}")
            print(f"  Topp kl: {peak_hour:02d}:00")
            print(f"  Risk: {result['risk_text']} ({result['risk_level']})")
            
            return result
            
        except Exception as e:
            print(f"❌ Fel vid CAMS ADS-request: {e}")
            import traceback
            traceback.print_exc()
            
            # Remove the temporary file on error
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            
            return None
    
    def _save_to_cache(self, data: Dict) -> None:
        """
        Save UV data to the cache

        Args:
            data: UV data to cache
        """
        try:
            # Atomic write: a crash mid-write must not corrupt the cache
            tmp_path = self.cache_file + '.atomic-tmp'
            with open(tmp_path, 'w') as f:
                json.dump(data, f, indent=2)
            os.replace(tmp_path, self.cache_file)
            print(f"💾 UV-data cachad: {self.cache_file}")
        except Exception as e:
            print(f"⚠️ Kunde inte spara cache: {e}")
    
    def _load_from_cache(self) -> Optional[Dict]:
        """
        Load UV data from the cache

        Returns:
            Cached UV data or None
        """
        try:
            with open(self.cache_file, 'r') as f:
                data = json.load(f)
            print(f"📂 UV-data laddad från cache")
            return data
        except Exception as e:
            print(f"⚠️ Kunde inte ladda cache: {e}")
            return None
    
    def get_uv_index(self) -> Optional[Dict]:
        """
        Get the day's MAX UV index (from cache or a fresh API call)

        Returns:
            Dict with UV data or None on error:
            {
                'uv_index': float (MAX for the day),
                'peak_hour': int (0-23, when the MAX occurs),
                'risk_level': str,
                'risk_text': str,
                'color': str,
                'timestamp': str (ISO format),
                'coordinates': dict,
                'source': str,
                'method': 'max_daily'
            }
        """
        # Check the cache first
        if self._is_cache_valid():
            cached_data = self._load_from_cache()
            if cached_data:
                return cached_data
        
        # Fetch fresh data from CAMS
        fresh_data = self._fetch_fresh_uv_data()
        
        if fresh_data:
            self._save_to_cache(fresh_data)
            return fresh_data
        
        # Fall back to the stale cache if the API call fails
        print("⚠️ API-fel, försöker använda gammal cache...")
        return self._load_from_cache()


# Test function
def test_cams_uv_client():
    """Test of the CAMS UV client with the MAX UV strategy"""
    print("=" * 80)
    print("🌞 CAMS UV CLIENT TEST (MAX UV-strategi)")
    print("=" * 80)
    
    # Stockholm coordinates
    client = CAMSUVClient(59.33, 18.06)
    
    print("\n📊 Test 1: Hämta MAX UV-index för dagen")
    uv_data = client.get_uv_index()
    
    if uv_data:
        print("\n✅ UV-data hämtad:")
        print(f"  MAX UV-index: {uv_data['uv_index']}")
        
        # Handle peak_hour (may be missing in an old cache)
        peak_hour = uv_data.get('peak_hour')
        if peak_hour is not None and isinstance(peak_hour, int):
            print(f"  Topp kl: {peak_hour:02d}:00")
        else:
            print(f"  Topp kl: N/A (gammal cache-format)")
        
        print(f"  Risk: {uv_data['risk_text']} ({uv_data['risk_level']})")
        print(f"  Färg: {uv_data['color']}")
        print(f"  Uppdaterad: {uv_data['timestamp']}")
        print(f"  Källa: {uv_data['source']}")
        print(f"  Metod: {uv_data.get('method', 'N/A')}")
        
        print("\n📂 Cache-fil skapad:")
        print(f"  cache/uv_cache.json")
        
        print("\n💡 Nästa anrop kommer använda cache (giltig i 24h)")
        
        print("\n📊 Förklaring:")
        print("  - UV-index är MAX-värdet för hela dygnet")
        print("  - Vintertid: Förvänta UV 0-2 (låg solvinkel)")
        print("  - Sommartid: Förvänta UV 3-7 (hög solvinkel)")
        print("  - Topp inträffar vanligen 11-14 lokal tid")
    else:
        print("\n❌ Kunde inte hämta UV-data")
        print("📝 Kontrollera:")
        print("  1. ~/.cdsapirc finns och är korrekt")
        print("  2. ADS-konto har accepterat dataset Terms of Use")
        print("  3. Internetanslutning fungerar")
    
    print("\n" + "=" * 80)
    print("✅ Test avslutat")
    print("=" * 80)


if __name__ == "__main__":
    test_cams_uv_client()
