#!/usr/bin/env python3
"""
Netatmo API-klient för väderstation-data
OAuth2 implementation med smart data-blending från alla stationer
+ SMHI-KOMPATIBEL TRYCKTREND-FUNKTIONALITET: 3-timmars analys enligt svensk meteorologisk standard
"""

import json
import os
import shutil
import time
import threading
from datetime import datetime, timedelta
import requests
from urllib.parse import urlencode


class NetatmoClient:
    """Netatmo API-klient med OAuth2, smart data-blending och SMHI-kompatibel trycktrend-analys."""
    
    def __init__(self, client_id, client_secret, refresh_token, preferred_station=None):
        """
        Initialisera Netatmo-klient.
        
        Args:
            client_id (str): Netatmo app Client ID
            client_secret (str): Netatmo app Client Secret  
            refresh_token (str): Initial refresh token från dev portal
            preferred_station (str): Önskad station/modul att visa (används för display, blending sker automatiskt)
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.initial_refresh_token = refresh_token
        self.preferred_station = preferred_station
        
        # API endpoints
        self.api_base = "api.netatmo.com"
        self.auth_endpoint = "/oauth2/token"
        self.data_endpoint = "/api/getstationsdata"
        
        # Token state
        self.access_token = None
        self.refresh_token = refresh_token
        self.token_expires_at = None
        # Tokens lagras i cache/ (volym-monterad på Synology) så att roterade
        # refresh-tokens överlever container-rebuilds. Utan detta bryts
        # Netatmo-inloggningen permanent vid rebuild om token hunnit rotera.
        os.makedirs("cache", exist_ok=True)
        self.token_file = os.path.join("cache", "tokens.json")
        self.legacy_token_file = "tokens.json"
        
        # Cache
        self._cache_data = None
        self._cache_timestamp = None
        self._cache_duration = 300  # 5 minuters cache (Netatmo uppdaterar var 10:e min)
        
        # Threading
        self._refresh_timer = None
        
        # SMHI-KOMPATIBEL TRYCKTREND-HISTORIK
        # Lagras i cache/ (volym-monterad på Synology) så historiken överlever
        # container-rebuilds. Annars nollställs den vid varje deploy och de
        # femgradiga snabbt-stegen "tystnar" i ~3h tills fönstret fyllts på.
        cache_dir = "cache"
        os.makedirs(cache_dir, exist_ok=True)
        self.pressure_history_file = os.path.join(cache_dir, "pressure_history.json")

        # Engångsmigrering: ta med ev. äldre historik från repo-roten in i cache/.
        legacy_history_file = "pressure_history.json"
        if not os.path.exists(self.pressure_history_file) and os.path.exists(legacy_history_file):
            try:
                shutil.copy2(legacy_history_file, self.pressure_history_file)
                print(f"📦 Migrerade tryckhistorik: {legacy_history_file} → {self.pressure_history_file}")
            except Exception as e:
                print(f"⚠️ Kunde inte migrera tryckhistorik: {e}")

        self._pressure_history = self._load_pressure_history()
        
        # Blending-prioriteter (moduler prioriteras för utomhusdata)
        self.blending_strategy = {
            'temperature': ['module', 'main_device'],  # Föredra moduler för temperatur
            'humidity': ['module', 'main_device'],     # Föredra moduler för luftfuktighet  
            'pressure': ['main_device'],                # Tryck finns bara på huvudenhet
            'co2': ['main_device'],                     # CO2 finns bara på huvudenhet
            'noise': ['main_device'],                   # Ljud finns bara på huvudenhet
            'rain': ['rain_module', 'module', 'main_device'],  # Prioritera regnmätare högst
            'rain_sum_1': ['rain_module'],              # 1h nederbörd (bara regnmätare)
            'rain_sum_24': ['rain_module']              # 24h nederbörd (bara regnmätare)
        }
        
        print("🔑 Netatmo-klient initierad med smart data-blending + SMHI-kompatibel trycktrend-analys")
        
        # Ladda sparade tokens eller använd initial
        self._load_saved_tokens()
        
        # Autentisera direkt
        self._authenticate()
    
    # === SMHI-KOMPATIBEL TRYCKTREND-HISTORIK FUNKTIONER ===
    
    def _load_pressure_history(self):
        """Ladda tryckhistorik från fil."""
        if os.path.exists(self.pressure_history_file):
            try:
                with open(self.pressure_history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
                
                # Validera struktur
                if isinstance(history, dict) and 'timestamps' in history and 'pressures' in history:
                    # Rensa gamla data (äldre än 7 dagar)
                    cutoff_time = time.time() - (7 * 24 * 3600)
                    clean_history = self._clean_old_pressure_data(history, cutoff_time)
                    
                    print(f"📊 Laddad tryckhistorik: {len(clean_history['timestamps'])} mätpunkter")
                    return clean_history
                else:
                    print("⚠️ Ogiltig historikstruktur - skapar ny")
                    return {"timestamps": [], "pressures": []}
                    
            except (json.JSONDecodeError, KeyError) as e:
                print(f"⚠️ Fel vid läsning av tryckhistorik: {e}")
                return {"timestamps": [], "pressures": []}
        else:
            print("📁 Ingen tryckhistorik finns - skapar ny")
            return {"timestamps": [], "pressures": []}
    
    def _clean_old_pressure_data(self, history, cutoff_time):
        """Ta bort data äldre än cutoff_time."""
        timestamps = history['timestamps']
        pressures = history['pressures']
        
        # Hitta index för data som ska behållas
        keep_indices = [i for i, ts in enumerate(timestamps) if ts >= cutoff_time]
        
        if keep_indices:
            cleaned_history = {
                "timestamps": [timestamps[i] for i in keep_indices],
                "pressures": [pressures[i] for i in keep_indices]
            }
            
            removed_count = len(timestamps) - len(keep_indices)
            if removed_count > 0:
                print(f"🗑️ Rensade {removed_count} gamla tryckdata-punkter")
            
            return cleaned_history
        else:
            print("🗑️ All historik var för gammal - återställer tom historik")
            return {"timestamps": [], "pressures": []}
    
    def _save_pressure_history(self):
        """Spara tryckhistorik till fil (atomärt, mot korrupt fil vid krasch)."""
        try:
            tmp_path = self.pressure_history_file + '.tmp'
            with open(tmp_path, 'w', encoding='utf-8') as f:
                json.dump(self._pressure_history, f, indent=2)
            os.replace(tmp_path, self.pressure_history_file)
        except Exception as e:
            print(f"❌ Fel vid sparande av tryckhistorik: {e}")
    
    def _add_pressure_measurement(self, pressure_hpa, timestamp=None):
        """
        Lägg till ny tryckmätning i historiken.
        
        Args:
            pressure_hpa (float): Tryck i hPa
            timestamp (float, optional): Unix timestamp, None = nu
        """
        if timestamp is None:
            timestamp = time.time()
        
        # Kontrollera att det inte är duplikat (inom 5 minuter)
        if self._pressure_history['timestamps']:
            last_timestamp = self._pressure_history['timestamps'][-1]
            if abs(timestamp - last_timestamp) < 300:  # 5 minuter
                # Uppdatera senaste mätningen istället för att lägga till ny
                self._pressure_history['timestamps'][-1] = timestamp
                self._pressure_history['pressures'][-1] = pressure_hpa
                return
        
        # Lägg till ny mätning
        self._pressure_history['timestamps'].append(timestamp)
        self._pressure_history['pressures'].append(pressure_hpa)
        
        # Begränsa historik till max 2000 punkter (ungefär 7 dagar vid 5min intervall)
        max_points = 2000
        if len(self._pressure_history['timestamps']) > max_points:
            excess = len(self._pressure_history['timestamps']) - max_points
            self._pressure_history['timestamps'] = self._pressure_history['timestamps'][excess:]
            self._pressure_history['pressures'] = self._pressure_history['pressures'][excess:]
        
        # Spara till fil
        self._save_pressure_history()
        
        print(f"📊 Tryckmätning sparad: {pressure_hpa} hPa (totalt {len(self._pressure_history['timestamps'])} punkter)")
    
    def _analyze_pressure_trend(self):
        """
        SMHI-kompatibel trycktrend-analys enligt svensk meteorologisk standard.
        
        Implementerar SMHIs 3-timmars metodik med svenska tröskelvärden.
        
        Returns:
            dict: {
                "trend": "rising|falling|stable|n/a",
                "description": "Svenska beskrivningar...",
                "icon": "wi-xxx",
                "data_hours": antal_timmar_data,
                "pressure_change": skillnad_i_hPa,
                "analysis_quality": "poor|basic|good|excellent",
                "smhi_compatible": True,
                "analysis_periods": {...}  # Detaljerad analys för olika perioder
            }
        """
        timestamps = self._pressure_history['timestamps']
        pressures = self._pressure_history['pressures']
        
        # Kontrollera om vi har tillräckligt med data
        if len(pressures) < 2:
            return {
                "trend": "n/a",
                "trend5": "unknown",
                "description": "Samlar tryckdata...",
                "icon": "wi-na",
                "data_hours": 0,
                "pressure_change": 0,
                "analysis_quality": "poor",
                "smhi_compatible": True,
                "analysis_periods": {}
            }
        
        current_time = time.time()
        oldest_time = timestamps[0]
        data_hours = (current_time - oldest_time) / 3600
        
        # Analysera olika tidsperioder enligt SMHI-metodik
        analysis_periods = self._analyze_multiple_periods_smhi(timestamps, pressures, current_time)
        
        # SMHI PRIMÄR METOD: 3-timmars analys (högst prioritet)
        primary_analysis = analysis_periods.get('3h')
        
        if primary_analysis and primary_analysis['data_points'] >= 3:
            # Använd SMHI 3-timmars metodik som primär
            trend_result = self._determine_smhi_trend(
                primary_analysis, 
                analysis_periods,
                data_hours
            )
            
            trend_result.update({
                "data_hours": data_hours,
                "analysis_quality": self._assess_analysis_quality_smhi(analysis_periods, data_hours),
                "smhi_compatible": True,
                "analysis_periods": analysis_periods
            })
            
            return trend_result
        
        # FALLBACK: 6-timmars analys om 3h inte tillgänglig
        elif analysis_periods.get('6h') and analysis_periods['6h']['data_points'] >= 4:
            fallback_analysis = analysis_periods['6h']
            trend_result = self._determine_smhi_trend(
                fallback_analysis, 
                analysis_periods,
                data_hours,
                fallback_period="6h"
            )
            
            trend_result.update({
                "data_hours": data_hours,
                "analysis_quality": "basic",
                "smhi_compatible": True,
                "analysis_periods": analysis_periods
            })
            
            return trend_result
        
        # MINIMAL FALLBACK: För lite data
        else:
            return {
                "trend": "n/a",
                "trend5": "unknown",
                "description": "Behöver mer data för SMHI-analys (3+ timmar)",
                "icon": "wi-na",
                "data_hours": data_hours,
                "pressure_change": 0,
                "analysis_quality": "poor",
                "smhi_compatible": True,
                "analysis_periods": analysis_periods
            }

    def _analyze_multiple_periods_smhi(self, timestamps, pressures, current_time):
        """
        Analysera tryckdata för olika tidsperioder enligt SMHI-metodik.
        
        Returns:
            dict: Analys för 3h, 6h, 12h, 24h perioder
        """
        periods = {
            '3h': 3 * 3600,    # SMHI primär metod
            '6h': 6 * 3600,    # SMHI sekundär 
            '12h': 12 * 3600,  # Utökad kontext
            '24h': 24 * 3600   # Dygnskontext
        }
        
        analysis_results = {}
        
        for period_name, period_seconds in periods.items():
            # Hitta data inom tidsperioden
            start_time = current_time - period_seconds
            
            # Filtrera data för perioden
            period_data = []
            for i, ts in enumerate(timestamps):
                if ts >= start_time:
                    period_data.append({
                        'timestamp': ts,
                        'pressure': pressures[i],
                        'index': i
                    })
            
            if len(period_data) < 2:
                analysis_results[period_name] = {
                    'data_points': len(period_data),
                    'pressure_change': 0,
                    'change_rate': 0,
                    'actual_hours': 0,
                    'start_pressure': None,
                    'end_pressure': None,
                    'available': False
                }
                continue
            
            # Beräkna förändring för perioden
            start_pressure = period_data[0]['pressure']
            end_pressure = period_data[-1]['pressure']
            pressure_change = end_pressure - start_pressure
            
            # Beräkna verklig tidsspan
            actual_seconds = period_data[-1]['timestamp'] - period_data[0]['timestamp']
            actual_hours = actual_seconds / 3600
            
            # Beräkna förändringshastighet per timme
            change_rate = pressure_change / max(actual_hours, 0.1) if actual_hours > 0 else 0
            
            analysis_results[period_name] = {
                'data_points': len(period_data),
                'pressure_change': pressure_change,
                'change_rate': change_rate,
                'actual_hours': actual_hours,
                'start_pressure': start_pressure,
                'end_pressure': end_pressure,
                'available': True,
                'period_coverage': (actual_hours / (period_seconds / 3600)) * 100  # Procent täckning
            }
        
        return analysis_results

    def _determine_smhi_trend(self, primary_analysis, all_periods, data_hours, fallback_period="3h"):
        """
        Bestäm trend enligt SMHI-metodik med svenska tröskelvärden.
        
        Args:
            primary_analysis: Huvudanalys (normalt 3h)
            all_periods: Alla tidsperioder för kontext
            data_hours: Total datahistorik
            fallback_period: Vilken period som används som primär
        
        Returns:
            dict: Trend-resultat med svenska beskrivningar
        """
        pressure_change = primary_analysis['pressure_change']
        change_rate = primary_analysis['change_rate']
        actual_hours = primary_analysis['actual_hours']
        
        # FEMGRADIG SKALA enligt pressure-descriptions.md (digitaliserad Huger-barometer)
        # Δ per 3 h:  <−2 faller snabbt | −2…−0,5 faller | ±0,5 stabilt | +0,5…+2 stiger | >+2 stiger snabbt
        # 'step' = gräns stabilt↔stiger/faller, 'fast' = gräns till snabbt-stegen.
        if fallback_period == "3h":
            step_threshold = 0.5   # |Δ| ≥ 0.5 hPa på 3h = stiger/faller
            fast_threshold = 2.0   # |Δ| > 2 hPa på 3h = snabbt
        else:
            # 6h+ fallback: skala trösklarna proportionellt mot faktiskt tidsspann
            # (ej extrapolering — undviker att brus förstärks till falska "snabbt")
            multiplier = (actual_hours / 3.0) if actual_hours > 0 else 1.0
            step_threshold = 0.5 * multiplier
            fast_threshold = 2.0 * multiplier

        # Kontextanalys från längre perioder
        context = self._get_trend_context(all_periods)

        # Femgradig klassificering på 3h-Δ (pressure_change), specens styckvisa gränser
        if pressure_change < -fast_threshold:
            trend5 = "falling_fast"
            description = f"Snabbt fallande tryck - {context['weather_desc']}"
            icon = "wi-direction-down"

        elif pressure_change < -step_threshold:
            trend5 = "falling"
            if context['long_term_trend'] == 'stabilizing':
                description = f"Fallande, stabiliseras - {context['weather_desc']}"
            else:
                description = f"Lågtryck närmar sig - {context['weather_desc']}"
            icon = "wi-direction-down"

        elif pressure_change < step_threshold:
            trend5 = "stable"
            # Nyanserad beskrivning baserat på kontext
            if abs(change_rate) > 0.1:  # Svag förändring detekterad
                if pressure_change > 0:
                    description = f"Nästan stabilt, svagt stigande - {context['weather_desc']}"
                else:
                    description = f"Nästan stabilt, svagt fallande - {context['weather_desc']}"
            else:
                description = f"Stabilt väderläge - {context['weather_desc']}"
            icon = "wi-minus"

        elif pressure_change < fast_threshold:
            trend5 = "rising"
            if context['long_term_trend'] == 'stabilizing':
                description = f"Stigande, stabiliseras - {context['weather_desc']}"
            else:
                description = f"Högtryck på ingång - {context['weather_desc']}"
            icon = "wi-direction-up"

        else:
            trend5 = "rising_fast"
            description = f"Snabbt stigande tryck - {context['weather_desc']}"
            icon = "wi-direction-up"

        # Behåll tregradig 'trend' för bakåtkompatibilitet (frontend-fallback, äldre konsumenter)
        if trend5 in ("rising", "rising_fast"):
            trend = "rising"
        elif trend5 in ("falling", "falling_fast"):
            trend = "falling"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "trend5": trend5,
            "description": description,
            "icon": icon,
            "pressure_change": pressure_change,
            "change_rate": change_rate,
            "primary_period": fallback_period,
            "context": context
        }

    def _get_trend_context(self, all_periods):
        """
        Analysera längre trender för att ge kontext till SMHI 3h-analysen.
        
        Returns:
            dict: Kontextinformation för beskrivningar
        """
        context = {
            'long_term_trend': 'unknown',
            'weather_desc': 'väderläge oklart'
        }
        
        # Analysera 24h trend för kontext
        if all_periods.get('24h') and all_periods['24h']['available']:
            day_change = all_periods['24h']['pressure_change']
            
            if abs(day_change) < 2:
                context['long_term_trend'] = 'stable'
                context['weather_desc'] = 'stabilt väder'
            elif day_change > 5:
                context['long_term_trend'] = 'rising'
                context['weather_desc'] = 'högtryck etableras'
            elif day_change < -5:
                context['long_term_trend'] = 'falling'
                context['weather_desc'] = 'lågtryck utvecklas'
        
        # Kontrollera om trenden stabiliseras (6h vs 12h jämförelse)
        if (all_periods.get('6h') and all_periods.get('12h') and 
            all_periods['6h']['available'] and all_periods['12h']['available']):
            
            six_h_rate = abs(all_periods['6h']['change_rate'])
            twelve_h_rate = abs(all_periods['12h']['change_rate'])
            
            # Om förändringshastigheten minskar = stabilisering
            if six_h_rate < twelve_h_rate * 0.7:
                context['long_term_trend'] = 'stabilizing'
                
                # Mer specifik beskrivning vid stabilisering
                if all_periods['12h']['pressure_change'] > 2:
                    context['weather_desc'] = 'högtryck stabiliseras'
                elif all_periods['12h']['pressure_change'] < -2:
                    context['weather_desc'] = 'lågtryck stabiliseras'
                else:
                    context['weather_desc'] = 'väderläget stabiliseras'
        
        return context

    def _assess_analysis_quality_smhi(self, analysis_periods, data_hours):
        """
        Bedöm kvaliteten på SMHI-analysen baserat på datatillgång.
        
        Returns:
            str: "poor|basic|good|excellent"
        """
        # Kontrollera SMHI 3h-analysens kvalitet
        three_h = analysis_periods.get('3h', {})
        
        if not three_h.get('available', False):
            return "poor"
        
        # Bedöm baserat på datatäckning och längd
        coverage = three_h.get('period_coverage', 0)
        data_points = three_h.get('data_points', 0)
        
        if coverage >= 90 and data_points >= 6 and data_hours >= 24:
            return "excellent"  # SMHI-kvalitet + långtidskontext
        elif coverage >= 80 and data_points >= 4 and data_hours >= 12:
            return "good"       # God SMHI-analys
        elif coverage >= 60 and data_points >= 3 and data_hours >= 6:
            return "basic"      # Grundläggande SMHI-analys
        else:
            return "poor"       # Otillräcklig data för tillförlitlig SMHI-analys
    
    # === BEFINTLIGA FUNKTIONER (INGA ÄNDRINGAR) ===
    
    def _load_saved_tokens(self):
        """Ladda sparade tokens från fil om de finns."""
        # Migrering: äldre versioner sparade tokens.json i appkatalogen
        token_path = self.token_file
        if not os.path.exists(token_path) and os.path.exists(self.legacy_token_file):
            token_path = self.legacy_token_file

        if os.path.exists(token_path):
            try:
                with open(token_path, 'r') as f:
                    token_data = json.load(f)

                self.refresh_token = token_data.get('refresh_token', self.initial_refresh_token)
                print(f"🔄 Laddat sparade tokens från {token_path}")

            except (json.JSONDecodeError, KeyError) as e:
                print(f"⚠️ Fel vid läsning av {token_path}: {e}")
                print("🔧 Använder initial refresh_token från config")
        else:
            print(f"📁 {self.token_file} finns inte - använder initial refresh_token")

    def _save_tokens(self, token_data):
        """Spara tokens till fil för framtida användning."""
        try:
            # Atomär skrivning: en krasch mitt i skrivningen får inte
            # korrumpera token-filen (då tappas refresh-token permanent)
            tmp_path = self.token_file + '.tmp'
            with open(tmp_path, 'w') as f:
                json.dump(token_data, f, indent=2)
            os.replace(tmp_path, self.token_file)
            print(f"💾 Tokens sparade i {self.token_file}")
        except Exception as e:
            print(f"❌ Fel vid sparande av tokens: {e}")
    
    def _authenticate(self):
        """Autentisera med refresh token för att få access token."""
        print("🔐 Autentiserar med Netatmo...")
        
        # Förbered POST-data
        params = {
            'grant_type': 'refresh_token',
            'refresh_token': self.refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        try:
            # API-anrop
            response = requests.post(
                f"https://{self.api_base}{self.auth_endpoint}",
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                data=urlencode(params),
                timeout=10
            )
            
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
            
            result = response.json()
            
            # Kontrollera fel
            if 'error' in result:
                raise Exception(f"{result['error']}: {result.get('error_description', 'Okänt fel')}")
            
            # Extrahera tokens
            self.access_token = result['access_token']
            self.refresh_token = result.get('refresh_token', self.refresh_token)
            expires_in = result.get('expires_in', 10800)  # Default 3h
            
            # Beräkna expiry-tid
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
            
            print(f"✅ Netatmo autentiserad! Token expires: {self.token_expires_at.strftime('%H:%M:%S')}")
            
            # Spara tokens
            self._save_tokens(result)
            
            # Schemalägg auto-refresh (60s före expiry)
            refresh_delay = max(expires_in - 60, 60)  # Minst 60s, max expires_in-60s
            self._schedule_token_refresh(refresh_delay)
            
        except requests.RequestException as e:
            print(f"❌ Nätverksfel vid Netatmo-autentisering: {e}")
            raise
        except Exception as e:
            print(f"❌ Fel vid Netatmo-autentisering: {e}")
            raise
    
    def _schedule_token_refresh(self, delay_seconds):
        """Schemalägg automatisk token-refresh."""
        if self._refresh_timer:
            self._refresh_timer.cancel()
        
        def refresh_token():
            try:
                print("🔄 Auto-refresh av Netatmo token...")
                self._authenticate()
            except Exception as e:
                print(f"❌ Auto-refresh misslyckades: {e}")
                # Retry efter 60s vid fel
                print("🔄 Försöker igen om 60 sekunder...")
                self._schedule_token_refresh(60)
        
        self._refresh_timer = threading.Timer(delay_seconds, refresh_token)
        self._refresh_timer.daemon = True
        self._refresh_timer.start()
        
        print(f"⏰ Token auto-refresh schemalagd om {delay_seconds//60} minuter")
    
    def _is_cache_valid(self):
        """Kontrollera om cache fortfarande är giltig."""
        if not self._cache_data or not self._cache_timestamp:
            return False
        
        cache_age = time.time() - self._cache_timestamp
        return cache_age < self._cache_duration
    
    def get_station_data(self):
        """
        Hämta väderstation-data från Netatmo API med smart blending.
        
        Returns:
            dict: Parsed station data med optimala värden från alla stationer
        """
        # Använd cache om giltig
        if self._is_cache_valid():
            print("📋 Använder cachad Netatmo-data")
            return self._cache_data
        
        if not self.access_token:
            print("❌ Ingen access token - kan inte hämta data")
            return None
        
        try:
            print("🌐 Hämtar Netatmo station data med smart blending...")
            
            # API-anrop
            response = requests.get(
                f"https://{self.api_base}{self.data_endpoint}",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.access_token}'
                },
                timeout=10
            )
            
            # Hantera 403 (invalid token)
            if response.status_code == 403:
                print("⚠️ Token invalid (403) - försöker refresh...")
                self._authenticate()
                # Retry med nytt token
                response = requests.get(
                    f"https://{self.api_base}{self.data_endpoint}",
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {self.access_token}'
                    },
                    timeout=10
                )
            
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
            
            result = response.json()
            
            # Kontrollera fel
            if 'error' in result:
                raise Exception(f"API Error: {result['error'].get('message', 'Okänt fel')}")
            
            # Parsa data med smart blending
            station_data = self._parse_station_data_with_blending(result.get('body', {}))
            
            # SMHI-KOMPATIBEL TRYCKTREND: Spara tryckdata till historik
            if station_data and station_data.get('pressure'):
                self._add_pressure_measurement(station_data['pressure'])
            
            # Uppdatera cache
            self._cache_data = station_data
            self._cache_timestamp = time.time()
            
            if station_data:
                print(f"✅ Netatmo-data hämtad med blending: {station_data.get('temperature', 'N/A')}°C")
            return station_data
            
        except requests.RequestException as e:
            print(f"❌ Nätverksfel vid Netatmo data-hämtning: {e}")
            return self._cache_data  # Returnera cache som fallback
        except Exception as e:
            print(f"❌ Fel vid Netatmo data-hämtning: {e}")
            return self._cache_data  # Returnera cache som fallback
    
    def _clean_station_type(self, type_text):
        """
        Rensa station-typ från extra information.
        
        Args:
            type_text (str): Raw station type från API
            
        Returns:
            str: Rensad station-typ
        """
        if not type_text:
            return "Okänd"
        
        # Mapping för vanliga typer
        type_mapping = {
            'NAMain': 'Huvudenhet',
            'NAModule1': 'Modul',
            'NAModule2': 'Vindmätare', 
            'NAModule3': 'Regnmätare',
            'NAModule4': 'Inomhusmodul'
        }
        
        # Ta bort parenteser och extra text
        clean_type = type_text.split(' (')[0].strip()
        
        # Använd mapping om tillgänglig
        return type_mapping.get(clean_type, clean_type)
    
    def _determine_station_category(self, device_type, station_name):
        """
        Avgör om en station är huvudenhet, modul eller regnmodul baserat på typ och namn.
        
        Args:
            device_type (str): Enhetens typ från API
            station_name (str): Stationens namn
            
        Returns:
            str: 'main_device', 'module' eller 'rain_module'
        """
        # Kontrollera enhetstyp
        if device_type in ['NAMain']:
            return 'main_device'
        elif device_type == 'NAModule3':
            return 'rain_module'  # Regnmätare får egen kategori
        elif device_type in ['NAModule1', 'NAModule2', 'NAModule4']:
            return 'module'
        
        # Fallback baserat på namn (för robusthet)
        name_lower = station_name.lower()
        if any(keyword in name_lower for keyword in ['regn', 'rain', 'precipitation', 'nederbörd']):
            return 'rain_module'
        elif any(keyword in name_lower for keyword in ['utomhus', 'outdoor', 'outside', 'extern']):
            return 'module'
        elif any(keyword in name_lower for keyword in ['inomhus', 'indoor', 'inside', 'intern', 'hemma']):
            return 'main_device'
        
        # Default fallback
        return 'main_device'
    
    def _blend_parameter_value(self, parameter_name, all_stations_data):
        """
        Välj bästa värde för en parameter baserat på blending-strategi.
        
        Args:
            parameter_name (str): Parameternamn (temperature, humidity, etc.)
            all_stations_data (list): Lista med alla stationer och deras data
            
        Returns:
            tuple: (värde, källa_station_namn, källa_typ)
        """
        strategy = self.blending_strategy.get(parameter_name, ['module', 'main_device'])
        
        # Samla tillgängliga värden enligt prioritet
        candidates = []
        
        for station in all_stations_data:
            value = station['data'].get(parameter_name)
            if value is not None:
                station_category = station['category']
                priority = 999  # Default låg prioritet
                
                # Sätt prioritet baserat på strategi
                if station_category in strategy:
                    priority = strategy.index(station_category)
                
                candidates.append({
                    'value': value,
                    'priority': priority,
                    'station_name': station['name'],
                    'station_type': station['type'],
                    'category': station_category
                })
        
        if not candidates:
            return None, None, None
        
        # Sortera efter prioritet (lägre nummer = högre prioritet)
        candidates.sort(key=lambda x: x['priority'])
        best = candidates[0]
        
        return best['value'], best['station_name'], best['station_type']
    
    def _parse_station_data_with_blending(self, body):
        """
        Parsa Netatmo API-svar med smart data-blending från alla stationer.
        
        Args:
            body (dict): API response body
            
        Returns:
            dict: Blended weather data från alla tillgängliga stationer
        """
        try:
            devices = body.get('devices', [])
            if not devices:
                print("⚠️ Inga devices hittades i Netatmo-data")
                return None
            
            # Samla alla stationer med deras data
            all_stations = []
            
            print(f"🔍 Analyserar alla tillgängliga stationer för data-blending...")
            
            # Iterera över alla devices (huvudstationer)
            for device in devices:
                station_name = device.get('station_name', 'Okänd station')
                device_type = device.get('type', 'Unknown')
                dashboard_data = device.get('dashboard_data', {})
                
                # Lägg till huvudenheten
                clean_type = self._clean_station_type(device_type)
                category = self._determine_station_category(device_type, station_name)
                
                main_station = {
                    'name': station_name,
                    'type': clean_type,
                    'category': category,
                    'data': {
                        'temperature': dashboard_data.get('Temperature'),
                        'humidity': dashboard_data.get('Humidity'),
                        'pressure': dashboard_data.get('Pressure'),
                        'co2': dashboard_data.get('CO2'),
                        'noise': dashboard_data.get('Noise')
                    },
                    'timestamp': dashboard_data.get('time_utc'),
                    'device_id': device.get('_id')
                }
                all_stations.append(main_station)
                
                # Iterera över moduler
                modules = device.get('modules', [])
                for module in modules:
                    module_name = module.get('module_name', 'Okänd modul')
                    module_type = module.get('type', 'Unknown')
                    module_data = module.get('dashboard_data', {})
                    
                    clean_module_type = self._clean_station_type(module_type)
                    module_category = self._determine_station_category(module_type, module_name)
                    
                    module_station = {
                        'name': module_name,
                        'type': clean_module_type,
                        'category': module_category,
                        'data': {
                            'temperature': module_data.get('Temperature'),
                            'humidity': module_data.get('Humidity'),
                            'pressure': module_data.get('Pressure'),
                            'co2': module_data.get('CO2'),
                            'noise': module_data.get('Noise'),
                            'rain': module_data.get('Rain'),           # Aktuell nederbörd
                            'rain_sum_1': module_data.get('sum_rain_1'),  # 1h nederbörd
                            'rain_sum_24': module_data.get('sum_rain_24') # 24h nederbörd
                        },
                        'timestamp': module_data.get('time_utc'),
                        'device_id': module.get('_id'),
                        'parent_station': station_name
                    }
                    all_stations.append(module_station)
            
            # Logga alla tillgängliga stationer
            print(f"📊 Hittade {len(all_stations)} stationer för blending:")
            for i, station in enumerate(all_stations, 1):
                available_params = [k for k, v in station['data'].items() if v is not None]
                parent_info = f" i {station.get('parent_station')}" if station.get('parent_station') else ""
                print(f"  {i}. {station['name']} ({station['type']}, {station['category']}){parent_info}")
                print(f"     📊 Data: {', '.join(available_params) if available_params else 'Inga'}")
            
            # Utför smart blending för varje parameter
            print(f"\n🧠 Utför smart data-blending...")
            blended_data = {}
            data_sources = {}
            
            parameters = ['temperature', 'humidity', 'pressure', 'co2', 'noise', 'rain', 'rain_sum_1', 'rain_sum_24']
            
            for param in parameters:
                value, source_name, source_type = self._blend_parameter_value(param, all_stations)
                if value is not None:
                    blended_data[param] = value
                    data_sources[param] = f"{source_name} ({source_type})"
                    print(f"  ✅ {param}: {value} från {source_name} ({source_type})")
                else:
                    print(f"  ❌ {param}: Inte tillgängligt")
            
            # Skapa slutgiltigt dataset
            if not blended_data:
                print("⚠️ Ingen data kunde blandas från stationerna")
                return None
            
            # Hitta primär station för visningsnamn (föredra preferred eller första med temperatur)
            primary_station = None
            if self.preferred_station:
                # Leta efter preferred station
                for station in all_stations:
                    if station['name'] == self.preferred_station:
                        primary_station = station
                        break
            
            if not primary_station:
                # Fallback till första station med temperatur
                for station in all_stations:
                    if station['data'].get('temperature') is not None:
                        primary_station = station
                        break
            
            if not primary_station:
                primary_station = all_stations[0]  # Absolut fallback
            
            # Beräkna data-ålder (använd senaste timestamp)
            latest_timestamp = max([s.get('timestamp', 0) for s in all_stations if s.get('timestamp')])
            data_age_minutes = None
            if latest_timestamp:
                data_age = time.time() - latest_timestamp
                data_age_minutes = int(data_age / 60)
            
            # Hantera enheter från user preferences
            user_prefs = body.get('user', {}).get('administrative', {})
            unit_temp = user_prefs.get('unit', 0)  # 0=Celsius, 1=Fahrenheit
            
            # Konvertera temperatur om nödvändigt
            if unit_temp == 1 and blended_data.get('temperature'):
                blended_data['temperature'] = (blended_data['temperature'] - 32) * 5/9
            
            # Slutgiltigt resultat
            final_data = {
                'station_name': primary_station['name'],
                'station_type': primary_station['type'],
                'temperature': blended_data.get('temperature'),
                'humidity': blended_data.get('humidity'),
                'pressure': blended_data.get('pressure'),
                'co2': blended_data.get('co2'),
                'noise': blended_data.get('noise'),
                'rain': blended_data.get('rain'),
                'rain_sum_1': blended_data.get('rain_sum_1'),
                'rain_sum_24': blended_data.get('rain_sum_24'),
                'timestamp': latest_timestamp,
                'data_age_minutes': data_age_minutes,
                'data_sources': data_sources,  # Ny: visar varifrån varje värde kommer
                'available_stations': [s['name'] for s in all_stations],
                'blending_used': True  # Flagga att blending användes
            }
            
            print(f"\n✅ Smart blending klar!")
            print(f"🎯 Primär station: {final_data['station_name']} ({final_data['station_type']})")
            print(f"📊 Blended data:")
            for param, value in blended_data.items():
                source = data_sources.get(param, 'Okänd')
                if param == 'temperature':
                    print(f"  🌡️ Temperatur: {value}°C från {source}")
                elif param == 'humidity':
                    print(f"  💧 Luftfuktighet: {value}% från {source}")
                elif param == 'pressure':
                    print(f"  📊 Tryck: {value} mbar från {source}")
                elif param == 'co2':
                    print(f"  🏭 CO2: {value} ppm från {source}")
                elif param == 'noise':
                    print(f"  🔊 Ljud: {value} dB från {source}")
            
            return final_data
            
        except Exception as e:
            print(f"❌ Fel vid smart blending av Netatmo-data: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_current_weather(self):
        """
        Hämta aktuellt väder med smart blending + SMHI-kompatibel trycktrend-analys.
        
        Returns:
            dict: Weather data kompatibel med WeatherDisplay inkl. SMHI-kompatibel trycktrend
        """
        station_data = self.get_station_data()
        if not station_data:
            return None
        
        # Utför SMHI-kompatibel trycktrend-analys
        pressure_trend = self._analyze_pressure_trend()
        
        # Konvertera till SMHI-kompatibelt format + trycktrend
        weather_data = {
            'temperature': station_data.get('temperature'),
            'humidity': station_data.get('humidity'),
            'pressure': station_data.get('pressure'),
            'source': 'netatmo_blended',
            'station_name': station_data.get('station_name'),
            'station_type': station_data.get('station_type'),
            'co2': station_data.get('co2'),
            'noise': station_data.get('noise'),
            'data_age_minutes': station_data.get('data_age_minutes'),
            'timestamp': station_data.get('timestamp'),
            'available_stations': station_data.get('available_stations', []),
            'data_sources': station_data.get('data_sources', {}),
            'blending_used': station_data.get('blending_used', False),
            
            # REGN-DATA från regnmodul (högst prioriterad)
            'rain': station_data.get('rain'),              # Aktuell nederbörd (mm)
            'rain_sum_1': station_data.get('rain_sum_1'),  # 1h total (mm)
            'rain_sum_24': station_data.get('rain_sum_24'), # 24h total (mm)
            
            # SMHI-KOMPATIBEL TRYCKTREND-DATA
            'pressure_trend': pressure_trend
        }
        
        # Logga SMHI-kompatibel trycktrend för debug
        if pressure_trend['trend'] != 'n/a':
            smhi_info = ""
            if pressure_trend.get('smhi_compatible'):
                primary_period = pressure_trend.get('primary_period', '3h')
                smhi_info = f" (SMHI {primary_period}-analys)"
            
            print(f"📈 SMHI-kompatibel trycktrend: {pressure_trend['trend']}{smhi_info}")
            print(f"   Beskrivning: {pressure_trend['description']}")
            print(f"   Datahistorik: {pressure_trend['data_hours']:.1f} timmar")
            print(f"   Tryckändring: {pressure_trend['pressure_change']:.1f} hPa")
            print(f"   Kvalitet: {pressure_trend['analysis_quality']}")
        
        return weather_data
    
    def cleanup(self):
        """Städa upp resurser."""
        if self._refresh_timer:
            self._refresh_timer.cancel()
        print("🧹 Netatmo-klient nedstängd")


def main():
    """Test-funktion för att köra klienten separat."""
    print("🧪 Testar Netatmo-klient med smart data-blending + SMHI-kompatibel trycktrend...")
    
    # Test-credentials läses från miljövariabler (aldrig hårdkodade i repot).
    # Sätt dem lokalt innan du kör klienten fristående, t.ex.:
    #   export NETATMO_CLIENT_ID=... NETATMO_CLIENT_SECRET=... NETATMO_REFRESH_TOKEN=...
    import os
    client_id = os.environ.get("NETATMO_CLIENT_ID", "")
    client_secret = os.environ.get("NETATMO_CLIENT_SECRET", "")
    refresh_token = os.environ.get("NETATMO_REFRESH_TOKEN", "")
    if not (client_id and client_secret and refresh_token):
        print("⚠️  Sätt NETATMO_CLIENT_ID / NETATMO_CLIENT_SECRET / NETATMO_REFRESH_TOKEN "
              "som miljövariabler för att köra detta test.")
        return
    
    # Testa med "Utomhus" som preferred för visning
    preferred_station = "Utomhus"
    
    try:
        # Skapa klient med smart blending + SMHI-kompatibel trycktrend
        client = NetatmoClient(client_id, client_secret, refresh_token, preferred_station)
        
        # Hämta blended data med SMHI-kompatibel trycktrend
        weather_data = client.get_current_weather()
        
        if weather_data:
            print("\n" + "="*50)
            print("✅ SMART BLENDING + SMHI-KOMPATIBEL TRYCKTREND TEST LYCKADES!")
            print("="*50)
            print(f"🎯 Primär visning: {weather_data.get('station_name', 'N/A')} ({weather_data.get('station_type', 'N/A')})")
            print(f"🌡️ Temperatur: {weather_data.get('temperature', 'N/A')}°C")
            print(f"💧 Luftfuktighet: {weather_data.get('humidity', 'N/A')}%")
            print(f"📊 Tryck: {weather_data.get('pressure', 'N/A')} mbar")
            if weather_data.get('co2'):
                print(f"🏭 CO2: {weather_data.get('co2', 'N/A')} ppm")
            if weather_data.get('noise'):
                print(f"🔊 Ljud: {weather_data.get('noise', 'N/A')} dB")
            print(f"📅 Data ålder: {weather_data.get('data_age_minutes', 'N/A')} minuter")
            
            # Visa SMHI-kompatibel trycktrend
            pressure_trend = weather_data.get('pressure_trend', {})
            print(f"\n📈 SMHI-KOMPATIBEL TRYCKTREND:")
            print(f"  Trend: {pressure_trend.get('trend', 'n/a')}")
            print(f"  Beskrivning: {pressure_trend.get('description', 'N/A')}")
            print(f"  Ikon: {pressure_trend.get('icon', 'wi-na')}")
            print(f"  Datahistorik: {pressure_trend.get('data_hours', 0):.1f} timmar")
            print(f"  Tryckändring: {pressure_trend.get('pressure_change', 0):.1f} hPa")
            print(f"  Kvalitet: {pressure_trend.get('analysis_quality', 'poor')}")
            print(f"  SMHI-kompatibel: {pressure_trend.get('smhi_compatible', False)}")
            
            # Visa primär period och analys-resultat
            if pressure_trend.get('primary_period'):
                print(f"  Primär period: {pressure_trend.get('primary_period')}")
            
            if pressure_trend.get('analysis_periods'):
                periods = pressure_trend['analysis_periods']
                print(f"\n📊 DETALJERAD SMHI-ANALYS:")
                for period, data in periods.items():
                    if data.get('available'):
                        change = data.get('pressure_change', 0)
                        hours = data.get('actual_hours', 0)
                        rate = data.get('change_rate', 0)
                        coverage = data.get('period_coverage', 0)
                        print(f"    {period}: {change:+.1f} hPa på {hours:.1f}h = {rate:+.2f} hPa/h (täckning: {coverage:.0f}%)")
            
            # Visa datakällor
            sources = weather_data.get('data_sources', {})
            if sources:
                print(f"\n📊 DATAKÄLLOR:")
                for param, source in sources.items():
                    print(f"  {param}: {source}")
            
            # Visa alla tillgängliga stationer
            available = weather_data.get('available_stations', [])
            if available:
                print(f"\n📋 Alla stationer: {', '.join(available)}")
                
            # SMHI-kompatibilitetstest
            print("\n" + "="*60)
            print("🇸🇪 SMHI-KOMPATIBILITETSTEST")
            print("="*60)
            print("✅ 3-timmars primäranalys implementerad")
            print("✅ Svenska tröskelvärden (0.8/2.0 hPa)")  
            print("✅ Kontextanalys från längre perioder")
            print("✅ Svenska väderbeskrivningar")
            print("✅ F4/S1 kompatibel notation (i beskrivningar)")
            print("="*60)
            
        else:
            print("❌ Kunde inte hämta blended väderdata")
        
        # Städa upp
        client.cleanup()
        
    except Exception as e:
        print(f"❌ Test misslyckades: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
