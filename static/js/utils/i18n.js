/**
 * @file i18n.js
 * @description Language engine: translation registry + t() helper (LANGUAGE PROJECT)
 * @dependencies None - loaded BEFORE all other modules and translation files
 *
 * Architecture (same pattern as MagicMirror's translations/):
 *   - Each language file under static/translations/ registers itself:
 *     I18n.register('sv', { KEY: 'text', ... })
 *   - All UI text is looked up with t('KEY') or t('KEY', {param: value})
 *   - Language is chosen with ui.language in reference/config.py and wired via
 *     /api/current (fetch-api-client calls I18n.setLanguage)
 *   - Fallback chain: chosen language → Swedish → key itself
 *   - Dates/weekdays are NOT translated via files - they use browser's
 *     Intl with I18n.locale() (language file's __locale, e.g. 'sv-SE')
 *
 * Adding a new language:
 *   1. Copy static/translations/sv.js to <code>.js and translate values
 *   2. Add <script> tag in templates/index.html (after sv.js)
 *   3. Set 'language': '<code>' in reference/config.py
 */

const I18n = {
    languages: {},
    current: 'sv',
    fallback: 'sv',

    /**
     * Register a language catalog (called by translation files)
     * @param {string} code - Language code ('sv', 'en', 'nb', ...)
     * @param {Object} catalog - Key → translated text (+ __locale for Intl)
     */
    register(code, catalog) {
        this.languages[code] = Object.assign(this.languages[code] || {}, catalog);
    },

    /**
     * Change active language (called from fetch-api-client when config is loaded)
     * @param {string} code - Language code from ui.language
     * @returns {boolean} true if language was changed
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
     * BCP 47 locale for Intl APIs (dates, times)
     * @returns {string} e.g. 'sv-SE'
     */
    locale() {
        const cat = this.languages[this.current];
        return (cat && cat.__locale) || 'sv-SE';
    },

    /**
     * Look up a translation
     * @param {string} key - Translation key
     * @param {Object} [params] - Placeholders: {value: 42} replaces {value}
     * @returns {string} Translated text (fallback: Swedish → key)
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
     * Translate static DOM elements marked with data-i18n="KEY"
     * (runs on language change; HTML's Swedish default texts stand until then)
     */
    apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = this.t(el.dataset.i18n);
        });
    }
};

window.I18n = I18n;
// Global shortcut - used by all modules
window.t = (key, params) => I18n.t(key, params);

console.log('✅ I18n laddad');
