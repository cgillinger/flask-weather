/**
 * UI Adaptation Engine - STEG 9 REFAKTORERING
 * FAS 3: GraciÃ¶s UI-degradering extraherat frÃ¥n dashboard.js
 * Hanterar Netatmo-oberoende visning och layout-anpassningar
 */

// === FAS 3: UI DEGRADERING SYSTEM ===

/**
 * Hantera visning/dÃ¶ljning av UI-element baserat pÃ¥ Netatmo-tillgÃ¤nglighet
 */
function applyUIAdaptations() {
    const netatmoAvailable = isNetatmoAvailable();
    
    console.log(`ðŸŽ¨ FAS 3: TillÃ¤mpar UI-anpassningar (Netatmo: ${netatmoAvailable ? 'TILLGÃ„NGLIG' : 'DOLD'})`);
    
    // Hantera FAKTISK temperatur-sektion
    adaptTemperatureSection(netatmoAvailable);
    
    // Hantera CO2/luftkvalitet
    adaptAirQualitySection(netatmoAvailable);
    
    // HUMIDITY FIX: Hantera luftfuktighet-visning
    adaptHumiditySection(netatmoAvailable);
    
    // Hantera labels/etiketter
    adaptLabels(netatmoAvailable);
    
    // Applicera CSS-klasser fÃ¶r layout-anpassningar
    applyCSSAdaptations(netatmoAvailable);
    
    console.log(`âœ… FAS 3: UI-anpassningar tillÃ¤mpade`);
}

/**
 * HUMIDITY FIX: Anpassa luftfuktighet-sektionen beroende pÃ¥ data-tillgÃ¤nglighet
 */
function adaptHumiditySection(netatmoAvailable) {
    const humidityElement = document.getElementById('smhi-humidity');
    
    // Kontrollera om vi har luftfuktighetsdata frÃ¥n nÃ¥gon kÃ¤lla
    const hasHumidityData = (netatmoAvailable && dashboardState.dataAvailability.netatmoHumidity) || 
                           dashboardState.dataAvailability.smhiHumidity;
    
    if (!hasHumidityData) {
        // HUMIDITY FIX: DÃ¶lj luftfuktighet helt nÃ¤r ingen data finns
        if (humidityElement) {
            humidityElement.classList.add('netatmo-hidden');
            console.log('ðŸ™ˆ HUMIDITY FIX: Luftfuktighet-element dolt - ingen data tillgÃ¤nglig');
        }
    } else {
        // Visa luftfuktighet nÃ¤r data finns
        if (humidityElement) {
            humidityElement.classList.remove('netatmo-hidden');
            console.log('ðŸ‘ï¸ HUMIDITY FIX: Luftfuktighet-element visat - data tillgÃ¤nglig');
        }
    }
}

/**
 * Anpassa temperatur-sektionen beroende på Netatmo-tillgänglighet
 */
function adaptTemperatureSection(netatmoAvailable) {
    const netatmoTempSection = document.querySelector('.faktisk-column');
    const tempUnit = document.querySelector('.temp-unit');
    
    if (!netatmoAvailable) {
        // FAS 3: Dölj FAKTISK temperatur-sektion
        if (netatmoTempSection) {
            netatmoTempSection.classList.add('netatmo-hidden');
            console.log('🙈 FAS 3: FAKTISK temperatur-sektion dold');
        }
        
        // Justera container för centrerad layout
        if (tempUnit) {
            tempUnit.classList.add('single-temperature-mode');
        }
    } else {
        // FAS 3: Visa FAKTISK temperatur-sektion
        if (netatmoTempSection) {
            netatmoTempSection.classList.remove('netatmo-hidden');
        }
        
        if (tempUnit) {
            tempUnit.classList.remove('single-temperature-mode');
        }
    }
}

/**
 * Anpassa luftkvalitet-sektionen
 */
function adaptAirQualitySection(netatmoAvailable) {
    const airQualityContainer = document.querySelector('.air-quality-container');
    
    if (!netatmoAvailable) {
        // FAS 3: DÃ¶lj CO2/luftkvalitet
        if (airQualityContainer) {
            airQualityContainer.classList.add('netatmo-hidden');
            console.log('ðŸ™ˆ FAS 3: Luftkvalitet-sektion dold');
        }
    } else {
        // FAS 3: Visa CO2/luftkvalitet
        if (airQualityContainer) {
            airQualityContainer.classList.remove('netatmo-hidden');
        }
    }
}

/**
 * Anpassa etiketter beroende pÃ¥ datakÃ¤llor
 */
function adaptLabels(netatmoAvailable) {
    const smhiLabel = document.querySelector('.smhi-label');
    
    if (!netatmoAvailable) {
        // FAS 3: Ã„ndra "PROGNOS" till "TEMPERATUR" nÃ¤r bara SMHI anvÃ¤nds
        if (smhiLabel) {
            smhiLabel.textContent = 'TEMPERATUR';
            console.log('ðŸ·ï¸ FAS 3: Etikett Ã¤ndrad till "TEMPERATUR"');
        }
    } else {
        // FAS 3: Ã…terstÃ¤ll till "PROGNOS" nÃ¤r bÃ¥da kÃ¤llor finns
        if (smhiLabel) {
            smhiLabel.textContent = 'PROGNOS';
        }
    }
}

/**
 * Applicera CSS-klasser fÃ¶r layout-anpassningar
 */
function applyCSSAdaptations(netatmoAvailable) {
    const weatherDetailsGrid = document.querySelector('.data-points-grid');
    const smhiMainCard = document.querySelector('.smhi-main-card');
    
    if (!netatmoAvailable) {
        // FAS 3: LÃ¤gg till SMHI-only klasser
        if (weatherDetailsGrid) {
            weatherDetailsGrid.classList.add('smhi-only-mode');
        }
        
        if (smhiMainCard) {
            smhiMainCard.classList.add('smhi-only-mode');
        }
        
        console.log('ðŸŽ¨ FAS 3: SMHI-only CSS-klasser tillÃ¤mpade');
    } else {
        // FAS 3: Ta bort SMHI-only klasser
        if (weatherDetailsGrid) {
            weatherDetailsGrid.classList.remove('smhi-only-mode');
        }
        
        if (smhiMainCard) {
            smhiMainCard.classList.remove('smhi-only-mode');
        }
    }
}

/**
 * Dynamiskt dÃ¶lja/visa element baserat pÃ¥ data-tillgÃ¤nglighet
 */
function adaptElementVisibility() {
    // HUMIDITY FIX: Kontrollera luftfuktighet separat
    adaptHumiditySection(isNetatmoAvailable());
    
    // DÃ¶lj andra element som inte har data
    const elementsToCheck = [
        { 
            selector: '.air-quality-container', 
            dataCheck: () => getDataSource('co2').available 
        }
    ];
    
    elementsToCheck.forEach(({ selector, dataCheck }) => {
        const element = document.querySelector(selector);
        if (element) {
            if (dataCheck()) {
                element.classList.remove('data-unavailable');
            } else {
                element.classList.add('data-unavailable');
            }
        }
    });
}

console.log('âœ… STEG 9: UI Adaptation Engine laddat - 7 funktioner extraherade!');