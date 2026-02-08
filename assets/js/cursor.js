document.addEventListener('DOMContentLoaded', () => {

    if (isMobileViewport()) {
        return;
    }

    // Configuration
    const TARGET_CLASSES = ['single-image', 'single-gallery-image', 'event-image', 'calendar-image-clone'];
    const TARGET_SELECTOR = TARGET_CLASSES.map(cls => `.${cls}`).join(',');
    
    // Create cursor elements
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    const cursorHorizontal = document.createElement('div');
    cursorHorizontal.classList.add('custom-cursor-horizontal');
    cursor.appendChild(cursorHorizontal);

    const cursorVertical = document.createElement('div');
    cursorVertical.classList.add('custom-cursor-vertical');
    cursor.appendChild(cursorVertical);

    // State tracking
    let isVisible = false;
    let animationId = null;
    let mouseX = 0;
    let mouseY = 0;

    // Optimized mouse move handler with RAF
    const updateCursorPosition = () => {
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        animationId = null;
    };

    // Throttled mouse movement
    document.addEventListener('mousemove', (e) => {
        if (isAdditionalTextOpen) {
            return;
        }

        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (!animationId) {
            animationId = requestAnimationFrame(updateCursorPosition);
        }
    }, { passive: true });

    // More efficient hover detection using mouseover/mouseout
    document.addEventListener('mouseover', (e) => {

        if (isAdditionalTextOpen) {
            return;
        }

        // Quick check: does the element match our selector?
        if (!e.target.matches || !e.target.matches(TARGET_SELECTOR)) return;
        
        if (!isVisible) {
            isVisible = true;
            cursor.style.opacity = '1';
        }
        
        // Determine cursor icon based on classes
        const target = e.target;
        
        if (target.classList.contains('single-gallery-image') || 
            target.classList.contains('calendar-image-clone')) {
            // Show minus icon for close action
            cursor.className = 'custom-cursor minus-icon';
        } else if (target.classList.contains('event-image') || 
                   target.classList.contains('single-image')) {
            // Show plus icon for scale up/open action
            cursor.className = 'custom-cursor plus-icon';
        }
        
    }, { passive: true });
    
    document.addEventListener('mouseout', (e) => {

        if (isAdditionalTextOpen) {
            return;
        }
        
        // Only hide if we're actually leaving one of our target elements
        if (!e.target.matches || !e.target.matches(TARGET_SELECTOR)) return;
        
        // Check if we're moving to a child element (don't hide in that case)
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && e.target.contains(relatedTarget)) return;
        
        if (isVisible) {
            isVisible = false;
            cursor.style.opacity = '0';
            cursor.className = 'custom-cursor';
        }
    }, { passive: true });

    // Optional: Cleanup function for SPA environments
    window.destroyCustomCursor = () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        cursor.remove();
    };
});

function isMobileViewport() {
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0)
}