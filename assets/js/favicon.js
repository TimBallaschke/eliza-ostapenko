(function() {
    'use strict';
    
    // Configuration
    const FAVICON_NAMES = {
        primary: 'favicon-01',
        secondary: 'favicon-02'
    };
    
    const ANIMATION_INTERVAL = 1500; // 1 second
    
    // Favicon manager class
    class FaviconManager {
        constructor() {
            this.favicons = this.initializeFavicons();
            this.currentIndex = 0;
            this.intervalId = null;
            
            if (this.favicons.primary && this.favicons.secondary) {
                this.start();
            }
        }
        
        initializeFavicons() {
            const primaryLink = document.querySelector('link[rel="icon"]');
            if (!primaryLink || !primaryLink.href) {
                console.warn('Primary favicon not found');
                return { primary: null, secondary: null };
            }
            
            const primary = primaryLink.href;
            const secondary = primary.replace(FAVICON_NAMES.primary, FAVICON_NAMES.secondary);
            
            return { primary, secondary };
        }
        
        createFaviconLink(href, rel) {
            const link = document.createElement('link');
            link.rel = rel;
            link.type = 'image/svg+xml';
            link.href = href;
            return link;
        }
        
        setFavicon(href) {
            const selectors = ['link[rel="icon"]', 'link[rel="shortcut icon"]'];
            const existingLinks = document.querySelectorAll(selectors.join(', '));
            
            if (existingLinks.length === 0) {
                // Create new favicon links if none exist
                const iconLink = this.createFaviconLink(href, 'icon');
                const shortcutLink = this.createFaviconLink(href, 'shortcut icon');
                
                document.head.appendChild(iconLink);
                document.head.appendChild(shortcutLink);
            } else {
                // Update existing links
                existingLinks.forEach(link => {
                    link.href = href;
                });
            }
        }
        
        toggleFavicon() {
            this.currentIndex = 1 - this.currentIndex;
            const favicon = this.currentIndex === 0 ? this.favicons.primary : this.favicons.secondary;
            this.setFavicon(favicon);
        }
        
        start() {
            // Set initial favicon
            this.setFavicon(this.favicons.primary);
            
            // Start animation
            this.intervalId = setInterval(() => {
                this.toggleFavicon();
            }, ANIMATION_INTERVAL);
        }
        
        stop() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }
    }
    
    // Initialize favicon manager when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new FaviconManager());
    } else {
        new FaviconManager();
    }
})();