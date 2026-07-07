/**
 * @file i18n.js
 * @description Språkmotor: översättningsregister + t()-hjälpare (SPRÅKPROJEKTET)
 * @dependencies Inga - laddas FÖRE alla andra moduler och översättningsfiler
 *
 * Arkitektur (samma mönster som MagicMirrors translations/):
 *   - Varje språkfil under static/translations/ registrerar sig själv:
 *     I18n.register('sv', { NYCKEL: 'text', ... })
 *   - All UI-text slås upp med t('NYCKEL') eller t('NYCKEL', {param: värde})
 *   - Språket väljs med ui.language i reference/config.py och plumbas via
 *     /api/current (fetch-api-client anropar I18n.setLanguage)
 *   - Fallback-kedja: valt språk → svenska → nyckeln själv
 *   - Datum/veckodagar översätts INTE via filerna - de använder webbläsarens
 *     Intl med I18n.locale() (språkfilens __locale, t.ex. 'sv-SE')
 *
 * Lägga till ett nytt språk:
 *   1. Kopiera static/translations/sv.js till <kod>.js och översätt värdena
 *   2. Lägg till <script>-taggen i templates/index.html (efter sv.js)
 *   3. Sätt 'language': '<kod>' i reference/config.py
 */

const I18n = {
    languages: {},
    current: 'sv',
    fallback: 'sv',

    /**
     * Registrera en språkkatalog (anropas av översättningsfilerna)
     * @param {string} code - Språkkod ('sv', 'en', 'nb', ...)
     * @param {Object} catalog - Nyckel → översatt text (+ __locale för Intl)
     */
    register(code, catalog) {
        this.languages[code] = Object.assign(this.languages[code] || {}, catalog);
    },

    /**
     * Byt aktivt språk (anropas från fetch-api-client när config hämtats)
     * @param {string} code - Språkkod från ui.language
     * @returns {boolean} true om språket byttes
     */
    setLanguage(code) {
        if (!code || code === this.current) return false;
        if (!this.languages[code]) {
            console.warn(`🌐 Okänt språk '${code}' - behåller '${this.current}'. Registrerade: ${Object.keys(this.languages).join(', ')}`);
            return false;
        }
        this.current = code;
        console.log(`🌐 Språk bytt till: ${code}`);
        this.apply();
        return true;
    },

    /**
     * BCP 47-locale för Intl-API:erna (datum, tider)
     * @returns {string} t.ex. 'sv-SE'
     */
    locale() {
        const cat = this.languages[this.current];
        return (cat && cat.__locale) || 'sv-SE';
    },

    /**
     * Slå upp en översättning
     * @param {string} key - Översättningsnyckel
     * @param {Object} [params] - Platshållare: {value: 42} ersätter {value}
     * @returns {string} Översatt text (fallback: svenska → nyckeln)
     */
    t(key, params) {
        const cat = this.languages[this.current] || {};
        const fb = this.languages[this.fallback] || {};
        let text = cat[key] !== undefined ? cat[key]
            : (fb[key] !== undefined ? fb[key] : key);
        if (params) {
            for (const [name, value] of Object.entries(params)) {
                text = text.replace(`{${name}}`, value);
            }
        }
        return text;
    },

    /**
     * Översätt statiska DOM-element märkta med data-i18n="NYCKEL"
     * (körs vid språkbyte; HTML:ens svenska default-texter står tills dess)
     */
    apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = this.t(el.dataset.i18n);
        });
    }
};

window.I18n = I18n;
// Global genväg - används av alla moduler
window.t = (key, params) => I18n.t(key, params);

console.log('✅ I18n laddad');
