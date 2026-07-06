/**
 * @file icon-packs.js
 * @description Ikonpaketssystem: växla väderikonuppsättning via config (ui.icon_pack)
 * @dependencies WeatherIconRenderer (weather-icon-renderer.js) för font-rendering
 *
 * Arkitektur:
 *   SMHI-symbol (1-27) ──► semantisk nyckel ──► aktivt pakets ikon (dag/natt)
 *
 * SMHI_SEMANTIC_MAP är den ENDA platsen som tolkar SMHI-symbolnummer.
 * Varje paket mappar semantiska nycklar till sina egna ikoner och behöver
 * inte veta något om SMHI.
 *
 * Lägga till ett nytt paket:
 *   1. Lägg ikonfilerna under static/assets/icons/<paketnamn>/
 *   2. Lägg till en post i ICON_PACKS med type 'font' eller 'svg'
 *      och en ikon per semantisk nyckel ({day: ..., night: ...})
 *   3. Välj paketet med ui.icon_pack i reference/config.py
 */

// === KANONISK MAPPNING: SMHI-symbol → semantisk vädernyckel ===
const SMHI_SEMANTIC_MAP = {
    1: 'clear',
    2: 'mostly-clear',
    3: 'partly-cloudy',
    4: 'mostly-cloudy',
    5: 'cloudy',
    6: 'overcast',
    7: 'fog',
    8: 'light-showers',
    9: 'showers',
    10: 'heavy-showers',
    11: 'thunder',
    12: 'light-sleet-showers',
    13: 'sleet-showers',
    14: 'heavy-sleet-showers',
    15: 'light-snow-showers',
    16: 'snow-showers',
    17: 'heavy-snow-showers',
    18: 'light-rain',
    19: 'rain',
    20: 'heavy-rain',
    21: 'thunderstorm',
    22: 'light-sleet',
    23: 'sleet',
    24: 'heavy-sleet',
    25: 'light-snow',
    26: 'snow',
    27: 'heavy-snow'
};

