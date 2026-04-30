let singleImages = document.querySelectorAll('.single-image');
let artworksGallery = document.querySelector('.artworks-gallery');
let artworksGalleryOutter = document.querySelector('.artworks-gallery-outter-container');
let artworksOverview = document.querySelector('.artworks-overview');

let isMouseTrackingInitialized = false;
let visibleGalleryIndex = null;
let currentMouseX = null;
let adjustmentInterval = null;
let galleryWidths = {};
// Map to store currentData and translateX values for each gallery element
let galleryStateMap = new Map()

let previousGalleryElement = null;
let currentGalleryElement = null;

let artworkTextHeight = 0;
let artworkTextHeightRatio = 0;
let galleryScaleValue = 1;

// Throttle utility function to limit function calls
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// Create throttled version of updateCurrentImage
let throttledUpdateCurrentImage;
// Track previous image to avoid unnecessary URL updates
let previousCurrentImage = null;

const websiteTitle = document.querySelector('.title');
const artworkInfoButton = document.querySelector('.info-button');
const aboutButton = document.querySelector('.about-button');
const calendarButton = document.querySelector('.calendar-button');
const calendarCloseButton = document.querySelector('.calendar-close-button');

let isAboutOpen = false;
let isArtworkInfoOpen = false;
let isCalendarOpen = false;
let isAdditionalTextOpen = false;
let isDetailView = false;

// Store references to event listeners for cleanup
let galleryEventListeners = new Map();
let galleryResizeHandler = null;

let visibleExhibitionImage = null;

let initializationClassesRemoved = false;

// Helper functions to manage gallery state
function initializeGalleryState(galleryElement) {
    if (!galleryStateMap.has(galleryElement)) {
        // Get current translateX directly from the element's transform style
        const transform = galleryElement.style.transform || '';
        const translateXMatch = transform.match(/translateX\(([^)]+)%\)/);
        const currentTranslateX = translateXMatch ? parseFloat(translateXMatch[1]) : 0;
        
        galleryStateMap.set(galleryElement, {
            currentData: { value: currentTranslateX, index: null },
            currentTranslateXPercent: currentTranslateX
        });
    }
}

function getGalleryState(galleryElement) {
    if (!galleryStateMap.has(galleryElement)) {
        initializeGalleryState(galleryElement);
    }
    return galleryStateMap.get(galleryElement);
}

function updateGalleryState(galleryElement, updates) {
    const currentState = getGalleryState(galleryElement);
    galleryStateMap.set(galleryElement, { ...currentState, ...updates });
}

// Optimized function to get translateX value from a specific gallery element
function getTranslateXFromElement(galleryElement) {
    const transform = galleryElement.style.transform || '';
    const translateXMatch = transform.match(/translateX\(([^)]+)%\)/);
    return translateXMatch ? parseFloat(translateXMatch[1]) : 0;
}


// Function to deinitialize gallery scaling and scrolling
function deinitializeGalleryScalingAndScrolling(resetTransforms = false) {
    
    // Remove all wheel event listeners
    galleryEventListeners.forEach((listeners, container) => {
        const artworkGalleryImages = container.querySelector('.artwork-gallery-images');
        if (artworkGalleryImages && listeners.wheelHandler) {
            artworkGalleryImages.removeEventListener('wheel', listeners.wheelHandler);
        }
        
        // Remove load event listeners from images
        if (listeners.imageLoadHandlers) {
            listeners.imageLoadHandlers.forEach((handler, img) => {
                img.removeEventListener('load', handler);
            });
        }
    });
    
    // Remove resize event listener
    if (galleryResizeHandler) {
        window.removeEventListener('resize', galleryResizeHandler);
        galleryResizeHandler = null;
    }
    
    // Clear all stored event listeners
    galleryEventListeners.clear();
    
    // Clear gallery state map completely
    galleryStateMap.clear();
    
    // Only reset transforms if explicitly requested
    // (Don't reset if galleries are intentionally positioned by centreImage)
    if (resetTransforms) {
        const allGalleryInners = document.querySelectorAll('.artwork-gallery-images-inner');
        allGalleryInners.forEach(gallery => {
            gallery.style.transform = 'translateX(0%)';
        });
    }
    
}

singleImages.forEach(singleImage => {
    singleImage.addEventListener('click', (event) => {
        handleSingleImageClick(singleImage);
    });
});

async function handleSingleImageClick(singleImage) {

    if(!initializationClassesRemoved) {
        removeInitializationClasses();
    };

    if (isMobile()) {
        if (document.body.classList.contains('mobile-menu-opened')) {
            openMobileMenu();
        }
    }
    
    const artworkClass = getArtworkClass(singleImage);
    if (artworkClass) {
        try {
            await navigateToGalleryArtwork(artworkClass);
            
            // Add transitioning class and ensure DOM stability for all browsers
            document.body.classList.add('transitioning');
            
            // Force a reflow to ensure transitioning class is applied
            document.body.offsetHeight;
            
            // Small delay to ensure DOM is stable before proceeding (helps all browsers)
            await new Promise(resolve => setTimeout(resolve, 50));

            // Get all images visible in viewport
            const visibleImages = getVisibleSingleImages();
            
            // Find the parent artwork-images container and get its images
            const artworkImagesContainer = singleImage.closest('.artwork-images');
            const containerImages = getImagesInArtworkContainer(artworkImagesContainer);
            
            // Combine both sets of images (remove duplicates)
            const allImages = combineImageArrays(visibleImages, containerImages);
            
            // Use requestAnimationFrame for smooth timing across all browsers
            requestAnimationFrame(() => {
                createOverlayWithClones(allImages, singleImage);
            });
        } catch (error) {
            console.error('Error in navigation:', error);
        }
    }
}

function initializeArtworkInfo(singleImage) {
    const artworkContainer = singleImage.closest('.artwork-container');
    const artworkNumber = artworkContainer.querySelector('.artwork-number');
    
    if (artworkNumber) {
        
        // Clone the artwork number element
        const clonedArtworkNumber = artworkNumber.cloneNode(true);
        
        // Set the class to artwork-number-gallery
        clonedArtworkNumber.className = 'artwork-number-gallery';
        
        // Get the original position
        const originalRect = artworkNumber.getBoundingClientRect();
        
        // Set fixed positioning with the exact same position
        clonedArtworkNumber.style.cssText = `
            position: fixed;
            top: ${originalRect.top}px;
            left: ${originalRect.left}px;
            width: ${originalRect.width}px;
            height: ${originalRect.height}px;
            transition: all 0.8s ease-in-out;
            line-height: var(--m-number-line-height);
            z-index: 10000;
        `;
        
        // Append to footer
        const footer = document.getElementById('footer');
        if (footer) {
            footer.appendChild(clonedArtworkNumber);
        }

        setTimeout(() => {
            clonedArtworkNumber.style.cssText = '';
        }, 10);

        const artworkTitle = document.querySelector('.artwork-title');
        const imageCaption = document.querySelector('.image-caption');
        const infoButton = document.querySelector('.info-button');
        const artworkInfoContainer = document.querySelector('.artwork-info-container');
        const artworkTitleCaptionContainer = document.querySelector('.artwork-title-caption-container');

        artworkInfoContainer.classList.remove('display-none');
        
        updateCurrentArtwork();
        setTimeout(() => {
            updateCurrentImage();
        }, 100);

        setTimeout(() => {
            if (imageCaption) {
                imageCaption.classList.remove('no-opacity');
            }
            if (infoButton) {
                infoButton.classList.remove('no-opacity');
            }
            if (artworkTitle) {
                artworkTitle.classList.remove('no-opacity');
            }
            if (artworkTitleCaptionContainer) {
                artworkTitleCaptionContainer.classList.remove('no-opacity');
            }

            if (isMobile()) {
                const mobileMenuClose = document.querySelector('.mobile-menu-close');
                mobileMenuClose.classList.remove('display-none');
            }
        }, 810);


        // Collect all artwork-number elements except the current one
        const allArtworkNumbers = Array.from(document.querySelectorAll('.artwork-number')).filter(element => element !== artworkNumber);

        // Find and console log matching artwork-number-gallery-hidden elements for each artwork number
        allArtworkNumbers.forEach(artworkNum => {
            const numberText = artworkNum.textContent;
            const clickedNumberText = artworkNumber.textContent;
            
            // Clone the artwork number element
            const clonedArtworkNum = artworkNum.cloneNode(true);
            const originalRect = artworkNum.getBoundingClientRect();
            
            // Set fixed positioning
            clonedArtworkNum.style.cssText = `
                position: fixed;
                top: ${originalRect.top}px;
                left: ${originalRect.left}px;
                width: ${originalRect.width}px;
                height: ${originalRect.height}px;
                z-index: 10000;
                transition: all 0.8s ease-in-out;
            `;

            // Append to body
            document.body.appendChild(clonedArtworkNum);

            setTimeout(() => {
                // Add classes to the cloned element
                if (numberText > clickedNumberText) {
                    clonedArtworkNum.classList.add('y-plus');
                } else {
                    clonedArtworkNum.classList.add('y-minus');
                }            
            }, 10);

            setTimeout(() => {
                clonedArtworkNum.remove();
            }, 810);
        });
    }
}

function deinitializeArtworkInfo() {
    const artworkTitle = document.querySelector('.artwork-title');
    const artworkInfoContainer = document.querySelector('.artwork-info-container');
    const imageCaption = document.querySelector('.image-caption');
    const infoButton = document.querySelector('.info-button');
    const artworkGalleryNumber = document.querySelector('.artwork-number-gallery');
    const artworkOverviewNumbers = document.querySelectorAll('.artwork-number');
    const artworkTitleCaptionContainer = document.querySelector('.artwork-title-caption-container');


    // Check which artwork overview number matches the gallery number
    if (artworkGalleryNumber) {
        const galleryNumberText = artworkGalleryNumber.textContent;
        
        artworkOverviewNumbers.forEach(overviewNumber => {
            if (overviewNumber.textContent === galleryNumberText) {
                
                // Get the position of the matching overview number
                const overviewRect = overviewNumber.getBoundingClientRect();
                
                // Apply the position to the gallery number
                artworkGalleryNumber.style.cssText = `
                    position: fixed;
                    top: ${overviewRect.top}px;
                    left: ${overviewRect.left}px;
                    width: ${overviewRect.width}px;
                    height: ${overviewRect.height}px;
                    transition: top 0.8s ease-in-out;
                    line-height: var(--m-number-line-height);
                    z-index: 10000;
                `;
            } else {
                // Clone the overview number with fixed positioning
                const clonedOverviewNumber = overviewNumber.cloneNode(true);
                const originalRect = overviewNumber.getBoundingClientRect();
                
                clonedOverviewNumber.style.cssText = `
                    position: fixed;
                    top: ${originalRect.top}px;
                    left: ${originalRect.left}px;
                    width: ${originalRect.width}px;
                    height: ${originalRect.height}px;
                    color: #000;
                    mix-blend-mode: normal;
                    z-index: 10000;
                    transition: all 0.8s ease-in-out;
                `;

                if (overviewNumber.textContent > galleryNumberText) {
                    clonedOverviewNumber.classList.add('y-plus');
                } else {
                    clonedOverviewNumber.classList.add('y-minus');
                }

                setTimeout(() => {
                    clonedOverviewNumber.classList.remove('y-plus');
                    clonedOverviewNumber.classList.remove('y-minus');
                }, 10);
                
                // Append to body
                document.body.appendChild(clonedOverviewNumber);
                
                setTimeout(() => {
                    clonedOverviewNumber.remove();
                }, 1000);
            }
        });

    }

    artworkTitle.classList.add('no-opacity');
    imageCaption.classList.add('no-opacity');
    infoButton.classList.add('no-opacity');
    artworkTitleCaptionContainer.classList.add('no-opacity');

    if (isMobile()) {
        const mobileMenuClose = document.querySelector('.mobile-menu-close');
        mobileMenuClose.classList.add('display-none');
    }

    setTimeout(() => {
        artworkInfoContainer.classList.add('display-none');
        
        // Remove the artwork gallery number from DOM
        if (artworkGalleryNumber) {
            artworkGalleryNumber.remove();
        }
    }, 950);
}

function getArtworkClass(artworkImg) {
    const artworkClass = Array.from(artworkImg.classList).find(cls => cls.startsWith('artwork-'));
    console.log('getArtworkClass found:', artworkClass);
    return artworkClass;
}

function navigateToGalleryArtwork(artworkClass) {
    console.log('navigateToGalleryArtwork looking for class:', artworkClass);
    const galleryImg = artworksGallery.querySelector(`.${artworkClass}`);
    console.log('Found gallery image:', galleryImg);

    if (galleryImg) {
        return scrollToGalleryArtwork(galleryImg);
    } else {
        return Promise.resolve(); // Return resolved promise if no gallery image found
    }
}

function scrollToGalleryArtwork(galleryImg) {
    const allInnerGalleryElements = document.querySelectorAll('.artwork-gallery-images-inner');
    const innerGalleryElement = galleryImg.closest('.artwork-gallery-images-inner');
    const innerGalleryIndex = Array.from(allInnerGalleryElements).indexOf(innerGalleryElement);

    const allImagesInGallery = innerGalleryElement.querySelectorAll('.single-gallery-image');
    const imageIndex = Array.from(allImagesInGallery).indexOf(galleryImg);

    if (!isTouchDevice()) {
        // Desktop: Use translateY for smooth gallery positioning
        if (innerGalleryElement) {
            artworksGalleryOutter.style.transition = 'none';
            const translateYValue = - ((innerGalleryIndex) * 100);
            artworksGalleryOutter.style.transform = `translateY(${translateYValue}dvh)`;
    
            return new Promise(async (resolve) => {
                setTimeout(async () => {
                    await centreImage(innerGalleryIndex, imageIndex);
                    setTimeout(() => {
                        resolve();
                        artworksGalleryOutter.style.transition = ''; // Reset to default
                    }, 10);
                }, 10);
            });
        } else {
            return Promise.resolve();
        }
    } else {
        // Mobile: Use scrollIntoView for better touch behavior
        const galleryImagesContainer = galleryImg.closest('.artwork-gallery-images-container');
        if (galleryImagesContainer) {
            return new Promise((resolve) => {
                // On mobile, the scrollable container is .artworks-gallery-outter-container
                // We need to scroll the container itself into view
                galleryImagesContainer.scrollIntoView({ 
                    behavior: 'auto',
                    block: 'start',
                    inline: 'nearest'
                });
                
                // After the container is scrolled into view, scroll the specific image into view
                setTimeout(() => {
                    galleryImg.scrollIntoView({ 
                        behavior: 'auto',
                        block: 'center',
                        inline: 'center'
                    });
                }, 50);

                // Resolve the promise after the scrolling is complete
                setTimeout(() => {
                    resolve();
                }, 100);
            });
        } else {
            return Promise.resolve();
        }
    }
}

