/**
 * AirQualityDisplay - the air quality tile.
 *
 * Shows indoor CO2 (Netatmo) and/or outdoor AQI (SMHI station → CAMS fallback)
 * depending on air_quality.mode ('indoor' | 'outdoor' | 'both'). The tile sits
 * on the same row as the barometer and UV and reuses their two-line style.
 *
 * Colors are index-driven (good/moderate/poor via ColorManager) and therefore
 * language-neutral. Only labels and band words go through i18n (t()).
 *
 * @dependencies ColorManager, FontAwesomeRenderer, I18n (global t)
 */
const AirQualityDisplay = {
    _co2Level(co2) {
        if (co2 > 1500) return 'poor';
        if (co2 > 800) return 'moderate';
        return 'good';
    },

    _worse(a, b) {
        const rank = { good: 0, moderate: 1, poor: 2 };
        return (rank[a] || 0) >= (rank[b] || 0) ? a : b;
    },

    _color(level) {
        try { return ColorManager.getAirQualityColor(level); } catch (e) { return 'inherit'; }
    },

    // Small dimmed distance line (pin + km) - only for real SMHI stations.
    // The CAMS model has no station and thus no meaningful distance → empty string.
    _distanceLine(outdoor) {
        if (!outdoor || outdoor.source !== 'smhi' || outdoor.distance_km == null) return '';
        const km = outdoor.distance_km;
        let dist;
        if (km < 1) dist = Math.round(km * 1000) + ' m';
        else if (km < 10) dist = km.toFixed(1).replace('.', ',') + ' km';
        else dist = Math.round(km) + ' km';
        return '<div class="barometer-trend-line" style="opacity:.7;font-size:.82em;margin-top:.05rem">' +
               '<i class="fas fa-location-dot" style="font-size:.82em;margin-right:.3em;opacity:.75"></i>' +
               dist + '</div>';
    },

    update(data) {
        const container = document.querySelector('.air-quality-container');
        if (!container) return;

        const aq = (data && data.air_quality) || {};
        const mode = aq.mode || 'indoor';
        const outdoor = aq.outdoor;
        const co2 = (data && data.netatmo && data.netatmo.co2 != null) ? data.netatmo.co2 : null;

        const showIndoor = (mode === 'indoor' || mode === 'both') && co2 != null;
        const showOutdoor = (mode === 'outdoor' || mode === 'both') && outdoor && outdoor.aqi != null;

        // Nothing to show (e.g. forecast-only mode with mode 'indoor', or the outdoor fetch failed entirely)
        if (!showIndoor && !showOutdoor) {
            container.classList.add('netatmo-hidden');
            return;
        }
        container.classList.remove('netatmo-hidden');
        container.style.display = '';

        const label = t('AQ_LABEL');
        const preStyle = 'opacity:.55;font-size:.72em;letter-spacing:.04em;font-weight:600;text-transform:uppercase';
        let leafLevel = 'good';
        let infoHtml = '';

        if (showIndoor && showOutdoor) {
            const inLevel = this._co2Level(co2);
            const outLevel = outdoor.level || 'good';
            leafLevel = this._worse(inLevel, outLevel);
            infoHtml =
                `<div class="barometer-trend-line" style="margin-bottom:.05rem">${label}</div>` +
                `<div class="barometer-pressure-line"><span style="${preStyle}">${t('AQ_INDOOR_SHORT')}</span> ` +
                `<span style="color:var(--text-primary)">${Math.round(co2)} ppm</span></div>` +
                `<div class="barometer-pressure-line"><span style="${preStyle}">${t('AQ_OUTDOOR_SHORT')}</span> ` +
                `<span style="color:var(--text-primary)">AQI ${outdoor.aqi}</span></div>`;
        } else if (showIndoor) {
            leafLevel = this._co2Level(co2);
            infoHtml =
                `<div class="barometer-pressure-line" style="color:var(--text-primary)">${Math.round(co2)} ppm</div>` +
                `<div class="barometer-trend-line">${label} (${t('AQ_INDOOR')})</div>`;
        } else {
            leafLevel = outdoor.level || 'good';
            const band = t('AQI_BAND_' + (outdoor.band || 'good'));
            infoHtml =
                `<div class="barometer-pressure-line" style="color:var(--text-primary)">AQI ${outdoor.aqi} · ${band}</div>` +
                `<div class="barometer-trend-line">${label} (${t('AQ_OUTDOOR')})</div>` +
                this._distanceLine(outdoor);
        }

        container.innerHTML = '';
        container.appendChild(FontAwesomeRenderer.createLeafIcon(leafLevel));
        const info = document.createElement('div');
        info.className = 'barometer-info';
        info.id = 'air-quality';  // keep the id for backwards compatibility
        info.innerHTML = infoHtml;
        container.appendChild(info);
    }
};

window.AirQualityDisplay = AirQualityDisplay;
