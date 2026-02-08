document.addEventListener('DOMContentLoaded', function() {
    const galleryContainers = document.querySelectorAll('.artwork-gallery-images-inner');
    
    galleryContainers.forEach(container => {
        const images = container.querySelectorAll('img');
        
        // If no images found, return early
        if (images.length === 0) return;
        
        let loadedImages = 0;
        const totalImages = images.length;
        
        // Function to handle when all images are loaded
        const handleAllImagesLoaded = () => {
            const firstImage = images[0];
            const lastImage = images[images.length - 1];
            const screenWidth = window.innerWidth;
            const firstImageWidth = firstImage.offsetWidth;
            const lastImageWidth = lastImage.offsetWidth;
            
            // Calculate padding-left: half screen width minus first image width
            const paddingLeft = (screenWidth / 2) - (firstImageWidth / 2);
            
            // Calculate padding-right: half screen width minus last image width
            const paddingRight = (screenWidth / 2) - (lastImageWidth / 2);
            
            // Set the padding properties
            container.style.paddingLeft = paddingLeft + 'px';
            // container.style.paddingRight = paddingRight + 'px';
        };
        
        // Check if images are already loaded
        const checkImageLoadStatus = () => {
            loadedImages = 0;
            images.forEach(img => {
                if (img.complete && img.naturalHeight !== 0) {
                    loadedImages++;
                }
            });
            
            if (loadedImages === totalImages) {
                handleAllImagesLoaded();
            }
        };
        
        // Add load event listeners to all images
        images.forEach(img => {
            if (img.complete && img.naturalHeight !== 0) {
                loadedImages++;
            } else {
                img.addEventListener('load', () => {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        handleAllImagesLoaded();
                    }
                });
                
                img.addEventListener('error', () => {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        handleAllImagesLoaded();
                    }
                });
            }
        });
        
        // Check initial load status
        checkImageLoadStatus();
    });
});



// window.addEventListener('resize', () => {
//     adjustGalleryPadding();
// });