async function centreImage(galleryIdx, imgIdx) {
    return new Promise(async (resolve) => {
        const galleries = document.querySelectorAll('.artwork-gallery-images-inner');
        const gallery = galleries[galleryIdx];
        if (!gallery) {
            resolve();
            return;
        }
      
        const images = gallery.querySelectorAll('.single-gallery-image');
        if (imgIdx < 0 || imgIdx >= images.length) {
            resolve();
            return;
        }
        
        // Step 1: Store original dimensions (same as applyGalleryScaling)
        images.forEach((img, i) => {
            if (!img.dataset.originalWidth) {
                const rect = img.getBoundingClientRect();
                img.dataset.originalWidth = rect.width;
                img.dataset.originalHeight = rect.height;
            }
        });
      
        // Calculate the center of the artworksGallery element instead of viewport center
        const artworksGalleryRect = artworksGallery.getBoundingClientRect();
        const galleryCenter = artworksGalleryRect.left + (artworksGalleryRect.width / 2);
        
        // Get gallery width for percentage calculations
        const galleryRect = gallery.getBoundingClientRect();
        const galleryWidth = galleryRect.width;
      
        // Step 2: Iterative approach - using percentage-based translateX
        const MAX_ITERATIONS = 40;
        const TOLERANCE = 1; // pixels
        const DAMPING_FACTOR = 0.3; // Only apply 30% of the correction each time
        let translateXPercent = 0; // Now using percentage
        let shouldBreak = false; // Flag to control loop exit
      
        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            
            // Apply current transform as percentage
            gallery.style.transform = `translateX(${translateXPercent}%)`;
            
            // Apply scaling with current positions
            applyScalingToImages(images, galleryCenter);
            
            // Set gallery width to its current calculated width in each iteration
            const currentGalleryWidth = gallery.getBoundingClientRect().width;
            gallery.style.width = `${currentGalleryWidth}px`;
            
            // Small delay to allow layout to update
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Reset width to auto for recalculation
            gallery.style.width = 'auto';

            // Check where our target image is now
            const targetImage = images[imgIdx];
            const targetRect = targetImage.getBoundingClientRect();
            const targetCenter = targetRect.left + (targetRect.width / 2);
                    
            // Calculate offset needed in pixels
            const errorPixels = galleryCenter - targetCenter;
        
            // If we're close enough, stop
            if (Math.abs(errorPixels) < TOLERANCE) {
                break;
            }
        
            // Convert pixel error to percentage of gallery width
            const errorPercent = (errorPixels / galleryWidth) * 100;
            
            // Adjust translateX percentage with damping
            translateXPercent += errorPercent * DAMPING_FACTOR;
        }
        
        // Final application
        gallery.style.transform = `translateX(${translateXPercent}%)`;
        applyScalingToImages(images, galleryCenter);

        // Resolve the promise when centering is complete
        setTimeout(() => {
            resolve();
        }, 0);
                
        // Center appropriate images in all other galleries
        const allGalleries = document.querySelectorAll('.artwork-gallery-images-inner');
        allGalleries.forEach((otherGallery, otherGalleryIdx) => {
            if (otherGalleryIdx !== galleryIdx) { // Skip the gallery we just centered
                const otherImages = otherGallery.querySelectorAll('.single-gallery-image');
                
                // Store original dimensions for other gallery images if not already stored
                otherImages.forEach((img) => {
                    if (!img.dataset.originalWidth) {
                        const rect = img.getBoundingClientRect();
                        img.dataset.originalWidth = rect.width;
                        img.dataset.originalHeight = rect.height;
                    }
                });
                
                // Determine which image to center based on gallery index
                let targetImageIndex;
                if (otherGalleryIdx < galleryIdx) {
                    // Lower index galleries: center the last image
                    targetImageIndex = otherImages.length - 1;
                } else {
                    // Higher index galleries: center the first image
                    targetImageIndex = 0;
                }
                
                // Center the target image in this gallery
                if (targetImageIndex >= 0 && targetImageIndex < otherImages.length) {
                    
                    // Use the same centering logic as the main gallery
                    centerImageInGallery(otherGallery, otherImages, targetImageIndex, galleryCenter);
                } else {
                    // Fallback: reset to start position
                    otherGallery.style.transform = `translateX(0%)`;
                    applyScalingToImages(otherImages, galleryCenter);
                }
            }
        });
        
        // Final verification
        const finalRect = images[imgIdx].getBoundingClientRect();
        const finalCenter = finalRect.left + (finalRect.width / 2);
        const finalError = Math.abs(finalCenter - galleryCenter);
    });
}

// Helper function to center a specific image in a gallery
function centerImageInGallery(gallery, images, targetImageIndex, galleryCenter) {
    
    // Simplified centering logic for other galleries
    const MAX_ITERATIONS = 50; // Reduced from 100 for performance
    const TOLERANCE = 1; // Reduced tolerance to see more iterations in action
    const DAMPING_FACTOR = 0.3; // Reduced for more conservative adjustments
    let translateXPercent = 0;
        
    // Get initial positions
    const targetImage = images[targetImageIndex];
    
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        // Apply current translateX
        gallery.style.transform = `translateX(${translateXPercent}%)`;
        
        // Force layout recalculation
        gallery.offsetHeight;
        
        // Apply scaling on every iteration as images move
        applyScalingToImages(images, galleryCenter);
        
        // Check target image position
        const imageRect = targetImage.getBoundingClientRect();
        const imageCenterX = imageRect.left + (imageRect.width / 2);
        const error = imageCenterX - galleryCenter;
        
        
        // Check if we're close enough
        if (Math.abs(error) <= TOLERANCE) {
            console.log(`Converged after ${iteration} iterations`);
            break;
        }
        
        // Prevent infinite correction
        if (iteration > 10 && Math.abs(error) > 1000) {
            console.warn('Error too large, breaking to prevent infinite loop');
            break;
        }
        
        // Calculate correction
        const galleryRect = gallery.getBoundingClientRect();
        const galleryWidth = galleryRect.width;
        
        if (galleryWidth <= 0) {
            break;
        }
        
        const correctionPercent = (error / galleryWidth) * 100 * DAMPING_FACTOR;
        translateXPercent -= correctionPercent;
        
        // Clamp to reasonable bounds
        translateXPercent = Math.max(-300, Math.min(300, translateXPercent));
    }
    
    
    // Apply final transform (scaling was already applied in the last iteration)
    gallery.style.transform = `translateX(${translateXPercent}%)`;
}

// Helper function that applies the exact same scaling logic as applyGalleryScaling
function applyScalingToImages(images, galleryCenter) {

    // Always compute the current gallery center and dimensions at call time
    const galleryRect = artworksGallery.getBoundingClientRect();
    const currentGalleryCenter = galleryRect.left + (galleryRect.width / 2);

    // Read scaling factor from CSS variable with a safe fallback
    const rootStyles = getComputedStyle(document.documentElement);
    const scalingVar = parseFloat(rootStyles.getPropertyValue('--gallery-scaling-factor').trim());
    const galleryScalingFactor = Number.isFinite(scalingVar) ? scalingVar : 0.8;

    images.forEach((image, index) => {
        // Get the image's current position (same as applyGalleryScaling)
        const imageRect = image.getBoundingClientRect();
        const imageCenterX = imageRect.left + (imageRect.width / 2);

        const originalWidth = parseFloat(image.dataset.originalWidth);
        const originalHeight = parseFloat(image.dataset.originalHeight);

        // Check if we have original dimensions
        if (!originalWidth || !originalHeight || isNaN(originalWidth) || isNaN(originalHeight)) {

            return; // Skip this image
        }

        // Calculate distance from up-to-date gallery center (same as applyGalleryScaling)
        const distanceFromCenter = imageCenterX - currentGalleryCenter;
        const absoluteDistance = Math.abs(distanceFromCenter);

        // Calculate scale factor (same as applyGalleryScaling)
        // Use gallery width for maxDistance calculation
        const maxDistance = galleryRect.width / 2;
        const normalizedDistance = Math.min(absoluteDistance / maxDistance, 1);
        const scaleFactor = 1 - (normalizedDistance * galleryScalingFactor);

        // Apply scaling (same as applyGalleryScaling)
        const newHeight = originalHeight * scaleFactor;
        const newWidth = originalWidth * scaleFactor;

        image.style.height = `${newHeight}px`;
        image.style.width = `${newWidth}px`;

    });
}

function getVisibleSingleImages() {
    const visibleImages = [];
    
    singleImages.forEach(singleImage => {
        if (isElementVisible(singleImage)) {
            visibleImages.push(singleImage);
        }
    });
    
    return visibleImages;
}

function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
        rect.top < windowHeight &&
        rect.bottom > 0 &&
        rect.left < windowWidth &&
        rect.right > 0
    );
}

function getImagesInArtworkContainer(artworkImagesContainer) {
    if (!artworkImagesContainer) {
        return [];
    }
    
    // Find all images with classes starting with "artwork-" within the container
    const imagesInContainer = artworkImagesContainer.querySelectorAll('img[class*="artwork-"]');
    return Array.from(imagesInContainer);
}

function combineImageArrays(visibleImages, containerImages) {
    // Create a Set to avoid duplicates using the elements themselves
    const combinedSet = new Set([...visibleImages, ...containerImages]);
    return Array.from(combinedSet);
}

function getCorrespondingGalleryImages(visibleImages) {
    const correspondingImages = [];
    
    if (!artworksGallery) return correspondingImages;
    
    visibleImages.forEach(singleImage => {
        const artworkClass = getArtworkClass(singleImage);
        if (artworkClass) {
            const galleryImg = artworksGallery.querySelector(`.${artworkClass}`);
            if (galleryImg) {
                correspondingImages.push(galleryImg);
            }
        }
    });
    
    return correspondingImages;
}

function createOverlayWithClones(visibleImages, clickedImage) {
    const overlay = createOverlayContainer();
    const clonesData = [];
    
    // Create all clones first, then animate (better for all browsers)
    visibleImages.forEach(singleImage => {
        const clone = cloneImageWithPosition(singleImage);
        clone.classList.add('clone');
        if (clone) {
            overlay.appendChild(clone);
            
            // Prepare animation data
            const artworkClass = getArtworkClass(singleImage);
            if (artworkClass && artworksGallery) {
                const correspondingGalleryImage = artworksGallery.querySelector(`.${artworkClass}`);
                if (correspondingGalleryImage) {
                    clonesData.push({ clone, correspondingGalleryImage, clickedImage });
                }
            }
        }
    });
    
    // Force reflow to ensure all clones are positioned
    overlay.offsetHeight;
    
    // Animate after small delay to ensure DOM is stable (benefits all browsers)
    setTimeout(() => {
        clonesData.forEach(({ clone, correspondingGalleryImage, clickedImage }) => {
            animateCloneToGalleryPosition(clone, correspondingGalleryImage, clickedImage);
        });
    }, 10);
}

