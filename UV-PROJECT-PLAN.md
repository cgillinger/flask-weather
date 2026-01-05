# 🌞 UV-Index Integration - Fasindelad Projektplan (UPPDATERAD)

## ⚠️ VIKTIGT: CAMS API-FÖRÄNDRING

**CAMS har bytt API-plattform sedan september 2024!**

- ❌ **Gamla API:n:** `api.copernicus.eu/api/v1/resources/...` (fungerar INTE längre)
- ✅ **Nya API:n:** **Atmosphere Data Store (ADS)** via `cdsapi` Python-bibliotek

---

## 📋 Projektöversikt

**Syfte:** Integrera UV-index från Copernicus CAMS i vaderdisplay-projektet  
**Placering i UI:** Till höger om luftkvalitet i weather-details-grid  
**Datakälla:** CAMS via ADS (Atmosphere Data Store)  
**Arkitekturprincip:** Modulariserad backend med separat service + cache + API endpoint

---

## 🎯 Teknisk Sammanfattning

### CAMS via ADS:
- **Plattform:** https://ads.atmosphere.copernicus.eu/
- **API-bibliotek:** `cdsapi` (Python CDS API client)
- **Autentisering:** Personal Access Token (från ADS-profil)
- **Dataset:** CAMS Global Solar Radiation med UV-index
- **Uppdateringsfrekvens:** Dagliga prognoser, typiskt publiceras på morgonen
- **Cachestrategi:** 24h cache, hämta dagligen
- **Koordinater:** Stockholm (Lat: 59.33, Lon: 18.06)

### Strålskyddsmyndighetens UV-skala:
| UV-index | risk_level | Färg       | Rådgivning |
|----------|-----------|------------|------------|
| 0–2      | low       | Grön       | Låg risk   |
| 3–5      | moderate  | Gul        | Måttlig risk |
| 6–7      | high      | Orange     | Hög risk - solskydd rekommenderas |
| 8–10     | very_high | Röd        | Mycket hög risk - skydda dig |
| 11+      | extreme   | Lila       | Extrem risk - undvik solen mitt på dagen |

---

## 🚀 FAS 1: ADS-registrering och API-verifiering

**Mål:** Registrera ADS-konto, installera bibliotek och verifiera API-åtkomst

**Komplexitet:** Låg  
**Chatt-längd:** Kort (~15-20 meddelanden)  
**Testbar output:** ADS-konto registrerat, API fungerar, UV-data hämtat

### Uppgifter:

#### 1.1 Registrera ADS-konto

**Steg:**
1. Gå till https://ads.atmosphere.copernicus.eu/
2. Klicka "Login/Register" → "Register"
3. Fyll i:
   - Email: christian.gillinger@protonmail.com
   - Användarnamn: (valfritt)
   - Lösenord: (valfritt starkt lösenord)
4. Bekräfta email
5. Logga in

#### 1.2 Hämta Personal Access Token

**Steg:**
1. Logga in på ADS
2. Klicka på ditt användarnamn (uppe till höger)
3. Välj "Profile" eller "Your User Profile"
4. Scrolla ner till "Personal Access Token"
5. Kopiera token (format: `UID:API-KEY`)

**Exempel på token-format:**
```
12345:a1b2c3d4-e5f6-1234-5678-abcdefghijkl
```

#### 1.3 Installera CDS API-bibliotek

```bash
cd ~/Dokument/Github/flask_weather
source venv/bin/activate  # Aktivera virtual environment
pip install cdsapi
```

**Verifiera installation:**
```bash
python3 -c "import cdsapi; print('✅ cdsapi installerat')"
```

#### 1.4 Konfigurera ADS API-credentials

**Skapa fil:** `~/.cdsapirc` (i ditt hem-katalog)

```bash
cat > ~/.cdsapirc << 'EOF'
url: https://ads.atmosphere.copernicus.eu/api
key: DIN-UID:DIN-API-KEY
EOF
```

