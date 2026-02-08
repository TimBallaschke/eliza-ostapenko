

document.addEventListener('DOMContentLoaded', () => {


    // Check if URL contains an artwork slug (exclude about/calendar)
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');
    const hasArtworkSlug = pathSegments.length > 0 && 
                          !pathSegments[0].startsWith('about') && 
                          !pathSegments[0].startsWith('calendar');

    if (hasArtworkSlug) {
        // Immediate initialization without animations for direct URL access
        
        // Disable all transitions temporarily
        const style = document.createElement('style');
        style.textContent = '* { transition: none !important; animation: none !important; }';
        document.head.appendChild(style);
        
        const singleImageContainers = document.querySelectorAll('.single-image-container');
        const artworkNumbers = document.querySelectorAll('.artwork-number');
        const exhibitionOverviewImages = document.querySelectorAll('.exhibition-overview-image');
        
        // Remove all classes immediately
        singleImageContainers.forEach(container => {
            container.classList.remove('not-visible');
        });
        
        document.body.classList.remove('initialize');
        
        artworkNumbers.forEach(number => {
            number.classList.remove('no-opacity');
        });
        
        exhibitionOverviewImages.forEach(image => {
            image.classList.remove('exhibition-overview-initialize');
        });
        
        const artworksOverviewScale = document.querySelector('.artworks-overview-scale');
        if (artworksOverviewScale) {
            // artworksOverviewScale.classList.add('overflow-hidden');
        }
        
        // Re-enable transitions after all changes are applied
        setTimeout(() => {
            document.head.removeChild(style);
        }, 50);
    
    } else {

        // Add event listeners for the progressive loading events
        window.addEventListener('progressive:lowres-ready', () => {
            // Normal animated initialization for root path
            setTimeout(() => {
                const singleImageContainers = document.querySelectorAll('.single-image-container');
                const artworkNumbers = document.querySelectorAll('.artwork-number');
                const exhibitionOverviewImages = document.querySelectorAll('.exhibition-overview-image');
            
                setTimeout(() => {
                    singleImageContainers.forEach(container => {
                        container.classList.remove('not-visible');
                    });
                }, 400);
                
                setTimeout(() => {
                    // Only remove classes from images in the first 7 grid rows
                    const maxRows = 6;
                    const estimatedImagesPerRow = 3; // Rough estimate of images per row
                    const maxImagesToProcess = maxRows * estimatedImagesPerRow;
                    
                    // Remove classes sequentially with 80ms delay between each container
                    // But only for the first 7 rows worth of images
                    singleImageContainers.forEach((container, index) => {
                        if (index < maxImagesToProcess) {
                            setTimeout(() => {
                                container.classList.remove('initialize-left');
                                container.classList.remove('initialize-right');
                            }, index * 80);
                        }
                    });
                    
                    // After initial animation completes, set up Intersection Observer for remaining containers
                    const totalAnimationTime = maxImagesToProcess * 80; // Total time for initial animation
                    setTimeout(() => {
                        setupIntersectionObserver();
                    }, totalAnimationTime + 100); // Add 100ms buffer
                }, 800);
                
                // Function to set up Intersection Observer (only called after initial animation)
                function setupIntersectionObserver() {
                    const observerOptions = {
                        root: null, // Use viewport as root
                        rootMargin: '100px', // Start animation 100px before container enters viewport
                        threshold: 0.15 // Trigger when 25% of container is visible
                    };
                    
                    const containerObserver = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const artworkContainer = entry.target;
                                
                                // Find all images with initialize classes within this container
                                const imagesWithInitialize = artworkContainer.querySelectorAll('.single-image-container.initialize-left, .single-image-container.initialize-right');
                                
                                if (imagesWithInitialize.length > 0) {
                                    // Animate children sequentially with 80ms delay between each
                                    imagesWithInitialize.forEach((imageContainer, index) => {
                                        setTimeout(() => {
                                            imageContainer.classList.remove('initialize-left');
                                            imageContainer.classList.remove('initialize-right');
                                            
                                            // Check if this was the last image with initialize classes
                                            checkIfAllImagesDone();
                                        }, index * 80);
                                    });
                                }
                                
                                // Stop observing this container after animation
                                containerObserver.unobserve(artworkContainer);
                            }
                        });
                    }, observerOptions);
                    
                    // Find and observe all artwork-images containers
                    const artworkContainers = document.querySelectorAll('.artwork-images');
                    artworkContainers.forEach(container => {
                        containerObserver.observe(container);
                    });
                    
                    // Function to check if all images are done and remove observer
                    function checkIfAllImagesDone() {
                        const remainingImages = document.querySelectorAll('.single-image-container.initialize-left, .single-image-container.initialize-right');
                        if (remainingImages.length === 0) {
                            console.log('All images initialized, removing Intersection Observer');
                            containerObserver.disconnect();
                        }
                    }
                }
            
                setTimeout(() => {
                    document.body.classList.remove('initialize');
                }, 1400);
            
                setTimeout(() => {
                    artworkNumbers.forEach(number => {
                        number.classList.remove('no-opacity');
                    });
                }, 1000);

                setTimeout(() => {
                    exhibitionOverviewImages.forEach(image => {
                        image.classList.remove('exhibition-overview-initialize');
                    });

                }, 2000);

                setTimeout(() => {
                    const artworksOverviewScale = document.querySelector('.artworks-overview-scale');
                    // artworksOverviewScale.classList.add('overflow-hidden');
                }, 3000);
            }, 200);

        });

    }
});