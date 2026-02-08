/**
 * Simplified Artwork Grid Layout
 * 
 * Key features:
 * - Groups images by aspect ratio within tolerance
 * - Each row shares at least one column with previous row
 * - Prevents excessive overlap for dynamic layout
 * - No min/max images per row constraints
 */

// Configuration
let gridColumns = getGridColumns();
let aspectRatioTolerance = 0.3;
let maxOverlapRatio = 0.7; // Maximum ratio of overlap between consecutive rows
let wideAspectRatioThreshold = 1.8; // Images with aspect ratio >= this value will span 2 columns
let ultraWideAspectRatioThreshold = 3.0; // Images with aspect ratio >= this value will span 3 columns

function getGridColumns() {
    const columns = getComputedStyle(document.documentElement).getPropertyValue('--overview-columns');
    return parseInt(columns) || 9;
}

function updateResponsiveSettings() {
    gridColumns = getGridColumns();
}

function waitForImagesToLoad(images, callback) {
    let loadedCount = 0;
    const totalImages = images.length;
    
    if (totalImages === 0) {
        callback();
        return;
    }
    
    const checkComplete = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
            callback();
        }
    };
    
    images.forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
            checkComplete();
        } else {
            img.addEventListener('load', checkComplete);
            img.addEventListener('error', checkComplete);
        }
    });
}

function getImageAspectRatio(img) {
    if (img.naturalWidth && img.naturalHeight) {
        return img.naturalWidth / img.naturalHeight;
    }
    
    if (img.offsetWidth && img.offsetHeight) {
        return img.offsetWidth / img.offsetHeight;
    }
    
    return null;
}

function areAspectRatiosSimilar(ratio1, ratio2) {
    const difference = Math.abs(ratio1 - ratio2);
    return difference <= aspectRatioTolerance;
}

function isWideImage(aspectRatio) {
    return aspectRatio >= wideAspectRatioThreshold && aspectRatio < ultraWideAspectRatioThreshold;
}

function isUltraWideImage(aspectRatio) {
    return aspectRatio >= ultraWideAspectRatioThreshold;
}

function getImageColumnSpan(aspectRatio, isVeryFirstImage = false) {
    if (isVeryFirstImage) {
        return 2; // First image always spans 2 columns
    } else if (isUltraWideImage(aspectRatio)) {
        return 3; // Ultra-wide images span 3 columns
    } else if (isWideImage(aspectRatio)) {
        return 2; // Wide images span 2 columns
    } else {
        return 1; // Regular images span 1 column
    }
}

