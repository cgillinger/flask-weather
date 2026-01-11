/**
 * @file fontawesome-renderer.js
 * @version 1.1.0
 * @lastModified 2025-01-10
 * @description Font Awesome ikonhantering med centraliserad färgkodning
 * @dependencies ColorManager (color-manager.js)
 * @author Flask Weather Dashboard Team
 * 
 * STEG 5 REFAKTORERING: Extraherat från weather-icon-renderer.js
 * v1.1.0: Integrerad med ColorManager för centraliserad färghantering
 */

// === FONT AWESOME SYSTEM - CENTRALISERAD FÄRGKODNING ===

/**
 * FontAwesome Renderer för luftkvalitet och andra ikoner
 * Använder ColorManager för konsistent färghantering
 */
class FontAwesomeRenderer {
    /**
     * Skapa luftkvalitets-ikon med färgkodning från ColorManager
     * @param {string} airQualityLevel - 'good', 'moderate', 'poor'
     * @returns {HTMLElement} Font Awesome leaf-ikon
     */
    static createLeafIcon(airQualityLevel = 'good') {
        const icon = document.createElement('i');
        icon.className = `fas fa-leaf air-quality-fa-icon`;
        icon.setAttribute('data-air-quality', airQualityLevel);
        
        // CENTRALISERAD FÄRGKODNING: Använd ColorManager istället för hårdkodade värden
        icon.style.color = ColorManager.getAirQualityColor(airQualityLevel);
        icon.style.fontSize = 'clamp(21px, 2.1rem, 28px)';
        icon.style.display = 'inline-block';
        icon.style.marginRight = '7px';
        
        return icon;
    }
    
    /**
     * Skapa generisk Font Awesome ikon
     * @param {string} iconClass - Font Awesome klass (t.ex. 'fas fa-volume-up')
     * @param {object} styles - CSS-stilar att applicera
     * @returns {HTMLElement} Font Awesome ikon
     */
    static createIcon(iconClass, styles = {}) {
        const icon = document.createElement('i');
        icon.className = iconClass;
        
        // Applicera stilar
        Object.keys(styles).forEach(property => {
            icon.style[property] = styles[property];
        });
        
        return icon;
    }
    
    /**
     * Skapa ljudnivå-ikon
     * NOTERA: Ljudnivå-färger är inte prioriterade i färghanteringsprojektet
     * och behåller därför hårdkodade värden tills vidare
     * 
     * @param {string} level - Ljudnivå ('low', 'medium', 'high')
     * @returns {HTMLElement} Font Awesome volym-ikon
     */
    static createVolumeIcon(level = 'medium') {
        const iconClasses = {
            'low': 'fas fa-volume-down',
            'medium': 'fas fa-volume-up', 
            'high': 'fas fa-volume-up'
        };
        
        // Hårdkodade färger behålls för ljudnivå (ej prioriterat i detta projekt)
        const colors = {
            'low': '#4CAF50',
            'medium': '#9575cd',
            'high': '#FF5722'
        };
        
        const icon = this.createIcon(iconClasses[level] || iconClasses['medium'], {
            color: colors[level] || colors['medium'],
            fontSize: 'clamp(21px, 2.1rem, 28px)',
            display: 'inline-block',
            marginRight: '7px'
        });
        
        icon.setAttribute('data-volume-level', level);
        return icon;
    }
}

// Exportera för backward compatibility (behåll gamla namn)
const FontAwesomeManager = FontAwesomeRenderer;

console.log('✅ FontAwesome Renderer v1.1.0 laddat - ColorManager integration aktiverad!');
