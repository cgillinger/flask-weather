# config.py - Weather Dashboard Configuration med WeatherEffects Support
# =============================================================================
# Riktiga Python-kommentarer för tydlig konfiguration!
# FAS 1: Netatmo-oberoende funktionalitet tillagd
# ✨ NYT FAS 2: WeatherEffects-konfiguration tillagd för MagicMirror-kompatibilitet
# ☀️ NYT FAS 3: UV-index konfiguration tillagd för CAMS-integration
# =============================================================================

CONFIG = {
    # === NETATMO CONFIGURATION & TOGGLE ===
    'use_netatmo': True,  # HUVUDVÄXEL: True = Med Netatmo, False = Bara SMHI (NYT!)
    
    'netatmo': {
        'client_id': '6848077b1c8bb27c8809e259',
        'client_secret': 'WZ1vJos04mu7SlL1QmsMv3cZ1OURHF',
        'refresh_token': '5c3dd9b22733bf0c008b8f1c|a7be84ead1b2e9ce13a4781fdab434f3',
        'preferred_station': 'Utomhus',  # Vilken station som prioriteras för visning (smart blending använder alla)
        'comment': 'Konfiguration för Netatmo-väderstation. Ignoreras om use_netatmo=False.'
    },
    
    # === LOCATION CONFIGURATION ===
    'smhi': {
        # AKTIV: Stockholm (original)
        'latitude': 59.3293,    
        'longitude': 18.0686,   
        
        # ALTERNATIV: Täby - Ella Gård 
        # 'latitude': 59.4644,
        # 'longitude': 18.0698,
        
        'comment': 'SMHI-koordinater. Täby (59.4644, 18.0698) kan ge mer representativ data för Netatmo-jämförelser.',
        'other_cities': 'Göteborg 57.7089,11.9746 | Malmö 55.6050,13.0038 | Uppsala 59.8586,17.6389'
    },
    
    'ipgeolocation': {
        'api_key': '8fd423c5ca0c49f198f9598baeb5a059',  # API-nyckel för exakta soltider från ipgeolocation.io
        'comment': 'Hämta gratis API-nyckel från https://ipgeolocation.io/ för exakta soltider. Om tom används förenklad beräkning.'
    },
    
    'display': {
        'location_name': 'Stockholm',  # Ortnamn som visas på skärmen
        'comment': 'Namn på ort som visas på skärmen - hjälper användaren förstå var data kommer från'
    },
    
    'ui': {
        'fullscreen': True,             # True/False - Fullskärmsläge för kiosk
        'refresh_interval_minutes': 15,         # 5-60 minuter - SMHI data-uppdatering (rekommenderat: 15)
        'netatmo_refresh_interval_minutes': 10, # 5-30 minuter - Netatmo snabb-uppdatering (ignoreras om use_netatmo=False)
        
        # VINDENHETER - AKTIV: 'land' (svensk landterminologi)
        'wind_unit': 'land',    # ALTERNATIV: 'sjo', 'land', 'beaufort', 'ms', 'kmh' (se guide nedan)
        
        # TEMA - AKTIV: 'dark' (enda produktionsklara temat)  
        'theme': 'dark',        # ALTERNATIV: 'light' (EJ produktionsklar!), 'dark', 'auto'
        
        # Automatiskt tema-byte (används när theme='auto')
        'auto_theme': {
            'day_theme': 'light',     # Tema för dagtid
            'night_theme': 'dark',    # Tema för natttid  
            'night_start': '21:00',   # När natttema börjar (HH:MM)
            'night_end': '06:00'      # När natttema slutar (HH:MM)
        },
        
        # Fönsterinställningar (används ej i kiosk-läge)
        'window_width': 1000,    # 800-1920 pixlar
        'window_height': 700,    # 600-1080 pixlar
        
        # Sol-funktioner
        'show_sun_times': True,  # True/False - Visa soluppgång/solnedgång
        'sun_cache_hours': 24    # 1-168 timmar - Hur länge soltider cachas
    },
    
    # =============================================================================
    # ✨ FAS 2: WEATHEREFFECTS KONFIGURATION - MagicMirror-kompatibel
    # =============================================================================
    
    'weather_effects': {
        # 🌦️ HUVUDINSTÄLLNING: Aktivera/inaktivera vädereffekter
        'enabled': True,  # True = Aktivera regn/snö-animationer, False = Inaktivera helt
        
        # 🎚️ INTENSITET: Automatisk eller manuell intensitetskontroll
        'intensity': 'auto',  # 'auto' = Baserat på SMHI precipitation, 'light', 'medium', 'heavy'
        
        # ☔ REGN-KONFIGURATION (MagicMirror-standard inställningar)
        'rain_config': {
            'droplet_count': 50,        # 10-100: Antal regndroppar (MM standard: 50)
            'droplet_speed': 2.0,       # 0.5-5.0: Hastighet i sekunder (MM standard: 2.0)  
            'wind_direction': 'none',   # 'none', 'left-to-right', 'right-to-left'
            'enable_splashes': False,   # True/False: Splash-effekter vid markträff (MM standard: False)
            'comment': 'Regn-animationer baserade på SMHI symbols 8-10, 18-20 (regnskurar/regn) + 11,21 (åska)'
        },
        
        # ❄️ SNÖ-KONFIGURATION (MagicMirror-standard inställningar)
        'snow_config': {
            'flake_count': 25,          # 10-50: Antal snöflingor (MM standard: 25)
            'characters': ['*', '+'],   # Lista med tecken för snöflingor (MM standard: ['*', '+'])
            'sparkle_enabled': False,   # True/False: Glittrande snöflingor (MM standard: False)
            'min_size': 0.8,           # 0.5-2.0: Minsta storlek i em (MM standard: 0.8)
            'max_size': 1.5,           # 1.0-3.0: Största storlek i em (MM standard: 1.5)
            'speed': 1.0,              # 0.5-2.0: Hastighets-multiplier (MM standard: 1.0)
            'comment': 'Snö-animationer baserade på SMHI symbols 15-17, 25-27 (snöbyar/snöfall) + 12-14, 22-24 (snöblandat)'
        },
        
        # ⚙️ AVANCERADE INSTÄLLNINGAR
        'transition_duration': 1000,   # 500-3000: Transition-tid i ms (MM standard: 1000)
        'debug_logging': False,        # True/False: Detaljerad console-loggning för felsökning
        'fallback_enabled': True,      # True/False: Graceful fallbacks vid API-fel
        
        # 🎯 LP156WH4 OPTIMERINGAR (1366×768 LED LCD Panel)
        'lp156wh4_optimizations': {
            'enabled': True,           # True/False: Aktivera LP156WH4-specifika optimeringar
            'contrast_boost': 1.1,     # 1.0-1.3: Kontrast-förstärkning för LED LCD (standard: 1.1)
            'brightness_boost': 1.1,   # 1.0-1.3: Ljusstyrke-förstärkning (standard: 1.1)
            'gpu_acceleration': True,  # True/False: GPU-acceleration för Pi5 (standard: True)
            'target_fps': 60,         # 30/60: Målframerate för animationer (standard: 60)
            'comment': 'Optimeringar för LP156WH4 panel och Pi5 GPU-prestanda'
        },
        
        # 📊 SMHI SYMBOL MAPPING (Läs-endast referens)
        'smhi_mapping_reference': {
            'rain': [8, 9, 10, 18, 19, 20],      # Regnskurar och regn
            'snow': [15, 16, 17, 25, 26, 27],    # Snöbyar och snöfall
            'sleet': [12, 13, 14, 22, 23, 24],   # Snöblandat regn (behandlas som snö)
            'thunder': [11, 21],                 # Åska (behandlas som intensivt regn)
            'clear': [1, 2, 3, 4, 5, 6, 7],     # Klart väder (ingen effekt)
            'comment': 'SMHI weather symbols → WeatherEffects mapping (används automatiskt av systemet)'
        },
        
        'comment': 'WeatherEffects ger MagicMirror-kompatibla regn/snö-animationer baserade på SMHI-data'
    },
    
    # =============================================================================
    # ☀️ FAS 3: UV-INDEX KONFIGURATION - CAMS Integration
    # =============================================================================
    
    'cams_uv': {
        # 🌞 HUVUDINSTÄLLNING: Aktivera/inaktivera UV-index
        'enabled': True,  # True = Hämta UV-data från CAMS, False = Inaktivera UV-funktionalitet
        
        # 📍 KOORDINATER: Används från SMHI-config automatiskt (59.3293, 18.0686)
        # Ingen separat koordinat-konfiguration behövs
        
        # 💾 CACHE: UV-data cachas i 24 timmar
        'cache_dir': 'cache',  # Katalog för uv_cache.json
        'cache_duration_hours': 24,  # Hur länge UV-data cachas (rekommenderat: 24h)
        
        # ⏰ UPPDATERING: Daglig uppdatering kl. 01:00
        'update_time': '01:00',  # HH:MM - När UV-data uppdateras dagligen
        
        # 🎨 VISNING: SSM (Strålskyddsmyndigheten) risknivåer
        # Låg (0-2), Måttlig (3-5), Hög (6-7), Mycket hög (8-10), Extrem (11+)
        
        'comment': 'UV-index från CAMS (Copernicus Atmosphere Monitoring Service) via ADS API. Kräver ~/.cdsapirc konfiguration.'
    }
}

