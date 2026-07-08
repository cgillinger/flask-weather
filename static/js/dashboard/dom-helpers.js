/**
 * DOM Helpers - STEP 3 REFACTORING
 * DOM manipulation and helper functions
 * Extracted from dashboard.js for modular structure
 */

// === BASIC DOM UPDATE ===

/**
 * Update text content for element with ID
 * @param {string} id - Element ID
 * @param {string} content - Text content to set
 */
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

/**
 * Update HTML content for element with ID
 * @param {string} id - Element ID
 * @param {string} htmlContent - HTML content to set
 */
function updateElementHTML(id, htmlContent) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = htmlContent;
    }
}

// === OPTIMERAD SOL-TIDSUPPDATERING ===

/**
 * Optimized update of sun times with smart span handling
 * @param {string} elementId - Element ID for sun time
 * @param {string} timeOnly - Tid att visa (t.ex. "06:30")
 */
function updateSunTimeOptimized(elementId, timeOnly) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let textSpan = element.querySelector('span');
    
    if (textSpan) {
        textSpan.textContent = timeOnly;
    } else {
        const icon = element.querySelector('i');
        if (icon) {
            const children = Array.from(element.childNodes);
            children.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    child.remove();
                }
            });
            
            textSpan = document.createElement('span');
            textSpan.textContent = timeOnly;
            element.appendChild(textSpan);
        }
    }
}

// === TID/DAG-LOGIK ===

/**
 * Check if it is daytime (06:00 - 20:00)
 * @returns {boolean} True if it is daytime
 */
function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour <= 20;
}

console.log('✅ STEP 3: DOM Helpers loaded - 4 functions extracted!');