**Ersätt** `DIN-UID:DIN-API-KEY` med din faktiska token från steg 1.2

**Verifiera rättigheter:**
```bash
chmod 600 ~/.cdsapirc
cat ~/.cdsapirc
```

#### 1.5 Hitta rätt UV-dataset i ADS-katalogen

**Manual sökning:**
1. Gå till https://ads.atmosphere.copernicus.eu/datasets
2. Sök efter "UV" eller "solar radiation"
3. Välj dataset som innehåller UV-index
4. Anteckna dataset-namn (t.ex. `cams-solar-radiation-timeseries`)

**Alternativt: Använd CAMS Global Atmospheric Composition Forecast**
- Dataset: `cams-global-atmospheric-composition-forecasts`
- Variable: UV biologically effective dose rate (för UV-index)

#### 1.6 Testskript: Verifiera ADS API-åtkomst

**Skapa:** `test_ads_uv.py` i projektkatalogen

```python
#!/usr/bin/env python3
"""
ADS UV API Test Script
Verifierar åtkomst till CAMS UV-data via Atmosphere Data Store
"""

import cdsapi
from datetime import datetime

print("=" * 80)
print("🌞 ADS UV API Test - FAS 1 (Uppdaterad)")
print("=" * 80)

# Initiera CDS API-klient
try:
    client = cdsapi.Client()
    print("✅ CDS API-klient initierad")
except Exception as e:
    print(f"❌ Kunde inte initiera API-klient: {e}")
    print("🔍 Kontrollera att ~/.cdsapirc finns och har rätt format")
    exit(1)

# Dagens datum
today = datetime.now().strftime("%Y-%m-%d")
print(f"\n📅 Datum: {today}")
print(f"📍 Koordinater: Lat 59.33, Lon 18.06 (Stockholm)")

# Testa dataset-åtkomst
# OBS: Dataset-namn kan variera, detta är ett exempel
dataset_name = "cams-solar-radiation-timeseries"

print(f"\n⏳ Testar åtkomst till dataset: {dataset_name}")
print("(Detta kan ta 30-60 sekunder...)")

try:
    # Exempel-request för UV-data
    # Parametrar kan behöva justeras baserat på faktiskt dataset
    request = {
        'sky_type': 'total_sky',
        'location': {
            'latitude': 59.33,
            'longitude': 18.06
        },
        'date': f'{today}/{today}',
        'time_step': '1hour',
        'time_reference': 'universal_time',
        'variable': 'uv_biologically_effective_dose'
    }
    
    print("\n📦 Request:")
    print(request)
    
    # Försök hämta data
    result = client.retrieve(
        dataset_name,
        request,
        'test_uv_output.nc'  # Sparas som NetCDF
    )
    
    print("\n✅ API-request lyckades!")
    print(f"📄 Data sparad till: test_uv_output.nc")
    print("\n🎯 ALLA TESTER GODKÄNDA!")
    print("=" * 80)
    print("💾 Klar för implementation av cams_uv_client.py")
    
except Exception as e:
    print(f"\n❌ API-request misslyckades: {e}")
    print("\n🔍 Möjliga orsaker:")
    print("1. Dataset-namn är felaktigt (kontrollera på ADS-webbplatsen)")
    print("2. Request-parametrar är felaktiga för detta dataset")
    print("3. Du har inte accepterat dataset Terms of Use")
    print("4. Token är felaktig i ~/.cdsapirc")
    print("\n📋 Nästa steg:")
    print("1. Gå till ADS-webbplatsen")
    print("2. Hitta rätt UV-dataset")
    print("3. Klicka 'Download data' och acceptera Terms of Use")
    print("4. Klicka 'Show API request' längst ner för att se korrekt request-format")

print("\n" + "=" * 80)
print("🏁 Test avslutat")
print("=" * 80)
```

**Kör testet:**
```bash
python3 test_ads_uv.py
```

