# config.example.py - Weather Dashboard Configuration Template med WeatherEffects
# =============================================================================
# 🔒 SÄKERHET: Denna fil innehåller INGA riktiga tokens/nycklar
# 📁 SETUP: Kopiera till config.py och fyll i dina riktiga värden
# 🚫 VARNING: Lägg ALDRIG till config.py till Git - den innehåller hemligheter!
# ✨ NYT FAS 2: WeatherEffects-konfiguration tillagd för MagicMirror-kompatibilitet
# =============================================================================

CONFIG = {
    # ⚡ HUVUDINSTÄLLNING: Välj mellan SMHI-only eller SMHI+Netatmo
    # 📊 False = SMHI-only (STANDARD) - Enbart väderprognos från SMHI
    # 🏠 True = SMHI+Netatmo - Prognos från SMHI + faktisk data från din väderstation
    'use_netatmo': False,  # ← ÄNDRA TILL True OM du har Netatmo-väderstation
    
    'smhi': {
        # 📍 OFFENTLIGA KOORDINATER - Stockholm som standard
        'latitude': 59.3293,    # Stockholm koordinater (offentlig information)
        'longitude': 18.0686,   # Andra städer: Täby/Ellagård 59.4644,18.0698 | Göteborg 57.7089,11.9746 | Malmö 55.6050,13.0038 | Uppsala 59.8586,17.6389
        # 💡 TIPS: Täby/Ellagård (59.4644, 18.0698) kan ge mer representativ data för Netatmo-jämförelser
    },
    
    'netatmo': {
        # 🔐 KÄNSLIGA NETATMO API-UPPGIFTER - Behövs ENDAST om use_netatmo=True
        # ⚠️  Lämna som de är om du bara vill använda SMHI (use_netatmo=False)
        'client_id': 'YOUR_NETATMO_CLIENT_ID_HERE',              # Från https://dev.netatmo.com/apps
        'client_secret': 'YOUR_NETATMO_CLIENT_SECRET_HERE',      # Från https://dev.netatmo.com/apps  
        'refresh_token': 'YOUR_NETATMO_REFRESH_TOKEN_HERE',      # Från första OAuth-autentiseringen
        'preferred_station': 'Utomhus',  # Vilken station som prioriteras för visning (smart blending använder alla)
        'comment': 'Konfiguration för Netatmo-väderstation. Ignoreras helt om use_netatmo=False.'
    },
    
    'ipgeolocation': {
        # 🔐 KÄNSLIG API-NYCKEL - Fyll i din riktiga nyckel (VALFRITT)
        'api_key': 'YOUR_IPGEOLOCATION_API_KEY_HERE',           # Gratis från https://ipgeolocation.io/
        'comment': 'Hämta gratis API-nyckel från https://ipgeolocation.io/ för exakta soltider. Om tom används förenklad beräkning.'
    },
    
    'display': {
        # 📍 OFFENTLIG ORTNAMN-INSTÄLLNING
        'location_name': 'Stockholm',  # Ortnamn som visas på skärmen
        'comment': 'Namn på ort som visas på skärmen - hjälper användaren förstå var data kommer ifrån'
    },
    
    'ui': {
        # 🎛️ OFFENTLIGA UI-INSTÄLLNINGAR - Anpassa efter behov
        'fullscreen': True,                      # True/False - Fullskärmsläge för kiosk
        'refresh_interval_minutes': 15,         # 5-60 minuter - SMHI data-uppdatering (rekommenderat: 15)
        'netatmo_refresh_interval_minutes': 10, # 5-30 minuter - Netatmo snabb-uppdatering (ignoreras om use_netatmo=False)
        
        # VINDENHETER - AKTIV: 'land' (svensk landterminologi)
        'wind_unit': 'land',    # ALTERNATIV: 'sjo', 'land', 'beaufort', 'ms', 'kmh' (se guide nedan)

        # TRYCKVISNING - hur barometern visas
        # 'words'   = beskrivande ord som en fysisk barometer (Storm/Regn/Ostadigt/Vackert/Mycket torrt)
        #             + siffra och trendpil på rad 2. Bra för tittare utan känsla för hPa-värden.
        # 'numeric' = enbart siffervärde + texttrend (klassiskt läge)
        'pressure_display': 'words',

        # IKONPAKET - vilken väderikonuppsättning som används
        # 'weather-icons'      = Weather Icons-fonten (klassiskt läge, färgkodas automatiskt)
        # 'amcharts'           = animerade färg-SVG:er med dag/natt-varianter
        # 'meteocons'          = animerade färg-SVG:er, fill-stil (MIT, modernast)
        # 'amedia-meteo'       = statiska färg-SVG:er, komplett dag/natt
        #                        OBS: CC BY-NC-SA 4.0 - ENDAST icke-kommersiell användning!
        # 'open-weather-icons' = font, OpenWeatherMap-symboler (färgkodas automatiskt)
        # 'kickstand-weather'  = font, minimalistisk (12 glyfer, färgkodas automatiskt)
        # Licenser: se "Ikonpaketens licenser" i readme + licensfil i varje ikonmapp.
        # Nya paket läggs till i static/js/utils/icon-packs.js
        'icon_pack': 'weather-icons',

        # IKONANIMERINGAR - vilka väderikoner som animeras (gäller SVG-paket som 'amcharts')
        # Safari och alla webbläsare på iPad/iPhone renderar animerade SVG-ikoner
        # på CPU:n och laggar när ~10 ikoner animerar samtidigt - auto-läget ger
        # därför dessa klienter enbart animerad huvudikon. Chromium-kiosker påverkas inte.
        # 'auto' = animera allt, utom Safari/iPad som bara animerar huvudikonen (rekommenderat)
        # 'all'  = animera alla ikoner på alla klienter
        # 'hero' = animera bara huvudikonen (aktuellt väder), prognosikoner statiska
        # 'none' = alla ikoner statiska
        'icon_animations': 'auto',

        # IKONPAKETSROTATION - rotera automatiskt mellan ikonpaketen.
        # När enabled=True ignoreras 'icon_pack' ovan. Rotationen omfattar ALLA
        # paket i static/js/utils/icon-packs.js (aldrig hårdkodad lista - nya
        # paket kommer med automatiskt), minus de som anges i 'exclude'.
        # Paketet väljs deterministiskt ur datumet, så alla klienter (kiosk,
        # iPad, ...) visar samma paket utan synk. Byte sker vid midnatt lokal
        # tid / måndag / månadsskifte beroende på intervall.
        # 'interval': 'day' | 'week' | 'month'
        # 'exclude':  paketnamn som hoppas över, t.ex. ['kickstand-weather']
        'icon_pack_rotation': {
            'enabled': False,
            'interval': 'week',
            'exclude': [],
        },

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
        'enabled': False,  # EXEMPEL: False = Inaktiverat, ändra till True för att aktivera regn/snö-animationer
        
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
    }
}

