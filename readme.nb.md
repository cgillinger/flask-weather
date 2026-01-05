# 🌤️ Flask Weather Dashboard

**Versjon 3.9.1** · [Changelog](CHANGELOG.md)

🌐 [English](readme.md) · [Svenska](readme.sv.md) · **Norsk** · [Dansk](readme.da.md) · [Suomi](readme.fi.md) · [Deutsch](readme.de.md) · [Français](readme.fr.md) · [Español](readme.es.md)

> Dette er en kortversjon. Full dokumentasjon (installasjon, UV-oppsett, feilsøking) finnes i den [engelske](readme.md) og [svenske](readme.sv.md) utgaven.

Et moderne, responsivt værdashbord for nettbrett, telefoner og dedikerte skjermer (Raspberry Pi-kiosk). Serveren kjører på hvilken som helst Linux-enhet — klientene trenger bare en nettleser.

> 🧑‍🔧 **Dette er et personlig hobbyprosjekt som deles som det er.** Jeg bygde det først og fremst for værskjermen på min egen vegg. Jeg legger det på GitHub i tilfelle noen andre vil ha et pent, selvhostet værdashbord – ikke minst med ekte **Netatmo**-støtte – men jeg rekker kanskje ikke å svare på feilrapporter eller se på pull requests. Du er hjertelig velkommen til å forke det.

![Flask Weather Dashboard med Netatmo](screenshots/hero-netatmo.png)

*Netatmo-modus: målt temperatur, luftfuktighet, lufttrykk og CO₂ ved siden av værvarselet.*

## ✨ Funksjoner

- **Valgbar værleverandør**: SMHI (standard, kun Norden), **YR/met.no** eller **Open-Meteo** — de to siste gir **global dekning**. Ingen API-nøkkel kreves. 12-timers- og 5-døgnsvarsel.
- **Netatmo-integrasjon (valgfritt)**: faktisk temperatur, CO2/luftkvalitet og avansert trykktrend fra din egen værstasjon.
- **Åtte språk** (`ui.language`): norsk vindterminologi følger YR/Meteorologisk institutt (svak vind, laber bris, frisk bris, kuling, storm, orkan). Dato og ukedager følger språket automatisk.
- **Seks ikonpakker** med valgfri automatisk rotasjon (dag/uke/måned).
- **Weather Effects**: animert regn og snø styrt av værsymbolene.
- **UV-indeks** fra CAMS/Copernicus (valgfritt, gratis API-nøkkel).
- Femtrinns trykktrend med barometerord, fargekodet vind (Beaufort), soltider.

## ⚡ Hurtigstart

```bash
sudo apt update && sudo apt install python3 python3-pip git libeccodes-dev -y
cd ~ && git clone https://github.com/cgillinger/flask-weather.git && cd flask-weather
pip3 install -r requirements.txt --break-system-packages
cp reference/config_example.py reference/config.py
nano reference/config.py
python3 app.py
```

Åpne deretter `http://SERVER-IP:8036` på nettbrettet.

## ⚙️ Grunnkonfigurasjon (`reference/config.py`)

```python
CONFIG = {
    'weather_provider': 'yr',        # 'smhi' | 'yr' | 'open-meteo'
    'smhi': {
        'latitude': 59.9139,         # Oslo - brukes av alle leverandører
        'longitude': 10.7522
    },
    'display': {
        'location_name': 'Oslo'
    },
    'ui': {
        'language': 'nb',            # Norsk grensesnitt ('no' fungerer også)
        'wind_unit': 'land',         # 'land' | 'sjo' | 'beaufort' | 'ms' | 'kmh'
        'icon_pack': 'meteocons',
    }
}
```

Med `yr` eller `open-meteo` fungerer dashbordet hvor som helst i verden — leverandørens symbolkoder oversettes automatisk, så ikoner og effekter er identiske uansett valg.

## 📄 Lisens

MIT — men de medfølgende ikonpakkene under `static/assets/icons/` har egne lisenser. Merk spesielt at `amedia-meteo/` er [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (**kun ikke-kommersiell bruk**). Se den engelske utgaven for hele lisenstabellen.