function groupImagesByAspectRatio(imageContainers) {
    const groups = [];
    const processedContainers = new Set();
    
    console.log('=== DEBUGGING IMAGE GROUPING ===');
    console.log('Total image containers:', imageContainers.length);
    
    // First, separate exhibition_view images from regular images
    const regularContainers = [];
    const exhibitionContainers = [];
    
    imageContainers.forEach((container, index) => {
        const img = container.querySelector('img');
        if (!img) return;
        
        const isExhibitionView = img.getAttribute('data-exhibition-view') === 'true';
        
        if (isExhibitionView) {
            exhibitionContainers.push({ container, originalIndex: index });
            console.log('Exhibition view image found:', {
                element: container,
                img: img,
                originalIndex: index,
                src: img.src,
                alt: img.alt,
                exhibition: img.getAttribute('data-exhibition')
            });
        } else {
            regularContainers.push({ container, originalIndex: index });
        }
    });
    
    console.log(`Found ${exhibitionContainers.length} exhibition view images and ${regularContainers.length} regular images`);
    
    // Debug each regular image
    regularContainers.forEach((containerData, index) => {
        const img = containerData.container.querySelector('img');
        const aspectRatio = getImageAspectRatio(img);
        console.log(`Regular image ${index}:`, {
            container: containerData.container,
            img: img,
            originalIndex: containerData.originalIndex,
            aspectRatio: aspectRatio,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            offsetWidth: img.offsetWidth,
            offsetHeight: img.offsetHeight
        });
    });
        
    // Process regular images with aspect ratio grouping
    regularContainers.forEach(containerData => {
        if (processedContainers.has(containerData.container)) return;
        
        const img = containerData.container.querySelector('img');
        if (!img) return;
        
        const aspectRatio = getImageAspectRatio(img);
        if (aspectRatio === null) return;
        
        console.log(`Processing image with aspect ratio ${aspectRatio.toFixed(3)}`);
        
        // Store both container and its original index
        const similarContainers = [containerData];
        processedContainers.add(containerData.container);
        
        regularContainers.forEach(otherContainerData => {
            if (otherContainerData.originalIndex <= containerData.originalIndex || processedContainers.has(otherContainerData.container)) return;
            
            const otherImg = otherContainerData.container.querySelector('img');
            if (!otherImg) return;
            
            const otherAspectRatio = getImageAspectRatio(otherImg);
            if (otherAspectRatio === null) return;
            
            if (areAspectRatiosSimilar(aspectRatio, otherAspectRatio)) {
                console.log(`Found similar image: ${otherAspectRatio.toFixed(3)} matches ${aspectRatio.toFixed(3)}`);
                similarContainers.push(otherContainerData);
                processedContainers.add(otherContainerData.container);
            }
        });
        
        // Sort by original index to maintain order
        similarContainers.sort((a, b) => a.originalIndex - b.originalIndex);
        
        groups.push({
            aspectRatio: aspectRatio,
            containers: similarContainers,
            isExhibitionGroup: false
        });
        
        console.log(`Created group with aspect ratio ${aspectRatio.toFixed(3)} and ${similarContainers.length} containers`);
    });
    
    // Position exhibition images just outside viewport with same grid dimensions
    exhibitionContainers.forEach((containerData, index) => {
        // Remove from grid positioning
        containerData.container.style.gridRow = '';
        containerData.container.style.gridColumn = '';
        
        // Add exhibition overview class
        containerData.container.classList.add('exhibition-overview-image');
        containerData.container.classList.add('exhibition-overview-initialize');
        
        // Calculate the same width as grid images
        // Get the grid container to calculate cell width
        const gridContainer = containerData.container.closest('.artwork-images');
        const gridContainerWidth = gridContainer ? gridContainer.offsetWidth : window.innerWidth;
        const cellWidth = gridContainerWidth / gridColumns;
        
        // Position just outside viewport (maintains exact grid dimensions)
        containerData.container.style.position = 'absolute';
        // Position slightly to the right of the viewport
        containerData.container.style.left = 'calc(100vw + 20px)';
        // Stack them vertically with proper spacing
        containerData.container.style.top = `${index * (cellWidth + 20)}px`;
        // Set exact same width as grid cells
        containerData.container.style.width = `${cellWidth}px`;
        // Let height adjust automatically to maintain aspect ratio
        containerData.container.style.height = 'auto';
        
        console.log('Positioning exhibition view image just outside viewport:', {
            container: containerData.container,
            originalIndex: containerData.originalIndex,
            position: `right of viewport, top: ${index * (cellWidth + 20)}px`,
            width: `${cellWidth}px`,
            gridColumns: gridColumns,
            class: 'exhibition-overview-image',
            index: index
        });
    });
    
    // Sort by aspect ratio (portrait to landscape) but move extreme ratios to the end
    const extremeThreshold = 0.4; // Images with aspect ratio < 0.5 or > 2.0 are considered extreme
    
    console.log('=== DEBUGGING ASPECT RATIO SORTING ===');
    console.log('Extreme threshold:', extremeThreshold);
    console.log('Groups before sorting:', groups.map(g => ({
        aspectRatio: g.aspectRatio.toFixed(3),
        count: g.containers.length,
        isExtreme: g.aspectRatio < extremeThreshold || g.aspectRatio > (1 / extremeThreshold)
    })));
    
    // Separate normal and extreme groups
    const normalGroups = [];
    const extremeGroups = [];
    
    groups.forEach(group => {
        const isExtreme = group.aspectRatio < extremeThreshold || group.aspectRatio > (1 / extremeThreshold);
        console.log(`Group with aspect ratio ${group.aspectRatio.toFixed(3)}: isExtreme = ${isExtreme}`);
        
        if (isExtreme) {
            extremeGroups.push(group);
        } else {
            normalGroups.push(group);
        }
    });
    
    console.log('Normal groups count:', normalGroups.length);
    console.log('Extreme groups count:', extremeGroups.length);
    
    // Sort normal groups by aspect ratio (portrait to landscape)
    normalGroups.sort((a, b) => a.aspectRatio - b.aspectRatio);
    
    // Sort extreme groups by aspect ratio (portrait to landscape)
    extremeGroups.sort((a, b) => a.aspectRatio - b.aspectRatio);
    
    console.log('Normal groups after sorting:', normalGroups.map(g => g.aspectRatio.toFixed(3)));
    console.log('Extreme groups after sorting:', extremeGroups.map(g => g.aspectRatio.toFixed(3)));
    
    // Combine: normal first, then extreme
    groups.length = 0; // Clear the array
    groups.push(...normalGroups, ...extremeGroups);
    
    console.log('Final combined order:', groups.map(g => g.aspectRatio.toFixed(3)));
    console.log('=== END DEBUGGING ===');
    
    return groups;
}