# =============================================================================
# 🎯 VIKTIGT: FÖRSTÅ SKILLNADEN MELLAN LÄGENA
# =============================================================================

# 📊 SMHI-ONLY LÄGE (use_netatmo = False) - STANDARD & REKOMMENDERAT FÖR NYBÖRJARE
# ✅ Fungerar direkt utan extra setup
# ✅ Visar väderprognos från SMHI
# ✅ Visar luftfuktighet från SMHI observationer  
# ✅ Visar lufttryck från SMHI
# ✅ Enkel trycktrend baserad på SMHI-data
# ✅ WeatherEffects (regn/snö-animationer) baserade på SMHI weather symbols
# ❌ Ingen faktisk temperatur från din plats
# ❌ Ingen CO2-mätning eller ljudnivå

# 🏠 SMHI+NETATMO LÄGE (use_netatmo = True) - FÖR AVANCERADE ANVÄNDARE MED VÄDERSTATION
# ✅ Allt från SMHI-only läget PLUS:
# ✅ Faktisk temperatur från din Netatmo-väderstation
# ✅ CO2-mätning och luftkvalitet
# ✅ Ljudnivå-mätning
# ✅ Avancerad trycktrend baserad på Netatmo-historik
# ✅ Smart data-blending från flera stationer
# ✅ WeatherEffects fortsätter fungera (baserade på SMHI symbols)
# ❌ Kräver Netatmo-väderstation och API-setup