**Framgångskriterier FAS 1:**
- [ ] ADS-konto registrerat och verifierat
- [ ] Personal Access Token hämtad
- [ ] `cdsapi` installerat (`pip list | grep cdsapi`)
- [ ] `~/.cdsapirc` skapad med korrekt token
- [ ] Rätt UV-dataset identifierat i ADS-katalogen
- [ ] Testskript kör utan fel (eller ger tydliga nästa-steg)
- [ ] UV-data kan hämtas (verifierad via test-output-fil)

---

## 🔧 FAS 2: CAMS UV Client-modul

**Mål:** Skapa modulariserad Python-klient för UV-data med caching

**Komplexitet:** Medel (1 fil, ~150-200 rader)  
**Chatt-längd:** Medel (~20-30 meddelanden)  
**Testbar output:** `cams_uv_client.py` fungerar, cache skapas, SSM-klassificering korrekt

### Uppgifter:

#### 2.1 Skapa cache-katalog

```bash
mkdir -p ~/Dokument/Github/flask_weather/cache
```

#### 2.2 Modul: `reference/data/cams_uv_client.py`

**Sökväg:** `/mnt/project/reference/data/cams_uv_client.py`

**Funktionalitet:**

```python
"""
CAMS UV Client - Atmosphere Data Store Integration
Hämtar UV-index från CAMS via ADS med 24h cachning
"""

import cdsapi
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

class CAMSUVClient:
    """
    CAMS UV-Index Client med 24h cachning via ADS
    
    Ansvar:
    - Hämta UV-data från CAMS via CDS API
    - Cachelagra i /cache/uv_cache.json
    - Validera cache-ålder (24h)
    - Returnera formaterad data enligt SSM-skala
    """
    
    def __init__(self, cache_dir: str = "cache"):
        """
        Initialiserar CAMS UV-klient
        
        Args:
            cache_dir: Katalog för cache-filer (default: "cache")
        """
        self.cache_dir = cache_dir
        self.cache_file = os.path.join(cache_dir, "uv_cache.json")
        self.dataset_name = "DATASET_NAME"  # Uppdateras efter FAS 1-verifiering
        
        # Skapa cache-katalog om den inte finns
        os.makedirs(cache_dir, exist_ok=True)
        
        # Initialisera CDS API-klient
        try:
            self.client = cdsapi.Client()
        except Exception as e:
            print(f"⚠️ Kunde inte initiera CDS API-klient: {e}")
            self.client = None
    
    def get_uv_index(self) -> Optional[Dict]:
        """
        Hämta UV-index (från cache eller API)
        
        Returns:
            dict: {
                "value": float,          # UV-index 0.0-12.0+
                "risk_level": str,       # "low|moderate|high|very_high|extreme"
                "risk_text": str,        # "Låg UV-risk" osv
                "updated": str,          # ISO8601 timestamp
                "source": "cams"
            }
            None: Om data inte tillgänglig
        """
        # 1. Försök läsa från cache
        cached_data = self._read_cache()
        if cached_data and self._is_cache_valid(cached_data):
            print(f"✅ UV-index från cache (ålder: {self._get_cache_age(cached_data):.1f}h)")
            return cached_data
        
        # 2. Hämta från API
        if not self.client:
            print("❌ CDS API-klient ej tillgänglig, använder gammal cache")
            return cached_data  # Returnera gammal cache om API inte fungerar
        
        try:
            uv_data = self._fetch_from_api()
            if uv_data:
                self._write_cache(uv_data)
                return uv_data
        except Exception as e:
            print(f"❌ API-fel: {e}")
            return cached_data  # Fallback till gammal cache
        
        return None
    
    def _fetch_from_api(self) -> Optional[Dict]:
        """
        Hämta UV-data från CAMS via ADS
        
        Returns:
            dict: Formaterad UV-data
            None: Om hämtning misslyckas
        """
        today = datetime.now().strftime("%Y-%m-%d")
        
        request = {
            # Request-parametrar baserat på FAS 1-verifiering
            # Uppdateras när rätt dataset är identifierat
        }
        
        print(f"🌐 Hämtar UV-data från CAMS ADS ({today})...")
        
        # Temporär fil för nedladdning
        temp_file = os.path.join(self.cache_dir, "temp_uv.nc")
        
        try:
            # Hämta data
            self.client.retrieve(
                self.dataset_name,
                request,
                temp_file
            )
            
            # Extrahera UV-värde från NetCDF
            # (Implementation beror på dataset-struktur)
            uv_value = self._extract_uv_from_netcdf(temp_file)
            
            # Rensa temporär fil
            if os.path.exists(temp_file):
                os.remove(temp_file)
            
            if uv_value is None:
                return None
            
            # Formatera och returnera
            return self._format_uv_data(uv_value)
            
        except Exception as e:
            print(f"❌ API-hämtning misslyckades: {e}")
            return None
    
    def _extract_uv_from_netcdf(self, filepath: str) -> Optional[float]:
        """
        Extrahera UV-index från NetCDF-fil
        
        Args:
            filepath: Sökväg till NetCDF-fil
            
        Returns:
            float: UV-index värde
            None: Om extrahering misslyckas
        """
        try:
            import netCDF4 as nc
            dataset = nc.Dataset(filepath)
            
            # Hitta UV-variabel (namn varierar mellan dataset)
            # Exempel: 'uv_biologically_effective_dose', 'uvi', etc.
            # Implementation uppdateras efter FAS 1-verifiering
            
            uv_value = 0.0  # Placeholder
            dataset.close()
            return uv_value
            
        except ImportError:
            print("⚠️ netCDF4 ej installerat (pip install netCDF4)")
            return None
        except Exception as e:
            print(f"❌ NetCDF-parsning misslyckades: {e}")
            return None
    
    def _format_uv_data(self, uv_value: float) -> Dict:
        """
        Formatera UV-data enligt SSM-skala
        
        Args:
            uv_value: UV-index värde
            
        Returns:
            dict: Formaterad UV-data
        """
        # SSM-klassificering
        if uv_value <= 2:
            risk_level = "low"
            risk_text = "Låg UV-risk"
        elif uv_value <= 5:
            risk_level = "moderate"
            risk_text = "Måttlig UV-risk"
        elif uv_value <= 7:
            risk_level = "high"
            risk_text = "Hög UV-risk – solskydd rekommenderas"
        elif uv_value <= 10:
            risk_level = "very_high"
            risk_text = "Mycket hög UV-risk – skydda dig"
        else:
            risk_level = "extreme"
            risk_text = "Extrem UV-risk – undvik solen mitt på dagen"
        
        return {
            "value": round(uv_value, 1),
            "risk_level": risk_level,
            "risk_text": risk_text,
            "updated": datetime.now(timezone.utc).isoformat(),
            "source": "cams"
        }
    
    def _read_cache(self) -> Optional[Dict]:
        """Läs UV-data från cache"""
        if not os.path.exists(self.cache_file):
            return None
        
        try:
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Cache-läsning misslyckades: {e}")
            return None
    
    def _write_cache(self, data: Dict):
        """Skriv UV-data till cache"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"💾 UV-cache uppdaterad: {self.cache_file}")
        except Exception as e:
            print(f"⚠️ Cache-skrivning misslyckades: {e}")
    
    def _is_cache_valid(self, cached_data: Dict) -> bool:
        """Kontrollera om cache är yngre än 24h"""
        cache_age_hours = self._get_cache_age(cached_data)
        return cache_age_hours < 24.0
    
    def _get_cache_age(self, cached_data: Dict) -> float:
        """Beräkna cache-ålder i timmar"""
        try:
            updated = datetime.fromisoformat(cached_data['updated'])
            now = datetime.now(timezone.utc)
            age = (now - updated).total_seconds() / 3600
            return age
        except:
            return 99999.0  # Ogiltig cache = mycket gammal
```