# =============================================================================
# 🎯 WEATHEREFFECTS SNABBGUIDE
# =============================================================================

# 🚀 SNABB AKTIVERING:
#    1. Sätt weather_effects.enabled = True (redan aktiverat ovan)
#    2. Starta om Flask-servern: python3 app.py
#    3. WeatherEffects aktiveras automatiskt vid regn/snö från SMHI
#    ✅ KLART! Animationer visas nu baserat på väderdata

# 🎚️ INTENSITETSINSTÄLLNINGAR:
# - 'auto': Automatisk baserat på SMHI precipitation (REKOMMENDERAT)
# - 'light': Få partiklar, långsamma animationer (bra för låg prestanda)
# - 'medium': Standard antal partiklar och hastighet
# - 'heavy': Många partiklar, snabba animationer (kräver bra prestanda)

# ☔ REGN-ANPASSNINGAR:
# - droplet_count: 30 = lätt regn, 50 = medel, 80 = kraftigt regn
# - droplet_speed: 3.0 = snabbt regn, 2.0 = medel, 1.0 = långsamt regn
# - wind_direction: 'left-to-right' för vindpåverkat regn

# ❄️ SNÖ-ANPASSNINGAR:
# - flake_count: 15 = lätt snöfall, 25 = medel, 40 = kraftigt snöfall
# - characters: ['❄', '❅', '❆'] för Unicode-snöflingor (kräver font-stöd)
# - sparkle_enabled: True för glittrande snöflingor (mer GPU-intensivt)