// === IKONPAKET ===
const ICON_PACKS = {
    /**
     * Weather Icons-fonten (Erik Flowers) - klassiskt läge.
     * Monokrom font som färgkodas automatiskt av ColorManager.
     */
    'weather-icons': {
        type: 'font',
        icons: {
            'clear':               {day: 'wi-day-sunny',          night: 'wi-night-clear'},
            'mostly-clear':        {day: 'wi-day-sunny-overcast', night: 'wi-night-partly-cloudy'},
            'partly-cloudy':       {day: 'wi-day-cloudy',         night: 'wi-night-alt-cloudy'},
            'mostly-cloudy':       {day: 'wi-day-cloudy-high',    night: 'wi-night-cloudy-high'},
            'cloudy':              {day: 'wi-cloudy',             night: 'wi-cloudy'},
            'overcast':            {day: 'wi-cloud',              night: 'wi-cloud'},
            'fog':                 {day: 'wi-fog',                night: 'wi-fog'},
            'light-showers':       {day: 'wi-day-showers',        night: 'wi-night-showers'},
            'showers':             {day: 'wi-day-rain',           night: 'wi-night-rain'},
            'heavy-showers':       {day: 'wi-rain',               night: 'wi-rain'},
            'thunder':             {day: 'wi-day-thunderstorm',   night: 'wi-night-thunderstorm'},
            'light-sleet-showers': {day: 'wi-day-rain-mix',       night: 'wi-night-rain-mix'},
            'sleet-showers':       {day: 'wi-rain-mix',           night: 'wi-rain-mix'},
            'heavy-sleet-showers': {day: 'wi-rain-mix',           night: 'wi-rain-mix'},
            'light-snow-showers':  {day: 'wi-day-snow',           night: 'wi-night-snow'},
            'snow-showers':        {day: 'wi-snowflake-cold',     night: 'wi-snowflake-cold'},
            'heavy-snow-showers':  {day: 'wi-snowflake-cold',     night: 'wi-snowflake-cold'},
            'light-rain':          {day: 'wi-day-rain',           night: 'wi-night-rain'},
            'rain':                {day: 'wi-rain',               night: 'wi-rain'},
            'heavy-rain':          {day: 'wi-rain',               night: 'wi-rain'},
            'thunderstorm':        {day: 'wi-thunderstorm',       night: 'wi-thunderstorm'},
            'light-sleet':         {day: 'wi-day-sleet',          night: 'wi-night-sleet'},
            'sleet':               {day: 'wi-sleet',              night: 'wi-sleet'},
            'heavy-sleet':         {day: 'wi-sleet',              night: 'wi-sleet'},
            'light-snow':          {day: 'wi-day-snow',           night: 'wi-night-snow'},
            'snow':                {day: 'wi-snowflake-cold',     night: 'wi-snowflake-cold'},
            'heavy-snow':          {day: 'wi-snowflake-cold',     night: 'wi-snowflake-cold'}
        }
    },

    /**
     * amCharts animerade väder-SVG:er - färgglada ikoner med inbyggd animation.
     * Egna färger; ColorManager-färgen ignoreras (style.color påverkar inte <img>).
     * Setet saknar dimma/snöblandat - närmaste ikon används som ersättare.
     */
    'amcharts': {
        type: 'svg',
        basePath: '/static/assets/icons/amcharts-svg/',
        // Icke-animerade kopior (utan <style>-block), genererade med
        // scripts/generate_static_icons.py - används av animeringsläget
        // ('hero'/'none') eftersom sidans CSS inte kan pausa animationer
        // inuti en <img>
        staticBasePath: '/static/assets/icons/amcharts-svg-static/',
        // Visuell skalning via CSS transform - kompenserar för luften i
        // SVG:ernas viewBox UTAN att påverka layouten (layoutboxen är
        // alltid exakt 1em, som en fontglyf)
        scale: 1.3,
        // Per-fil-korrigering: vissa filer ritar sitt innehåll i mindre
        // del av viewBoxen än övriga (solen ~55% mot molnens ~80%)
        fileScale: {
            'day/day.svg': 1.4,
            'night/night.svg': 1.35
        },
        icons: {
            'clear':               {day: 'day/day.svg',          night: 'night/night.svg'},
            'mostly-clear':        {day: 'day/cloudy-day-1.svg', night: 'night/cloudy-night-1.svg'},
            'partly-cloudy':       {day: 'day/cloudy-day-2.svg', night: 'night/cloudy-night-2.svg'},
            'mostly-cloudy':       {day: 'day/cloudy-day-2.svg', night: 'night/cloudy-night-2.svg'},
            'cloudy':              {day: 'day/cloudy-day-3.svg', night: 'night/cloudy-night-3.svg'},
            'overcast':            {day: 'day/cloudy-day-3.svg', night: 'night/cloudy-night-3.svg'},
            'fog':                 {day: 'day/cloudy-day-3.svg', night: 'night/cloudy-night-3.svg'},
            'light-showers':       {day: 'day/rainy-1.svg',      night: 'day/rainy-4.svg'},
            'showers':             {day: 'day/rainy-2.svg',      night: 'day/rainy-5.svg'},
            'heavy-showers':       {day: 'day/rainy-3.svg',      night: 'day/rainy-6.svg'},
            'thunder':             {day: 'animated/thunder.svg', night: 'animated/thunder.svg'},
            'light-sleet-showers': {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'sleet-showers':       {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'heavy-sleet-showers': {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'light-snow-showers':  {day: 'day/snowy-1.svg',      night: 'day/snowy-4.svg'},
            'snow-showers':        {day: 'day/snowy-2.svg',      night: 'day/snowy-5.svg'},
            'heavy-snow-showers':  {day: 'day/snowy-3.svg',      night: 'day/snowy-6.svg'},
            'light-rain':          {day: 'day/rainy-4.svg',      night: 'day/rainy-4.svg'},
            'rain':                {day: 'day/rainy-5.svg',      night: 'day/rainy-5.svg'},
            'heavy-rain':          {day: 'day/rainy-6.svg',      night: 'day/rainy-6.svg'},
            'thunderstorm':        {day: 'animated/thunder.svg', night: 'animated/thunder.svg'},
            'light-sleet':         {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'sleet':               {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'heavy-sleet':         {day: 'day/rainy-7.svg',      night: 'day/rainy-7.svg'},
            'light-snow':          {day: 'day/snowy-4.svg',      night: 'day/snowy-4.svg'},
            'snow':                {day: 'day/snowy-5.svg',      night: 'day/snowy-5.svg'},
            'heavy-snow':          {day: 'day/snowy-6.svg',      night: 'day/snowy-6.svg'}
        }
    }
};

// === ANIMERINGSLÄGE ===

/**
 * Detektera WebKit-klienter (Safari samt ALLA webbläsare på iPad/iPhone,
 * som är WebKit under huven). WebKit CPU-rastrerar animerade SVG:er i
 * <img> genom deras feGaussianBlur-filter varje bildruta - med ~10 ikoner
 * samtidigt laggar det. Auto-läget ger därför dessa klienter hero-only.
 * OBS: iPadOS uppger sig som "Macintosh" i user agent - avslöjas av
 * multi-touch (maxTouchPoints).
 * @returns {boolean} true om klienten bör få reducerad ikonanimering
 */
function isWebKitClient() {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
        (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isSafari = /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR/.test(ua);
    return isIOS || isSafari;
}

// === REGISTRY ===
const IconRegistry = {
    activePack: 'weather-icons',

    // Upplöst animeringsläge: 'all' | 'hero' | 'none'
    // ('auto' från config löses upp till 'all' eller 'hero' i setAnimationMode)
    animationMode: 'all',

    /**
     * Sätt aktivt ikonpaket (anropas från fetch-api-client när config hämtats)
     * @param {string} packName - Nyckel i ICON_PACKS
     */
    setActivePack(packName) {
        if (!packName || packName === this.activePack) return;

        if (ICON_PACKS[packName]) {
            this.activePack = packName;
            console.log(`🎨 Ikonpaket bytt till: ${packName}`);
        } else {
            console.warn(`⚠️ Okänt ikonpaket '${packName}' - behåller '${this.activePack}'. Tillgängliga: ${Object.keys(ICON_PACKS).join(', ')}`);
        }
    },

    /**
     * Sätt ikonanimeringsläge (anropas från fetch-api-client när config hämtats)
     * @param {string} mode - 'auto' | 'all' | 'hero' | 'none' (ui.icon_animations)
     */
    setAnimationMode(mode) {
        if (!['auto', 'all', 'hero', 'none'].includes(mode)) {
            console.warn(`⚠️ Okänt ikonanimeringsläge '${mode}' - behåller '${this.animationMode}'. Giltiga: auto, all, hero, none`);
            return;
        }

        const resolved = mode === 'auto' ? (isWebKitClient() ? 'hero' : 'all') : mode;
        if (resolved !== this.animationMode) {
            this.animationMode = resolved;
            console.log(`🎬 Ikonanimeringsläge: ${resolved}${mode === 'auto' ? ' (auto-detekterat)' : ''}`);
        }
    },

    /**
     * Skapa väderikon-element för en SMHI-symbol med aktivt paket
     * @param {number} symbol - SMHI vädersymbol (1-27)
     * @param {boolean} isDay - Dag- eller nattvariant
     * @param {Array} extraClasses - Extra CSS-klasser (t.ex. storleksklass)
     * @returns {HTMLElement} <i>-element (font) eller <img>-element (svg)
     */
    createWeatherIcon(symbol, isDay = true, extraClasses = []) {
        const semanticKey = SMHI_SEMANTIC_MAP[parseInt(symbol)];
        const pack = ICON_PACKS[this.activePack];
        const variants = semanticKey && pack ? pack.icons[semanticKey] : null;
        const iconName = variants ? (isDay ? variants.day : variants.night) : null;

        if (!iconName) {
            return WeatherIconRenderer.createIcon('wi-na', extraClasses);
        }

        if (pack.type === 'font') {
            return WeatherIconRenderer.createIcon(iconName, extraClasses);
        }

        // SVG-paket: <img> med TVINGAD layoutbox på 1em (som en fontglyf,
        // se styles.css) - paketets scale justerar bara det visuella via
        // transform och kan aldrig spränga layouten
        //
        // ANIMERINGSLÄGE: hero-ikonen (aktuellt väder) identifieras på sin
        // CSS-klass från current-weather-view; övriga ikoner får statiska
        // filer när läget är 'hero' eller 'none'
        const isHero = extraClasses.includes('weather-main-icon');
        const animate = this.animationMode === 'all' ||
            (this.animationMode === 'hero' && isHero);
        const basePath = animate
            ? pack.basePath
            : (pack.staticBasePath || pack.basePath);

        const img = document.createElement('img');
        img.src = basePath + iconName;
        img.alt = '';
        img.draggable = false;
        img.className = ['svg-weather-icon', ...extraClasses].join(' ');
        const visualScale = (pack.scale || 1) * ((pack.fileScale && pack.fileScale[iconName]) || 1);
        if (visualScale !== 1) {
            img.style.setProperty('--icon-scale', String(visualScale));
        }
        return img;
    }
};

window.IconRegistry = IconRegistry;

console.log(`✅ Icon Packs laddat - ${Object.keys(ICON_PACKS).length} paket tillgängliga: ${Object.keys(ICON_PACKS).join(', ')}`);