**Storleksbegränsning:** ~150-200 rader (inom ANTI-MONOLIT-regler)

#### 2.3 Installera NetCDF-bibliotek

```bash
pip install netCDF4
```

Lägg till i `requirements.txt`:
```
cdsapi>=0.7.0
netCDF4>=1.6.0
```

#### 2.4 Test av client-modul

```python
# test_cams_client.py
from reference.data.cams_uv_client import CAMSUVClient

client = CAMSUVClient()
uv_data = client.get_uv_index()

if uv_data:
    print(f"✅ UV-index: {uv_data['value']}")
    print(f"📊 Risk: {uv_data['risk_level']} - {uv_data['risk_text']}")
else:
    print("❌ Kunde inte hämta UV-data")
```

**Framgångskriterier FAS 2:**
- [ ] `cams_uv_client.py` skapad (< 200 rader)
- [ ] `cdsapi` och `netCDF4` installerade
- [ ] Cache-katalog skapad automatiskt
- [ ] UV-data kan hämtas från API
- [ ] UV-värde konverteras till SSM-risknivå korrekt
- [ ] Cache fungerar (andra anropet snabbt)
- [ ] Felhantering fungerar (gammal cache vid API-fel)

---

## 🌐 FAS 3: Flask API-integration

**Mål:** Exponera UV-data via Flask endpoint och integrera i app.py