function createOverlayContainer() {
    // Remove existing overlay if it exists
    const existingOverlay = document.getElementById('artwork-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create new overlay container
    const overlay = document.createElement('div');
    overlay.id = 'artwork-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        pointer-events: none;
        z-index: 9999;
    `;
    
    document.body.appendChild(overlay);
    return overlay;
}

function cloneImageWithPosition(originalImage) {
    // Get the position and dimensions of the original image
    const rect = originalImage.getBoundingClientRect();
    
    // Clone the image
    const clone = originalImage.cloneNode(true);
    
    // Position the clone exactly where the original is with improved stability
    clone.style.cssText = `
        position: absolute;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        margin: 0;
        padding: 0;
        border: 0;
        pointer-events: auto;
        z-index: 10000;
        opacity: 1;
        transform: none;
        will-change: transform, opacity;
        backface-visibility: hidden;
    `;
    
    // Ensure the clone has a stable src and prevent progressive loading interference
    const currentSrc = clone.src;
    Object.defineProperty(clone, '_originalSrc', { value: currentSrc, writable: false });
    clone.removeAttribute('data-high-res'); // Prevent progressive loading from targeting this clone
    
    return clone;
}

function animateCloneToGalleryPosition(clone, galleryImg, clickedImage) {

    if (isMobile()) {
        const mobileMenuButton = document.querySelector('.mobile-menu-button');
        mobileMenuButton.classList.add('display-none');
    }

    // Get the position and dimensions of the gallery element
    const galleryRect = galleryImg.getBoundingClientRect();
    
    // Add transition properties to the clone
    clone.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    // Force a reflow to ensure the transition is applied
    clone.offsetHeight;
    
    // Use requestAnimationFrame for smoother animation timing
    requestAnimationFrame(() => {
        // Animate to the gallery element's position and size
        clone.style.top = `${galleryRect.top}px`;
        clone.style.left = `${galleryRect.left}px`;
        clone.style.width = `${galleryRect.width}px`;
        clone.style.height = `${galleryRect.height}px`;

        setTimeout(() => {
            artworksOverview.classList.add('display-none');
        }, 10); // Wait longer before hiding overview to prevent flickering

        if (getArtworkClass(clone) === getArtworkClass(clickedImage)) {
            initializeArtworkInfo(clickedImage);
        }
    });

    setTimeout(() => {
        artworksGalleryOutter.classList.remove('display-none');
        isDetailView = true;

        // Remove overlay after gallery is fully visible and transition is complete
        const artworkOverlay = document.getElementById('artwork-overlay');
        if (artworkOverlay) {
            setTimeout(() => {
                artworkOverlay.remove();
            }, 200); // Wait for gallery to fully render before removing overlay
        }
        
        // Gallery scaling and scrolling is now handled by the new initialization system

        // Add click event listeners to all gallery containers
        const allGalleryContainers = document.querySelectorAll('.artwork-gallery-images-inner');
        allGalleryContainers.forEach(galleryContainer => {
            galleryContainer.addEventListener('click', handleGalleryClick);
        });

        const mobileMenuClose = document.querySelector('.mobile-menu-close');
        mobileMenuClose.addEventListener('click', handleGalleryClick);
        document.body.classList.add('detail-view');
        document.body.classList.remove('transitioning');

        if (!isTouchDevice()) {
            initializeGalleryScalingAndScrolling();
        }
        
    }, 850);
}



// Helper function to remove the tracking event listeners and ScrollTrigger instances
function removeMouseTracking() {
    // Kill all ScrollTrigger instances related to gallery images
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger && trigger.trigger.classList.contains('single-gallery-image')) {
            trigger.kill();
        }
    });
    
    // Clean up related tracking variables
    if (adjustmentInterval) {
        clearInterval(adjustmentInterval);
        adjustmentInterval = null;
    }
    currentMouseX = null;
    isMouseTrackingInitialized = false;
}


// Function to find which gallery element is currently in view
function getVisibleGalleryIndex() {
    const artworkGalleryContainers = document.querySelectorAll('.artwork-gallery-images-container');
    const viewportCenterY = window.innerHeight / 2;
    let closestIndex;
    let closestDistance = Infinity;
    
    artworkGalleryContainers.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const elementCenterY = rect.top + (rect.height / 2);
        const distance = Math.abs(elementCenterY - viewportCenterY);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });
    
    return closestIndex;
}

// Function to detect translateX value of the visible gallery element
function getCurrentTranslateXValue() {
    const galleryElements = document.querySelectorAll('.artwork-gallery-images-inner');
    const visibleIndex = getVisibleGalleryIndex();
    const element = galleryElements[visibleIndex];
    
    if (!element) return 0;
    
    // Get the current transform style
    const transform = element.style.transform || '';
    
    // Extract translateX value using regex
    const translateXMatch = transform.match(/translateX\(([^)]+)%\)/);
    let currentTranslateX = 0;
    
    if (translateXMatch) {
        currentTranslateX = parseFloat(translateXMatch[1]);
    }
    
    return { value: currentTranslateX, index: visibleIndex };
}

// // Function to check if the last image of the current gallery is visible in viewport
// function isLastImageVisible() {
//     const visibleIndex = getVisibleGalleryIndex();
//     const galleryContainers = document.querySelectorAll('.artwork-gallery-images-container');
    
//     if (!galleryContainers[visibleIndex]) return false;
    
//     const currentGallery = galleryContainers[visibleIndex];
//     const images = currentGallery.querySelectorAll('.single-gallery-image');
    
//     if (images.length === 0) return false;
    
//     const lastImage = images[images.length - 1];
//     const lastImageRect = lastImage.getBoundingClientRect();
//     const viewportWidth = window.innerWidth;
    
//     // Check if any part of the last image is visible in the viewport
//     return lastImageRect.left < viewportWidth && lastImageRect.right > 0;
// }

// // Function to gradually adjust translateX when last image is visible
// function adjustTranslateXForLastImage() {
//     if (!isLastImageVisible()) return;
    
//     const currentTranslateData = getCurrentTranslateXValue();
//     const currentTranslateX = currentTranslateData.value;
//     const visibleIndex = currentTranslateData.index;
    
//     const galleryElements = document.querySelectorAll('.artwork-gallery-images-inner');
//     const element = galleryElements[visibleIndex];
    
//     if (!element) return;
    
//     // Animation parameters
//     const totalAdjustment = 5; // 5% total
//     const totalDuration = 500; // 500ms total
//     const intervalDuration = 10; // 10ms between steps (more reliable than 1ms)
//     const startTime = performance.now();
    
//     let currentValue = currentTranslateX;
    
//     const interval = setInterval(() => {
//         const elapsed = performance.now() - startTime;
//         const progress = Math.min(elapsed / totalDuration, 1); // 0 to 1
        
//         // Calculate target value based on progress
//         const targetValue = currentTranslateX + (totalAdjustment * progress);
//         currentValue = targetValue;
        
//         // Apply the new translateX value
//         element.style.transform = element.style.transform.replace(
//             /translateX\([^)]+%\)/, 
//             `translateX(${currentValue}%)`
//         ) || `translateX(${currentValue}%)`;
        
//         // Stop when we've completed the duration
//         if (progress >= 1) {
//             clearInterval(interval);
//         }
//     }, intervalDuration);
// }

// Updated gallery scaling and scroll connection logic
function initializeGalleryScalingAndScrolling() {
    
    // First, ensure we clean up any existing initialization
    // (Don't reset transforms to preserve centreImage positioning)
    if (!isTouchDevice()) {
        deinitializeGalleryScalingAndScrolling(false);
    }
    
    // Get all artwork containers
    const artworkGalleryImagesContainers = document.querySelectorAll('.artwork-gallery-images-container');

    artworkGalleryImagesContainers.forEach(container => {
        const artworkGalleryImages = container.querySelector('.artwork-gallery-images');
        const singleGalleryImages = container.querySelectorAll('.single-gallery-image');

        if (!artworkGalleryImages || singleGalleryImages.length === 0) return;
        
        // Store original dimensions for each image
        const originalDimensions = new Map();
        
        // Function to connect vertical scrolling to translateX of inner gallery
        function connectVerticalToTranslateX() {
            let isScrolling = false;
            
            // Get the inner gallery element for this container
            const artworkGalleryImagesInner = container.querySelector('.artwork-gallery-images-inner');
            if (!artworkGalleryImagesInner) return;
            
            // Get current translateX value (might be positioned by centreImage)
            const currentTransform = artworkGalleryImagesInner.style.transform || '';
            const translateXMatch = currentTransform.match(/translateX\(([^)]+)%\)/);
            const currentTranslateX = translateXMatch ? parseFloat(translateXMatch[1]) : 0;
            
            // Initialize state with current position (preserving centreImage positioning)
            galleryStateMap.set(artworkGalleryImagesInner, {
                currentData: { value: currentTranslateX, index: null },
                currentTranslateXPercent: currentTranslateX
            });
            
            let galleryState = getGalleryState(artworkGalleryImagesInner);
            
            // Create wheel event handler function to store reference
            const wheelHandler = function(e) {
                
                // Check if we're scrolling vertically
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    
                    // Determine scroll direction
                    const isScrollingDown = e.deltaY > 0;
                    const isScrollingUp = e.deltaY < 0;


                    // Check if first image is centered or beyond center in parent container
                    const firstImage = singleGalleryImages[0];
                    
                    if (firstImage) {
                        const firstImageRect = firstImage.getBoundingClientRect();
                        const firstImageCenter = firstImageRect.left + (firstImageRect.width / 2);
                        const containerRect = artworkGalleryImages.getBoundingClientRect();
                        const containerCenter = containerRect.left + (containerRect.width / 2);
                        
                        if (firstImageCenter >= (containerCenter + 75) && isScrollingUp) {
                            // Find the current container index and apply translateY
                            const currentContainer = container;
                            const allContainers = document.querySelectorAll('.artwork-gallery-images-container');
                            const currentIndex = Array.from(allContainers).indexOf(currentContainer);
                                
                            // Only apply translateY if this is not the first container
                            if (currentIndex !== -1 && currentIndex > 0 && !isArtworkInfoOpen && !isCalendarOpen && !isAboutOpen) {
                                console.log('Applying translateY to move to previous gallery');
                                const translateYValue = -((currentIndex - 1) * 100);
                                artworksGalleryOutter.style.transform = `translateY(${translateYValue}dvh)`;
                                console.log(`Applied translateY: ${translateYValue}dvh to move to previous gallery (index: ${currentIndex - 1})`);

                                // Preserve existing translateX for the target gallery (going back)
                                const targetGalleryIndex = currentIndex - 1;
                                
                                setTimeout(() => {
                                    // Get and preserve the current state of the target gallery
                                    const targetGallery = document.querySelectorAll('.artwork-gallery-images-inner')[targetGalleryIndex];
                                    if (targetGallery) {
                                        const existingState = getGalleryState(targetGallery);
                                        // Preserve the existing translateX position
                                        console.log('Preserved gallery state after navigation:', existingState.currentTranslateXPercent);
                                    }
                                    updateCurrentArtwork();
                                }, 350); // Slightly longer to ensure CSS transition completes
                                
                                // Prevent further scroll processing after navigation
                            }
                            return;
                        }
                    }

                    // Check if last image is centered or beyond center in parent container
                    const lastImage = singleGalleryImages[singleGalleryImages.length - 1];
                    
                    if (lastImage) {

                        const lastImageRect = lastImage.getBoundingClientRect();
                        const lastImageCenter = lastImageRect.left + (lastImageRect.width / 2);
                        const containerRect = artworkGalleryImages.getBoundingClientRect();
                        const containerCenter = containerRect.left + (containerRect.width / 2);
                        
                        if (lastImageCenter <= (containerCenter - 75) && isScrollingDown) {

                            // Find the current container index and apply translateY
                            const currentContainer = container;
                            const allContainers = document.querySelectorAll('.artwork-gallery-images-container');
                            const currentIndex = Array.from(allContainers).indexOf(currentContainer);

                            console.log('currentIndex', currentIndex);
                            console.log('isArtworkInfoOpen', isArtworkInfoOpen);
                            console.log('isCalendarOpen', isCalendarOpen);
                            console.log('isAboutOpen', isAboutOpen);
                                                                
                            // Only apply translateY if this is not the last container
                            if (currentIndex !== -1 && currentIndex < allContainers.length - 1  && !isArtworkInfoOpen && !isCalendarOpen && !isAboutOpen) {
                                console.log('Applying translateY to move to next gallery');
                                const translateYValue = -((currentIndex + 1) * 100);
                                artworksGalleryOutter.style.transform = `translateY(${translateYValue}dvh)`;
                                console.log(`Applied translateY: ${translateYValue}dvh to move to next gallery (index: ${currentIndex + 1})`);

                                // Immediately reset the translateX for smoother transition
                                const targetGalleryIndex = currentIndex + 1;
                                const targetGallery = document.querySelectorAll('.artwork-gallery-images-inner')[targetGalleryIndex];
                                if (targetGallery) {
                                    // Reset translateX immediately for the target gallery
                                    targetGallery.style.transform = 'translateX(0%)';
                                    updateGalleryState(targetGallery, {
                                        currentData: { value: 0, index: targetGalleryIndex },
                                        currentTranslateXPercent: 0
                                    });
                                    console.log('Immediately reset gallery state for smooth transition');
                                }
                                
                                setTimeout(() => {
                                    updateCurrentArtwork();
                                }, 350); // Slightly longer to ensure CSS transition completes
                                                                
                            }
                            return;
                        }
                    }

                    e.preventDefault(); // Prevent default vertical scroll
                    
                    // Get current gallery state (refreshed each time to account for updates from stepScaling)
                    galleryState = getGalleryState(artworkGalleryImagesInner);
                    
                    // Convert vertical scroll to translateX percentage movement
                    const scrollAmount = e.deltaY;
                    const translateAmountPercent = (scrollAmount / artworkGalleryImages.clientWidth) * 100 * 0.2; // Adjust multiplier to control sensitivity
                    galleryState.currentTranslateXPercent -= translateAmountPercent; // Negative for natural scroll direction
                    
                    // Calculate the maximum translateX percentage based on content width
                    const containerWidth = artworkGalleryImages.clientWidth;
                    const contentWidth = artworkGalleryImagesInner.scrollWidth;
                    const maxTranslateXPercent = Math.min(0, ((containerWidth - contentWidth) / containerWidth) * 100);
                    
                    // Define the positive range limit (adjust this value as needed)
                    const maxPositiveTranslateXPercent = 25; // Allow up to 25% positive translateX
                    
                    // Clamp translateX within extended bounds (negative to positive range)
                    galleryState.currentTranslateXPercent = Math.max(maxTranslateXPercent, Math.min(maxPositiveTranslateXPercent, galleryState.currentTranslateXPercent));
                    
                    // Update the gallery state
                    updateGalleryState(artworkGalleryImagesInner, galleryState);

                     
                    // Apply translateX to the inner gallery element
                    artworkGalleryImagesInner.style.transform = `translateX(${galleryState.currentTranslateXPercent}%)`;
                    
                    // Update image scaling after translateX change
                    requestUpdateImageScales();
                                        
                    
                    isScrolling = true;
                    clearTimeout(isScrolling);
                    setTimeout(() => {
                        isScrolling = false;
                    }, 100);
                }
                // Check if we're scrolling horizontally
                else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                    
                    // Determine horizontal scroll direction
                    const isScrollingRight = e.deltaX > 0;
                    const isScrollingLeft = e.deltaX < 0;

                    // Check if first image is centered or beyond center in parent container (for left scroll)
                    const firstImage = singleGalleryImages[0];
                    
                    if (firstImage) {
                        const firstImageRect = firstImage.getBoundingClientRect();
                        const firstImageCenter = firstImageRect.left + (firstImageRect.width / 2);
                        const containerRect = artworkGalleryImages.getBoundingClientRect();
                        const containerCenter = containerRect.left + (containerRect.width / 2);
                        
                        if (firstImageCenter >= (containerCenter + 75) && isScrollingLeft) {
                            // Find the current container index and apply translateY
                            const currentContainer = container;
                            const allContainers = document.querySelectorAll('.artwork-gallery-images-container');
                            const currentIndex = Array.from(allContainers).indexOf(currentContainer);
                                                                
                            // Only apply translateY if this is not the first container
                            if (currentIndex !== -1 && currentIndex > 0 && !isArtworkInfoOpen && !isCalendarOpen && !isAboutOpen) {
                                const translateYValue = -((currentIndex - 1) * 100);
                                artworksGalleryOutter.style.transform = `translateY(${translateYValue}dvh)`;

                                // Preserve existing translateX for the target gallery (going back)
                                const targetGalleryIndex = currentIndex - 1;
                                
                                setTimeout(() => {
                                    // Get and preserve the current state of the target gallery
                                    const targetGallery = document.querySelectorAll('.artwork-gallery-images-inner')[targetGalleryIndex];
                                    if (targetGallery) {
                                        const existingState = getGalleryState(targetGallery);
                                        // Preserve the existing translateX position
                                        console.log('Preserved gallery state after horizontal navigation:', existingState.currentTranslateXPercent);
                                    }
                                    updateCurrentArtwork();
                                }, 350); // Slightly longer to ensure CSS transition completes
                            }
                            
                            return;

                        }
                    }

                    // Check if last image is centered or beyond center in parent container (for right scroll)
                    const lastImage = singleGalleryImages[singleGalleryImages.length - 1];
                    
                    if (lastImage) {
                        const lastImageRect = lastImage.getBoundingClientRect();
                        const lastImageCenter = lastImageRect.left + (lastImageRect.width / 2);
                        const containerRect = artworkGalleryImages.getBoundingClientRect();
                        const containerCenter = containerRect.left + (containerRect.width / 2);
                        
                        if (lastImageCenter <= (containerCenter - 75) && isScrollingRight) {
                            // Find the current container index and apply translateY
                            const currentContainer = container;
                            const allContainers = document.querySelectorAll('.artwork-gallery-images-container');
                            const currentIndex = Array.from(allContainers).indexOf(currentContainer);
                                                                
                            // Only apply translateY if this is not the last container
                            if (currentIndex !== -1 && currentIndex < allContainers.length - 1 && !isArtworkInfoOpen && !isCalendarOpen && !isAboutOpen) {
                                const translateYValue = -((currentIndex + 1) * 100);
                                artworksGalleryOutter.style.transform = `translateY(${translateYValue}dvh)`;

                                // Immediately reset the translateX for smoother transition
                                const targetGalleryIndex = currentIndex + 1;
                                const targetGallery = document.querySelectorAll('.artwork-gallery-images-inner')[targetGalleryIndex];
                                if (targetGallery) {
                                    // Reset translateX immediately for the target gallery
                                    targetGallery.style.transform = 'translateX(0%)';
                                    updateGalleryState(targetGallery, {
                                        currentData: { value: 0, index: targetGalleryIndex },
                                        currentTranslateXPercent: 0
                                    });
                                    console.log('Immediately reset gallery state for smooth horizontal transition');
                                }
                                
                                setTimeout(() => {
                                    updateCurrentArtwork();
                                }, 350); // Slightly longer to ensure CSS transition completes
                            }
                            
                            return;
                        }
                    }

                    e.preventDefault(); // Prevent default horizontal scroll
                    
                    // Get current gallery state (refreshed each time to account for updates from stepScaling)
                    galleryState = getGalleryState(artworkGalleryImagesInner);
                    
                    // Convert horizontal scroll to translateX percentage movement
                    const scrollAmount = e.deltaX;
                    const translateAmountPercent = (scrollAmount / artworkGalleryImages.clientWidth) * 100 * 0.2; // Adjust multiplier to control sensitivity
                    galleryState.currentTranslateXPercent -= translateAmountPercent; // Negative for natural scroll direction
                    
                    // Calculate the maximum translateX percentage based on content width
                    const containerWidth = artworkGalleryImages.clientWidth;
                    const contentWidth = artworkGalleryImagesInner.scrollWidth;
                    const maxTranslateXPercent = Math.min(0, ((containerWidth - contentWidth) / containerWidth) * 100);
                    
                    // Define the positive range limit (adjust this value as needed)
                    const maxPositiveTranslateXPercent = 25; // Allow up to 25% positive translateX
                    
                    // Clamp translateX within extended bounds (negative to positive range)
                    galleryState.currentTranslateXPercent = Math.max(maxTranslateXPercent, Math.min(maxPositiveTranslateXPercent, galleryState.currentTranslateXPercent));
                    
                    // Update the gallery state
                    updateGalleryState(artworkGalleryImagesInner, galleryState);
                    
                    // Apply translateX to the inner gallery element
                    artworkGalleryImagesInner.style.transform = `translateX(${galleryState.currentTranslateXPercent}%)`;
                    
                    // Update image scaling after translateX change
                    requestUpdateImageScales();
                                        
                    console.log('Applied horizontal translateX:', galleryState.currentTranslateXPercent + '%');
                    
                    isScrolling = true;
                    clearTimeout(isScrolling);
                    setTimeout(() => {
                        isScrolling = false;
                    }, 100);
                }

                // Throttle updateCurrentImage to prevent browser flooding
                throttledUpdateCurrentImage();
            };
            
            // Add wheel event listener and store reference
            artworkGalleryImages.addEventListener('wheel', wheelHandler, { passive: false });
            
            // Store the event listener reference for cleanup
            if (!galleryEventListeners.has(container)) {
                galleryEventListeners.set(container, {
                    wheelHandler: wheelHandler,
                    imageLoadHandlers: new Map()
                });
            } else {
                galleryEventListeners.get(container).wheelHandler = wheelHandler;
            }
        }
        
        // Initialize vertical to translateX connection
        connectVerticalToTranslateX();
                
        // Initialize original dimensions
        singleGalleryImages.forEach(img => {
            // Wait for image to load to get natural dimensions
            if (img.complete) {
                storeOriginalDimensions(img);
            } else {
                const loadHandler = () => {
                    storeOriginalDimensions(img);
                    requestUpdateImageScales(); // Update scales after image loads
                };
                img.addEventListener('load', loadHandler);
                
                // Store load handler reference for cleanup
                const containerListeners = galleryEventListeners.get(container);
                if (containerListeners) {
                    containerListeners.imageLoadHandlers.set(img, loadHandler);
                }
            }
        });
        
        function storeOriginalDimensions(img) {
            const originalHeight = img.naturalHeight || img.offsetHeight;
            const originalWidth = img.naturalWidth || img.offsetWidth;
            const aspectRatio = originalWidth / originalHeight;
            
            // Get the artwork gallery container height
            const artworkGalleryContainer = document.querySelector('.artwork-gallery-images');
            const containerHeight = artworkGalleryContainer ? artworkGalleryContainer.offsetHeight : window.innerHeight;
            const maxHeight = containerHeight * 0.8;
            const maxWidth = maxHeight * aspectRatio;
            
            originalDimensions.set(img, {
                height: maxHeight,
                width: maxWidth,
                aspectRatio: aspectRatio
            });
        }
                
        // Use requestAnimationFrame for smoother updates
        function requestUpdateImageScales() {
            // Use applyScalingToImages instead for consistency
            const galleryRect = artworksGallery.getBoundingClientRect();
            const galleryCenter = galleryRect.left + (galleryRect.width / 2);
            applyScalingToImages(singleGalleryImages, galleryCenter);
        }
                // Note: Scroll event listener removed since we're now using translateX instead of scroll
        
        // Initial scale update (with a small delay to ensure images are loaded)
        setTimeout(() => requestUpdateImageScales(), 100);
        
        // Debounced resize handler
        let resizeTimeout;
        const resizeHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Recalculate dimensions based on new window size
                singleGalleryImages.forEach(img => {
                    storeOriginalDimensions(img);
                });
                requestUpdateImageScales();
            }, 150);
        };
        
        // Only add resize listener once (not per container)
        if (!galleryResizeHandler) {
            galleryResizeHandler = resizeHandler;
            window.addEventListener('resize', galleryResizeHandler);
        }
    });
    
    updateCurrentImage();
}

// Function to detect mobile devices based on screen width
function isMobile() {
    return window.innerWidth < 768;
}

function isTouchDevice() {
    // For testing: always return true to simulate touch device behavior on desktop
    // return true;
    
    // Primary check: touch capability (most reliable)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        return true;
    }
    
    // Fallback: check for mobile/tablet user agents (more comprehensive)
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Kindle|Silk|PlayBook|BB10|Windows Phone|Windows Mobile|SamsungBrowser|UCBrowser|Opera Mobi|Opera Mini|CriOS|FxiOS|EdgiOS|OPiOS|Vivaldi|YaBrowser|DuckDuckGo|Brave/i.test(navigator.userAgent);
}


function handleGalleryClick(event) {

    document.body.classList.add('transitioning');

    let timeoutDuration = 0;

    if (document.body.classList.contains('info-opened')) {
        closeArtworkInfo();

        if (isAdditionalTextOpen) {
            timeoutDuration = 200;
        } else {
            timeoutDuration = 1000;
        }
    }

    setTimeout(() => {
        let clickedGallery;
    
        if (!isTouchDevice()) {
            // If no event is passed (e.g., from websiteTitle click), use the current visible gallery
            if (!event || !event.currentTarget) {
                const visibleGalleryIndex = getVisibleGalleryIndex();
                const galleryContainers = document.querySelectorAll('.artwork-gallery-images');
                clickedGallery = galleryContainers[visibleGalleryIndex];
            } else {
                clickedGallery = event.currentTarget; 
                console.log('clickedGallery', clickedGallery);
                // Get the gallery container that was clicked
            }
        } else {
            // On mobile, get the currently visible gallery using getVisibleGalleryIndex
            const visibleGalleryIndex = getVisibleGalleryIndex();
            const galleryContainers = document.querySelectorAll('.artwork-gallery-images');
            clickedGallery = galleryContainers[visibleGalleryIndex];
        }
    
        
        // Get all artwork classes from the clicked gallery container
        const galleryImages = clickedGallery.querySelectorAll('.single-gallery-image');
        const artworkClasses = [];
        
        galleryImages.forEach(image => {
            const artworkClass = getArtworkClass(image);
            if (artworkClass) {
                artworkClasses.push(artworkClass);
            }
        });
        
        if (artworkClasses.length > 0 && artworksOverview) {
            // Find the corresponding artwork container in artworks-overview
            const correspondingContainer = findArtworkContainerByClasses(artworkClasses);
            
            if (correspondingContainer) {
                
                // Scroll the corresponding container to the center of the viewport
                scrollContainerToViewportCenter(correspondingContainer);
                
                // After scrolling, get all visible images from artworks-overview
                setTimeout(() => {
                    // Force a reflow to ensure scrolling is complete
                    document.body.offsetHeight;
                    
                    const visibleOverviewImages = getVisibleSingleImages();
                    
                    // Find corresponding gallery images
                    const correspondingGalleryImages = getCorrespondingGalleryImages(visibleOverviewImages);
                    
                    // Get images from the clicked gallery
                    const clickedGalleryImages = Array.from(clickedGallery.querySelectorAll('.single-gallery-image'));
                    
                    // Merge the arrays and remove duplicates
                    const mergedGalleryImages = combineImageArrays(correspondingGalleryImages, clickedGalleryImages);
                    
                    // Use requestAnimationFrame for smooth overlay creation timing
                    requestAnimationFrame(() => {
                        createGalleryOverlayWithClones(mergedGalleryImages);
                    });
                }, 100); // Small delay to ensure scrolling is complete
                
            } else {
                console.log('No corresponding artwork container found for classes:', artworkClasses);
            }
        } else {
            console.log('No artwork classes found or artworks-overview not available');
        }
    }, timeoutDuration);
}

function findArtworkContainerByClasses(artworkClasses) {
    // Find all artwork containers in artworks-overview
    const artworkContainers = artworksOverview.querySelectorAll('.artwork-images');
    
    for (const container of artworkContainers) {
        // Check if this container has any image with a matching class
        for (const artworkClass of artworkClasses) {
            const matchingImage = container.querySelector(`.${artworkClass}`);
            if (matchingImage) {
                return container; // Found a match, this is the correct container
            }
        }
    }
    
    return null;
}

function scrollContainerToViewportCenter(container) {

    console.log('scrollContainerToViewportCenter', container);
    console.log('container', container);

    const artworksOverviewOutter = document.querySelector('.artworks-overview-outter-container');
    // Get the container's current position
    const containerRect = container.getBoundingClientRect();
    const viewportCenterY = window.innerHeight / 2;
    const viewportCenterX = window.innerWidth / 2;
    
    // Calculate the container's center position
    const containerCenterY = containerRect.top + (containerRect.height / 2);
    const containerCenterX = containerRect.left + (containerRect.width / 2);
    
    // Calculate how much we need to scroll to center the container
    const scrollOffsetY = containerCenterY - viewportCenterY;
    const scrollOffsetX = containerCenterX - viewportCenterX;
    
    // Scroll to center the container in the viewport
    artworksOverviewOutter.scrollBy({
        top: scrollOffsetY,
        left: scrollOffsetX,
        behavior: 'auto'
    }); 
}

function createGalleryOverlayWithClones(mergedGalleryImages) {
    const overlay = createOverlayContainer();
    const clonesData = [];

    // Deinitialize artwork info with improved timing
    setTimeout(() => {
        deinitializeArtworkInfo();
    }, 50);
    
    // Create all clones first, then animate (better for all browsers)
    mergedGalleryImages.forEach(singleImage => {
        const clone = cloneImageWithPosition(singleImage);
        if (clone) {
            overlay.appendChild(clone);
            
            // Prepare animation data
            const artworkClass = getArtworkClass(singleImage);
            if (artworkClass && artworksGallery) {
                const correspondingOverviewImage = artworksOverview.querySelector(`.${artworkClass}`);
                if (correspondingOverviewImage) {
                    clonesData.push({ clone, correspondingOverviewImage });
                }
            }
        }
    });
    
    // Force reflow to ensure all clones are positioned
    overlay.offsetHeight;
    
    // Animate after small delay to ensure DOM is stable (benefits all browsers)
    setTimeout(() => {
        clonesData.forEach(({ clone, correspondingOverviewImage }) => {
            animateCloneToOverviewPosition(clone, correspondingOverviewImage);
        });
    }, 10);
}

function animateCloneToOverviewPosition(clone, overviewImg) {

    // Get the position and dimensions of the gallery element
    const overviewRect = overviewImg.getBoundingClientRect();
    
    // Add transition properties to the clone
    clone.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    // Force a reflow to ensure the transition is applied
    clone.offsetHeight;
    
    // Animate to the gallery element's position and size
    setTimeout(() => {
        clone.style.top = `${overviewRect.top}px`;
        clone.style.left = `${overviewRect.left}px`;
        clone.style.width = `${overviewRect.width}px`;
        clone.style.height = `${overviewRect.height}px`;

        setTimeout(() => {
            artworksGalleryOutter.classList.add('display-none');
        }, 10);

    }, 50);


    setTimeout(() => {
        artworksOverview.classList.remove('display-none');
        isDetailView = false;

        // Reset URL to root (remove artwork slug) only if about or calendar are not open
        if (!document.body.classList.contains('about-opened') && !document.body.classList.contains('calendar-opened')) {
            if (window.history && window.history.pushState) {
                window.history.pushState({}, '', '/');
            } else {
                window.location.hash = '';
            }
        }
        

        const artworkOverlay = document.getElementById('artwork-overlay');
        if (artworkOverlay) {
            setTimeout(() => {
                artworkOverlay.remove();
            }, 10);
        }

        if (!isTouchDevice()) {
            deinitializeGalleryScalingAndScrolling(true); // Clean up gallery interactions and reset positions
        }

        if (isMobile()) {
            const mobileMenuButton = document.querySelector('.mobile-menu-button');
            mobileMenuButton.classList.remove('display-none');
        }

        document.body.classList.remove('detail-view');
        document.body.classList.remove('transitioning');

    }, 1000);
}













// // Wait for page to fully load before centering image
// window.addEventListener('load', function() {
//     centreImage(0, 3);
// });

// // Track mouse X position and apply translateX to gallery elements
// document.addEventListener('mousemove', function(event) {
//     // Update current mouse position
//     currentMouseX = event.clientX;
    
//     applyScrollGalleryScaling();
// });


function updateCurrentArtwork() {
    const currentGalleryIndex = getVisibleGalleryIndex();
    const galleryElements = document.querySelectorAll('.artwork-gallery-images-container');
    currentGalleryElement = galleryElements[currentGalleryIndex];
    
    // Check if the gallery element has changed
    if (currentGalleryElement !== previousGalleryElement) {
        updateArtworkInfo();
        updateCurrentImage();
        previousGalleryElement = currentGalleryElement;
    }
}


function updateArtworkInfo() {  

    const currentGalleryIndex = getVisibleGalleryIndex();
    const currentGalleryElementTitle = currentGalleryElement.querySelector('.artwork-hidden-title').textContent;
    const titleContainerText = document.querySelector('.artwork-title-text');
    titleContainerText.textContent = currentGalleryElementTitle;

    // // Update URL with artwork title only if calendar and about are not open
    // if (!document.body.classList.contains('calendar-opened') && !document.body.classList.contains('about-opened')) {
    //     const artworkSlug = currentGalleryElementTitle
    //         .toLowerCase()
    //         .trim()
    //         .replace(/\s+/g, '-')
    //         .replace(/[^a-z0-9\-]/g, '')
    //         .replace(/-+/g, '-')
    //         .replace(/^-|-$/g, '');
    //     window.history.pushState({}, '', `/${artworkSlug}`);
    // }

    const artworkGalleryNumber = document.querySelector('.artwork-number-gallery');
    if (artworkGalleryNumber) {
        artworkGalleryNumber.textContent = currentGalleryIndex + 1;
    }

    const currentGalleryElementMainText = currentGalleryElement.querySelector('.artwork-hidden-main-text').innerHTML;
    const artworkMainText = document.querySelector('.artwork-main-text');
    
    const currentGalleryElementAdditionalTextHidden = currentGalleryElement.querySelector('.artwork-hidden-additional-text').innerHTML;
    
    // Function to convert <br> tags to <p> elements
    function convertBrToParagraphs(htmlString) {
        if (!htmlString) return '';
        
        console.log('Original HTML:', JSON.stringify(htmlString));
        
        // First, check if the content is already wrapped in HTML tags
        const trimmedContent = htmlString.trim();
        
        // If the content starts and ends with <p> tags, extract the inner content
        if (trimmedContent.startsWith('<p>') && trimmedContent.endsWith('</p>')) {
            // Remove outer <p> tags and get inner content
            const innerContent = trimmedContent.slice(3, -4);
            console.log('Extracted inner content:', innerContent);
            
            // Split by <br> tags and process
            const parts = innerContent.split(/<br\s*\/?>/i)
                .map(part => part.trim())
                .filter(part => part !== '');
            
            console.log('Parts after split and filter:', parts);
            
            // Additional safety check: filter out parts that are only whitespace or HTML entities
            const cleanParts = parts.filter(part => {
                const cleanPart = part.replace(/&nbsp;/g, '').replace(/\s/g, '');
                return cleanPart.length > 0;
            });
            
            console.log('Clean parts:', cleanParts);
            
            // Wrap each non-empty part in a <p> tag
            const result = cleanParts.map(part => `<p>${part}</p>`).join('');
            console.log('Final result:', result);
            
            return result;
        } else {
            // Original logic for content not already wrapped
            const parts = htmlString.split(/<br\s*\/?>/i)
                .map(part => part.trim())
                .filter(part => part !== '');
            
            console.log('Parts after split and filter:', parts);
            
            // Additional safety check: filter out parts that are only whitespace or HTML entities
            const cleanParts = parts.filter(part => {
                const cleanPart = part.replace(/&nbsp;/g, '').replace(/\s/g, '');
                return cleanPart.length > 0;
            });
            
            console.log('Clean parts:', cleanParts);
            
            // Wrap each non-empty part in a <p> tag
            const result = cleanParts.map(part => `<p>${part}</p>`).join('');
            console.log('Final result:', result);
            
            return result;
        }
    }
    
    // Check if additional text exists and is not empty
    if (currentGalleryElementAdditionalTextHidden && currentGalleryElementAdditionalTextHidden.trim() !== '') {
        artworkMainText.innerHTML = currentGalleryElementMainText + '<span class="read-more-button"><span class="arrow arrow-margin">→ </span><span class="italic">read more</span></span>';

        const artworkAdditionalText = document.querySelector('.artwork-additional-text');
        // Convert <br> tags to <p> elements before setting the content
        const processedAdditionalText = convertBrToParagraphs(currentGalleryElementAdditionalTextHidden);
        artworkAdditionalText.innerHTML = processedAdditionalText + '<span class="read-more-button"><span class="arrow arrow-margin">← </span><span class="italic">show less</span></span>';

        const currentGalleryElementAuthorText = currentGalleryElement.querySelector('.artwork-hidden-author').textContent;
        const artworkAuthorText = document.querySelector('.artwork-author-text');
        artworkAuthorText.textContent = currentGalleryElementAuthorText;

        const readMoreButtons = document.querySelectorAll('.read-more-button');
        console.log(readMoreButtons);
        readMoreButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (document.body.classList.contains('additional-text-opened')) {
                    closeAdditionalText();
                } else {
                    openAdditionalText();
                }
            });
        });
    } else {
        artworkMainText.innerHTML = currentGalleryElementMainText;
    }
}

function updateCurrentImage() {
    
    if (!currentGalleryElement) return;

    const images = currentGalleryElement.querySelectorAll('.single-gallery-image');
    const galleryRect = artworksGallery.getBoundingClientRect();
    const galleryCenterX = galleryRect.left + (galleryRect.width / 2);
    let closestImage = null;
    let closestDistance = Infinity;
    
    images.forEach((image) => {
        const imageRect = image.getBoundingClientRect();
        const imageCenterX = imageRect.left + (imageRect.width / 2);
        const distance = Math.abs(imageCenterX - galleryCenterX);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestImage = image;
        }
    });
    
    // Find the corresponding image-hidden-caption element
    if (closestImage) {
        const imageIndex = Array.from(images).indexOf(closestImage);
        const hiddenCaptions = currentGalleryElement.querySelectorAll('.image-hidden-caption');
        const closestCaption = hiddenCaptions[imageIndex]; 

        const captionContainer = document.querySelector('.image-caption');
        captionContainer.innerHTML = closestCaption.textContent
            .replace(/ x /g, ' × ')
            .replace(/(\d+(?:,\d+)?\s*[x×]\s*\d+(?:,\d+)?(?:\s*[x×]\s*\d+(?:,\d+)?)*\s*(?:cm|mm|m))/gi, '<span class="dimensions">$1</span>');
        
        // Update URL with image index only if calendar and about are not open AND image has changed
        if (closestImage !== previousCurrentImage && 
            !document.body.classList.contains('calendar-opened') && 
            !document.body.classList.contains('about-opened')) {
            const currentArtworkTitle = currentGalleryElement.querySelector('.artwork-hidden-title').textContent;
            const artworkSlug = currentArtworkTitle
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9\-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            const slugWithIndex = `${artworkSlug}-${imageIndex + 1}`;
            window.history.pushState({}, '', `/${slugWithIndex}`);
            
            // Update the previous image reference
            previousCurrentImage = closestImage;
        }
        
        // Update image counter
        const currentImageNumber = document.querySelector('.current-image-number');
        const totalImageNumber = document.querySelector('.total-image-number');
        if (currentImageNumber && totalImageNumber) {
            currentImageNumber.textContent = String(imageIndex + 1).padStart(2, '0'); // Add 1 and pad with leading zero
            totalImageNumber.textContent = String(images.length).padStart(2, '0'); // Total count with leading zero
        }
        
        const viewExhibitionButton = document.querySelector('.view-exhibition-button');
        // Check if the closest image is an exhibition view
        const isExhibitionView = closestImage.dataset.exhibitionView === 'true';
        if (isExhibitionView && !isArtworkInfoOpen) {
            viewExhibitionButton.classList.add('visible');
            visibleExhibitionImage = closestImage.dataset.exhibition;
            
        } else {
            viewExhibitionButton.classList.remove('visible');
            visibleExhibitionImage = null;
        }
    }
}

// Create throttled version of updateCurrentImage to prevent browser flooding
throttledUpdateCurrentImage = throttle(updateCurrentImage, 50);

function openArtworkInfo() {
    artworksGallery.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const artworkInfoContainer = document.querySelector('.artwork-info-container');
    artworkInfoContainer.classList.remove('hidden');

    isArtworkInfoOpen = true;
    document.body.classList.add('info-opened');
    const artworkMainTextContainer = document.querySelector('.artwork-main-text-container');

    const viewExhibitionButton = document.querySelector('.view-exhibition-button');
    viewExhibitionButton.classList.add('no-opacity');

    // Apply scale transform to the visible gallery element
    const visibleGalleryIndex = getVisibleGalleryIndex();
    const galleryElements = document.querySelectorAll('.artwork-gallery-images-scale');
    const visibleGallery = galleryElements[visibleGalleryIndex];

    // Measure the scroll-height of the artworkMainTextContainer
    if (artworkMainTextContainer) {

        if (!isMobile()) {
            // Force a reflow to ensure accurate measurements
            artworkMainTextContainer.offsetHeight;
            artworkTextHeight = artworkMainTextContainer.offsetHeight;
            artworkTextHeightRatio = artworkTextHeight * 1.4 / window.innerHeight;
            
            // Set the CSS custom property to the text height value
            document.documentElement.style.setProperty('--info-text-height', `${artworkTextHeight}px`);
                                
            if (visibleGallery) {
                galleryScaleValue = 1 - artworkTextHeightRatio;

                if (!isTouchDevice()) {
                    visibleGallery.style.transform = `scale(${galleryScaleValue})`;
                }
            }
            
            // Apply translateY to the parent element
            const visibleGalleryParent = visibleGallery.closest('.artwork-gallery-images');
            if (visibleGalleryParent) {
                visibleGalleryParent.style.transition = 'transform 500ms ease-in-out';
                visibleGalleryParent.style.transform = `translateY(-${artworkTextHeight / 2}px)`;
                
                // Remove transition after animation completes
                setTimeout(() => {
                    visibleGalleryParent.style.transition = '';
                }, 500);
            }

            // Apply scaling to images every 10ms for 500ms
            const images = visibleGallery.querySelectorAll('.single-gallery-image');

            const galleryRect = artworksGallery.getBoundingClientRect();
            const galleryCenter = galleryRect.left + (galleryRect.width / 2);
            
            let intervalCount = 0;
            const maxIntervals = 500; // 500ms / 10ms = 50 intervals
            
            const scalingInterval = setInterval(() => {

                applyScalingToImages(images, galleryCenter);
                intervalCount++;
                
                if (intervalCount >= maxIntervals) {
                    clearInterval(scalingInterval);
                }
            }, 1);
        } else {
            visibleGallery.classList.add('display-none');
        }
    }



    const imageCaption = document.querySelector('.image-caption');
    imageCaption.classList.add('no-opacity');

    setTimeout(() => {
        imageCaption.classList.add('no-height');
    }, 250);

    if (!isMobile()) {
        const artworkTitle = document.querySelector('.artwork-title');
        artworkTitle.classList.add('large-font-size');
    
        artworkInfoButton.textContent = 'Close';
    } else {
        const mobileMenuClose = document.querySelector('.mobile-menu-close');
        mobileMenuClose.classList.add('display-none');

        setTimeout(() => {
            const mobileMenuBack = document.querySelector('.mobile-menu-back');
            mobileMenuBack.classList.remove('display-none');

            mobileMenuBack.addEventListener('click', closeArtworkInfo);
        }, 200);
    }
};

function closeArtworkInfo() {

    if (!isAdditionalTextOpen) {
        const artworkInfoContainer = document.querySelector('.artwork-info-container');
        artworkInfoContainer.classList.add('hidden');
    
        isArtworkInfoOpen = false;
        const artworkMainTextContainer = document.querySelector('.artwork-main-text-container');
    
        const visibleGalleryIndex = getVisibleGalleryIndex();
        const galleryElements = document.querySelectorAll('.artwork-gallery-images-scale');
        const visibleGallery = galleryElements[visibleGalleryIndex];
        
        // Measure the scroll-height of the artworkMainTextContainer
        if (artworkMainTextContainer) {

            if (!isMobile()) {

                if (visibleGallery) {    
                    visibleGallery.style.transform = '';
                }
                
                // Apply translateY to the parent element
                const visibleGalleryParent = visibleGallery.closest('.artwork-gallery-images');
                if (visibleGalleryParent) {
                    visibleGalleryParent.style.transition = 'transform 500ms ease-in-out';
                    visibleGalleryParent.style.transform = `translateY(0)`;
                    
                    // Remove transition after animation completes
                    setTimeout(() => {
                        visibleGalleryParent.style.transition = '';
                    }, 500);
                }

                // Apply scaling to images every 10ms for 500ms
                const images = visibleGallery.querySelectorAll('.single-gallery-image');
        
                const galleryRect = artworksGallery.getBoundingClientRect();
                const galleryCenter = galleryRect.left + (galleryRect.width / 2);
                
                let intervalCount = 0;
                const maxIntervals = 500; // 500ms / 10ms = 50 intervals
                
                const scalingInterval = setInterval(() => {

                    applyScalingToImages(images, galleryCenter);
                    intervalCount++;
                    
                    if (intervalCount >= maxIntervals) {
                        clearInterval(scalingInterval);
                    }
                }, 1);
            } else {
                setTimeout(() => {
                    visibleGallery.classList.remove('display-none');
                }, 500);
            }
        }
    
        const imageCaption = document.querySelector('.image-caption');
        imageCaption.classList.remove('no-height');
    
        setTimeout(() => {

            setTimeout(() => {
                imageCaption.classList.remove('no-opacity');
            }, 210);

            const viewExhibitionButton = document.querySelector('.view-exhibition-button');
            viewExhibitionButton.classList.remove('no-opacity');

            if (isMobile()) {
                document.body.classList.remove('info-opened');
            }
        }, 500);

        if (!isMobile()) {
            document.body.classList.remove('info-opened');
        }
        
        artworksGallery.style.overflow = '';
        document.body.style.overflow = '';

        if (!isMobile()) {
            const artworkTitle = document.querySelector('.artwork-title');
            artworkTitle.classList.remove('large-font-size');

            artworkInfoButton.innerHTML = '<span class="arrow arrow-margin">→</span>Info';
        } else {
            const mobileMenuBack = document.querySelector('.mobile-menu-back');
            mobileMenuBack.removeEventListener('click', closeArtworkInfo);

            mobileMenuBack.classList.add('display-none');
    
            setTimeout(() => {
                const mobileMenuClose = document.querySelector('.mobile-menu-close');
                mobileMenuClose.classList.remove('display-none');
            }, 200);
        }
    } else {
        document.body.classList.remove('additional-text-opened');
        isAdditionalTextOpen = false;
        isArtworkInfoOpen = false;

        const artworkInfoContainer = document.querySelector('.artwork-info-container');
        artworkInfoContainer.classList.add('hidden');
    
        const artworkMainTextContainer = document.querySelector('.artwork-main-text-container');

        const visibleGalleryIndex = getVisibleGalleryIndex();
        const galleryElements = document.querySelectorAll('.artwork-gallery-images-scale');
        const visibleGallery = galleryElements[visibleGalleryIndex];
        
    
        // Measure the scroll-height of the artworkMainTextContainer
        if (artworkMainTextContainer) {

            if (!isTouchDevice()) {
                if (visibleGallery) {    
                    visibleGallery.style.transform = '';
                }
                
                // Apply translateY to the parent element
                const visibleGalleryParent = visibleGallery.closest('.artwork-gallery-images');
                if (visibleGalleryParent) {
                    visibleGalleryParent.style.transform = `translateY(0)`;
                }
    
                // Apply scaling to images every 10ms for 500ms
                const images = visibleGallery.querySelectorAll('.single-gallery-image');
    
                const galleryRect = artworksGallery.getBoundingClientRect();
                const galleryCenter = galleryRect.left + (galleryRect.width / 2);
    
                let intervalCount = 0;
                const maxIntervals = 1000; // 500ms / 10ms = 50 intervals
                
                const scalingInterval = setInterval(() => {
        
                    applyScalingToImages(images, galleryCenter);
                    intervalCount++;
                    
                    if (intervalCount >= maxIntervals) {
                        clearInterval(scalingInterval);
                    }
                }, 1);

            } else {
                setTimeout(() => {
                    visibleGallery.classList.remove('display-none');
                }, 500);
            }
        }
    
        artworksGallery.style.overflow = '';
        document.body.style.overflow = '';

        if (!isMobile()) {
            const artworkTitle = document.querySelector('.artwork-title');
            artworkTitle.classList.remove('large-font-size');

            artworkInfoButton.innerHTML = '<span class="arrow arrow-margin">→</span>Info';
        } else {
            const mobileMenuBack = document.querySelector('.mobile-menu-back');
            mobileMenuBack.removeEventListener('click', closeArtworkInfo);

            mobileMenuBack.classList.add('display-none');
    
            setTimeout(() => {
                const mobileMenuClose = document.querySelector('.mobile-menu-close');
                mobileMenuClose.classList.remove('display-none');
            }, 200);
        }
    
        const imageCaption = document.querySelector('.image-caption');
        imageCaption.classList.remove('no-height');
    
        setTimeout(() => {

            setTimeout(() => {
                imageCaption.classList.remove('no-opacity');
            }, 210);

            const viewExhibitionButton = document.querySelector('.view-exhibition-button');
            viewExhibitionButton.classList.remove('no-opacity');

            if (isMobile()) {
                document.body.classList.remove('info-opened');
            }
        }, 500);

        if (!isMobile()) {
            document.body.classList.remove('info-opened');
        }

        setTimeout(() => {

            currentGalleryElement.style.transition = 'all 0.5s ease-in-out';
            currentGalleryElement.style.opacity = '1';
            document.body.classList.remove('right');
        }, 500);
    
        setTimeout(() => {
            currentGalleryElement.style.transition = '';
            const artworkAdditionalTextContainer = document.querySelector('.artwork-additional-text-container');
            if (artworkAdditionalTextContainer) {
                artworkAdditionalTextContainer.scrollTop = 0;
            }
        }, 1000);
    }
};

function openAdditionalText() {
    document.body.classList.add('additional-text-opened');
    isAdditionalTextOpen = true;

    currentGalleryElement.style.transition = 'all 0.3s ease-in-out';
    currentGalleryElement.style.opacity = '0';

    setTimeout(() => {
        currentGalleryElement.style.transition = '';
    }, 300);
};

function closeAdditionalText() {
    document.body.classList.remove('additional-text-opened');
    isAdditionalTextOpen = false;

    setTimeout(() => {
        currentGalleryElement.style.transition = 'all 0.3s ease-in-out';
        currentGalleryElement.style.opacity = '1';
    }, 300);

    setTimeout(() => {
        currentGalleryElement.style.transition = '';
        const artworkAdditionalTextContainer = document.querySelector('.artwork-additional-text-container');
        if (artworkAdditionalTextContainer) {
            artworkAdditionalTextContainer.scrollTop = 0;
        }
    }, 600);
};

artworkInfoButton.addEventListener('click', () => {
    if (isCalendarOpen) {
        toggleCalendar();

        setTimeout(() => {
            toggleArtworkInfo(false);
        }, 600);
    } else if (isAboutOpen) {
        toggleAbout();

        setTimeout(() => {
            toggleArtworkInfo(false);
        }, 600);
    } else {
        toggleArtworkInfo(true);
    }
});

function toggleArtworkInfo(stepScaling) {
    if (isArtworkInfoOpen) {
        closeArtworkInfo(stepScaling);
    } else {
        openArtworkInfo(stepScaling);
    }
}






// Function to get CSS custom property value
function getCSSVariableValue(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

// Function to apply scale to gallery elements
function scaleDownGalleryElements(isOpen) {
    // if (!isOpen) {
    //     const scaleValue = getCSSVariableValue('--scale-value');
    //     const galleryElements = document.querySelectorAll('.artwork-gallery-images-inner');
        
    //     galleryElements.forEach(element => {
    //         // Add transition for smooth scaling
    //         element.style.transition = 'transform 500ms ease-in-out';
            
    //         const currentTransform = element.style.transform || '';
            
    //         // Extract translateX value if it exists
    //         const translateXMatch = currentTransform.match(/translateX\(([^)]+)%\)/);
    //         const translateXValue = translateXMatch ? translateXMatch[1] : '0';
            
    //         // Combine translateX and scale
    //         const newTransform = `translateX(${translateXValue}%) scale(${scaleValue})`;
    //         element.style.transform = newTransform;
            
    //         // Remove transition after animation completes
    //         setTimeout(() => {
    //             element.style.transition = '';
    //         }, 500);
    //     });
    // } else {
    //     const galleryElements = document.querySelectorAll('.artwork-gallery-images-inner');
        
    //     galleryElements.forEach(element => {
    //         // Add transition for smooth scaling
    //         element.style.transition = 'transform 500ms ease-in-out';
            
    //         const currentTransform = element.style.transform || '';
            
    //         // Extract translateX value if it exists, removing any scale
    //         const translateXMatch = currentTransform.match(/translateX\(([^)]+)%\)/);
    //         const translateXValue = translateXMatch ? translateXMatch[1] : '0';
            
    //         // Apply only translateX, removing scale
    //         const newTransform = `translateX(${translateXValue}%)`;
    //         element.style.transform = newTransform;
            
    //         // Remove transition after animation completes
    //         setTimeout(() => {
    //             element.style.transition = '';
    //         }, 500);
    //     });
    // }
}

aboutButton.addEventListener('click', () => {

    removeInitializationClasses();

    if (isCalendarOpen) {
        toggleCalendar();

        setTimeout(() => {
            toggleAbout();
        }, 600);
    } else if (isArtworkInfoOpen) {
        closeArtworkInfo(false);

        setTimeout(() => {
            toggleAbout();
        }, 700);
    } else if (isAdditionalTextOpen) {
        closeArtworkInfo(false);

        setTimeout(() => {
            toggleAbout();
        }, 1000);
    } else {

        toggleAbout();
    }
});

calendarButton.addEventListener('click', () => {

    removeInitializationClasses();

    if (isAboutOpen) {
        toggleAbout();

        setTimeout(() => {
            toggleCalendar();
        }, 510);
    } else if (isArtworkInfoOpen) {
        closeArtworkInfo(false);

        setTimeout(() => {
            toggleCalendar();
        }, 700);
    } else if (isAdditionalTextOpen) {
        closeArtworkInfo(false);

        setTimeout(() => {
            toggleCalendar();
        }, 1000);
    } else {
        toggleCalendar();
    }
});

calendarCloseButton.addEventListener('click', () => {
    if (isAboutOpen) {
        toggleAbout();

        setTimeout(() => {
            toggleCalendar();
        }, 510);
    } else if (isArtworkInfoOpen) {
        closeArtworkInfo(false);

        setTimeout(() => {
            toggleCalendar();
        }, 700);
    } else if (isAdditionalTextOpen) {
        closeArtworkInfo(false);

        setTimeout(() => {
            toggleCalendar();
        }, 1000);
    } else {

        toggleCalendar();
    }
});


websiteTitle.addEventListener('click', closeAll);

function closeAll() {

    if(isMobile()) {
        if(document.body.classList.contains('detail-view')) {
            if(document.body.classList.contains('info-opened')) {
                toggleArtworkInfo();

                setTimeout(() => {
                    handleGalleryClick();
                }, 1000);
            } else if(document.body.classList.contains('exhibition-opened-mobile')) {
                closeExhibition();

                setTimeout(() => {
                    handleGalleryClick();
                }, 500);
            } else {
                handleGalleryClick();
            }
        }

        if(document.body.classList.contains('about-opened')) {
            toggleAbout();

            setTimeout(() => {
                openMobileMenu();
            }, 400);
        } else if(document.body.classList.contains('calendar-opened')) {
            toggleCalendar();

            setTimeout(() => {
                openMobileMenu();
            }, 400);
        } else if(document.body.classList.contains('mobile-menu-opened')) {
            openMobileMenu();
        }

        return;
    }

    if(document.body.classList.contains('detail-view')) {
        if(document.body.classList.contains('additional-text-opened')) {
            toggleArtworkInfo();

            setTimeout(() => {
                handleGalleryClick();
            }, 800);
        } else if(document.body.classList.contains('info-opened')) {
            toggleArtworkInfo();

            setTimeout(() => {
                handleGalleryClick();
            }, 400);
        } else if(document.body.classList.contains('calendar-opened')) {
            toggleCalendar();

            setTimeout(() => {
                handleGalleryClick();
            }, 400);
        } else if(document.body.classList.contains('about-opened')) {
            toggleAbout();

            setTimeout(() => {
                handleGalleryClick();
            }, 400);
        } else {
            handleGalleryClick();
        }
    } else {
        if(document.body.classList.contains('about-opened')) {
            toggleAbout();
        }
    
        if(document.body.classList.contains('calendar-opened')) {
            toggleCalendar();
        }
    }
}


function toggleCalendar() {
    if (isCalendarOpen) {
        document.body.classList.remove('calendar-opened');
        stepScaling(false);
        isCalendarOpen = false;

        // Remove entire calendar path from URL (including any event titles)
        const currentPath = window.location.pathname;
        if (currentPath.includes('calendar')) {
            const newPath = currentPath.replace(/\/calendar.*$/, '');
            window.history.pushState({}, '', newPath || '/');
        }

        setTimeout(() => {

            if(document.body.classList.contains('detail-view')) {
                updateCurrentImage();
            }
            
            closeAllCalendarEvents();

            const viewExhibitionButton = document.querySelector('.view-exhibition-button');
            viewExhibitionButton.classList.remove('no-opacity');

            // Scroll the about scroll container back to the top
            const calendarScrollContainer = document.querySelector('.calendar-scroll-container');
            if (calendarScrollContainer) {
                calendarScrollContainer.scrollTop = 0;
            }
        }, 510);

    } else {

        setEventContentHeight();
        document.body.classList.add('calendar-opened');
        stepScaling(true);
        isCalendarOpen = true;

        // Add "calendar" to URL, replacing any existing slug
        const currentPath = window.location.pathname;
        const basePath = currentPath.replace(/\/[^\/]*$/, ''); // Remove everything after the last slash
        const newPath = basePath + 'calendar';
        window.history.pushState({}, '', newPath);

        const viewExhibitionButton = document.querySelector('.view-exhibition-button');
        viewExhibitionButton.classList.add('no-opacity');


        setTimeout(() => {
            updateCurrentImage();
        }, 510);
    }
}

function closeAllCalendarEvents() {
    // Find all event content elements that are currently showing full information
    const allEventContents = document.querySelectorAll('.event-content');
    
    allEventContents.forEach(content => {
        if (!content.classList.contains('preview-visible')) {
            // This event is showing full information, reset it to preview mode
            const previewContainer = content.querySelector('.event-preview-container');
            const fullContainer = content.querySelector('.event-full-container');
            
            // Temporarily disable transitions
            const originalTransition = content.style.transition;
            content.style.transition = 'none';
            
            // Show preview container, hide full container
            previewContainer.classList.remove('display-none');
            previewContainer.classList.remove('no-opacity');
            fullContainer.classList.add('display-none');
            fullContainer.classList.add('no-opacity');

            
            // Reset height to preview height
            const previewHeight = previewContainer.scrollHeight;
            content.style.height = previewHeight + 'px';
            
            // Add preview-visible class to indicate preview mode
            content.classList.add('preview-visible');
            
            // Re-enable transitions after a brief delay to ensure the reset is complete
            setTimeout(() => {
                content.style.transition = ' ';
            }, 10);
        }
    });
}


function toggleAbout() {
    if (isAboutOpen) {
        document.body.classList.remove('about-opened');
        aboutButton.textContent = 'About';
        stepScaling(false);
        isAboutOpen = false;

        // Remove "about" or "imprint" from URL
        const currentPath = window.location.pathname;
        if (currentPath.endsWith('about') || currentPath.endsWith('imprint')) {
            const newPath = currentPath.replace(/(about|imprint)$/, '');
            window.history.pushState({}, '', newPath || '/');
        }

        setTimeout(() => {
            document.body.classList.remove('right');

            if(document.body.classList.contains('detail-view')) {
                updateCurrentImage();
            }

            const viewExhibitionButton = document.querySelector('.view-exhibition-button');
            viewExhibitionButton.classList.remove('no-opacity');

            // Scroll the about scroll container back to the top
            const aboutScrollContainer = document.querySelector('.about-scroll-container');
            if (aboutScrollContainer) {
                aboutScrollContainer.scrollTop = 0;
            }

            if(document.body.classList.contains('imprint-opened-2')) {

                document.body.classList.remove('imprint-opened-2');
                document.body.classList.add('imprint-opened-1');

                setTimeout(() => {
                    document.body.classList.remove('imprint-opened-1');
                }, 250);
            }

        }, 510);
    } else {
        document.body.classList.add('right');

        // Add "about" to URL, replacing any existing slug — but preserve "imprint" if already present (deep-link init)
        const currentPath = window.location.pathname;
        if (!currentPath.endsWith('imprint')) {
            const basePath = currentPath.replace(/\/[^\/]*$/, ''); // Remove everything after the last slash
            const newPath = basePath + 'about';
            window.history.pushState({}, '', newPath);
        }

        setTimeout(() => {
            document.body.classList.add('about-opened');
            aboutButton.textContent = 'Close';
            stepScaling(true);
            isAboutOpen = true;

            const viewExhibitionButton = document.querySelector('.view-exhibition-button');
            viewExhibitionButton.classList.add('no-opacity');

        }, 10);

        setTimeout(() => {
            updateCurrentImage();
        }, 510);
    }
}

// Function to check if the last image of the current gallery is visible in viewport
function isLastImageVisible() {
    const currentGalleryIndex = getVisibleGalleryIndex();
    const galleryElements = document.querySelectorAll('.artwork-gallery-images-inner');
    const currentGallery = galleryElements[currentGalleryIndex];
    
    if (!currentGallery) return false;
    
    const images = currentGallery.querySelectorAll('.single-gallery-image');
    if (images.length === 0) return false;
    
    const lastImage = images[images.length - 1];
    const lastImageRect = lastImage.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Check if any part of the last image is visible in the viewport
    return lastImageRect.left < viewportWidth && lastImageRect.right > 0;
}

function stepScaling(adjustTranslateX = false) {
    const images = document.querySelectorAll('.single-gallery-image');
    if (!images || images.length === 0 || !artworksGallery) {
        return;
    }

    const durationMs = 500;
    let animationStartTimestampMs = null;
    
    // Get the current gallery element
    const currentGalleryIndex = getVisibleGalleryIndex();
    const galleryElements = document.querySelectorAll('.artwork-gallery-images-inner');
    const currentGallery = galleryElements[currentGalleryIndex];
    
    if (!currentGallery) {
        return;
    }
    
    // Check if last image is visible and only adjust translateX if it's not
    const lastImageVisible = isLastImageVisible();
    
    // Get initial translateX value and add 7%
    let initialTranslateX = getTranslateXFromElement(currentGallery);
    const newTranslateX = initialTranslateX + 5;
    
    if(adjustTranslateX && lastImageVisible) {
        // Add CSS transition and apply the new translateX value
        currentGallery.style.transition = 'transform 0.5s ease-in-out';
        currentGallery.style.transform = `translateX(${newTranslateX}%)`;
        
        // Update the gallery state immediately to prevent jumps during scrolling
        updateGalleryState(currentGallery, {
            currentData: { value: newTranslateX, index: currentGalleryIndex },
            currentTranslateXPercent: newTranslateX
        });
    }

    // Cancel any previous in-flight animation to avoid overlaps
    if (window.__stepScalingAnimationFrameId != null) {
        cancelAnimationFrame(window.__stepScalingAnimationFrameId);
        window.__stepScalingAnimationFrameId = null;
    }

    const animateScaling = (timestampMs) => {
        if (animationStartTimestampMs === null) {
            animationStartTimestampMs = timestampMs;
        }

        const galleryRect = artworksGallery.getBoundingClientRect();
        const galleryCenter = galleryRect.left + (galleryRect.width / 2);
        applyScalingToImages(images, galleryCenter);

        const elapsedMs = timestampMs - animationStartTimestampMs;
        if (elapsedMs < durationMs) {
            window.__stepScalingAnimationFrameId = requestAnimationFrame(animateScaling);
        } else {
            window.__stepScalingAnimationFrameId = null;
            // Remove transition after animation completes
            currentGallery.style.transition = '';
        }
    };

    window.__stepScalingAnimationFrameId = requestAnimationFrame(animateScaling);
}

function recalculateArtworkTextValues() {
    if (isArtworkInfoOpen) {
        const artworkMainTextContainer = document.querySelector('.artwork-main-text-container');
        
        if (artworkMainTextContainer) {
            // Force a reflow to ensure accurate measurements
            artworkMainTextContainer.offsetHeight;
            artworkTextHeight = artworkMainTextContainer.offsetHeight;
            artworkTextHeightRatio = artworkTextHeight * 1.4 / window.innerHeight;
            
            // Update the CSS custom property
            document.documentElement.style.setProperty('--info-text-height', `${artworkTextHeight}px`);
            
            // Update gallery scaling if artwork info is open
            const visibleGalleryIndex = getVisibleGalleryIndex();
            const galleryElements = document.querySelectorAll('.artwork-gallery-images-inner');
            const visibleGallery = galleryElements[visibleGalleryIndex];
            
            if (visibleGallery) {
                galleryScaleValue = 1 - artworkTextHeightRatio;
                
                // Get the current transform to preserve translateX
                const currentTransform = visibleGallery.style.transform || '';
                
                // Extract the translateX value if it exists
                const translateXMatch = currentTransform.match(/translateX\(([^)]+)%\)/);
                const translateXValue = translateXMatch ? translateXMatch[1] : '0';
                
                // Combine translateX and updated scale
                const newTransform = `translateX(${translateXValue}%) scale(${galleryScaleValue})`;
                visibleGallery.style.transform = newTransform;
            }
            
            // Update translateY on the parent element
            const visibleGalleryParent = visibleGallery.closest('.artwork-gallery-images');
            if (visibleGalleryParent) {
                visibleGalleryParent.style.transform = `translateY(-${artworkTextHeight / 2}px)`;
            }
        }
    }
}

// Add window resize event listener
window.addEventListener('resize', () => {
    recalculateArtworkTextValues();
});

// Dynamic Height Adjustment for Gallery Images
function initializeGalleryImageScaling() {
    const galleryContainers = document.querySelectorAll('.artwork-gallery-images');
    
    galleryContainers.forEach(container => {
        // Initial scaling
        updateImageScaling(container);
        
        // Add scroll event listener with throttling for performance
        let scrollTimeout;
        container.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                updateImageScaling(container);
            }, 16); // ~60fps
        });
    });
}



document.addEventListener('DOMContentLoaded', () => {
    const viewSeriesButtons = document.querySelectorAll('.view-series-button');
    viewSeriesButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            navigateToGallerySeries(event.target);
        });
    });

    const viewExhibitionButton = document.querySelector('.view-exhibition-button');
    viewExhibitionButton.addEventListener('click', navigateToExhibition);
});

async function navigateToGallerySeries(button) {
    console.log('navigateToGallerySeries');
    const parent = button.closest('.event-image-caption');
    const seriesTitle = parent.querySelector('.visible-artwork-title').textContent;
    console.log('seriesTitle', seriesTitle);
    
    // Sanitize the title to match the class format (same as PHP)
    const sanitizedTitle = seriesTitle.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    console.log('sanitizedTitle', sanitizedTitle);
    if (isDetailView) {

        const galleryClass = `${sanitizedTitle}-gallery`;
    
        // Find the gallery container with this class
        const galleryContainer = document.querySelector(`.${galleryClass}`);
        console.log('galleryContainer', galleryContainer);
        if (!galleryContainer) {
            return;
        }
    
        // Get all gallery containers and find the index of the current one
        const allGalleryContainers = document.querySelectorAll('.artwork-gallery-images-container');
        const galleryIndex = Array.from(allGalleryContainers).indexOf(galleryContainer);
        
        // Check if the target gallery is currently visible using getVisibleGalleryIndex()
        const currentVisibleIndex = getVisibleGalleryIndex();
        const isTargetGalleryVisible = currentVisibleIndex === galleryIndex;
        
        if (!isTargetGalleryVisible) {
            if (!isTouchDevice()) {
                (async () => {
                    await centreImage(galleryIndex, 0);
                    const translateYValue = - ((galleryIndex) * 100);
                    artworksGalleryOutter.style.transform = `translateY(${translateYValue}dvh)`;
                    setTimeout(() => {
                        // Re-initialize gallery scaling and scrolling for the new gallery
                        initializeGalleryScalingAndScrolling();
                        updateCurrentArtwork();
                    }, 500);

                    setTimeout(() => {
                        updateCurrentImage();
                    }, 600);
                })();
            } else {
                galleryContainer.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            if(isMobile()) {
                if(document.body.classList.contains('exhibition-opened-mobile')) {
                    closeExhibition();
                } else {
                    toggleCalendarMobile();
                }
            }
        }
    } else {
        const overviewClass = `${sanitizedTitle}-overview`;
    
        // Find the gallery container with this class
        const overviewContainer = document.querySelector(`.${overviewClass}`);
        console.log('overviewContainer', overviewContainer);
        if (!overviewContainer) {
            return;
        }

        // Get the first image from the overview container
        const firstImage = overviewContainer.querySelector('.single-image');
    
        if (!isTouchDevice()) {

            await scrollToElement(overviewContainer);

            setTimeout(() => {
                handleSingleImageClick(firstImage);
            }, 200);
        } else {

            if(isMobile()) {
                toggleCalendarMobile();

                setTimeout(() => {
                    const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
                    mobileMenuItems.forEach(item => {
                        item.classList.add('no-opacity');
                    });
                }, 250);
    
                setTimeout(() => {
                    document.body.classList.remove('mobile-menu-opened');
                }, 500);
            }

            setTimeout(async () => {
                await scrollToElement(overviewContainer);
                
                setTimeout(() => {
                    handleSingleImageClick(firstImage);
                }, 10);
            }, 500);

            setTimeout(() => {
                header.classList.remove('no-blend');
            }, 1000);
        }
    }
}

function scrollToElement(element) {
    return new Promise((resolve) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    resolve();
                }
            });
        }, { threshold: 0.5 });
        
        element.scrollIntoView({ behavior: 'smooth' });
        observer.observe(element);
    });
}

function removeInitializationClasses() {
    // Remove all initialize-left and initialize-right classes from the DOM
    const initializeElements = document.querySelectorAll('.initialize-left, .initialize-right');
    initializeElements.forEach(element => {
        element.classList.remove('initialize-left');
        element.classList.remove('initialize-right');
    });
    
    // Mark as completed
    initializationClassesRemoved = true;
}   

function navigateToExhibition() {

    removeInitializationClasses();

    if (!isMobile()) {
        if (!isCalendarOpen) {
            if (isAboutOpen) {
                toggleAbout();
        
                setTimeout(() => {
                    openExhibition();
                    toggleCalendar();
                }, 510);
    
            } else if (isArtworkInfoOpen) {
                closeArtworkInfo(false);
        
                setTimeout(() => {
                    openExhibition();
                    toggleCalendar();
                }, 800);
            } else if (isAdditionalTextOpen) {
                closeArtworkInfo(false);
        
                setTimeout(() => {
                    openExhibition();
                    toggleCalendar();
                }, 1000);
            } else {
                openExhibition();
                toggleCalendar();
            }  
        } else {
            openExhibition();
        }
    } else {
        document.body.classList.add('exhibition-opened-mobile');

        const mobileMenuClose = document.querySelector('.mobile-menu-close');
        mobileMenuClose.classList.add('display-none');

        setTimeout(() => {
            const mobileMenuBack = document.querySelector('.mobile-menu-back');
            mobileMenuBack.classList.remove('display-none');

            mobileMenuBack.addEventListener('click', closeExhibition);
        }, 200);

        setTimeout(() => {
            openExhibition();
        }, 200);
    }
}

function openExhibition() {
    // Sanitize the exhibition image name to match the class format (same as PHP)
    const sanitizedExhibitionImage = visibleExhibitionImage.toLowerCase().replace(/[^a-z]/g, '');
    const eventClass = `${sanitizedExhibitionImage}-event`;
    const eventContainer = document.querySelector(`.${eventClass}`);
    const eventContent = eventContainer.querySelector('.event-content');
    const previewContainer = eventContent.querySelector('.event-preview-container');
    const fullContainer = eventContent.querySelector('.event-full-container');

        // Get the current scroll position and the element's position
    const scrollContainer = document.querySelector('.calendar-scroll-container') || window;
    const currentScrollTop = scrollContainer.scrollTop || window.pageYOffset;
    const elementTop = eventContent.getBoundingClientRect().top + currentScrollTop;

    if (!eventContainer) {
        return;
    }

    if (eventContent.classList.contains('preview-visible')) {
        // Expanding to full view
        previewContainer.classList.add('no-opacity');
        fullContainer.classList.remove('display-none');

        // Load high-resolution images when expanding to full view
        loadHighResEventImagesForEvent(eventContent);

        // Update URL with calendar event name (delayed to avoid conflict with toggleCalendar)
        setTimeout(() => {
            const eventTitle = eventContainer?.querySelector('.event-title')?.textContent || 'calendar-event';
            const urlSlug = eventTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            window.history.pushState({}, '', `/calendar/${urlSlug}`);
        }, 1000);
    
        setTimeout(() => {
            const newHeight = fullContainer.scrollHeight;
            const heightDifference = newHeight - eventContent.offsetHeight;
            
            eventContent.style.height = newHeight + 'px';
            
        }, 250);

        setTimeout(() => {
            previewContainer.classList.add('display-none');
            fullContainer.classList.remove('no-opacity');
            eventContent.classList.remove('preview-visible');
            
        }, 750);

        setTimeout(() => {
                // Scroll the event container to the top of the calendar scroll container with overscroll
                const eventContainerTop = eventContainer.offsetTop;
                const overscrollOffset = -1; // 20px overscroll
                scrollContainer.scrollTo({
                    top: eventContainerTop - overscrollOffset,
                    behavior: 'smooth'
                });
            }, 300);
    } else {
        setTimeout(() => {
            // Scroll the event container to the top of the calendar scroll container with overscroll
            const eventContainerTop = eventContainer.offsetTop;
            const overscrollOffset = -3; // 20px overscroll
            scrollContainer.scrollTo({
                top: eventContainerTop - overscrollOffset,
                behavior: 'smooth'
            });
        }, 300);
    }
}

function closeExhibition() {
    document.body.classList.remove('exhibition-opened-mobile');

    // Reset URL to root (remove entire calendar path)
    window.history.pushState({}, '', '/');

    // Update current image info
    updateCurrentImage();

    const mobileMenuBack = document.querySelector('.mobile-menu-back');
    mobileMenuBack.classList.add('display-none');

    setTimeout(() => {
        const mobileMenuClose = document.querySelector('.mobile-menu-close');
        mobileMenuClose.classList.remove('display-none');

        mobileMenuBack.removeEventListener('click', closeExhibition);
    }, 200);
}

function applyMobileSwipeScaling() {
    const galleries = document.querySelectorAll('.artwork-gallery-images-inner');

    galleries.forEach(gallery => {
        const images = gallery.querySelectorAll('.single-gallery-image');
        
        // Add scroll event listener to check for last image overscroll
        const galleryContainer = gallery.closest('.artwork-gallery-images');
        if (galleryContainer) {
            galleryContainer.addEventListener('scroll', () => {
                const lastImage = images[images.length - 1];
                if (lastImage) {
                    const lastImageRect = lastImage.getBoundingClientRect();
                    const viewportCenterX = window.innerWidth / 2;
                    const lastImageCenterX = lastImageRect.left + (lastImageRect.width / 2);
                    
                    // Check if last image is 10px over the center to the left
                    if (lastImageCenterX < (viewportCenterX - 10) && !document.body.classList.contains('info-opened')) {
                        // Get the current gallery index and scroll to the next one
                        const allGalleryContainers = document.querySelectorAll('.artwork-gallery-images-container');
                        const currentContainer = gallery.closest('.artwork-gallery-images-container');
                        const currentIndex = Array.from(allGalleryContainers).indexOf(currentContainer);
                        
                        // Check if there's a next gallery to scroll to
                        if (currentIndex !== -1 && currentIndex < allGalleryContainers.length - 1) {
                            const nextIndex = currentIndex + 1;
                            const nextGalleryContainer = allGalleryContainers[nextIndex];
                            
                            // Scroll to the next gallery using actual scrolling
                            if (nextGalleryContainer) {
                                nextGalleryContainer.scrollIntoView({ 
                                    behavior: 'smooth',
                                    block: 'start'
                                });
                            }
                        }
                    }
                    
                    // Check if first image is 10px over the center to the right
                    const firstImage = images[0];
                    if (firstImage) {
                        const firstImageRect = firstImage.getBoundingClientRect();
                        const firstImageCenterX = firstImageRect.left + (firstImageRect.width / 2);
                        
                        if (firstImageCenterX > (viewportCenterX + 10) && !document.body.classList.contains('info-opened')) {
                            // Get the current gallery index and scroll to the previous one
                            const allGalleryContainers = document.querySelectorAll('.artwork-gallery-images-container');
                            const currentContainer = gallery.closest('.artwork-gallery-images-container');
                            const currentIndex = Array.from(allGalleryContainers).indexOf(currentContainer);
                            
                            // Check if there's a previous gallery to scroll to
                            if (currentIndex !== -1 && currentIndex > 0) {
                                const prevIndex = currentIndex - 1;
                                const prevGalleryContainer = allGalleryContainers[prevIndex];
                                
                                // Scroll to the previous gallery using actual scrolling
                                if (prevGalleryContainer) {
                                    prevGalleryContainer.scrollIntoView({ 
                                        behavior: 'smooth',
                                        block: 'start'
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }
        
        images.forEach(image => {
            // Define animation parameters based on device type - more subtle scaling
            const isMobile = window.matchMedia("(max-width: 576px)").matches;
            const isTablet = window.matchMedia("(max-width: 1300px)").matches;
            const scrollDuration = isMobile ? 1 : isTablet ? 0.8 : 0.1;
            const scaleStart = isMobile ? 0.3 : isTablet ? 0.15 : 0.2;
            const scaleEnd = isMobile ? 1 : isTablet ? 0.7 : 1;

            // Clear any existing ScrollTrigger instances for this image
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.trigger === image) {
                    trigger.kill();
                }
            });

            // GSAP timeline for each image
            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: image,
                    scroller: gallery.closest('.artwork-gallery-images'),
                    start: "0% 100%",
                    end: "100% 0%",
                    scrub: true,
                    ease: "none",
                    horizontal: true,
                },
            });

            // Animation: Scale up and then scale back down
            timeline.fromTo(
                image,
                { scale: scaleStart },
                { scale: scaleEnd, duration: scrollDuration, ease: "linear" }
            );

            timeline.to(
                image,
                { scale: scaleStart, duration: scrollDuration, ease: "linear" },
                scrollDuration
            );
        });
    });
}

// Set up ScrollTrigger animations
document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger plugin
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
    
    if (isTouchDevice()) {
        setTimeout(() => {
            applyMobileSwipeScaling();
        }, 1000);

        const mobileMenuButton = document.querySelector('.mobile-menu-button');
        mobileMenuButton.addEventListener('click', () => {
            openMobileMenu();
        });

        const artworksGalleryOutter = document.querySelector('.artworks-gallery-outter-container');
        const artworkGalleryImages = document.querySelectorAll('.artwork-gallery-images');

        artworksGalleryOutter.addEventListener('scroll', updateCurrentArtwork);
        artworkGalleryImages.forEach(image => {
            image.addEventListener('scroll', updateCurrentImage);
        });
    }
});

function openMobileMenu() {

    const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
    const header = document.querySelector('#header');
    const mobileMenuAbout = document.querySelector('.mobile-menu-about');
    const mobileMenuCalendar = document.querySelector('.mobile-menu-calendar');

    if (document.body.classList.contains('mobile-menu-opened')) {

        // Remove event listeners when closing
        if (mobileMenuAbout) {
            mobileMenuAbout.removeEventListener('click', handleAboutClick);
        }
        if (mobileMenuCalendar) {
            mobileMenuCalendar.removeEventListener('click', handleCalendarClick);
        }

        if (document.body.classList.contains('about-opened')) {
            toggleAboutMobile();

            setTimeout(() => {
                mobileMenuItems.forEach(item => {
                    item.classList.add('no-opacity');
                });
            }, 250);

            setTimeout(() => {
                document.body.classList.remove('mobile-menu-opened');
            }, 500);

            setTimeout(() => {
                header.classList.remove('no-blend');
            }, 1000);
        } else if (document.body.classList.contains('calendar-opened')) {

            toggleCalendarMobile();

            setTimeout(() => {
                mobileMenuItems.forEach(item => {
                    item.classList.add('no-opacity');
                });
            }, 250);

            setTimeout(() => {
                document.body.classList.remove('mobile-menu-opened');
            }, 500);

            setTimeout(() => {
                header.classList.remove('no-blend');
            }, 1000);
        } else {

            mobileMenuItems.forEach(item => {
                item.classList.add('no-opacity');
            });

            setTimeout(() => {
                document.body.classList.remove('mobile-menu-opened');
            }, 250);

            setTimeout(() => {
                header.classList.remove('no-blend');
            }, 750);

        }

    } else {
        document.body.classList.add('mobile-menu-opened');
        header.classList.add('no-blend');

        mobileMenuAbout.addEventListener('click', handleAboutClick);
        mobileMenuCalendar.addEventListener('click', handleCalendarClick);

        setTimeout(() => {
            mobileMenuItems.forEach(item => {
                item.classList.remove('no-opacity');
            });
        }, 300);
    }
}

// Define the event handler functions outside so they can be referenced for removal
function handleAboutClick() {

    removeInitializationClasses();

    if (document.body.classList.contains('calendar-opened')) {
        document.body.classList.remove('calendar-opened');
        // Keep boolean flag in sync when closing calendar via mobile About
        isCalendarOpen = false;
    }
    toggleAboutMobile();
}

function handleCalendarClick() {

    removeInitializationClasses();

    if (document.body.classList.contains('about-opened')) {
        toggleAboutMobile();
    }
    toggleCalendarMobile();
}

function toggleAboutMobile() {
    const wasAboutOpen = document.body.classList.contains('about-opened');
    document.body.classList.toggle('about-opened');

    // Handle URL changes
    if (!wasAboutOpen) {
        // Opening about - add "about" to URL, replacing any existing slug — but preserve "imprint" if already present (deep-link init)
        const currentPath = window.location.pathname;
        if (!currentPath.endsWith('imprint')) {
            const basePath = currentPath.replace(/\/[^\/]*$/, ''); // Remove everything after the last slash
            const newPath = basePath + 'about';
            window.history.pushState({}, '', newPath);
        }
    } else {
        // Closing about - remove "about" or "imprint" from URL
        const currentPath = window.location.pathname;
        if (currentPath.endsWith('about') || currentPath.endsWith('imprint')) {
            const newPath = currentPath.replace(/(about|imprint)$/, '');
            window.history.pushState({}, '', newPath || '/');
        }
    }

    setTimeout(() => {
        if(!document.body.classList.contains('about-opened')) {
            const aboutScrollContainer = document.querySelector('.about-scroll-container');
            if (aboutScrollContainer) {
                aboutScrollContainer.scrollTop = 0;
            }
    
            if(document.body.classList.contains('imprint-opened-2')) {
    
                document.body.classList.remove('imprint-opened-2');
                document.body.classList.add('imprint-opened-1');
    
                setTimeout(() => {
                    document.body.classList.remove('imprint-opened-1');
                }, 250);
            }
        };
    }, 1000);
}

function toggleCalendarMobile() {
    // Toggle class and keep boolean flag in sync
    closeAllCalendarEvents();

    const wasCalendarOpen = isCalendarOpen;
    
    // Force a reflow to ensure the initial CSS state is established before applying the class change
    // This fixes the issue where the transition doesn't work on the first open
    const calendarContainer = document.querySelector('.calendar-outter-container');
    if (calendarContainer && !wasCalendarOpen) {
        // Force reflow by reading a layout property
        calendarContainer.offsetHeight;
    }
    
    const calendarNowOpen = document.body.classList.toggle('calendar-opened');
    isCalendarOpen = calendarNowOpen;

    // Handle URL changes
    if (!wasCalendarOpen) {

        // Opening calendar - add "calendar" to URL, replacing any existing slug
        const currentPath = window.location.pathname;
        const basePath = currentPath.replace(/\/[^\/]*$/, ''); // Remove everything after the last slash
        const newPath = basePath + 'calendar';
        window.history.pushState({}, '', newPath);
    } else {
        // Closing calendar - remove entire calendar path from URL (including any event titles)
        const currentPath = window.location.pathname;
        if (currentPath.includes('calendar')) {
            const newPath = currentPath.replace(/\/calendar.*$/, '');
            window.history.pushState({}, '', newPath || '/');
        }
    }

    const calendarScrollContainer = document.querySelector('.calendar-scroll-container');
    if (calendarScrollContainer) {
        calendarScrollContainer.scrollTop = 0;
    }

}










// Comprehensive window resize handler
function handleWindowResize() {
    
    // Debounce resize events for better performance
    let resizeTimeout;
    clearTimeout(resizeTimeout);
    
    resizeTimeout = setTimeout(() => {
        // 1. Update artwork info text height and related calculations
        recalculateArtworkTextValues();
        
        // 2. Update gallery image scaling for all galleries
        updateGalleryImageScaling();
        
        // 3. Update mobile/desktop detection and related functionality
        updateDeviceSpecificFeatures();
        
        // 4. Recalculate gallery center positions and scaling
        updateGalleryScalingPositions();
        
        // 5. Update ScrollTrigger instances for mobile
        updateScrollTriggerInstances();
        
        // 6. Update current image detection
        setTimeout(() => {
            updateCurrentImage();
        }, 100);
        
    }, 0); // 150ms debounce
}

// Function to update gallery image scaling across all galleries
function updateGalleryImageScaling() {
    const galleryContainers = document.querySelectorAll('.artwork-gallery-images-container');
    
    galleryContainers.forEach(container => {
        const singleGalleryImages = container.querySelectorAll('.single-gallery-image');
        
        // Recalculate original dimensions for each image
        singleGalleryImages.forEach(img => {
            storeOriginalDimensionsForImage(img);
        });
        
        // Apply updated scaling
        const galleryRect = artworksGallery.getBoundingClientRect();
        const galleryCenter = galleryRect.left + (galleryRect.width / 2);
        applyScalingToImages(singleGalleryImages, galleryCenter);
    });
}


// Helper function to store original dimensions for a single image
function storeOriginalDimensionsForImage(img) {
    const originalHeight = img.naturalHeight || img.offsetHeight;
    const originalWidth = img.naturalWidth || img.offsetWidth;
    const aspectRatio = originalWidth / originalHeight;
    
    // Get the artwork gallery container height
    const artworkGalleryContainer = document.querySelector('.artwork-gallery-images');
    const containerHeight = artworkGalleryContainer ? artworkGalleryContainer.offsetHeight : window.innerHeight;
    const maxHeight = containerHeight * 0.8;
    const maxWidth = maxHeight * aspectRatio;
    
    // Store in dataset for consistency with existing code
    img.dataset.originalWidth = maxWidth;
    img.dataset.originalHeight = maxHeight;
}

// Function to update device-specific features based on new window size
function updateDeviceSpecificFeatures() {
    const wasMobile = document.body.classList.contains('mobile-detected');
    const isTouchDeviceNow = isTouchDevice();
    
    if (wasMobile !== isTouchDeviceNow) {
        
        if (isTouchDeviceNow) {
            // Switching to mobile
            document.body.classList.add('mobile-detected');
            
            // Deinitialize desktop gallery features
            if (isDetailView) {
                deinitializeGalleryScalingAndScrolling(false);
            }
            
            // Initialize mobile features
            setTimeout(() => {
                if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                    applyMobileSwipeScaling();
                }
            }, 200);
            
        } else {
            // Switching to desktop
            document.body.classList.remove('mobile-detected');
            
            // Clean up mobile ScrollTrigger instances
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.getAll().forEach(trigger => {
                    if (trigger.trigger && trigger.trigger.classList.contains('single-gallery-image')) {
                        trigger.kill();
                    }
                });
            }
            
            // Initialize desktop gallery features if in detail view
            if (isDetailView) {
                setTimeout(() => {
                    initializeGalleryScalingAndScrolling();
                }, 200);
            }
        }
    }
}

// Function to update gallery center positions and recalculate scaling
function updateGalleryScalingPositions() {
    if (!artworksGallery) return;
    
    // Get updated gallery center position
    const galleryRect = artworksGallery.getBoundingClientRect();
    const galleryCenter = galleryRect.left + (galleryRect.width / 2);
    
    // Update scaling for all visible images
    const allGalleryImages = document.querySelectorAll('.single-gallery-image');
    applyScalingToImages(allGalleryImages, galleryCenter);
    
    // Update gallery widths in the state map
    const galleryInners = document.querySelectorAll('.artwork-gallery-images-inner');
    galleryInners.forEach(gallery => {
        if (galleryStateMap.has(gallery)) {
            const currentState = getGalleryState(gallery);
            // Force recalculation of gallery dimensions
            gallery.style.width = 'auto';
            const newWidth = gallery.getBoundingClientRect().width;
            
            // Update any stored width values if needed
            galleryWidths[gallery] = newWidth;
        }
    });
}



// Function to update ScrollTrigger instances for mobile
function updateScrollTriggerInstances() {
    if (isTouchDevice() && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        // Kill existing ScrollTrigger instances
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.trigger && trigger.trigger.classList.contains('single-gallery-image')) {
                trigger.kill();
            }
        });
        
        // Refresh ScrollTrigger to recalculate positions
        ScrollTrigger.refresh();
        
        // Reapply mobile scaling with updated dimensions
        setTimeout(() => {
            applyMobileSwipeScaling();
        }, 100);
    }
}

// Enhanced version of the existing recalculateArtworkTextValues function
function recalculateArtworkTextValues() {
    if (isArtworkInfoOpen) {
        console.log('recaculateArtworkTextValues called');
        const artworkMainTextContainer = document.querySelector('.artwork-main-text-container');
        
        setTimeout(() => {
            if (artworkMainTextContainer) {
                // Force a reflow to ensure accurate measurements
                artworkMainTextContainer.offsetHeight;
                artworkTextHeight = artworkMainTextContainer.offsetHeight;
                console.log('artworkTextHeight', artworkTextHeight);
                artworkTextHeightRatio = artworkTextHeight * 1.4 / window.innerHeight;
                
                // Update the CSS custom property
                document.documentElement.style.setProperty('--info-text-height', `${artworkTextHeight}px`);
                
                // Update gallery scaling if artwork info is open
                const visibleGalleryIndex = getVisibleGalleryIndex();
                const galleryElements = document.querySelectorAll('.artwork-gallery-images-scale');
                const visibleGallery = galleryElements[visibleGalleryIndex];
                
                if (visibleGallery) {
                    galleryScaleValue = 1 - artworkTextHeightRatio;
                    
                    // Get the current transform to preserve translateX
                    const currentTransform = visibleGallery.style.transform || '';
                    const translateXMatch = currentTransform.match(/translateX\(([^)]+)%\)/);
                    const translateXValue = translateXMatch ? translateXMatch[1] : '0';
                    
                    // Combine translateX and updated scale
                    const newTransform = `translateX(${translateXValue}%) scale(${galleryScaleValue})`;
                    visibleGallery.style.transform = newTransform;
                }
                
                // Update translateY on the parent element
                const visibleGalleryParent = visibleGallery.closest('.artwork-gallery-images');
                if (visibleGalleryParent) {
                    visibleGalleryParent.style.transform = `translateY(-${artworkTextHeight / 2}px)`;
                }
                
                // Update image scaling with new gallery positions
                setTimeout(() => {
                    const images = visibleGallery.querySelectorAll('.single-gallery-image');
                    const galleryRect = artworksGallery.getBoundingClientRect();
                    const galleryCenter = galleryRect.left + (galleryRect.width / 2);
                    
                    applyScalingToImages(images, galleryCenter);
                }, 50);
            }
        }, 500);
    }
}

// Function to handle orientation changes on mobile devices
function handleOrientationChange() {
    // Wait for the orientation change to complete
    setTimeout(() => {
        handleWindowResize();
        
        // Additional mobile-specific updates
        if (isTouchDevice()) {
            // Force ScrollTrigger refresh on mobile after orientation change
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
            
            // Update mobile menu positioning if open
            if (document.body.classList.contains('mobile-menu-opened')) {
                // Recalculate mobile menu positions if needed
                updateMobileMenuPositions();
            }
        }
    }, 100);
}

// Helper function to update mobile menu positions (if needed)
function updateMobileMenuPositions() {
    // Add any mobile menu specific resize handling here
}

// Initialize resize event listeners
function initializeResizeHandlers() {
    // Main window resize handler
    window.addEventListener('resize', handleWindowResize);
    
    // Handle orientation changes on mobile devices
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Additional viewport change handler for mobile browsers
    if (isTouchDevice()) {
        // Handle mobile viewport changes (e.g., address bar hiding/showing)
        let viewportTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(viewportTimeout);
            viewportTimeout = setTimeout(() => {
                // Force a complete recalculation on mobile
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
                updateCurrentImage();
            }, 300);
        });
    }
}

// Call this function when the page loads to set up resize handling
document.addEventListener('DOMContentLoaded', () => {
    initializeResizeHandlers();

    if (!isTouchDevice()) {
        setTimeout(() => {
            updateGalleryImageScaling();
        }, 1000);
    }

});

// Export the main resize handler for manual calling if needed
window.handleWindowResize = handleWindowResize;

// Helper function to find and navigate to artwork by slug and image index
function navigateToArtworkBySlug(artworkSlug, imageIndex = 0) {
    // Find all artwork containers
    const artworkContainers = document.querySelectorAll('.artwork-images');
    let matchingImage = null;
    
    artworkContainers.forEach((artworkContainer) => {
        // Get the first image in this container to extract the artwork slug
        const firstImage = artworkContainer.querySelector('.single-image');
        if (firstImage) {
            // Extract artwork name from the image class name
            // Class format: "single-image artwork-some-say-we-have-no-time-to-stand-and-stare-1 progressive-image is-upgraded"
            const imageClasses = firstImage.className;
            const artworkClassMatch = imageClasses.match(/artwork-(.+?)-\d+/);
            
            if (artworkClassMatch) {
                const artworkSlugFromClass = artworkClassMatch[1]; // Extract the artwork slug
                
                // Normalize both slugs for comparison (remove ALL hyphens and special chars)
                const normalizedClassSlug = artworkSlugFromClass.replace(/[^a-z0-9]/gi, '').toLowerCase();
                const normalizedUrlSlug = artworkSlug.replace(/[^a-z0-9]/gi, '').toLowerCase();
                
                if (normalizedClassSlug === normalizedUrlSlug) {
                    // Found matching artwork container, now find the specific image by index
                    const artworkImages = artworkContainer.querySelectorAll('.single-image');
                    if (artworkImages[imageIndex]) {
                        matchingImage = artworkImages[imageIndex];
                    } else {
                        // Fallback to first image if index is out of bounds
                        matchingImage = artworkImages[0];
                    }
                    return; // Exit the loop once we found the match
                }
            }
        }
    });

    console.log('matchingImage', matchingImage);
    console.log('Looking for artworkSlug:', artworkSlug);
    
    if (matchingImage) {
        console.log('Found matching image class:', matchingImage.className);
        
        // Trigger the same click handling as a user click
        // Scroll the image into view first        
        // Wait for scroll to complete before handling click
        setTimeout(() => {
            console.log('About to call handleSingleImageClick');
            handleSingleImageClick(matchingImage);
        }, 0);

        setTimeout(() => {
            updateCurrentArtwork();
            setTimeout(() => {
                updateCurrentImage();
                document.body.classList.remove('url-loading');
            }, 100);

            setTimeout(() => {
                const whiteOverlay = document.querySelector('.white-overlay');
                if (whiteOverlay) {
                    whiteOverlay.remove();
                }
            }, 600);
        }, 1300);
    }
}

// Helper function to find and expand event by slug
function expandEventBySlug(eventSlug) {
    const eventContainers = document.querySelectorAll('.event-container');
    let matchingEvent = null;
    
    eventContainers.forEach(container => {
        const eventTitle = container.querySelector('.event-title')?.textContent;
        if (eventTitle) {
            const containerSlug = eventTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (containerSlug === eventSlug) {
                matchingEvent = container;
            }
        }
    });
    
    if (matchingEvent) {
        const eventContent = matchingEvent.querySelector('.event-content');
        if (eventContent && eventContent.classList.contains('preview-visible')) {
            const eventTitle = matchingEvent.querySelector('.event-title')?.textContent;
            if (eventTitle) {
                visibleExhibitionImage = eventTitle;
                openExhibition();
            }
        }
    }
}

// Helper function to initialize about state
function initializeAboutState() {
    if (!isMobile()) {
        toggleAbout();
    } else {
        setTimeout(() => openMobileMenu(), 1200);
        setTimeout(() => toggleAboutMobile(), 1500);
    }
}

// Helper function to initialize imprint state (opens about + imprint)
function initializeImprintState() {
    const triggerImprint = () => {
        const imprintBtn = document.querySelector('.imprint-button');
        if (imprintBtn) imprintBtn.click();
    };

    if (!isMobile()) {
        toggleAbout();
        setTimeout(triggerImprint, 600);
    } else {
        setTimeout(() => openMobileMenu(), 1200);
        setTimeout(() => toggleAboutMobile(), 1500);
        setTimeout(triggerImprint, 2100);
    }
}

// Helper function to initialize calendar state
function initializeCalendarState(eventSlug = null) {
    if (!isMobile()) {
        toggleCalendar();
        if (eventSlug) {
            setTimeout(() => expandEventBySlug(eventSlug), 100);
        }
    } else {
        setTimeout(() => openMobileMenu(), 1200);
        setTimeout(() => toggleCalendarMobile(), 1500);
        if (eventSlug) {
            setTimeout(() => expandEventBySlug(eventSlug), 1700);
        }
    }
}

// URL state initialization - called on page load
function initializeFromURL() {

    if (isTouchDevice()) {
        applyMobileSwipeScaling();
    }

    const currentPath = window.location.pathname;

    // Parse URL segments
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');

    // Check for imprint state (must come before about, since /imprint should open about + imprint)
    if (currentPath.includes('imprint')) {
        setTimeout(() => {
            initializeImprintState();
        }, 1000);
        return;
    }

    // Check for about state
    if (currentPath.includes('about')) {
        setTimeout(() => {
            initializeAboutState();
        }, 1000);
        return;
    }

    // Check for calendar state
    if (currentPath.includes('calendar')) {
        const calendarIndex = pathSegments.indexOf('calendar');
        const eventSlug = (calendarIndex !== -1 && pathSegments.length > calendarIndex + 1) 
            ? pathSegments[calendarIndex + 1] 
            : null;

        if (eventSlug) {
            setTimeout(() => {
                setEventContentHeight();
                initializeCalendarState(eventSlug);
            }, 2000);  
  
        } else {
            setTimeout(() => {
                initializeCalendarState(eventSlug);
            }, 1000);
        }
        return;
    }

    // Check for artwork state (any other slug that's not about/calendar)
    if (pathSegments.length > 0) {
        document.body.classList.add('url-loading');
        
        // Create and append white overlay for smooth transition
        const whiteOverlay = document.createElement('div');
        whiteOverlay.className = 'white-overlay';
        document.body.appendChild(whiteOverlay);

        setTimeout(() => {
            const artworkSlug = pathSegments[0];
        
            // Check if there's an image index in the slug
            const imageIndexMatch = artworkSlug.match(/-(\d+)$/);
            if (imageIndexMatch) {
                const imageIndex = parseInt(imageIndexMatch[1]) - 1; // Convert to 0-based index
                const artworkTitle = artworkSlug.replace(/-\d+$/, ''); // Remove index from slug

                // Navigate to the specific artwork and image
                navigateToArtworkBySlug(artworkTitle, imageIndex);
            } else {
                // Navigate to the first image of the artwork
                navigateToArtworkBySlug(artworkSlug, 0);
            }
        }, 1000);

        return;
    }
}

// Call initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other initialization to complete
    initializeFromURL();
});


document.addEventListener('DOMContentLoaded', () => {
    if (isTouchDevice()) {

        console.log('isTouchDevice');

    } else {

        console.log('is not TouchDevice');

    }
});

document.addEventListener('DOMContentLoaded', () => {
    const forwardTargets = document.querySelectorAll('.image-caption, .artwork-title-text');

    forwardTargets.forEach((el) => {
        el.addEventListener('wheel', (e) => {
            if (!currentGalleryElement) return;
            const activeGallery = currentGalleryElement
                .closest('.artwork-gallery-images-container')
                ?.querySelector('.artwork-gallery-images');
            if (!activeGallery) return;

            e.preventDefault();
            activeGallery.dispatchEvent(new WheelEvent('wheel', {
                deltaX: e.deltaX,
                deltaY: e.deltaY,
                deltaZ: e.deltaZ,
                deltaMode: e.deltaMode,
                bubbles: true,
                cancelable: true,
            }));
        }, { passive: false });
    });
});