function createRowsFromGroup(containers, isFirstGroup = false) {
    const rows = [];
    let currentRowContainers = [];
    
    // Calculate maximum images per row (75% of columns)
    const maxImagesPerRow = Math.floor(gridColumns * 0.75);
    
    containers.forEach((containerData, index) => {
        const isFirstImageOfFirstGroup = isFirstGroup && index === 0;
        
        // Get image aspect ratio to determine column span
        const img = containerData.container.querySelector('img');
        const aspectRatio = getImageAspectRatio(img);
        const isWide = aspectRatio ? isWideImage(aspectRatio) : false;
        const isUltraWide = aspectRatio ? isUltraWideImage(aspectRatio) : false;
        const columnSpan = aspectRatio ? getImageColumnSpan(aspectRatio, isFirstImageOfFirstGroup) : 1;
        
        // Mark container properties for later reference
        containerData.isWide = isWide;
        containerData.isUltraWide = isUltraWide;
        containerData.columnSpan = columnSpan;
        
        if (img && aspectRatio) {
            if (isUltraWide) {
                console.log(`Ultra-wide image detected: aspect ratio ${aspectRatio.toFixed(3)} >= ${ultraWideAspectRatioThreshold} (will span 3 columns)`, img.alt || img.src);
            } else if (isWide) {
                console.log(`Wide image detected: aspect ratio ${aspectRatio.toFixed(3)} >= ${wideAspectRatioThreshold} (will span 2 columns)`, img.alt || img.src);
            }
        }
        
        if (currentRowContainers.length === 0) {
            currentRowContainers.push(containerData);
        } else {
            // Calculate space needed for current row
            let spaceNeeded = 0;
            currentRowContainers.forEach(container => {
                spaceNeeded += container.columnSpan || 1;
            });
            
            // Check if adding this image would exceed limits
            let newSpaceNeeded = spaceNeeded + columnSpan;
            
            if (currentRowContainers.length < maxImagesPerRow && newSpaceNeeded <= gridColumns) {
                currentRowContainers.push(containerData);
            } else {
                // Current row is full, start new row
                rows.push([...currentRowContainers]);
                currentRowContainers = [containerData];
            }
        }
    });
    
    // Add the last row if it has containers
    if (currentRowContainers.length > 0) {
        rows.push(currentRowContainers);
    }
    
    return rows;
}

function calculateOverlap(range1, range2) {
    const overlapStart = Math.max(range1.start, range2.start);
    const overlapEnd = Math.min(range1.end, range2.end);
    const overlapSize = Math.max(0, overlapEnd - overlapStart + 1);
    
    const range1Size = range1.end - range1.start + 1;
    const range2Size = range2.end - range2.start + 1;
    const minRangeSize = Math.min(range1Size, range2Size);
    
    return overlapSize / minRangeSize;
}

