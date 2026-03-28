# Changelog

Alla anmärkningsvärda ändringar i detta projekt dokumenteras i denna fil.
Formatet baseras på [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/).

## [3.0.0] - 2026-03-28

### Ändrat
- **Layout-rebalansering**: Dashboard-proportioner ändrade från 30/12/58 till 55/7/38 (φ-inspirerat)
- Klocka, temperaturer och väderikon skalade upp ~30% för bättre visuell balans
- Prognoskort komprimerade utan att ta bort datapunkter
- Forecast-card min-height borttagen för naturligare storleksanpassning

### Tillagt
- VERSION-fil för central versionshantering
- CHANGELOG.md för ändringslogg

### Fixat
- Visuell obalans där prognoszonerna dominerade hero-innehållet
- Timprognoskortens overflow: krympt ikon, temperatur, padding och border

## [2.x.x] och tidigare

Historiska versioner var inte centralt spårade. Se individuella filhuvuden för
filspecifik versionshistorik (styles.css, color-manager.js, etc.).
