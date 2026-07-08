# CLAUDE.md — Flask Weather Dashboard

Flask app serving a 24/7 weather kiosk dashboard (runs on a Synology NAS, displayed
fullscreen by a Raspberry Pi 5 in kiosk mode). Weather data from a configurable
provider (SMHI / YR / Open-Meteo) blended with a local Netatmo station; optional
UV (Copernicus CAMS) and outdoor air quality (SMHI datavärd + CAMS fallback).

## Live code map — the ONLY directories that matter

| Path | Role |
|---|---|
| `app.py` | Flask app: routes, background update threads, weather_state |
| `reference/data/*.py` | Data clients (SMHI, YR, Open-Meteo, Netatmo, air quality, utils). **Live code despite the folder name** |
| `reference/config.py` | Real config incl. credentials — **gitignored, never commit** |
| `reference/config_example.py` | Documented config template (public) |
| `cams_uv_client.py` | UV index client (Copernicus ADS) |
| `static/js/**` | Frontend. All files are loaded by `templates/index.html` |
| `templates/index.html` | The single template |
| `scripts/generate_static_icons.py` | Icon build helper |
| `pressure_trend_diagnosis.py` | Standalone diagnostic tool, run manually — not imported by the app |

## Do NOT read these when reviewing/searching code

- `backup/` — frozen local snapshots of old file versions (gitignored, kept on purpose).
  Never treat their contents as current code; they have misled reviews before.
- `logs/`, `flask.log`, `task.log` — runtime logs.
- `cache/`, `pressure_history.json`, `sun_cache.json`, `tokens.json`, `uv_test.nc` — runtime/data artifacts.
- Root-level `.md`/`.txt`/`.docx` notes are historical documentation, not code
  (`DEVELOPMENT_HISTORY.md` documents old PRs from before the git history was rebuilt).

## Architecture notes that prevent wrong conclusions

- **Weather effects (rain/snow animations) are decided in the frontend**, in
  `updateWeatherEffects()` (`static/js/dashboard-views/current-weather-view.js`):
  Netatmo measured rain has priority; otherwise fallback to the SMHI weather symbol
  via `weatherEffectsManager.updateFromSMHI()`. The backend computes its own effect
  type too (`get_intelligent_weather_effect_type` in app.py, exposed via
  `/api/weather-effects-config` and the debug endpoint), but the frontend currently
  ignores that field — don't mistake either side for dead code.
- All providers normalize their symbols to the SMHI Wsymb2 scale 1–27
  (`SMHI_SYMBOL_MAPPING.md` is the reference); icons, colors and effects key off that.
- `/api/current` returns `netatmo: null` in SMHI-only mode; frontend has explicit
  degradation paths for that.
- Frontend JS is plain global-scope scripts (no modules/bundler); load order is set
  in `templates/index.html`. A function defined in one file may be called from another.

## Conventions

- Code comments and docstrings: **English**. Log/console messages: Swedish (leave as-is).
- UI strings come from `static/translations/*.js` — never hardcode display text.
- Version lives in `VERSION` + `CHANGELOG.md`; releases are merge commits tagged like `v3.10.3`.
- Verify Python with `python3 -m py_compile`, JS with `node --check`.

## Deployment

Deployed to a Synology NAS (see memory: bundle workaround, `scp -O`, PATH quirks).
The Pi at 192.168.50.22 is display-only against the NAS. Don't restart services
without being asked.