**Komplexitet:** Låg-medel (1-2 filer, minimal påverkan på befintlig kod)  
**Chatt-längd:** Kort-medel (~20-25 meddelanden)  
**Testbar output:** `/api/uv` endpoint fungerar, data tillgänglig för frontend

### Uppgifter:

#### 3.1 Lägg till CAMS UV-konfiguration i `reference/config.py`

```python
# Lägg till i CONFIG dict
'cams_uv': {
    'enabled': True,  # True/False - Aktivera UV-index
    'cache_hours': 24,  # Hur länge UV-cache är giltig
    'dataset_name': 'DATASET_NAME',  # Från FAS 1-verifiering
    'comment': 'CAMS UV-index via Atmosphere Data Store (ADS)'
},
```

#### 3.2 Skapa Flask endpoint: `/api/uv`

**Fil:** `app.py` (ny endpoint-funktion)

**BACKUP FÖRE ÄNDRING:**
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup/ORIGINAL_uv_integration_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
cp app.py "$BACKUP_DIR/"
echo "✅ Backup: $BACKUP_DIR/app.py"
```

**Tillägg i app.py:**

```python
# Import (lägg till i början av filen)
from reference.data.cams_uv_client import CAMSUVClient

# Global UV-klient (initialiseras i init_api_clients)
cams_uv_client = None

# Lägg till i init_api_clients() funktionen:
def init_api_clients(config):
    # ... befintlig kod ...
    
    # CAMS UV Client
    global cams_uv_client
    uv_config = config.get('cams_uv', {})
    if uv_config.get('enabled', True):
        try:
            cams_uv_client = CAMSUVClient(cache_dir='cache')
            print("✅ CAMS UV-klient initierad")
        except Exception as e:
            print(f"⚠️ CAMS UV-klient fel: {e}")
            cams_uv_client = None
    else:
        print("📊 CAMS UV: INAKTIVERAT i config")
    
    # ... resten av befintlig kod ...