# 🔧 PRESTANDA-OPTIMERING FÖR PI5:
# - Minska droplet_count/flake_count om animationer är hackiga
# - Sätt target_fps till 30 om 60fps är för krävande
# - Inaktivera gpu_acceleration om det ger problem

# 🛠 FELSÖKNING:
# - Sätt debug_logging = True för detaljerad console-output
# - Kontrollera browser developer tools för JavaScript-fel
# - Verifiera att /api/weather-effects-config returnerar korrekt JSON

# =============================================================================
# NETATMO-VÄXEL GUIDE - NYT I FAS 1
# =============================================================================

# use_netatmo = True  (AKTUELL INSTÄLLNING)
# ✅ Full funktionalitet med alla Netatmo-sensorer
# ✅ Faktisk temperatur från Netatmo
# ✅ CO2-mätning och luftkvalitet
# ✅ Ljudnivå-mätning
# ✅ Trycktrend baserad på Netatmo-historik
# ✅ Smart data-blending från flera stationer
# ✅ WeatherEffects baserade på SMHI weather symbols

# use_netatmo = False  (SMHI-ONLY MODE)
# ⚡ Enbart SMHI-baserad väderapp
# ❌ Ingen faktisk temperatur (bara prognos)
# ❌ Ingen CO2/luftkvalitet-data
# ❌ Ingen ljudnivå-data
# ✅ Luftfuktighet och tryck från SMHI
# ✅ Förenklad trycktrend från SMHI-prognoser
# ✅ Bibehållen design och funktionalitet
# ✅ WeatherEffects fortfarande baserade på SMHI

# BYTE MELLAN LÄGEN:
# 1. Ändra 'use_netatmo' till True/False
# 2. Starta om Flask-servern (python3 app.py)
# 3. Ladda om webbläsarsidan
# 4. Appen anpassar sig automatiskt

# =============================================================================
# VINDENHETER GUIDE - Fullständig lista över tillgängliga alternativ
# =============================================================================

# AKTIV: 'land' = Svensk landterminologi enligt Beaufort-skalan
# 0: Lugnt (<1 km/h)
# 1-2: Svag vind (1-11 km/h) 
# 3-4: Måttlig vind (12-28 km/h)
# 5-6: Frisk vind (29-49 km/h)
# 7-9: Hård vind (50-88 km/h)
# 10-11: Storm (89-117 km/h)
# 12: Orkan (118+ km/h)

# ALTERNATIV:
# 'sjo'     = Sjöterminologi: Stiltje, Bris, Kuling, Storm, Orkan
# 'beaufort'= Beaufort 0-12 med svenska namn (Lugnt, Svag vind, etc.)
# 'ms'      = X.X m/s (decimaler) - Teknisk mätning
# 'kmh'     = XX km/h (heltal) - Vardagligt format

# =============================================================================
# TEMA GUIDE
# =============================================================================

