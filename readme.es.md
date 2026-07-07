# 🌤️ Flask Weather Dashboard

**Versión 3.10.1** · [Changelog](CHANGELOG.md)

🌐 [English](readme.md) · [Svenska](readme.sv.md) · [Norsk](readme.nb.md) · [Dansk](readme.da.md) · [Suomi](readme.fi.md) · [Deutsch](readme.de.md) · [Français](readme.fr.md) · **Español**

> Esta es una versión abreviada. La documentación completa (instalación, configuración UV, solución de problemas) está en las ediciones [inglesa](readme.md) y [sueca](readme.sv.md).

Un panel meteorológico moderno y responsive para tabletas, teléfonos y pantallas dedicadas (quiosco Raspberry Pi). El servidor funciona en cualquier dispositivo Linux — los clientes solo necesitan un navegador.

> 🧑‍🔧 **Este es un proyecto personal de aficionado, compartido tal cual.** Lo hice sobre todo para la pantalla del tiempo de mi propia pared. Lo publico en GitHub por si alguien más quiere un panel meteorológico autoalojado y elegante — sobre todo con soporte real de **Netatmo** — pero puede que no tenga tiempo de responder a los informes de errores ni de revisar las pull requests. Eres muy libre de hacer un fork.

![Flask Weather Dashboard con Netatmo](screenshots/hero-netatmo.png)

*Modo Netatmo: temperatura, humedad, presión y CO₂ medidos junto a la previsión.*

## ✨ Características

- **Proveedor meteorológico a elegir**: SMHI (por defecto, solo países nórdicos), **YR/met.no** u **Open-Meteo** — los dos últimos con **cobertura mundial**. No se necesita clave API. Previsiones de 12 horas y 5 días.
- **Integración Netatmo (opcional)**: temperatura real, CO2/calidad del aire y tendencia barométrica precisa desde tu propia estación meteorológica.
- **Calidad del aire exterior** (`air_quality.mode`): AQI europeo de la estación de medición SMHI más cercana, con respaldo global Open-Meteo/CAMS (sin clave). Interior, exterior o ambos.
- **Ocho idiomas** (`ui.language`): la terminología del viento en español sigue las denominaciones Beaufort de AEMET (flojo, moderado, fresco, fuerte, temporal, huracán). Fechas y días de la semana siguen el idioma automáticamente.
- **Seis paquetes de iconos** con rotación automática opcional (día/semana/mes).
- **Weather Effects**: lluvia y nieve animadas, controladas por los símbolos meteorológicos.
- **Índice UV** vía CAMS/Copernicus (opcional, clave API gratuita).
- Tendencia barométrica de cinco niveles con las palabras del barómetro clásico (Tempestad/Lluvia/Variable/Buen tiempo/Muy seco), viento codificado por colores (Beaufort), horas de salida/puesta del sol.

## ⚡ Inicio rápido

```bash
sudo apt update && sudo apt install python3 python3-pip git libeccodes-dev -y
cd ~ && git clone https://github.com/cgillinger/flask-weather.git && cd flask-weather
pip3 install -r requirements.txt --break-system-packages
cp reference/config_example.py reference/config.py
nano reference/config.py
python3 app.py
```

Después abre `http://IP-DEL-SERVIDOR:8036` en la tableta.

## ⚙️ Configuración básica (`reference/config.py`)

```python
CONFIG = {
    'weather_provider': 'open-meteo',  # 'smhi' | 'yr' | 'open-meteo'
    'smhi': {
        'latitude': 40.4168,           # Madrid - usado por todos los proveedores
        'longitude': -3.7038
    },
    'display': {
        'location_name': 'Madrid'
    },
    'ui': {
        'language': 'es',              # Interfaz en español
        'wind_unit': 'land',           # 'land' | 'sjo' | 'beaufort' | 'ms' | 'kmh'
        'icon_pack': 'meteocons',
    }
}
```

Con `yr` u `open-meteo` el panel funciona en cualquier parte del mundo — los códigos de símbolos del proveedor se traducen automáticamente, así que los iconos y efectos funcionan de forma idéntica sea cual sea la elección.

## 📄 Licencia

MIT — pero los paquetes de iconos incluidos en `static/assets/icons/` tienen sus propias licencias. Ten en cuenta especialmente que `amedia-meteo/` es [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (**solo uso no comercial**). La tabla completa de licencias está en la edición inglesa.