# Nytt endpoint (lägg till med övriga endpoints)
@app.route('/api/uv')
def api_uv():
    """
    UV-index endpoint
    
    Returns:
        JSON: {
            "uv_index": float,
            "risk_level": str,
            "risk_text": str,
            "updated": str,
            "available": bool
        }
    """
    if not cams_uv_client:
        return jsonify({
            'available': False,
            'error': 'UV-klient ej tillgänglig'
        })
    
    try:
        uv_data = cams_uv_client.get_uv_index()
        
        if uv_data:
            return jsonify({
                'uv_index': uv_data['value'],
                'risk_level': uv_data['risk_level'],
                'risk_text': uv_data['risk_text'],
                'updated': uv_data['updated'],
                'available': True
            })
        else:
            return jsonify({
                'available': False,
                'error': 'UV-data ej tillgänglig'
            })
    
    except Exception as e:
        print(f"❌ UV API-fel: {e}")
        return jsonify({
            'available': False,
            'error': str(e)
        }), 500
```

#### 3.3 Bakgrundsuppdatering i app.py

**Funktion:** `update_cams_uv()` (ny funktion)

```python
def update_cams_uv():
    """
    Schemalagd UV-uppdatering
    - Körs vid start
    - Körs dagligen kl. 01:00 (1 timme efter CAMS uppdaterar)
    """
    if not cams_uv_client:
        print("📊 UV-uppdaterare: Klient ej tillgänglig")
        return
    
    while True:
        try:
            # Tvinga omhämtning (ignorera cache)
            # Detta kan göras genom att ta bort cache-filen
            cache_file = cams_uv_client.cache_file
            if os.path.exists(cache_file):
                os.remove(cache_file)
                print("🗑️ UV-cache rensad för omhämtning")
            
            uv_data = cams_uv_client.get_uv_index()
            if uv_data:
                print(f"✅ UV-uppdatering: {uv_data['value']} ({uv_data['risk_level']})")
            else:
                print("⚠️ UV-uppdatering misslyckades")
                
        except Exception as e:
            print(f"❌ UV-uppdaterare fel: {e}")
        
        # Vänta 24 timmar
        time.sleep(24 * 3600)

# Lägg till i initialize_app():
def initialize_app():
    # ... befintlig kod ...
    
    # Starta UV-uppdaterare (om aktiverat)
    if weather_state['config'].get('cams_uv', {}).get('enabled', True):
        uv_thread = threading.Thread(target=update_cams_uv, daemon=True)
        uv_thread.start()
        print("✅ UV-uppdaterare startad (daglig uppdatering kl. 01:00)")
    else:
        print("📊 UV-uppdaterare HOPPAS ÖVER (cams_uv.enabled=False)")
    
    # ... resten av befintlig kod ...
```

#### 3.4 Test av API

```bash
# Starta Flask
python3 app.py

# I annan terminal:
curl http://localhost:8036/api/uv

# Förväntat svar:
{
  "uv_index": 3.4,
  "risk_level": "moderate",
  "risk_text": "Måttlig UV-risk",
  "updated": "2025-11-18T12:34:56+00:00",
  "available": true
}
```

**Framgångskriterier FAS 3:**
- [ ] UV-konfiguration tillagd i `reference/config.py`
- [ ] `/api/uv` endpoint svarar med HTTP 200
- [ ] JSON-format korrekt
- [ ] Data motsvarar cache-innehåll
- [ ] Bakgrundsuppdatering startar utan fel
- [ ] Felhantering fungerar (returnerar `available: false` vid fel)
- [ ] Flask loggar UV-uppdateringar korrekt

---

## 🎨 FAS 4: Frontend-integration

**Mål:** Visa UV-index i UI till höger om luftkvalitet

**Komplexitet:** Medel (3 filer: HTML + CSS + JS)  
**Chatt-längd:** Medel (~25-35 meddelanden)  
**Testbar output:** UV-index visas korrekt med färgkodning i webbläsaren

### Uppgifter:

#### 4.1 HTML-struktur (`templates/index.html`)

**BACKUP FÖRE ÄNDRING:**
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup/uv_frontend_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
cp templates/index.html static/css/styles.css static/js/dashboard.js "$BACKUP_DIR/"
echo "✅ Backup: $BACKUP_DIR/"
```