function findValidStartColumn(row, previousRowRange) {
    const validStarts = [];
    
    // Calculate actual space needed based on column spans
    let spaceNeeded = 0;
    row.forEach(containerData => {
        spaceNeeded += containerData.columnSpan || 1;
    });
    
    for (let start = 1; start <= gridColumns - spaceNeeded + 1; start++) {
        const end = start + spaceNeeded - 1;
        const currentRange = { start, end };
        
        if (previousRowRange === null) {
            // First row, any position is valid
            validStarts.push(start);
        } else {
            const overlap = calculateOverlap(currentRange, previousRowRange);
            
            // Must have at least some overlap (share at least one column)
            // But not too much overlap (less than maxOverlapRatio)
            if (overlap > 0 && overlap < maxOverlapRatio) {
                validStarts.push(start);
            }
        }
    }
    
    // If no valid starts found with overlap constraints, 
    // fall back to ensuring at least one column overlap
    if (validStarts.length === 0 && previousRowRange !== null) {
        for (let start = 1; start <= gridColumns - spaceNeeded + 1; start++) {
            const end = start + spaceNeeded - 1;
            const currentRange = { start, end };
            const overlap = calculateOverlap(currentRange, previousRowRange);
            
            if (overlap > 0) {
                validStarts.push(start);
            }
        }
    }
    
    // If still no valid starts, just use any position that fits
    if (validStarts.length === 0) {
        for (let start = 1; start <= gridColumns - spaceNeeded + 1; start++) {
            validStarts.push(start);
        }
    }
    
    // Return a random valid start position
    return validStarts[Math.floor(Math.random() * validStarts.length)] || 1;
}

function positionRows(allRows, isFirstGroup = false) {
    const positions = [];
    let previousRowRange = null;
    let currentRowNumber = 1;
    let overallImageIndex = 0;
    
    allRows.forEach(row => {
        // Mark the very first image
        row.forEach((containerData, index) => {
            containerData.isVeryFirstImage = overallImageIndex === 0;
            overallImageIndex++;
        });
        
        const startColumn = findValidStartColumn(row, previousRowRange);
        let currentColumn = startColumn;
        
        // Position each container in the row
        row.forEach((containerData, index) => {
            positions.push({
                container: containerData.container,
                row: currentRowNumber,
                column: currentColumn,
                isVeryFirstImage: containerData.isVeryFirstImage,
                isWide: containerData.isWide,
                isUltraWide: containerData.isUltraWide,
                columnSpan: containerData.columnSpan || 1
            });
            
            // Move to next column based on column span
            currentColumn += containerData.columnSpan || 1;
        });
        
        // Update previous row range based on actual columns used
        const firstColumn = startColumn;
        const lastColumn = currentColumn - 1;
        previousRowRange = {
            start: firstColumn,
            end: lastColumn
        };
        
        currentRowNumber++;
    });
    
    return positions;
}

function applyPositions(positions, isInitialLayout = false) {
    const gridMidpoint = Math.ceil(gridColumns / 2);
    
    positions.forEach(position => {
        const container = position.container;
        container.style.gridRow = position.row;
        
        if (position.columnSpan > 1) {
            container.style.gridColumn = `${position.column} / span ${position.columnSpan}`;
        } else {
            container.style.gridColumn = position.column;
        }
        
        // Only apply initialize classes during initial layout and if no artwork slug
        if (isInitialLayout) {
            const currentPath = window.location.pathname;
            const pathSegments = currentPath.split('/').filter(segment => segment !== '');
            const hasArtworkSlug = pathSegments.length > 0 && 
                                  !pathSegments[0].startsWith('about') && 
                                  !pathSegments[0].startsWith('calendar');
            
            console.log('🎯 Initialize class check:', {
                path: currentPath,
                segments: pathSegments,
                hasArtworkSlug,
                position: position.column,
                gridMidpoint,
                container: container.className
            });
            
            if (!hasArtworkSlug) {
                if (position.column <= gridMidpoint) {
                    container.classList.add('initialize-left');
                    console.log('🎯 Added initialize-left to:', container.className);
                } else {
                    container.classList.add('initialize-right');
                    console.log('🎯 Added initialize-right to:', container.className);
                }
            } else {
                console.log('🎯 Skipping initialize classes due to artwork slug');
            }
        }
    });
}

