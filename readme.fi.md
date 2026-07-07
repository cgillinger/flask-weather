# 🌤️ Flask Weather Dashboard

**Versio 3.9.1** · [Changelog](CHANGELOG.md)

🌐 [English](readme.md) · [Svenska](readme.sv.md) · [Norsk](readme.nb.md) · [Dansk](readme.da.md) · **Suomi** · [Deutsch](readme.de.md) · [Français](readme.fr.md) · [Español](readme.es.md)

> Tämä on lyhennelmä. Täydellinen dokumentaatio (asennus, UV-määritys, vianetsintä) löytyy [englanninkielisestä](readme.md) ja [ruotsinkielisestä](readme.sv.md) versiosta.

Moderni, responsiivinen sääkojelauta tableteille, puhelimille ja kiinteille näytöille (Raspberry Pi -kioski). Palvelin toimii millä tahansa Linux-laitteella — asiakaslaitteet tarvitsevat vain selaimen.

![Dashboard Preview](screenshots/screenshot2.png)

## ✨ Ominaisuudet

- **Valittava säädata­lähde**: SMHI (oletus, vain Pohjoismaat), **YR/met.no** tai **Open-Meteo** — kaksi jälkimmäistä kattavat **koko maailman**. API-avainta ei tarvita. 12 tunnin ja 5 vuorokauden ennusteet.
- **Netatmo-integraatio (valinnainen)**: todellinen lämpötila, CO2/ilmanlaatu ja tarkka ilmanpaineen kehitys omalta sääasemalta.
- **Kahdeksan kieltä** (`ui.language`): suomen tuuliterminologia noudattaa Ilmatieteen laitoksen nimityksiä (heikkoa, kohtalaista, navakkaa, kovaa tuulta, myrskyä, hirmumyrskyä). Päivämäärät ja viikonpäivät seuraavat kieltä automaattisesti.
- **Kuusi kuvakepakettia** ja valinnainen automaattinen kierto (päivä/viikko/kuukausi).
- **Weather Effects**: animoitu sade ja lumi sääsymbolien ohjaamana.
- **UV-indeksi** CAMS/Copernicus-palvelusta (valinnainen, ilmainen API-avain).
- Viisiportainen paineen kehitys barometrisanoin, värikoodattu tuuli (Beaufort), auringon nousu- ja laskuajat.

## ⚡ Pika-aloitus

```bash
sudo apt update && sudo apt install python3 python3-pip git libeccodes-dev -y
cd ~ && git clone https://github.com/cgillinger/flask-weather.git && cd flask-weather
pip3 install -r requirements.txt --break-system-packages
cp reference/config_example.py reference/config.py
nano reference/config.py
python3 app.py
```

Avaa sitten `http://PALVELIMEN-IP:8036` tabletilla.

## ⚙️ Perusmääritys (`reference/config.py`)

```python
CONFIG = {
    'weather_provider': 'open-meteo',  # 'smhi' | 'yr' | 'open-meteo'
    'smhi': {
        'latitude': 60.1699,           # Helsinki - kaikki lähteet käyttävät näitä
        'longitude': 24.9384
    },
    'display': {
        'location_name': 'Helsinki'
    },
    'ui': {
        'language': 'fi',              # Suomenkielinen käyttöliittymä
        'wind_unit': 'land',           # 'land' | 'sjo' | 'beaufort' | 'ms' | 'kmh'
        'icon_pack': 'meteocons',
    }
}
```

`yr`- tai `open-meteo`-lähteellä kojelauta toimii missä päin maailmaa tahansa — lähteen symbolikoodit käännetään automaattisesti, joten kuvakkeet ja efektit toimivat samoin valinnasta riippumatta.

## 📄 Lisenssi

MIT — mutta mukana tulevilla kuvakepaketeilla (`static/assets/icons/`) on omat lisenssinsä. Huomaa erityisesti, että `amedia-meteo/` on [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (**vain ei-kaupallinen käyttö**). Koko lisenssitaulukko on englanninkielisessä versiossa.