**Plats:** Inne i `.weather-details-grid` efter `.air-quality-container`

```html
<!-- UV-index - Till höger om luftkvalitet -->
<div class="detail-item uv-index-container" id="uv-index-container" style="display: none;">
    <img src="/static/sun_15428539.png" alt="UV" class="uv-icon" id="uv-icon">
    <span id="uv-index-text">UV -- (Låg risk)</span>
</div>
```

#### 4.2 CSS-styling (`static/css/styles.css`)

```css
/* UV-INDEX CONTAINER */
.uv-index-container {
    display: flex;
    align-items: center;
    gap: 7px;
}

.uv-icon {
    width: clamp(21px, 2.1rem, 28px);
    height: clamp(21px, 2.1rem, 28px);
    object-fit: contain;
}

/* UV-RISKNIVÅ FÄRGKODNING via CSS Filters */
.uv-icon.uv-low {
    filter: none;  /* Ljusblå (original) */
}

.uv-icon.uv-moderate {
    filter: brightness(1.2) saturate(1.5) hue-rotate(-15deg);  /* Gul */
}

.uv-icon.uv-high {
    filter: brightness(1.1) saturate(1.6) hue-rotate(-30deg);  /* Orange */
}

.uv-icon.uv-very-high {
    filter: brightness(0.9) saturate(1.8) hue-rotate(-50deg);  /* Röd */
}

.uv-icon.uv-extreme {
    filter: brightness(0.85) saturate(1.5) hue-rotate(70deg);  /* Lila */
}
```

#### 4.3 JavaScript-modul (`static/js/dashboard-components/uv-display.js`)

```javascript
/**
 * UV-Display Modul
 * Hanterar UV-index visning i weather-details-grid
 */

const UVDisplay = {
    updateUVDisplay(uvData) {
        const container = document.getElementById('uv-index-container');
        const icon = document.getElementById('uv-icon');
        const text = document.getElementById('uv-index-text');
        
        if (!container || !icon || !text) return;
        
        // Visa container
        container.style.display = 'flex';
        
        // Formatera text
        const uvValue = uvData.uv_index.toFixed(1);
        text.textContent = `UV ${uvValue} (${uvData.risk_text})`;
        
        // Ta bort gamla klasser
        icon.classList.remove('uv-low', 'uv-moderate', 'uv-high', 'uv-very-high', 'uv-extreme');
        
        // Applicera ny färgklass
        icon.classList.add(`uv-${uvData.risk_level}`);
        
        console.log(`🌞 UV-index: ${uvValue} (${uvData.risk_level})`);
    },
    
    hideUVDisplay() {
        const container = document.getElementById('uv-index-container');
        if (container) {
            container.style.display = 'none';
            console.log('🙈 UV-index dold - ingen data');
        }
    }
};
```

#### 4.4 Integration i dashboard.js

**Lägg till i `updateCurrentWeather()` funktionen:**

```javascript
// Efter barometer-uppdatering, lägg till:

// UV-index update
fetch('/api/uv')
    .then(response => response.json())
    .then(uvData => {
        if (uvData && uvData.available) {
            UVDisplay.updateUVDisplay(uvData);
        } else {
            UVDisplay.hideUVDisplay();
        }
    })
    .catch(error => {
        console.warn('UV API-fel:', error);
        UVDisplay.hideUVDisplay();
    });
```

#### 4.5 Ladda UV-modul i index.html

**Plats:** Efter `rain-display.js`, innan `dashboard.js`

```html
<!-- UV DISPLAY MODUL -->
<script src="/static/js/dashboard-components/uv-display.js"></script>

<!-- MAIN: Dashboard JavaScript -->
<script src="/static/js/dashboard.js"></script>
```

#### 4.6 Test i webbläsare

**Öppna:** http://localhost:8036