# AKTIV: 'dark' = Mörkt tema (enda fullt utvecklade temat)
# VARNING: 'light' = Ljust tema (EJ produktionsklart - mycket fult!)
# 'auto' = Växlar automatiskt enligt auto_theme-tider

# =============================================================================
# UPPDATERINGSINTERVALL GUIDE
# =============================================================================

# AKTUELLA: 15/10 minuter (balanserat för Pi3B)
# Snabb:    5/5 minuter (mer CPU-belastning)
# Standard: 15/10 minuter (rekommenderat)
# Sparsamhet: 30/20 minuter (låg CPU-belastning)

# =============================================================================
# KOORDINATER FÖR SVENSKA STÄDER
# =============================================================================

# Stockholm: 59.3293, 18.0686  (AKTIV)
# Täby/Ella Gård: 59.4644, 18.0698  (ALTERNATIV - närmare Netatmo-stationer)
# Göteborg:  57.7089, 11.9746
# Malmö:     55.6050, 13.0038
# Uppsala:   59.8586, 17.6389
# Linköping: 58.4108, 15.6214
# Örebro:    59.2741, 15.2066
# Västerås:  59.6162, 16.5528

# =============================================================================
# SNABBGUIDE FÖR ÄNDRINGAR
# =============================================================================

# För att köra UTAN Netatmo (SMHI-only):
# 1. Ändra 'use_netatmo' till False
# 2. Starta om Flask-servern (python3 app.py)
# 3. Ladda om webbläsarsidan
# 4. Appen visar bara SMHI-data automatiskt (WeatherEffects fortsätter fungera)

# För att byta vindenheter:
# 1. Ändra 'wind_unit' till önskat alternativ
# 2. Starta om Flask-servern (python3 app.py)
# 3. Ladda om webbläsarsidan

# För att byta ort:
# 1. Ändra 'latitude', 'longitude' och 'location_name'
# 2. Starta om Flask-servern
# 3. Vänta några minuter på första datahämtningen

# För att ändra uppdateringsintervall:
# 1. Ändra 'refresh_interval_minutes' och/eller 'netatmo_refresh_interval_minutes'
# 2. Starta om Flask-servern
# 3. Effekt syns på nästa uppdateringscykel

# För att inaktivera WeatherEffects:
# 1. Ändra 'weather_effects.enabled' till False
# 2. Starta om Flask-servern
# 3. Inga regn/snö-animationer visas (endast statisk väderdata)

# För att aktivera/inaktivera UV-index:
# 1. Ändra 'cams_uv.enabled' till True/False
# 2. Starta om Flask-servern
# 3. UV-index visas/döljs i weather-details-grid

# =============================================================================
# FELSÖKNING - VANLIGA PROBLEM OCH LÖSNINGAR
# =============================================================================

# ❌ PROBLEM: "WeatherEffects fungerar inte" (NYT FAS 2)
# ✅ LÖSNING: Kontrollera weather_effects.enabled = True och starta om Flask-servern

# ❌ PROBLEM: "Animationer är hackiga på Pi5" (NYT FAS 2)
# ✅ LÖSNING: Minska droplet_count/flake_count eller sätt target_fps till 30

# ❌ PROBLEM: "Inga effekter visas trots regn/snö" (NYT FAS 2)
# ✅ LÖSNING: Aktivera debug_logging och kontrollera console för SMHI symbol-mappning

# ❌ PROBLEM: "Netatmo autentiseringsfel" 
# ✅ LÖSNING: Kontrollera client_id, client_secret och refresh_token

# ❌ PROBLEM: "Inga soltider eller konstiga tider"
# ✅ LÖSNING: Kontrollera ipgeolocation api_key eller använd fallback-beräkning

# ❌ PROBLEM: "Vinddata visas fel"
# ✅ LÖSNING: Kontrollera wind_unit-inställning

# ❌ PROBLEM: "Dashboard visar fel läge"
# ✅ LÖSNING: Kontrollera use_netatmo inställningen (True/False)

# ❌ PROBLEM: "UV-index visas inte" (NYT FAS 3)
# ✅ LÖSNING: Kontrollera cams_uv.enabled = True och att ~/.cdsapirc är korrekt konfigurerad

# ❌ PROBLEM: "CAMS UV API-fel" (NYT FAS 3)
# ✅ LÖSNING: Verifiera ~/.cdsapirc innehåller giltig token (UID:API-KEY format)

# ❌ PROBLEM: "UV-cache inte uppdateras" (NYT FAS 3)
# ✅ LÖSNING: Radera cache/uv_cache.json och starta om Flask-servern
