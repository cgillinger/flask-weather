# 🌤️ Flask Weather Dashboard

**Version 3.10.1** · [Changelog](CHANGELOG.md)

🌐 [English](readme.md) · [Svenska](readme.sv.md) · [Norsk](readme.nb.md) · **Dansk** · [Suomi](readme.fi.md) · [Deutsch](readme.de.md) · [Français](readme.fr.md) · [Español](readme.es.md)

> Dette er en kortversion. Fuld dokumentation (installation, UV-opsætning, fejlfinding) findes i den [engelske](readme.md) og [svenske](readme.sv.md) udgave.

Et moderne, responsivt vejrdashboard til tablets, telefoner og dedikerede skærme (Raspberry Pi-kiosk). Serveren kører på enhver Linux-enhed — klienterne behøver kun en browser.

> 🧑‍🔧 **Dette er et personligt hobbyprojekt, der deles, som det er.** Jeg byggede det primært til vejrskærmen på min egen væg. Jeg lægger det på GitHub, hvis andre skulle ønske et pænt, selvhostet vejr-dashboard – ikke mindst med ægte **Netatmo**-understøttelse – men jeg når måske ikke at svare på fejlrapporter eller kigge på pull requests. Du er meget velkommen til at forke det.

![Flask Weather Dashboard med Netatmo](screenshots/hero-netatmo.png)

*Netatmo-tilstand: målt temperatur, luftfugtighed, lufttryk og CO₂ ved siden af vejrudsigten.*

## ✨ Funktioner

- **Valgbar vejrleverandør**: SMHI (standard, kun Norden), **YR/met.no** eller **Open-Meteo** — de to sidste giver **global dækning**. Ingen API-nøgle kræves. 12-timers og 5-døgns prognoser.
- **Netatmo-integration (valgfrit)**: faktisk temperatur, CO2/luftkvalitet og avanceret trykudvikling fra din egen vejrstation.
- **Udendørs luftkvalitet** (`air_quality.mode`): European AQI fra nærmeste SMHI-målestation, med global Open-Meteo/CAMS-fallback (ingen nøgle). Vælg inde, ude eller begge.
- **Otte sprog** (`ui.language`): dansk vindterminologi følger DMI (svag vind, jævn vind, frisk vind, kuling, storm, orkan). Dato og ugedage følger sproget automatisk.
- **Seks ikonpakker** med valgfri automatisk rotation (dag/uge/måned).
- **Weather Effects**: animeret regn og sne styret af vejrsymbolerne.
- **UV-indeks** fra CAMS/Copernicus (valgfrit, gratis API-nøgle).
- Femtrins trykudvikling med barometerord, farvekodet vind (Beaufort), soltider.

## ⚡ Hurtig start

```bash
sudo apt update && sudo apt install python3 python3-pip git libeccodes-dev -y
cd ~ && git clone https://github.com/cgillinger/flask-weather.git && cd flask-weather
pip3 install -r requirements.txt --break-system-packages
cp reference/config_example.py reference/config.py
nano reference/config.py
python3 app.py
```

Åbn derefter `http://SERVER-IP:8036` på tabletten.

## ⚙️ Grundkonfiguration (`reference/config.py`)

```python
CONFIG = {
    'weather_provider': 'yr',        # 'smhi' | 'yr' | 'open-meteo'
    'smhi': {
        'latitude': 55.6761,         # København - bruges af alle leverandører
        'longitude': 12.5683
    },
    'display': {
        'location_name': 'København'
    },
    'ui': {
        'language': 'da',            # Dansk brugerflade
        'wind_unit': 'land',         # 'land' | 'sjo' | 'beaufort' | 'ms' | 'kmh'
        'icon_pack': 'meteocons',
    }
}
```

Med `yr` eller `open-meteo` fungerer dashboardet hvor som helst i verden — leverandørens symbolkoder oversættes automatisk, så ikoner og effekter er identiske uanset valg.

## 📄 Licens

MIT — men de medfølgende ikonpakker under `static/assets/icons/` har egne licenser. Bemærk især at `amedia-meteo/` er [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (**kun ikke-kommerciel brug**). Se den engelske udgave for hele licenstabellen.
