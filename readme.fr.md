# 🌤️ Flask Weather Dashboard

**Version 3.10.1** · [Changelog](CHANGELOG.md)

🌐 [English](readme.md) · [Svenska](readme.sv.md) · [Norsk](readme.nb.md) · [Dansk](readme.da.md) · [Suomi](readme.fi.md) · [Deutsch](readme.de.md) · **Français** · [Español](readme.es.md)

> Ceci est une version abrégée. La documentation complète (installation, configuration UV, dépannage) se trouve dans les éditions [anglaise](readme.md) et [suédoise](readme.sv.md).

Un tableau de bord météo moderne et responsive pour tablettes, téléphones et écrans dédiés (kiosque Raspberry Pi). Le serveur tourne sur n'importe quel appareil Linux — les clients n'ont besoin que d'un navigateur.

> 🧑‍🔧 **Ceci est un projet personnel de loisir, partagé en l'état.** Je l'ai surtout créé pour l'écran météo de mon propre mur. Je le publie sur GitHub au cas où quelqu'un d'autre voudrait un joli tableau de bord météo auto-hébergé — notamment avec une vraie prise en charge **Netatmo** — mais je n'aurai peut-être pas le temps de répondre aux rapports de bugs ni d'examiner les pull requests. N'hésitez pas à le forker.

![Flask Weather Dashboard avec Netatmo](screenshots/hero-netatmo.png)

*Mode Netatmo : température, humidité, pression et CO₂ mesurés à côté des prévisions.*

## ✨ Fonctionnalités

- **Fournisseur météo au choix** : SMHI (par défaut, pays nordiques uniquement), **YR/met.no** ou **Open-Meteo** — les deux derniers offrent une **couverture mondiale** (Open-Meteo utilise entre autres les modèles de Météo-France). Aucune clé API requise. Prévisions sur 12 heures et 5 jours.
- **Intégration Netatmo (optionnelle)** : température réelle, CO2/qualité de l'air et tendance barométrique précise depuis votre station météo.
- **Qualité de l'air extérieur** (`air_quality.mode`) : AQI européen depuis la station de mesure SMHI la plus proche, avec repli mondial Open-Meteo/CAMS (sans clé). Intérieur, extérieur ou les deux.
- **Huit langues** (`ui.language`) : la terminologie du vent en français suit l'échelle de Beaufort de Météo-France. Dates et jours de la semaine suivent la langue automatiquement.
- **Six jeux d'icônes** avec rotation automatique optionnelle (jour/semaine/mois).
- **Weather Effects** : pluie et neige animées, pilotées par les symboles météo.
- **Indice UV** via CAMS/Copernicus (optionnel, clé API gratuite).
- Tendance barométrique à cinq niveaux avec les mots du baromètre classique (Tempête/Pluie/Variable/Beau temps/Très sec), vent codé par couleur (Beaufort), heures de lever/coucher du soleil.

## ⚡ Démarrage rapide

```bash
sudo apt update && sudo apt install python3 python3-pip git libeccodes-dev -y
cd ~ && git clone https://github.com/cgillinger/flask-weather.git && cd flask-weather
pip3 install -r requirements.txt --break-system-packages
cp reference/config_example.py reference/config.py
nano reference/config.py
python3 app.py
```

Puis ouvrez `http://IP-DU-SERVEUR:8036` sur la tablette.

## ⚙️ Configuration de base (`reference/config.py`)

```python
CONFIG = {
    'weather_provider': 'open-meteo',  # 'smhi' | 'yr' | 'open-meteo'
    'smhi': {
        'latitude': 48.8566,           # Paris - utilisé par tous les fournisseurs
        'longitude': 2.3522
    },
    'display': {
        'location_name': 'Paris'
    },
    'ui': {
        'language': 'fr',              # Interface en français
        'wind_unit': 'land',           # 'land' | 'sjo' | 'beaufort' | 'ms' | 'kmh'
        'icon_pack': 'meteocons',
    }
}
```

Avec `yr` ou `open-meteo`, le tableau de bord fonctionne partout dans le monde — les codes symboles du fournisseur sont traduits automatiquement, les icônes et les effets fonctionnent donc de façon identique quel que soit le choix.

## 📄 Licence

MIT — mais les jeux d'icônes fournis sous `static/assets/icons/` ont leurs propres licences. Notez en particulier que `amedia-meteo/` est sous [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (**usage non commercial uniquement**). Le tableau complet des licences figure dans l'édition anglaise.