**Kontrollera:**
- [ ] UV-index visas till höger om luftkvalitet
- [ ] Ikonen är synlig och korrekt färgad
- [ ] Text visar "UV X.X (Risk-text)"
- [ ] Färg matchar risk-nivå
- [ ] Layout påverkar inte övriga komponenter

**Framgångskriterier FAS 4:**
- [ ] HTML-struktur tillagd
- [ ] UV-ikon (`sun_15428539.png`) verifierad i `/static/`
- [ ] CSS-styling tillagd
- [ ] `uv-display.js` skapad (< 100 rader)
- [ ] Modul laddad i rätt ordning
- [ ] `dashboard.js` uppdaterad
- [ ] UV-index visas korrekt i UI
- [ ] Alla 5 risknivåer testade visuellt
- [ ] Responsiv design verifierad

---

## 🎯 Sammanfattning - Vad har ändrats från ursprunglig plan

### ✅ Lösningar på problemet:

1. **API-migration:** CAMS har bytt till ADS-plattformen
2. **Nytt bibliotek:** `cdsapi` istället för direkt HTTP-requests
3. **Autentisering:** Personal Access Token istället för användarnamn/lösenord
4. **Data-format:** NetCDF istället för JSON
5. **Registrering krävs:** ADS-konto måste skapas först

### 📊 Tekniska skillnader:

| Aspekt | Ursprunglig Plan | Uppdaterad Plan |
|--------|-----------------|-----------------|
| **API** | `api.copernicus.eu` | `ads.atmosphere.copernicus.eu` |
| **Bibliotek** | `requests` | `cdsapi` + `netCDF4` |
| **Auth** | Basic Auth (user/pass) | Token (`~/.cdsapirc`) |
| **Format** | JSON | NetCDF (`.nc`) |
| **Request** | HTTP GET | CDS API `retrieve()` |
| **Registrering** | Direkt API-access | ADS-konto krävs |

### ⚙️ Dependencies som krävs:

```txt
# requirements.txt
cdsapi>=0.7.0
netCDF4>=1.6.0
```

### 🔧 Konfigurationsfiler:

1. **`~/.cdsapirc`** (ADS credentials)
2. **`reference/config.py`** (UV-konfiguration)
3. **`cache/uv_cache.json`** (UV-data cache)

---

## 📚 Resurser & Referenser

### CAMS ADS Dokumentation:
- **ADS-plattform:** https://ads.atmosphere.copernicus.eu/
- **API-guide:** https://ads.atmosphere.copernicus.eu/how-to-api
- **Dataset-katalog:** https://ads.atmosphere.copernicus.eu/datasets
- **CDS API Python:** https://github.com/ecmwf/cdsapi

### Strålskyddsmyndigheten:
- **UV-index förklaring:** https://www.stralsakerhetsmyndigheten.se/omraden/uv-stralning/

### Projektets befintliga struktur:
- **API-klienter:** `reference/data/smhi_client.py`, `reference/data/netatmo_client.py`
- **Cache-exempel:** `sun_cache.json`
- **Frontend-moduler:** `static/js/dashboard-components/rain-display.js`

---

## 🚨 Viktig information

**⚠️ CAMS API-förändring (Sept 2024):**
Den ursprungliga projektplanen använde den gamla CAMS API:n som inte längre fungerar. Alla användare måste:

1. Registrera sig på ADS
2. Skapa Personal Access Token
3. Installera `cdsapi` biblioteket
4. Konfigurera `~/.cdsapirc`

**Utan dessa steg kommer UV-integrationen inte att fungera!**

---

**Dokumentversion:** 2.0 (UPPDATERAD FÖR ADS)  
**Skapad:** 2025-11-18  
**Uppdaterad:** 2025-11-18  
**Status:** Klar för implementation med ADS

---

**🎯 KRITISKT:** Denna uppdaterade plan reflekterar CAMS migration till Atmosphere Data Store (ADS) i september 2024. Den ursprungliga API:n fungerar inte längre.