# 💡 REKOMMENDATION: Börja med use_netatmo=False, uppgradera senare om du skaffar väderstation

# =============================================================================
# 🚀 SNABB SETUP-GUIDE FÖR NYBÖRJARE
# =============================================================================

# 🎯 STEG 1: GRUNDSETUP (SMHI-ONLY)
#    1. Kopiera denna fil: cp config.example.py config.py
#    2. Öppna config.py i en texteditor
#    3. Ändra koordinater om du inte bor i Stockholm (se städer nedan)
#    4. Ändra location_name till ditt ortnamn
#    5. Spara filen och kör: python3 app.py
#    ✅ KLART! Du har en fungerande väder-dashboard

# 🌦️ STEG 2: AKTIVERA WEATHEREFFECTS (VALFRITT - REKOMMENDERAT)
#    1. Öppna config.py
#    2. Ändra weather_effects.enabled från False till True
#    3. Spara filen och starta om: python3 app.py
#    4. Ladda om webbläsarsidan
#    ✅ KLART! Nu visas regn/snö-animationer vid dåligt väder

# 🏠 STEG 3: LÄGG TILL NETATMO (VALFRITT - AVANCERAT)
#    1. Skaffa Netatmo-väderstation
#    2. Gå till https://dev.netatmo.com/apps
#    3. Skapa en ny app eller använd befintlig
#    4. Anteckna Client ID och Client Secret
#    5. Genomför OAuth-flow för att få refresh_token
#    6. Öppna config.py och sätt use_netatmo = True
#    7. Ersätt alla 'YOUR_NETATMO_*_HERE' med riktiga värden
#    8. Starta om: python3 app.py

# 🌅 STEG 4: FÖRBÄTTRA SOLTIDER (VALFRITT)
#    1. Gå till https://ipgeolocation.io/
#    2. Registrera dig för gratis konto (1000 anrop/månad)
#    3. Kopiera din API-nyckel
#    4. Ersätt 'YOUR_IPGEOLOCATION_API_KEY_HERE' med din nyckel
#    (Om du hoppar över detta används förenklad solberäkning)

# =============================================================================
# 🌦️ WEATHEREFFECTS SNABBGUIDE - NYT FAS 2
# =============================================================================

# 🚀 SNABB AKTIVERING:
#    1. Sätt weather_effects.enabled = True i config.py
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

# 🔧 PRESTANDA-OPTIMERING FÖR PI3B/PI5:
# - Minska droplet_count/flake_count om animationer är hackiga
# - Sätt target_fps till 30 om 60fps är för krävande
# - Inaktivera gpu_acceleration om det ger problem

# 🐛 FELSÖKNING WEATHEREFFECTS:
# - Sätt debug_logging = True för detaljerad console-output
# - Kontrollera browser developer tools för JavaScript-fel
# - Verifiera att /api/weather-effects-config returnerar korrekt JSON
# - Kontrollera att både CSS och JS för WeatherEffects laddas

# 🚫 INAKTIVERA WEATHEREFFECTS:
#    1. Sätt weather_effects.enabled = False i config.py
#    2. Starta om Flask-servern: python3 app.py
#    3. Inga regn/snö-animationer visas (endast statisk väderdata)

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

# Stockholm: 59.3293, 18.0686  (STANDARD)
# Täby/Ellagård: 59.4644, 18.0698  (ALTERNATIV - närmare Netatmo-stationer)
# Göteborg:  57.7089, 11.9746
# Malmö:     55.6050, 13.0038
# Uppsala:   59.8586, 17.6389
# Linköping: 58.4108, 15.6214
# Örebro:    59.2741, 15.2066
# Västerås:  59.6162, 16.5528