function layoutImages(container, isInitialLayout = false) {
    const imageContainers = Array.from(container.querySelectorAll('.single-image-container'));
    if (imageContainers.length === 0) return;

    const images = imageContainers.map(container => container.querySelector('img')).filter(img => img);
    const unloadedImages = images.filter(img => !img.complete || img.naturalWidth === 0);
    
    if (unloadedImages.length > 0) {
        waitForImagesToLoad(unloadedImages, () => {
            layoutImages(container, isInitialLayout);
        });
        return;
    }
    
    console.log('🎯 Grid layout starting for container:', container.className);
    console.log('🎯 Is initial layout:', isInitialLayout);

    const aspectRatioGroups = groupImagesByAspectRatio(imageContainers);
    
    // Convert groups to rows (only regular images, exhibition images are hidden)
    const allRows = [];
    aspectRatioGroups.forEach((group, groupIndex) => {
        const isFirstGroup = groupIndex === 0;
        const groupRows = createRowsFromGroup(group.containers, isFirstGroup);
        allRows.push(...groupRows);
    });
    
    console.log('Total rows created:', allRows.length);
    console.log('Rows:', allRows.map(row => row.length));
    
    // Position all rows
    const positions = positionRows(allRows, aspectRatioGroups.length > 0);
    
    console.log('Final positions:', positions);
    applyPositions(positions, isInitialLayout);
    
    // Signal that grid layout is complete for this container
    if (isInitialLayout) {
        console.log('🎯 Grid layout complete - dispatching gridLayoutComplete event');
        container.dispatchEvent(new CustomEvent('gridLayoutComplete', {
            bubbles: true,
            detail: { container, positions }
        }));
    }
}

function setupGrids() {
    const artworkContainers = document.querySelectorAll('.artwork-images');
    artworkContainers.forEach(container => {
        layoutImages(container, true); // Pass true for initial layout
    });
}

function reLayoutAllGrids() {
    const artworkContainers = document.querySelectorAll('.artwork-images');
    artworkContainers.forEach(container => {
        const imageContainers = container.querySelectorAll('.single-image-container');
        imageContainers.forEach(container => {
            container.style.gridRow = '';
            container.style.gridColumn = '';
            // Don't remove initialize classes - they should persist
        });
        
        layoutImages(container, false); // Pass false for resize layout
    });
}

function setAspectRatioTolerance(tolerance) {
    aspectRatioTolerance = tolerance;
    reLayoutAllGrids();
}

function getAspectRatioTolerance() {
    return aspectRatioTolerance;
}

function setMaxOverlapRatio(ratio) {
    maxOverlapRatio = Math.max(0, Math.min(1, ratio));
    reLayoutAllGrids();
}

function getMaxOverlapRatio() {
    return maxOverlapRatio;
}

function setWideAspectRatioThreshold(threshold) {
    wideAspectRatioThreshold = Math.max(1.0, threshold);
    reLayoutAllGrids();
}

function getWideAspectRatioThreshold() {
    return wideAspectRatioThreshold;
}

function setUltraWideAspectRatioThreshold(threshold) {
    ultraWideAspectRatioThreshold = Math.max(wideAspectRatioThreshold, threshold);
    reLayoutAllGrids();
}

function getUltraWideAspectRatioThreshold() {
    return ultraWideAspectRatioThreshold;
}

// Initialize
function init() {
    updateResponsiveSettings();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupGrids);
    } else {
        setupGrids();
    }
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newColumns = getGridColumns();
            if (newColumns !== gridColumns) {
                console.log(`Grid columns changed from ${gridColumns} to ${newColumns}`);
                updateResponsiveSettings();
                reLayoutAllGrids();
            }
        }, 100);
    });
}

// Add event listeners for the progressive loading events
window.addEventListener('progressive:lowres-ready', () => {
    init();
});

// Make functions globally available
window.artworkGridLayout = {
    reLayoutAllGrids,
    setAspectRatioTolerance,
    getAspectRatioTolerance,
    setMaxOverlapRatio,
    getMaxOverlapRatio,
    setWideAspectRatioThreshold,
    getWideAspectRatioThreshold,
    setUltraWideAspectRatioThreshold,
    getUltraWideAspectRatioThreshold
};