# =============================================================================
# FELSÖKNING - VANLIGA PROBLEM OCH LÖSNINGAR
# =============================================================================

# ❌ PROBLEM: "Import error för config"
# ✅ LÖSNING: Kontrollera att config.py finns (ej config.example.py)

# ❌ PROBLEM: "Kan inte starta utan giltig konfiguration"
# ✅ LÖSNING: Kontrollera att config.py är korrekt kopierad och har rätt format

# ❌ PROBLEM: "Fel koordinater/fel väder"
# ✅ LÖSNING: Kontrollera latitude/longitude i config.py

# ❌ PROBLEM: "WeatherEffects fungerar inte" (NYT FAS 2)
# ✅ LÖSNING: Kontrollera weather_effects.enabled = True och starta om Flask-servern

# ❌ PROBLEM: "Animationer är hackiga på Pi3B/Pi5" (NYT FAS 2)
# ✅ LÖSNING: Minska droplet_count/flake_count eller sätt target_fps till 30

# ❌ PROBLEM: "Inga effekter visas trots regn/snö" (NYT FAS 2)
# ✅ LÖSNING: Aktivera debug_logging och kontrollera console för SMHI symbol-mappning

# ❌ PROBLEM: "JavaScript-fel för WeatherEffects" (NYT FAS 2)
# ✅ LÖSNING: Kontrollera att /static/js/weather-effects.js laddas korrekt

# ❌ PROBLEM: "Netatmo autentiseringsfel" (ENDAST om use_netatmo=True)
# ✅ LÖSNING: Kontrollera client_id, client_secret och refresh_token

# ❌ PROBLEM: "Inga soltider eller konstiga tider"
# ✅ LÖSNING: Kontrollera ipgeolocation api_key eller använd fallback-beräkning

# ❌ PROBLEM: "Vinddata visas fel"
# ✅ LÖSNING: Kontrollera wind_unit-inställning

# ❌ PROBLEM: "Dashboard visar fel läge"
# ✅ LÖSNING: Kontrollera use_netatmo inställningen (True/False)

# =============================================================================
# HUR DU ÄNDRAR MELLAN LÄGENA
# =============================================================================

# 📊 FÖR ATT KÖRA SMHI-ONLY (STANDARD):
#    1. Öppna config.py
#    2. Sätt: use_netatmo = False
#    3. Spara filen
#    4. Starta om: python3 app.py
#    → Du ser bara SMHI-väderprognos (WeatherEffects fortsätter fungera)

# 🌦️ FÖR ATT AKTIVERA WEATHEREFFECTS:
#    1. Öppna config.py
#    2. Sätt: weather_effects.enabled = True
#    3. Spara filen
#    4. Starta om: python3 app.py
#    → Du ser regn/snö-animationer vid dåligt väder

# 🏠 FÖR ATT LÄGGA TILL NETATMO:
#    1. Sätt upp Netatmo API-uppgifter först (se guide ovan)
#    2. Öppna config.py
#    3. Sätt: use_netatmo = True
#    4. Spara filen
#    5. Starta om: python3 app.py
#    → Du ser SMHI + faktisk data från din väderstation

# =============================================================================
# SÄKERHET OCH BACKUP
# =============================================================================

# ⚠️  VIKTIGT: config.py innehåller känsliga API-nycklar (om du använder Netatmo)
# 🔒 LÄGG ALDRIG till config.py i Git (är utesluten via .gitignore)
# 💾 GÖR backup av config.py före uppdateringar
# 🔄 Använd environment variables i produktion för extra säkerhet

# =============================================================================
# SUPPORT OCH HJÄLP
# =============================================================================

# 📚 OM DU BEHÖVER HJÄLP:
#    1. Kontrollera att du följt setup-guiden ovan
#    2. Kolla felsökningssektionen
#    3. Testa med SMHI-only läget först (use_netatmo=False)
#    4. Aktivera WeatherEffects för mer visuell upplevelse
#    5. Kontrollera loggar när du kör python3 app.py